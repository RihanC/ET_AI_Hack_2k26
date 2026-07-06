// ============================================================
// ISIP — Alert Service
// ============================================================

import alertRepository from './alert.repository.js';
import ApiError from '../../utils/ApiError.js';
import { PAGINATION } from '../../utils/constants.js';
import { emitAlertNew, emitAlertAcknowledged, emitAlertResolved, emitDashboardUpdate } from '../../utils/socket.emitter.js';
import { timelineAlertCreated, timelineAlertResolved } from '../../utils/timeline.helper.js';
import prisma from '../../config/database.js';

class AlertService {
  async getAll(query) {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.type) where.type = query.type;
    if (query.severity) where.severity = query.severity;
    if (query.acknowledged !== undefined) where.acknowledged = query.acknowledged;
    if (query.resolved !== undefined) where.resolved = query.resolved;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { data, total } = await alertRepository.findAll({ skip, take: limit, where });
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const alert = await alertRepository.findById(id);
    if (!alert) throw ApiError.notFound('Alert not found');
    return alert;
  }

  async create(data) {
    const alert = await alertRepository.create(data);
    emitAlertNew(alert);
    timelineAlertCreated(alert);
    return alert;
  }

  async update(id, data) {
    await this.getById(id);
    return alertRepository.update(id, data);
  }

  async delete(id) {
    await this.getById(id);
    await alertRepository.delete(id);
  }

  /**
   * Acknowledge an alert — marks it as seen by a user.
   */
  async acknowledge(id, userId) {
    const alert = await this.getById(id);

    if (alert.acknowledged) {
      throw ApiError.badRequest('Alert is already acknowledged');
    }

    const updated = await alertRepository.update(id, {
      acknowledged: true,
      userId: userId,
    });

    emitAlertAcknowledged(updated);
    return updated;
  }

  /**
   * Resolve an alert — marks it as resolved by a user.
   */
  async resolve(id, userId) {
    const alert = await this.getById(id);

    if (alert.resolved) {
      throw ApiError.badRequest('Alert is already resolved');
    }

    const updated = await alertRepository.update(id, {
      acknowledged: true,
      resolved: true,
      resolvedById: userId,
      resolvedAt: new Date(),
    });

    emitAlertResolved(updated);
    timelineAlertResolved(updated);
    return updated;
  }

  /**
   * Get alert history — summary and recent data.
   */
  async getHistory(query) {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.severity) where.severity = query.severity;

    const { data, total } = await alertRepository.findAll({ skip, take: limit, where });

    // Summary counts
    const [totalAlerts, acknowledgedCount, resolvedCount, criticalCount, warningCount] = await Promise.all([
      prisma.alert.count(query.zoneId ? { where: { zoneId: query.zoneId } } : {}),
      prisma.alert.count({ where: { acknowledged: true, ...(query.zoneId ? { zoneId: query.zoneId } : {}) } }),
      prisma.alert.count({ where: { resolved: true, ...(query.zoneId ? { zoneId: query.zoneId } : {}) } }),
      prisma.alert.count({ where: { severity: 'CRITICAL', ...(query.zoneId ? { zoneId: query.zoneId } : {}) } }),
      prisma.alert.count({ where: { severity: 'WARNING', ...(query.zoneId ? { zoneId: query.zoneId } : {}) } }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        total: totalAlerts,
        acknowledged: acknowledgedCount,
        unacknowledged: totalAlerts - acknowledgedCount,
        resolved: resolvedCount,
        unresolved: totalAlerts - resolvedCount,
        critical: criticalCount,
        warning: warningCount,
      },
    };
  }
}

export default new AlertService();
