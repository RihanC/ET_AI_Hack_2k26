// ============================================================
// ISIP — Dashboard Routes
// ============================================================

import { Router } from 'express';
import dashboardController from './dashboard.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard KPIs
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs retrieved
 */
router.get('/', authenticate, dashboardController.getKPIs);

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview (totals + recent timeline)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview retrieved
 */
router.get('/overview', authenticate, dashboardController.getOverview);

/**
 * @swagger
 * /dashboard/statistics:
 *   get:
 *     summary: Get dashboard statistics (groupBy breakdowns)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get('/statistics', authenticate, dashboardController.getStatistics);

/**
 * @swagger
 * /dashboard/charts:
 *   get:
 *     summary: Get dashboard chart data (trends, heatmap, readings)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Charts data retrieved
 */
router.get('/charts', authenticate, dashboardController.getCharts);

export default router;
