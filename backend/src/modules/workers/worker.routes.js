// ============================================================
// ISIP — Worker Routes
// ============================================================

import { Router } from 'express';
import workerController from './worker.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getWorkersSchema, getWorkerByIdSchema,
  createWorkerSchema, updateWorkerSchema, deleteWorkerSchema,
  biometricsSchema, assignZoneSchema, movementHistorySchema, updateStatusSchema,
} from './worker.validation.js';
import { ROLES_OPERATIONAL, ROLES_MANAGEMENT } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /workers:
 *   get:
 *     summary: Get all workers
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: zoneId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: ppeStatus
 *         schema: { type: string }
 *       - in: query
 *         name: riskLevel
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Workers retrieved
 */
router.get('/', authenticate, validate(getWorkersSchema), workerController.getAll);

/**
 * @swagger
 * /workers/{id}:
 *   get:
 *     summary: Get worker by ID
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Worker retrieved
 */
router.get('/:id', authenticate, validate(getWorkerByIdSchema), workerController.getById);

/**
 * @swagger
 * /workers/{id}/movements:
 *   get:
 *     summary: Get worker movement history
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Movement history retrieved
 */
router.get('/:id/movements', authenticate, validate(movementHistorySchema), workerController.getMovementHistory);

/**
 * @swagger
 * /workers:
 *   post:
 *     summary: Create a new worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Worker created
 */
router.post('/', authenticate, authorize(...ROLES_MANAGEMENT), validate(createWorkerSchema), workerController.create);

/**
 * @swagger
 * /workers/{id}:
 *   put:
 *     summary: Update a worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Worker updated
 */
router.put('/:id', authenticate, authorize(...ROLES_OPERATIONAL), validate(updateWorkerSchema), workerController.update);

/**
 * @swagger
 * /workers/{id}/biometrics:
 *   patch:
 *     summary: Update worker biometrics (heartRate, gasExposure, ppeStatus)
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               heartRate: { type: number }
 *               gasExposure: { type: number }
 *               ppeStatus: { type: string, enum: [COMPLIANT, NON_COMPLIANT, PARTIAL] }
 *     responses:
 *       200:
 *         description: Biometrics updated
 */
router.patch('/:id/biometrics', authenticate, authorize(...ROLES_OPERATIONAL), validate(biometricsSchema), workerController.updateBiometrics);

/**
 * @swagger
 * /workers/{id}/zone:
 *   patch:
 *     summary: Assign worker to a zone
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [zoneId]
 *             properties:
 *               zoneId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Worker assigned to zone
 */
router.patch('/:id/zone', authenticate, authorize(...ROLES_OPERATIONAL), validate(assignZoneSchema), workerController.assignZone);

/**
 * @swagger
 * /workers/{id}/status:
 *   patch:
 *     summary: Update worker status
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, BREAK, EMERGENCY, EVACUATED, OFF_SHIFT] }
 *     responses:
 *       200:
 *         description: Worker status updated
 */
router.patch('/:id/status', authenticate, authorize(...ROLES_OPERATIONAL), validate(updateStatusSchema), workerController.updateStatus);

/**
 * @swagger
 * /workers/{id}:
 *   delete:
 *     summary: Delete a worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Worker deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deleteWorkerSchema), workerController.delete);

export default router;
