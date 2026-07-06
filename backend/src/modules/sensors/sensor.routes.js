// ============================================================
// ISIP — Sensor Routes
// ============================================================

import { Router } from 'express';
import sensorController from './sensor.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getSensorsSchema, getSensorByIdSchema,
  createSensorSchema, updateSensorSchema, deleteSensorSchema,
  calibrateSensorSchema, maintenanceModeSchema, sensorHealthSchema,
} from './sensor.validation.js';
import { ROLES_OPERATIONAL, ROLES_MANAGEMENT } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /sensors:
 *   get:
 *     summary: Get all sensors
 *     tags: [Sensors]
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
 *         name: equipmentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sensors retrieved
 */
router.get('/', authenticate, validate(getSensorsSchema), sensorController.getAll);

/**
 * @swagger
 * /sensors/{id}:
 *   get:
 *     summary: Get sensor by ID
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sensor retrieved
 */
router.get('/:id', authenticate, validate(getSensorByIdSchema), sensorController.getById);

/**
 * @swagger
 * /sensors/{id}/health:
 *   get:
 *     summary: Get sensor health information
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sensor health retrieved
 */
router.get('/:id/health', authenticate, validate(sensorHealthSchema), sensorController.getHealth);

/**
 * @swagger
 * /sensors:
 *   post:
 *     summary: Create a new sensor
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Sensor created
 */
router.post('/', authenticate, authorize(...ROLES_MANAGEMENT), validate(createSensorSchema), sensorController.create);

/**
 * @swagger
 * /sensors/{id}:
 *   put:
 *     summary: Update a sensor
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sensor updated
 */
router.put('/:id', authenticate, authorize(...ROLES_OPERATIONAL), validate(updateSensorSchema), sensorController.update);

/**
 * @swagger
 * /sensors/{id}/calibrate:
 *   post:
 *     summary: Set sensor to calibration mode
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sensor set to calibration mode
 */
router.post('/:id/calibrate', authenticate, authorize(...ROLES_MANAGEMENT), validate(calibrateSensorSchema), sensorController.calibrate);

/**
 * @swagger
 * /sensors/{id}/maintenance:
 *   post:
 *     summary: Enable or disable sensor maintenance mode
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Maintenance mode toggled
 */
router.post('/:id/maintenance', authenticate, authorize(...ROLES_MANAGEMENT), validate(maintenanceModeSchema), sensorController.setMaintenanceMode);

/**
 * @swagger
 * /sensors/{id}:
 *   delete:
 *     summary: Delete a sensor
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sensor deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deleteSensorSchema), sensorController.delete);

export default router;
