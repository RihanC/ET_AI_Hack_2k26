// ============================================================
// ISIP — Sensor Validation Schemas
// ============================================================

import { z } from 'zod';

const idParam = z.object({
  id: z.string().uuid('Invalid sensor ID'),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  zoneId: z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),
  type: z.enum(['GAS', 'TEMPERATURE', 'PRESSURE', 'VIBRATION', 'HUMIDITY', 'FLOW']).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'WARNING', 'CRITICAL']).optional(),
  search: z.string().optional(),
});

export const getSensorsSchema = { query: querySchema };
export const getSensorByIdSchema = { params: idParam };

export const createSensorSchema = {
  body: z.object({
    name: z.string().min(1, 'Sensor name is required').max(150),
    type: z.enum(['GAS', 'TEMPERATURE', 'PRESSURE', 'VIBRATION', 'HUMIDITY', 'FLOW']),
    unit: z.string().min(1, 'Unit is required').max(20),
    min: z.number().optional().default(0),
    max: z.number().optional().default(100),
    threshold: z.number().optional().default(50),
    value: z.number().optional().default(0),
    status: z.enum(['ONLINE', 'OFFLINE', 'WARNING', 'CRITICAL']).optional(),
    trend: z.enum(['UP', 'DOWN', 'STABLE']).optional(),
    zoneId: z.string().uuid('Invalid zone ID'),
    equipmentId: z.string().uuid('Invalid equipment ID').optional().nullable(),
  }),
};

export const updateSensorSchema = {
  params: idParam,
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    type: z.enum(['GAS', 'TEMPERATURE', 'PRESSURE', 'VIBRATION', 'HUMIDITY', 'FLOW']).optional(),
    unit: z.string().min(1).max(20).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    threshold: z.number().optional(),
    value: z.number().optional(),
    status: z.enum(['ONLINE', 'OFFLINE', 'WARNING', 'CRITICAL']).optional(),
    trend: z.enum(['UP', 'DOWN', 'STABLE']).optional(),
    zoneId: z.string().uuid().optional(),
    equipmentId: z.string().uuid().optional().nullable(),
  }),
};

export const deleteSensorSchema = { params: idParam };

export const calibrateSensorSchema = { params: idParam };

export const maintenanceModeSchema = {
  params: idParam,
  body: z.object({
    enabled: z.boolean(),
  }),
};

export const sensorHealthSchema = { params: idParam };
