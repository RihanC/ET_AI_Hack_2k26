// ============================================================
// ISIP — Worker Controller
// ============================================================

import workerService from './worker.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class WorkerController {
  getAll = asyncHandler(async (req, res) => {
    const { data, pagination } = await workerService.getAll(req.query);
    ApiResponse.paginated(res, 'Workers retrieved', data, pagination);
  });

  getById = asyncHandler(async (req, res) => {
    const worker = await workerService.getById(req.params.id);
    ApiResponse.ok(res, 'Worker retrieved', worker);
  });

  create = asyncHandler(async (req, res) => {
    const worker = await workerService.create(req.body);
    ApiResponse.created(res, 'Worker created', worker);
  });

  update = asyncHandler(async (req, res) => {
    const worker = await workerService.update(req.params.id, req.body);
    ApiResponse.ok(res, 'Worker updated', worker);
  });

  delete = asyncHandler(async (req, res) => {
    await workerService.delete(req.params.id);
    ApiResponse.ok(res, 'Worker deleted');
  });

  updateBiometrics = asyncHandler(async (req, res) => {
    const worker = await workerService.updateBiometrics(req.params.id, req.body);
    ApiResponse.ok(res, 'Worker biometrics updated', worker);
  });

  assignZone = asyncHandler(async (req, res) => {
    const { zoneId } = req.body;
    const worker = await workerService.assignZone(req.params.id, zoneId);
    ApiResponse.ok(res, 'Worker assigned to zone', worker);
  });

  getMovementHistory = asyncHandler(async (req, res) => {
    const { data, pagination } = await workerService.getMovementHistory(req.params.id, req.query);
    ApiResponse.paginated(res, 'Worker movement history retrieved', data, pagination);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const worker = await workerService.updateStatus(req.params.id, status);
    ApiResponse.ok(res, 'Worker status updated', worker);
  });
}

export default new WorkerController();
