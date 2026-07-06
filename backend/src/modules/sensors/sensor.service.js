// ============================================================
// ISIP — Sensor Service
// ============================================================

import sensorRepository from './sensor.repository.js';
import alertRepository from '../alerts/alert.repository.js';
import ApiError from '../../utils/ApiError.js';
import { PAGINATION } from '../../utils/constants.js';
import { emitSensorUpdate, emitAlertNew } from '../../utils/socket.emitter.js';
import { timelineAlertCreated, timelineSensorStatusChanged } from '../../utils/timeline.helper.js';
import logger from '../../utils/logger.js';

class SensorService {
  async getAll(query) {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.equipmentId) where.equipmentId = query.equipmentId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { data, total } = await sensorRepository.findAll({ skip, take: limit, where });
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const sensor = await sensorRepository.findById(id);
    if (!sensor) throw ApiError.notFound('Sensor not found');
    return sensor;
  }

  async create(data) {
    return sensorRepository.create(data);
  }

  async update(id, data) {
    const existing = await this.getById(id);

    // Update lastReading timestamp when value changes
    if (data.value !== undefined) {
      data.lastReading = new Date();

      // ── Threshold Detection ─────────────────────────────
      const newValue = data.value;
      const threshold = data.threshold ?? existing.threshold;
      const max = data.max ?? existing.max;
      const oldStatus = existing.status;

      const newStatus = this._calculateStatus(newValue, threshold, max, existing.min);
      if (newStatus !== oldStatus) {
        data.status = newStatus;
        // Log status change timeline event
        timelineSensorStatusChanged(
          { ...existing, ...data },
          oldStatus,
          newStatus
        );
      }

      // Calculate trend
      data.trend = this._calculateTrend(newValue, existing.value);

      // Auto-generate alerts on threshold exceedance
      if (newStatus === 'WARNING' && oldStatus !== 'WARNING' && oldStatus !== 'CRITICAL') {
        await this._generateAlert(existing, newValue, 'WARNING');
      }
      if (newStatus === 'CRITICAL' && oldStatus !== 'CRITICAL') {
        await this._generateAlert(existing, newValue, 'CRITICAL');
      }
    }

    const updated = await sensorRepository.update(id, data);
    emitSensorUpdate(updated);
    return updated;
  }

  async delete(id) {
    await this.getById(id);
    await sensorRepository.delete(id);
  }

  /**
   * Set sensor to calibration mode (takes it offline temporarily).
   */
  async calibrate(id) {
    const sensor = await this.getById(id);
    const oldStatus = sensor.status;
    const updated = await sensorRepository.update(id, {
      status: 'OFFLINE',
      lastReading: new Date(),
    });
    timelineSensorStatusChanged(updated, oldStatus, 'OFFLINE');
    emitSensorUpdate(updated);
    return updated;
  }

  /**
   * Set sensor to maintenance mode.
   */
  async setMaintenanceMode(id, enabled) {
    const sensor = await this.getById(id);
    const oldStatus = sensor.status;
    const newStatus = enabled ? 'OFFLINE' : 'ONLINE';
    const updated = await sensorRepository.update(id, {
      status: newStatus,
      lastReading: new Date(),
    });
    if (oldStatus !== newStatus) {
      timelineSensorStatusChanged(updated, oldStatus, newStatus);
    }
    emitSensorUpdate(updated);
    return updated;
  }

  /**
   * Get sensor health summary.
   */
  async getHealth(id) {
    const sensor = await this.getById(id);
    const utilizationPercent = sensor.max > sensor.min
      ? ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100
      : 0;

    const thresholdProximity = sensor.threshold > 0
      ? (sensor.value / sensor.threshold) * 100
      : 0;

    const isNearThreshold = thresholdProximity >= 80;
    const isOverThreshold = sensor.value >= sensor.threshold;

    return {
      sensor,
      health: {
        status: sensor.status,
        utilizationPercent: Math.round(utilizationPercent * 100) / 100,
        thresholdProximity: Math.round(thresholdProximity * 100) / 100,
        isNearThreshold,
        isOverThreshold,
        trend: sensor.trend,
        lastReading: sensor.lastReading,
        timeSinceReading: sensor.lastReading
          ? Math.round((Date.now() - new Date(sensor.lastReading).getTime()) / 1000)
          : null,
      },
    };
  }

  // ── Private Helpers ──────────────────────────────────────

  /**
   * Calculate sensor status from current value and thresholds.
   */
  _calculateStatus(value, threshold, max, min) {
    // If value exceeds max or is at/above threshold by >= 20% of range
    const range = max - min;
    const criticalThreshold = threshold + (range * 0.1);

    if (value >= criticalThreshold || value >= max) {
      return 'CRITICAL';
    }
    if (value >= threshold) {
      return 'WARNING';
    }
    return 'ONLINE';
  }

  /**
   * Calculate trend direction.
   */
  _calculateTrend(newValue, oldValue) {
    const diff = newValue - oldValue;
    const tolerance = Math.abs(oldValue) * 0.02; // 2% tolerance
    if (Math.abs(diff) <= tolerance) return 'STABLE';
    return diff > 0 ? 'UP' : 'DOWN';
  }

  /**
   * Generate an alert when a sensor exceeds its threshold.
   */
  async _generateAlert(sensor, value, severity) {
    try {
      const alertData = {
        type: this._mapSensorTypeToAlertType(sensor.type),
        severity,
        title: `${sensor.name} — ${severity} threshold exceeded`,
        description: `Sensor "${sensor.name}" reading ${value} ${sensor.unit} has exceeded the ${severity.toLowerCase()} threshold of ${sensor.threshold} ${sensor.unit}`,
        source: sensor.id,
        zoneId: sensor.zoneId,
      };

      const alert = await alertRepository.create(alertData);
      emitAlertNew(alert);
      timelineAlertCreated(alert);
      logger.warn(`[Sensor] Auto-generated ${severity} alert for sensor ${sensor.name}`);
    } catch (error) {
      logger.error(`[Sensor] Failed to auto-generate alert: ${error.message}`);
    }
  }

  /**
   * Map sensor type to alert type.
   */
  _mapSensorTypeToAlertType(sensorType) {
    const mapping = {
      GAS: 'GAS',
      TEMPERATURE: 'TEMPERATURE',
      PRESSURE: 'PRESSURE',
      VIBRATION: 'EQUIPMENT',
      HUMIDITY: 'SYSTEM',
      FLOW: 'SYSTEM',
    };
    return mapping[sensorType] || 'SYSTEM';
  }
}

export default new SensorService();
