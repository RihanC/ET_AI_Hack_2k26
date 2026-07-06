// ============================================================
// ISIP — Equipment Routes
// ============================================================

import { Router } from 'express';
import equipmentController from './equipment.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getEquipmentListSchema, getEquipmentByIdSchema,
  createEquipmentSchema, updateEquipmentSchema, deleteEquipmentSchema,
} from './equipment.validation.js';
import { ROLES_MANAGEMENT, ROLES_OPERATIONAL } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /equipment:
 *   get:
 *     summary: Get all equipment
 *     tags: [Equipment]
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
 *     responses:
 *       200:
 *         description: Equipment retrieved
 */
router.get('/', authenticate, validate(getEquipmentListSchema), equipmentController.getAll);

/**
 * @swagger
 * /equipment/{id}:
 *   get:
 *     summary: Get equipment by ID
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Equipment retrieved
 */
router.get('/:id', authenticate, validate(getEquipmentByIdSchema), equipmentController.getById);

/**
 * @swagger
 * /equipment:
 *   post:
 *     summary: Create new equipment
 *     tags: [Equipment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Equipment'
 *     responses:
 *       201:
 *         description: Equipment created
 */
router.post('/', authenticate, authorize(...ROLES_MANAGEMENT), validate(createEquipmentSchema), equipmentController.create);

/**
 * @swagger
 * /equipment/{id}:
 *   put:
 *     summary: Update equipment
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Equipment updated
 */
router.put('/:id', authenticate, authorize(...ROLES_OPERATIONAL), validate(updateEquipmentSchema), equipmentController.update);

/**
 * @swagger
 * /equipment/{id}:
 *   delete:
 *     summary: Delete equipment
 *     tags: [Equipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Equipment deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deleteEquipmentSchema), equipmentController.delete);

export default router;
