// ============================================================
// ISIP — Alert Controller
// ============================================================

import alertService from './alert.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class AlertController {
  getAll = asyncHandler(async (req, res) => {
    const { data, pagination } = await alertService.getAll(req.query);
    ApiResponse.paginated(res, 'Alerts retrieved', data, pagination);
  });

  getById = asyncHandler(async (req, res) => {
    const alert = await alertService.getById(req.params.id);
    ApiResponse.ok(res, 'Alert retrieved', alert);
  });

  create = asyncHandler(async (req, res) => {
    const alert = await alertService.create(req.body);
    ApiResponse.created(res, 'Alert created', alert);
  });

  update = asyncHandler(async (req, res) => {
    const alert = await alertService.update(req.params.id, req.body);
    ApiResponse.ok(res, 'Alert updated', alert);
  });

  delete = asyncHandler(async (req, res) => {
    await alertService.delete(req.params.id);
    ApiResponse.ok(res, 'Alert deleted');
  });

  acknowledge = asyncHandler(async (req, res) => {
    const alert = await alertService.acknowledge(req.params.id, req.user.id);
    ApiResponse.ok(res, 'Alert acknowledged', alert);
  });

  resolve = asyncHandler(async (req, res) => {
    const alert = await alertService.resolve(req.params.id, req.user.id);
    ApiResponse.ok(res, 'Alert resolved', alert);
  });

  getHistory = asyncHandler(async (req, res) => {
    const result = await alertService.getHistory(req.query);
    res.status(200).json({
      success: true,
      message: 'Alert history retrieved',
      data: result.data,
      pagination: result.pagination,
      summary: result.summary,
      timestamp: new Date().toISOString(),
    });
  });
}

export default new AlertController();
