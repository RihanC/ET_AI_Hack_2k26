// ============================================================
// ISIP — Constants
// ============================================================

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  OPERATOR: 'OPERATOR',
  TECHNICIAN: 'TECHNICIAN',
  VIEWER: 'VIEWER',
};

// Role hierarchy for RBAC — maps requested role names to schema enum values
// "Supervisor" maps to SAFETY_OFFICER, "Safety Officer" is the same
export const ROLE_HIERARCHY = {
  ADMIN: 4,
  SAFETY_OFFICER: 3,
  OPERATOR: 2,
  TECHNICIAN: 1,
  VIEWER: 0,
};

// Role groups for route protection
export const ROLES_ADMIN = ['ADMIN'];
export const ROLES_MANAGEMENT = ['ADMIN', 'SAFETY_OFFICER'];
export const ROLES_OPERATIONAL = ['ADMIN', 'SAFETY_OFFICER', 'OPERATOR'];
export const ROLES_ALL_STAFF = ['ADMIN', 'SAFETY_OFFICER', 'OPERATOR', 'TECHNICIAN'];
export const ROLES_AUTHENTICATED = ['ADMIN', 'SAFETY_OFFICER', 'OPERATOR', 'TECHNICIAN', 'VIEWER'];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  // Dashboard
  DASHBOARD_UPDATE: 'dashboard:update',
  // Sensor
  SENSOR_UPDATE: 'sensor:update',
  // Worker
  WORKER_UPDATE: 'worker:update',
  WORKER_MOVEMENT: 'worker:movement',
  // Alert
  ALERT_NEW: 'alert:new',
  ALERT_ACKNOWLEDGED: 'alert:acknowledged',
  ALERT_RESOLVED: 'alert:resolved',
  // Permit
  PERMIT_CREATED: 'permit:created',
  PERMIT_UPDATED: 'permit:updated',
  // Timeline
  TIMELINE_NEW: 'timeline:new',
  // Zone
  ZONE_UPDATE: 'zone:update',
};

export const SOCKET_NAMESPACES = {
  ALERTS: '/alerts',
  SENSORS: '/sensors',
};

export const API_PREFIX = '/api';
