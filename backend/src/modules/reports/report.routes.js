// ============================================================
// ISIP — Report Routes
// ============================================================

import { Router } from 'express';
import reportController from './report.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getReportsSchema, getReportByIdSchema,
  createReportSchema, updateReportSchema, deleteReportSchema,
} from './report.validation.js';
import { ROLES_MANAGEMENT, ROLES_OPERATIONAL } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get all reports
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: frequency
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reports retrieved
 */
router.get('/', authenticate, authorize(...ROLES_OPERATIONAL), validate(getReportsSchema), reportController.getAll);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Report retrieved
 */
router.get('/:id', authenticate, authorize(...ROLES_OPERATIONAL), validate(getReportByIdSchema), reportController.getById);

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     responses:
 *       201:
 *         description: Report created
 */
router.post('/', authenticate, authorize(...ROLES_MANAGEMENT), validate(createReportSchema), reportController.create);

/**
 * @swagger
 * /reports/{id}:
 *   put:
 *     summary: Update a report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Report updated
 */
router.put('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(updateReportSchema), reportController.update);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Report deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deleteReportSchema), reportController.delete);

export default router;
