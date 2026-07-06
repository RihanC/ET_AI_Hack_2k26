// ============================================================
// ISIP — User Routes
// ============================================================

import { Router } from 'express';
import userController from './user.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getUsersSchema, getUserByIdSchema,
  createUserSchema, updateUserSchema, deleteUserSchema,
} from './user.validation.js';
import { ROLES_MANAGEMENT, ROLES_ADMIN } from '../../utils/constants.js';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
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
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users retrieved
 */
router.get('/', authenticate, authorize(...ROLES_MANAGEMENT), validate(getUsersSchema), userController.getAll);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User retrieved
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticate, authorize(...ROLES_MANAGEMENT), validate(getUserByIdSchema), userController.getById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/', authenticate, authorize(...ROLES_ADMIN), validate(createUserSchema), userController.create);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:id', authenticate, authorize(...ROLES_ADMIN), validate(updateUserSchema), userController.update);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:id', authenticate, authorize(...ROLES_ADMIN), validate(deleteUserSchema), userController.delete);

export default router;
