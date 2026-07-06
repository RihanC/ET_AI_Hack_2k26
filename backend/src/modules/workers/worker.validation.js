// ============================================================
// ISIP — Worker Validation Schemas
// ============================================================

import { z } from 'zod';

const idParam = z.object({
  id: z.string().min(1, 'Invalid worker ID'),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  zoneId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'BREAK', 'EMERGENCY', 'EVACUATED', 'OFF_SHIFT']).optional(),
  ppeStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  search: z.string().optional(),
});

export const getWorkersSchema = { query: querySchema };
export const getWorkerByIdSchema = { params: idParam };

export const createWorkerSchema = {
  body: z.object({
    name: z.string().min(1, 'Worker name is required').max(100),
    role: z.string().min(1, 'Worker role is required').max(50),
    badge: z.string().min(1, 'Badge number is required').max(20),
    shift: z.string().max(20).optional().default('Morning'),
    status: z.enum(['ACTIVE', 'BREAK', 'EMERGENCY', 'EVACUATED', 'OFF_SHIFT']).optional(),
    ppeStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    heartRate: z.number().positive().optional().nullable(),
    gasExposure: z.number().min(0).optional().nullable(),
    task: z.string().max(200).optional().nullable(),
    zoneId: z.string().uuid('Invalid zone ID').optional().nullable(),
    permitId: z.string().uuid('Invalid permit ID').optional().nullable(),
  }),
};

export const updateWorkerSchema = {
  params: idParam,
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    role: z.string().min(1).max(50).optional(),
    badge: z.string().min(1).max(20).optional(),
    shift: z.string().max(20).optional(),
    status: z.enum(['ACTIVE', 'BREAK', 'EMERGENCY', 'EVACUATED', 'OFF_SHIFT']).optional(),
    ppeStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    heartRate: z.number().positive().optional().nullable(),
    gasExposure: z.number().min(0).optional().nullable(),
    task: z.string().max(200).optional().nullable(),
    zoneId: z.string().uuid().optional().nullable(),
    permitId: z.string().uuid().optional().nullable(),
  }),
};

export const deleteWorkerSchema = { params: idParam };

export const biometricsSchema = {
  params: idParam,
  body: z.object({
    heartRate: z.number().positive().optional().nullable(),
    gasExposure: z.number().min(0).optional().nullable(),
    ppeStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']).optional(),
  }),
};

export const assignZoneSchema = {
  params: idParam,
  body: z.object({
    zoneId: z.string().uuid('Invalid zone ID'),
  }),
};

export const movementHistorySchema = {
  params: idParam,
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
};

export const updateStatusSchema = {
  params: idParam,
  body: z.object({
    status: z.enum(['ACTIVE', 'BREAK', 'EMERGENCY', 'EVACUATED', 'OFF_SHIFT']),
  }),
};
