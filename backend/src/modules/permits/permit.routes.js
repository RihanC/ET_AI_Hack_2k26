// ============================================================
// ISIP — Permit Routes
// ============================================================

import { Router } from 'express';
import permitController from './permit.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getPermitsSchema, getPermitByIdSchema,
  createPermitSchema, updatePermitSchema, deletePermitSchema,
  approvePermitSchema, rejectPermitSchema, suspendPermitSchema,
  assignWorkersSchema, assignEquipmentSchema, permitHistorySchema,
} from './permit.validation.js';
import { ROLES_MANAGEMENT, ROLES_OPERATIONAL } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /permits:
 *   get:
 *     summary: Get all permits
 *     tags: [Permits]
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
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: riskLevel
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permits retrieved
 */
router.get('/', authenticate, validate(getPermitsSchema), permitController.getAll);

/**
 * @swagger
 * /permits/history:
 *   get:
 *     summary: Get permit history with status summary
 *     tags: [Permits]
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
 *     responses:
 *       200:
 *         description: Permit history retrieved
 */
router.get('/history', authenticate, validate(permitHistorySchema), permitController.getHistory);

/**
 * @swagger
 * /permits/{id}:
 *   get:
 *     summary: Get permit by ID
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permit retrieved
 */
router.get('/:id', authenticate, validate(getPermitByIdSchema), permitController.getById);

/**
 * @swagger
 * /permits:
 *   post:
 *     summary: Create a new permit
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Permit created
 */
router.post('/', authenticate, authorize(...ROLES_OPERATIONAL), validate(createPermitSchema), permitController.create);

/**
 * @swagger
 * /permits/{id}:
 *   put:
 *     summary: Update a permit
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permit updated
 */
router.put('/:id', authenticate, authorize(...ROLES_OPERATIONAL), validate(updatePermitSchema), permitController.update);

/**
 * @swagger
 * /permits/{id}/approve:
 *   post:
 *     summary: Approve a pending permit
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permit approved
 *       400:
 *         description: Permit is not in PENDING status
 */
router.post('/:id/approve', authenticate, authorize(...ROLES_MANAGEMENT), validate(approvePermitSchema), permitController.approve);

/**
 * @swagger
 * /permits/{id}/reject:
 *   post:
 *     summary: Reject a pending permit
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permit rejected
 *       400:
 *         description: Permit is not in PENDING status
 */
router.post('/:id/reject', authenticate, authorize(...ROLES_MANAGEMENT), validate(rejectPermitSchema), permitController.reject);

/**
 * @swagger
 * /permits/{id}/suspend:
 *   post:
 *     summary: Suspend an active permit
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permit suspended
 */
router.post('/:id/suspend', authenticate, authorize(...ROLES_MANAGEMENT), validate(suspendPermitSchema), permitController.suspend);

/**
 * @swagger
 * /permits/{id}/workers:
 *   post:
 *     summary: Assign workers to a permit
 *     tags: [Permits]
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
 *             required: [workerIds]
 *             properties:
 *               workerIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Workers assigned to permit
 */
router.post('/:id/workers', authenticate, authorize(...ROLES_OPERATIONAL), validate(assignWorkersSchema), permitController.assignWorkers);

/**
 * @swagger
 * /permits/{id}/equipment:
 *   post:
 *     summary: Assign equipment to a permit
 *     tags: [Permits]
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
 *             required: [equipmentIds]
 *             properties:
 *               equipmentIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Equipment assigned to permit
 */
router.post('/:id/equipment', authenticate, authorize(...ROLES_OPERATIONAL), validate(assignEquipmentSchema), permitController.assignEquipment);

/**
 * @swagger
 * /permits/{id}:
 *   delete:
 *     summary: Delete a permit
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permit deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deletePermitSchema), permitController.delete);

export default router;
