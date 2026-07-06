// ============================================================
// ISIP — Permit Service
// ============================================================

import permitRepository from './permit.repository.js';
import ApiError from '../../utils/ApiError.js';
import { PAGINATION } from '../../utils/constants.js';
import { emitPermitCreated, emitPermitUpdated } from '../../utils/socket.emitter.js';
import {
  timelinePermitCreated, timelinePermitApproved, timelinePermitRejected,
  timelineWorkerAssigned,
} from '../../utils/timeline.helper.js';
import prisma from '../../config/database.js';

class PermitService {
  async getAll(query) {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { data, total } = await permitRepository.findAll({ skip, take: limit, where });
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const permit = await permitRepository.findById(id);
    if (!permit) throw ApiError.notFound('Permit not found');
    return permit;
  }

  async create(data, issuerId = null) {
    const { equipmentIds, ...permitData } = data;

    // Parse date strings
    permitData.startTime = new Date(permitData.startTime);
    permitData.endTime = new Date(permitData.endTime);

    // Set issuer if authenticated user
    if (issuerId) {
      permitData.issuerId = issuerId;
    }

    const permit = await permitRepository.create(permitData);

    // Link equipment if provided
    if (equipmentIds?.length) {
      await permitRepository.setEquipment(permit.id, equipmentIds);
    }

    const fullPermit = await permitRepository.findById(permit.id);
    emitPermitCreated(fullPermit);
    timelinePermitCreated(fullPermit);
    return fullPermit;
  }

  async update(id, data) {
    await this.getById(id);

    const { equipmentIds, ...permitData } = data;

    if (permitData.startTime) permitData.startTime = new Date(permitData.startTime);
    if (permitData.endTime) permitData.endTime = new Date(permitData.endTime);

    const permit = await permitRepository.update(id, permitData);

    // Update equipment links if provided
    if (equipmentIds !== undefined) {
      await permitRepository.setEquipment(id, equipmentIds);
    }

    const fullPermit = await permitRepository.findById(permit.id);
    emitPermitUpdated(fullPermit);
    return fullPermit;
  }

  async delete(id) {
    await this.getById(id);
    await permitRepository.delete(id);
  }

  /**
   * Approve a permit — transitions from PENDING to ACTIVE.
   */
  async approve(id, userId) {
    const permit = await this.getById(id);

    if (permit.status !== 'PENDING') {
      throw ApiError.badRequest(`Cannot approve permit with status '${permit.status}'. Only PENDING permits can be approved.`);
    }

    const updated = await permitRepository.update(id, {
      status: 'ACTIVE',
      issuerId: userId,
    });

    const fullPermit = await permitRepository.findById(updated.id);
    emitPermitUpdated(fullPermit);
    timelinePermitApproved(fullPermit);
    return fullPermit;
  }

  /**
   * Reject a permit — transitions from PENDING to REVOKED.
   */
  async reject(id, userId) {
    const permit = await this.getById(id);

    if (permit.status !== 'PENDING') {
      throw ApiError.badRequest(`Cannot reject permit with status '${permit.status}'. Only PENDING permits can be rejected.`);
    }

    const updated = await permitRepository.update(id, {
      status: 'REVOKED',
      issuerId: userId,
    });

    const fullPermit = await permitRepository.findById(updated.id);
    emitPermitUpdated(fullPermit);
    timelinePermitRejected(fullPermit);
    return fullPermit;
  }

  /**
   * Suspend an active permit.
   */
  async suspend(id) {
    const permit = await this.getById(id);

    if (permit.status !== 'ACTIVE') {
      throw ApiError.badRequest(`Cannot suspend permit with status '${permit.status}'. Only ACTIVE permits can be suspended.`);
    }

    const updated = await permitRepository.update(id, { status: 'SUSPENDED' });
    const fullPermit = await permitRepository.findById(updated.id);
    emitPermitUpdated(fullPermit);
    return fullPermit;
  }

  /**
   * Assign workers to a permit by updating their permitId.
   */
  async assignWorkers(id, workerIds) {
    const permit = await this.getById(id);

    // Update each worker's permitId
    await prisma.worker.updateMany({
      where: { id: { in: workerIds } },
      data: { permitId: id },
    });

    // Create timeline events for each assigned worker
    const workers = await prisma.worker.findMany({
      where: { id: { in: workerIds } },
      include: { zone: { select: { name: true } } },
    });

    for (const worker of workers) {
      timelineWorkerAssigned(worker, permit.zone?.name || 'permit zone');
    }

    const fullPermit = await permitRepository.findById(id);
    emitPermitUpdated(fullPermit);
    return fullPermit;
  }

  /**
   * Assign equipment to a permit.
   */
  async assignEquipment(id, equipmentIds) {
    await this.getById(id);
    await permitRepository.setEquipment(id, equipmentIds);

    const fullPermit = await permitRepository.findById(id);
    emitPermitUpdated(fullPermit);
    return fullPermit;
  }

  /**
   * Get permit history — all permits for a zone, grouped by status.
   */
  async getHistory(query) {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = {};
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.status) where.status = query.status;

    const { data, total } = await permitRepository.findAll({ skip, take: limit, where });

    // Summary counts
    const statusCounts = await prisma.permit.groupBy({
      by: ['status'],
      _count: { id: true },
      ...(query.zoneId ? { where: { zoneId: query.zoneId } } : {}),
    });

    const summary = {};
    statusCounts.forEach((s) => { summary[s.status] = s._count.id; });

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary,
    };
  }
}

export default new PermitService();
