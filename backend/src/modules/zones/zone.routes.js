// ============================================================
// ISIP — Zone Routes
// ============================================================

import { Router } from 'express';
import zoneController from './zone.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getZonesSchema, getZoneByIdSchema,
  createZoneSchema, updateZoneSchema, deleteZoneSchema,
} from './zone.validation.js';
import { ROLES_MANAGEMENT } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /zones:
 *   get:
 *     summary: Get all zones
 *     tags: [Zones]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: riskLevel
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Zones retrieved
 */
router.get('/', authenticate, validate(getZonesSchema), zoneController.getAll);

/**
 * @swagger
 * /zones/{id}:
 *   get:
 *     summary: Get zone by ID
 *     tags: [Zones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Zone retrieved
 */
router.get('/:id', authenticate, validate(getZoneByIdSchema), zoneController.getById);

/**
 * @swagger
 * /zones:
 *   post:
 *     summary: Create a new zone
 *     tags: [Zones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateZone'
 *     responses:
 *       201:
 *         description: Zone created
 */
router.post('/', authenticate, authorize(...ROLES_MANAGEMENT), validate(createZoneSchema), zoneController.create);

/**
 * @swagger
 * /zones/{id}:
 *   put:
 *     summary: Update a zone
 *     tags: [Zones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Zone updated
 */
router.put('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(updateZoneSchema), zoneController.update);

/**
 * @swagger
 * /zones/{id}:
 *   delete:
 *     summary: Delete a zone
 *     tags: [Zones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Zone deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deleteZoneSchema), zoneController.delete);

export default router;
