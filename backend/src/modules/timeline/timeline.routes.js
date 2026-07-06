// ============================================================
// ISIP — Timeline Routes
// ============================================================

import { Router } from 'express';
import timelineController from './timeline.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getTimelineSchema, getTimelineByIdSchema,
  createTimelineSchema, updateTimelineSchema, deleteTimelineSchema,
} from './timeline.validation.js';
import { ROLES_MANAGEMENT } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /timeline:
 *   get:
 *     summary: Get timeline events
 *     tags: [Timeline]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: severity
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Timeline events retrieved
 */
router.get('/', authenticate, validate(getTimelineSchema), timelineController.getAll);

/**
 * @swagger
 * /timeline/{id}:
 *   get:
 *     summary: Get timeline event by ID
 *     tags: [Timeline]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Timeline event retrieved
 */
router.get('/:id', authenticate, validate(getTimelineByIdSchema), timelineController.getById);

/**
 * @swagger
 * /timeline:
 *   post:
 *     summary: Create a timeline event
 *     tags: [Timeline]
 *     responses:
 *       201:
 *         description: Timeline event created
 */
router.post('/', authenticate, authorize(...ROLES_MANAGEMENT), validate(createTimelineSchema), timelineController.create);

/**
 * @swagger
 * /timeline/{id}:
 *   put:
 *     summary: Update a timeline event
 *     tags: [Timeline]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Timeline event updated
 */
router.put('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(updateTimelineSchema), timelineController.update);

/**
 * @swagger
 * /timeline/{id}:
 *   delete:
 *     summary: Delete a timeline event
 *     tags: [Timeline]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Timeline event deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(deleteTimelineSchema), timelineController.delete);

export default router;
