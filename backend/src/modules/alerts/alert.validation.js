// ============================================================
// ISIP — Alert Validation Schemas
// ============================================================

import { z } from 'zod';

const idParam = z.object({
  id: z.string().min(1, 'Invalid alert ID'),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  zoneId: z.string().uuid().optional(),
  type: z.enum(['GAS', 'TEMPERATURE', 'PRESSURE', 'EQUIPMENT', 'WORKER', 'PERMIT', 'SYSTEM']).optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  acknowledged: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search: z.string().optional(),
});

export const getAlertsSchema = { query: querySchema };
export const getAlertByIdSchema = { params: idParam };

export const createAlertSchema = {
  body: z.object({
    type: z.enum(['GAS', 'TEMPERATURE', 'PRESSURE', 'EQUIPMENT', 'WORKER', 'PERMIT', 'SYSTEM']),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional().default('INFO'),
    title: z.string().min(1, 'Alert title is required').max(200),
    description: z.string().min(1, 'Alert description is required').max(1000),
    source: z.string().max(100).optional().nullable(),
    zoneId: z.string().uuid('Invalid zone ID').optional().nullable(),
  }),
};

export const updateAlertSchema = {
  params: idParam,
  body: z.object({
    type: z.enum(['GAS', 'TEMPERATURE', 'PRESSURE', 'EQUIPMENT', 'WORKER', 'PERMIT', 'SYSTEM']).optional(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(1000).optional(),
    acknowledged: z.boolean().optional(),
    source: z.string().max(100).optional().nullable(),
    zoneId: z.string().uuid().optional().nullable(),
    userId: z.string().uuid().optional().nullable(),
  }),
};

export const deleteAlertSchema = { params: idParam };

export const getAlertHistorySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    zoneId: z.string().uuid().optional(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  }),
};

export const acknowledgeAlertSchema = { params: idParam };
export const resolveAlertSchema = { params: idParam };

