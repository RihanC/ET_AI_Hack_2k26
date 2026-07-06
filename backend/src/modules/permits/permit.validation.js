// ============================================================
// ISIP — Permit Validation Schemas
// ============================================================

import { z } from 'zod';

const idParam = z.object({
  id: z.string().min(1, 'Invalid permit ID'),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  zoneId: z.string().uuid().optional(),
  type: z.enum(['HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL', 'WORKING_AT_HEIGHT', 'CHEMICAL']).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'SUSPENDED', 'REVOKED']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  search: z.string().optional(),
});

export const getPermitsSchema = { query: querySchema };
export const getPermitByIdSchema = { params: idParam };

export const createPermitSchema = {
  body: z.object({
    type: z.enum(['HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL', 'WORKING_AT_HEIGHT', 'CHEMICAL']),
    title: z.string().min(1, 'Permit title is required').max(200),
    status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'SUSPENDED', 'REVOKED']).optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    compliance: z.number().min(0).max(100).optional().default(0),
    startTime: z.string().datetime({ message: 'Invalid start time' }).or(z.string().min(1)),
    endTime: z.string().datetime({ message: 'Invalid end time' }).or(z.string().min(1)),
    issuerId: z.string().uuid('Invalid issuer ID').optional().nullable(),
    zoneId: z.string().uuid('Invalid zone ID'),
    aiRecommendation: z.string().max(1000).optional().nullable(),
    equipmentIds: z.array(z.string().uuid()).optional(),
  }),
};

export const updatePermitSchema = {
  params: idParam,
  body: z.object({
    type: z.enum(['HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL', 'WORKING_AT_HEIGHT', 'CHEMICAL']).optional(),
    title: z.string().min(1).max(200).optional(),
    status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'SUSPENDED', 'REVOKED']).optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    compliance: z.number().min(0).max(100).optional(),
    startTime: z.string().datetime().or(z.string().min(1)).optional(),
    endTime: z.string().datetime().or(z.string().min(1)).optional(),
    issuerId: z.string().uuid().optional().nullable(),
    zoneId: z.string().uuid().optional(),
    aiRecommendation: z.string().max(1000).optional().nullable(),
    equipmentIds: z.array(z.string().uuid()).optional(),
  }),
};

export const deletePermitSchema = { params: idParam };

export const approvePermitSchema = { params: idParam };
export const rejectPermitSchema = { params: idParam };
export const suspendPermitSchema = { params: idParam };

export const assignWorkersSchema = {
  params: idParam,
  body: z.object({
    workerIds: z.array(z.string().min(1)).min(1, 'At least one worker ID is required'),
  }),
};

export const assignEquipmentSchema = {
  params: idParam,
  body: z.object({
    equipmentIds: z.array(z.string().uuid()).min(1, 'At least one equipment ID is required'),
  }),
};

export const permitHistorySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    zoneId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'SUSPENDED', 'REVOKED']).optional(),
  }),
};
