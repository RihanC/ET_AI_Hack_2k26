// ============================================================
// ISIP — Dashboard Controller
// ============================================================

import dashboardService from './dashboard.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class DashboardController {
  getKPIs = asyncHandler(async (req, res) => {
    const kpis = await dashboardService.getKPIs();
    ApiResponse.ok(res, 'Dashboard KPIs retrieved', kpis);
  });

  getOverview = asyncHandler(async (req, res) => {
    const overview = await dashboardService.getOverview();
    ApiResponse.ok(res, 'Dashboard overview retrieved', overview);
  });

  getStatistics = asyncHandler(async (req, res) => {
    const stats = await dashboardService.getStatistics();
    ApiResponse.ok(res, 'Dashboard statistics retrieved', stats);
  });

  getCharts = asyncHandler(async (req, res) => {
    const charts = await dashboardService.getCharts();
    ApiResponse.ok(res, 'Dashboard charts retrieved', charts);
  });
}

export default new DashboardController();
