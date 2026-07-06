// ============================================================
// ISIP — Timeline Helper
// Automatically creates timeline events for important actions.
// ============================================================

import timelineRepository from '../modules/timeline/timeline.repository.js';
import { emitTimelineNew } from './socket.emitter.js';
import logger from './logger.js';

/**
 * Create a timeline event and emit via Socket.IO.
 * Catches errors silently so it never blocks the calling operation.
 */
export async function createTimelineEvent({
  category,
  title,
  description,
  severity = 'INFO',
  zoneId = null,
  relatedId = null,
}) {
  try {
    const event = await timelineRepository.create({
      category,
      title,
      description,
      severity,
      zoneId,
      relatedId,
    });
    emitTimelineNew(event);
    return event;
  } catch (error) {
    logger.error(`[Timeline] Failed to create event: ${error.message}`);
    return null;
  }
}

// ── Convenience Methods ──────────────────────────────────

export async function timelinePermitCreated(permit) {
  return createTimelineEvent({
    category: 'PERMIT',
    title: 'Permit Created',
    description: `Permit "${permit.title}" (${permit.type}) created for zone`,
    severity: 'INFO',
    zoneId: permit.zoneId,
    relatedId: permit.id,
  });
}

export async function timelinePermitApproved(permit) {
  return createTimelineEvent({
    category: 'PERMIT',
    title: 'Permit Approved',
    description: `Permit "${permit.title}" has been approved and activated`,
    severity: 'INFO',
    zoneId: permit.zoneId,
    relatedId: permit.id,
  });
}

export async function timelinePermitRejected(permit) {
  return createTimelineEvent({
    category: 'PERMIT',
    title: 'Permit Rejected',
    description: `Permit "${permit.title}" has been rejected`,
    severity: 'WARNING',
    zoneId: permit.zoneId,
    relatedId: permit.id,
  });
}

export async function timelineWorkerAssigned(worker, zoneName) {
  return createTimelineEvent({
    category: 'WORKER',
    title: 'Worker Assigned to Zone',
    description: `Worker "${worker.name}" (${worker.badge}) assigned to ${zoneName}`,
    severity: 'INFO',
    zoneId: worker.zoneId,
    relatedId: worker.id,
  });
}

export async function timelineWorkerEnteredZone(worker, zoneName) {
  return createTimelineEvent({
    category: 'WORKER',
    title: 'Worker Entered Zone',
    description: `Worker "${worker.name}" (${worker.badge}) entered ${zoneName}`,
    severity: 'INFO',
    zoneId: worker.zoneId,
    relatedId: worker.id,
  });
}

export async function timelineAlertCreated(alert) {
  return createTimelineEvent({
    category: 'SENSOR',
    title: 'Alert Created',
    description: `${alert.severity} alert: ${alert.title}`,
    severity: alert.severity,
    zoneId: alert.zoneId,
    relatedId: alert.id,
  });
}

export async function timelineAlertResolved(alert) {
  return createTimelineEvent({
    category: 'SENSOR',
    title: 'Alert Resolved',
    description: `Alert "${alert.title}" has been resolved`,
    severity: 'INFO',
    zoneId: alert.zoneId,
    relatedId: alert.id,
  });
}

export async function timelineSensorStatusChanged(sensor, oldStatus, newStatus) {
  const severity = newStatus === 'CRITICAL' ? 'CRITICAL' : newStatus === 'WARNING' ? 'WARNING' : 'INFO';
  return createTimelineEvent({
    category: 'SENSOR',
    title: 'Sensor Status Changed',
    description: `Sensor "${sensor.name}" status changed from ${oldStatus} to ${newStatus}`,
    severity,
    zoneId: sensor.zoneId,
    relatedId: sensor.id,
  });
}
