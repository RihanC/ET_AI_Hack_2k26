// ============================================================
// ISIP — Worker Service
// ============================================================

import workerRepository from './worker.repository.js';
import alertRepository from '../alerts/alert.repository.js';
import ApiError from '../../utils/ApiError.js';
import { PAGINATION } from '../../utils/constants.js';
import { emitWorkerUpdate, emitWorkerMovement, emitAlertNew } from '../../utils/socket.emitter.js';
import { timelineWorkerEnteredZone, timelineAlertCreated } from '../../utils/timeline.helper.js';
import logger from '../../utils/logger.js';

class WorkerService {
  async getAll(query) {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.status) where.status = query.status;
    if (query.ppeStatus) where.ppeStatus = query.ppeStatus;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { badge: { contains: query.search, mode: 'insensitive' } },
        { role: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { data, total } = await workerRepository.findAll({ skip, take: limit, where });
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const worker = await workerRepository.findById(id);
    if (!worker) throw ApiError.notFound('Worker not found');
    return worker;
  }

  async create(data) {
    const existing = await workerRepository.findByBadge(data.badge);
    if (existing) throw ApiError.conflict('Badge number already assigned');

    const worker = await workerRepository.create(data);
    emitWorkerUpdate(worker);
    return worker;
  }

  async update(id, data) {
    const existing = await this.getById(id);

    if (data.badge) {
      const badgeCheck = await workerRepository.findByBadge(data.badge);
      if (badgeCheck && badgeCheck.id !== id) throw ApiError.conflict('Badge number already in use');
    }

    // Track zone change as movement
    if (data.zoneId && data.zoneId !== existing.zoneId) {
      await this._recordMovement(id, existing.zoneId, data.zoneId);
      data.lastSeen = new Date();
    }

    // Update lastSeen when status changes
    if (data.status || data.zoneId) {
      data.lastSeen = new Date();
    }

    // Auto-detect risk level from biometrics
    if (data.heartRate !== undefined || data.gasExposure !== undefined) {
      const heartRate = data.heartRate ?? existing.heartRate;
      const gasExposure = data.gasExposure ?? existing.gasExposure;
      data.riskLevel = this._calculateRiskLevel(heartRate, gasExposure);
    }

    // Generate alerts for emergency biometrics
    await this._checkBiometricAlerts(existing, data);

    const updated = await workerRepository.update(id, data);
    emitWorkerUpdate(updated);
    return updated;
  }

  async delete(id) {
    await this.getById(id);
    await workerRepository.delete(id);
  }

  /**
   * Update worker biometrics (heartRate, gasExposure).
   */
  async updateBiometrics(id, biometrics) {
    const existing = await this.getById(id);

    const data = {
      ...biometrics,
      lastSeen: new Date(),
    };

    // Calculate risk level
    const heartRate = biometrics.heartRate ?? existing.heartRate;
    const gasExposure = biometrics.gasExposure ?? existing.gasExposure;
    data.riskLevel = this._calculateRiskLevel(heartRate, gasExposure);

    // Check for biometric alerts
    await this._checkBiometricAlerts(existing, data);

    const updated = await workerRepository.update(id, data);
    emitWorkerUpdate(updated);
    return updated;
  }

  /**
   * Assign worker to a zone.
   */
  async assignZone(id, zoneId) {
    const existing = await this.getById(id);

    if (existing.zoneId !== zoneId) {
      await this._recordMovement(id, existing.zoneId, zoneId);
    }

    const updated = await workerRepository.update(id, {
      zoneId,
      lastSeen: new Date(),
    });

    if (updated.zone) {
      timelineWorkerEnteredZone(updated, updated.zone.name);
    }

    emitWorkerUpdate(updated);
    return updated;
  }

  /**
   * Get worker movement history.
   */
  async getMovementHistory(id, query = {}) {
    await this.getById(id); // verify exists
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;

    const { data, total } = await workerRepository.getMovementHistory(id, { skip, take: limit });
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Update worker status.
   */
  async updateStatus(id, status) {
    await this.getById(id);
    const updated = await workerRepository.update(id, {
      status,
      lastSeen: new Date(),
    });
    emitWorkerUpdate(updated);

    // Generate alert for emergency status
    if (status === 'EMERGENCY') {
      await this._generateWorkerAlert(updated, 'CRITICAL', 'Worker Emergency', `Worker "${updated.name}" (${updated.badge}) status set to EMERGENCY`);
    }

    return updated;
  }

  // ── Private Helpers ──────────────────────────────────────

  _calculateRiskLevel(heartRate, gasExposure) {
    if (!heartRate && !gasExposure) return 'LOW';

    // Critical: very high HR or high gas exposure
    if ((heartRate && heartRate > 120) || (gasExposure && gasExposure > 15)) {
      return 'CRITICAL';
    }
    // High: elevated HR or moderate gas exposure
    if ((heartRate && heartRate > 100) || (gasExposure && gasExposure > 8)) {
      return 'HIGH';
    }
    // Medium: slightly elevated
    if ((heartRate && heartRate > 90) || (gasExposure && gasExposure > 3)) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  async _recordMovement(workerId, fromZoneId, toZoneId) {
    try {
      const movement = await workerRepository.createMovement({
        workerId,
        fromZoneId: fromZoneId || null,
        toZoneId: toZoneId || null,
      });
      emitWorkerMovement(movement);
    } catch (error) {
      logger.error(`[Worker] Failed to record movement: ${error.message}`);
    }
  }

  async _checkBiometricAlerts(existing, data) {
    try {
      // High heart rate alert
      if (data.heartRate && data.heartRate > 120 && (!existing.heartRate || existing.heartRate <= 120)) {
        await this._generateWorkerAlert(
          existing, 'CRITICAL',
          'Critical Heart Rate',
          `Worker "${existing.name}" (${existing.badge}) heart rate at ${data.heartRate} BPM — exceeds critical threshold`
        );
      }

      // PPE non-compliance alert
      if (data.ppeStatus === 'NON_COMPLIANT' && existing.ppeStatus !== 'NON_COMPLIANT') {
        await this._generateWorkerAlert(
          existing, 'WARNING',
          'PPE Non-Compliance',
          `Worker "${existing.name}" (${existing.badge}) is not wearing proper PPE`
        );
      }
    } catch (error) {
      logger.error(`[Worker] Failed to check biometric alerts: ${error.message}`);
    }
  }

  async _generateWorkerAlert(worker, severity, title, description) {
    try {
      const alert = await alertRepository.create({
        type: 'WORKER',
        severity,
        title,
        description,
        source: worker.id,
        zoneId: worker.zoneId,
      });
      emitAlertNew(alert);
      timelineAlertCreated(alert);
    } catch (error) {
      logger.error(`[Worker] Failed to generate alert: ${error.message}`);
    }
  }
}

export default new WorkerService();
