// ============================================================
// ISIP — Permit Controller
// ============================================================

import permitService from './permit.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class PermitController {
  getAll = asyncHandler(async (req, res) => {
    const { data, pagination } = await permitService.getAll(req.query);
    ApiResponse.paginated(res, 'Permits retrieved', data, pagination);
  });

  getById = asyncHandler(async (req, res) => {
    const permit = await permitService.getById(req.params.id);
    ApiResponse.ok(res, 'Permit retrieved', permit);
  });

  create = asyncHandler(async (req, res) => {
    const permit = await permitService.create(req.body, req.user?.id);
    ApiResponse.created(res, 'Permit created', permit);
  });

  update = asyncHandler(async (req, res) => {
    const permit = await permitService.update(req.params.id, req.body);
    ApiResponse.ok(res, 'Permit updated', permit);
  });

  delete = asyncHandler(async (req, res) => {
    await permitService.delete(req.params.id);
    ApiResponse.ok(res, 'Permit deleted');
  });

  approve = asyncHandler(async (req, res) => {
    const permit = await permitService.approve(req.params.id, req.user.id);
    ApiResponse.ok(res, 'Permit approved', permit);
  });

  reject = asyncHandler(async (req, res) => {
    const permit = await permitService.reject(req.params.id, req.user.id);
    ApiResponse.ok(res, 'Permit rejected', permit);
  });

  suspend = asyncHandler(async (req, res) => {
    const permit = await permitService.suspend(req.params.id);
    ApiResponse.ok(res, 'Permit suspended', permit);
  });

  assignWorkers = asyncHandler(async (req, res) => {
    const permit = await permitService.assignWorkers(req.params.id, req.body.workerIds);
    ApiResponse.ok(res, 'Workers assigned to permit', permit);
  });

  assignEquipment = asyncHandler(async (req, res) => {
    const permit = await permitService.assignEquipment(req.params.id, req.body.equipmentIds);
    ApiResponse.ok(res, 'Equipment assigned to permit', permit);
  });

  getHistory = asyncHandler(async (req, res) => {
    const result = await permitService.getHistory(req.query);
    ApiResponse.paginated(res, 'Permit history retrieved', result.data, result.pagination);
  });
}

export default new PermitController();
