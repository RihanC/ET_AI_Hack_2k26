// ============================================================
// ISIP — Alert Routes
// ============================================================

import { Router } from 'express';
import alertController from './alert.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getAlertsSchema, getAlertByIdSchema,
  createAlertSchema, updateAlertSchema, deleteAlertSchema,
  getAlertHistorySchema, acknowledgeAlertSchema, resolveAlertSchema,
} from './alert.validation.js';
import { ROLES_OPERATIONAL, ROLES_MANAGEMENT } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Get all alerts
 *     tags: [Alerts]
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
 *         name: severity
 *         schema: { type: string }
 *       - in: query
 *         name: acknowledged
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alerts retrieved
 */
router.get('/', authenticate, validate(getAlertsSchema), alertController.getAll);

/**
 * @swagger
 * /alerts/history:
 *   get:
 *     summary: Get alert history and summary counts
 *     tags: [Alerts]
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
 *         name: severity
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Alert history retrieved
 */
router.get('/history', authenticate, validate(getAlertHistorySchema), alertController.getHistory);

/**
 * @swagger
 * /alerts/{id}:
 *   get:
 *     summary: Get alert by ID
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alert retrieved
 */
router.get('/:id', authenticate, validate(getAlertByIdSchema), alertController.getById);

/**
 * @swagger
 * /alerts:
 *   post:
 *     summary: Create a new alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Alert created
 */
router.post('/', authenticate, authorize(...ROLES_OPERATIONAL), validate(createAlertSchema), alertController.create);

/**
 * @swagger
 * /alerts/{id}:
 *   put:
 *     summary: Update an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alert updated
 */
router.put('/:id', authenticate, authorize(...ROLES_OPERATIONAL), validate(updateAlertSchema), alertController.update);

/**
 * @swagger
 * /alerts/{id}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alert acknowledged
 */
router.post('/:id/acknowledge', authenticate, authorize(...ROLES_OPERATIONAL), validate(acknowledgeAlertSchema), alertController.acknowledge);

/**
 * @swagger
 * /alerts/{id}/resolve:
 *   post:
 *     summary: Resolve an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alert resolved
 */
router.post('/:id/resolve', authenticate, authorize(...ROLES_OPERATIONAL), validate(resolveAlertSchema), alertController.resolve);

/**
 * @swagger
 * /alerts/{id}:
 *   delete:
 *     summary: Delete an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alert deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deleteAlertSchema), alertController.delete);

export default router;
