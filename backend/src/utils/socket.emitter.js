// ============================================================
// ISIP — Socket.IO Emitter Utility
// ============================================================

import { getIO } from '../socket/socket.manager.js';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from './constants.js';
import logger from './logger.js';

/**
 * Safely get the Socket.IO instance (returns null if not initialized).
 */
function safeGetIO() {
  try {
    return getIO();
  } catch {
    return null;
  }
}

/**
 * Emit an event to all connected clients.
 */
export function emitToAll(event, data) {
  const io = safeGetIO();
  if (!io) return;
  io.emit(event, data);
  logger.debug(`[Socket Emit] ${event} → all clients`);
}

/**
 * Emit an event to a specific zone room.
 */
export function emitToZone(zoneId, event, data) {
  const io = safeGetIO();
  if (!io) return;
  io.to(`zone:${zoneId}`).emit(event, data);
  logger.debug(`[Socket Emit] ${event} → zone:${zoneId}`);
}

/**
 * Emit an event to a specific user room.
 */
export function emitToUser(userId, event, data) {
  const io = safeGetIO();
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
  logger.debug(`[Socket Emit] ${event} → user:${userId}`);
}

// ── Specific Emitters ────────────────────────────────────

export function emitDashboardUpdate(data) {
  emitToAll(SOCKET_EVENTS.DASHBOARD_UPDATE, data);
}

export function emitSensorUpdate(sensor) {
  emitToAll(SOCKET_EVENTS.SENSOR_UPDATE, sensor);
  if (sensor.zoneId) {
    emitToZone(sensor.zoneId, SOCKET_EVENTS.SENSOR_UPDATE, sensor);
  }
  const io = safeGetIO();
  if (io) {
    io.of(SOCKET_NAMESPACES.SENSORS).emit(SOCKET_EVENTS.SENSOR_UPDATE, sensor);
  }
}

export function emitWorkerUpdate(worker) {
  emitToAll(SOCKET_EVENTS.WORKER_UPDATE, worker);
  if (worker.zoneId) {
    emitToZone(worker.zoneId, SOCKET_EVENTS.WORKER_UPDATE, worker);
  }
}

export function emitWorkerMovement(movement) {
  emitToAll(SOCKET_EVENTS.WORKER_MOVEMENT, movement);
  if (movement.toZoneId) {
    emitToZone(movement.toZoneId, SOCKET_EVENTS.WORKER_MOVEMENT, movement);
  }
  if (movement.fromZoneId) {
    emitToZone(movement.fromZoneId, SOCKET_EVENTS.WORKER_MOVEMENT, movement);
  }
}

export function emitAlertNew(alert) {
  emitToAll(SOCKET_EVENTS.ALERT_NEW, alert);
  if (alert.zoneId) {
    emitToZone(alert.zoneId, SOCKET_EVENTS.ALERT_NEW, alert);
  }
  const io = safeGetIO();
  if (io) {
    io.of(SOCKET_NAMESPACES.ALERTS).emit(SOCKET_EVENTS.ALERT_NEW, alert);
  }
}

export function emitAlertAcknowledged(alert) {
  emitToAll(SOCKET_EVENTS.ALERT_ACKNOWLEDGED, alert);
  const io = safeGetIO();
  if (io) {
    io.of(SOCKET_NAMESPACES.ALERTS).emit(SOCKET_EVENTS.ALERT_ACKNOWLEDGED, alert);
  }
}

export function emitAlertResolved(alert) {
  emitToAll(SOCKET_EVENTS.ALERT_RESOLVED, alert);
  const io = safeGetIO();
  if (io) {
    io.of(SOCKET_NAMESPACES.ALERTS).emit(SOCKET_EVENTS.ALERT_RESOLVED, alert);
  }
}

export function emitPermitCreated(permit) {
  emitToAll(SOCKET_EVENTS.PERMIT_CREATED, permit);
  if (permit.zoneId) {
    emitToZone(permit.zoneId, SOCKET_EVENTS.PERMIT_CREATED, permit);
  }
}

export function emitPermitUpdated(permit) {
  emitToAll(SOCKET_EVENTS.PERMIT_UPDATED, permit);
  if (permit.zoneId) {
    emitToZone(permit.zoneId, SOCKET_EVENTS.PERMIT_UPDATED, permit);
  }
}

export function emitTimelineNew(event) {
  emitToAll(SOCKET_EVENTS.TIMELINE_NEW, event);
  if (event.zoneId) {
    emitToZone(event.zoneId, SOCKET_EVENTS.TIMELINE_NEW, event);
  }
}
