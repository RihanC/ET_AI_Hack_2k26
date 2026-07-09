// ============================================================
// ISIP — Sensor Controller
// ============================================================

import sensorService from './sensor.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class SensorController {
  getAll = asyncHandler(async (req, res) => {
    const { data, pagination } = await sensorService.getAll(req.query);
    ApiResponse.paginated(res, 'Sensors retrieved', data, pagination);
  });

  getById = asyncHandler(async (req, res) => {
    const sensor = await sensorService.getById(req.params.id);
    ApiResponse.ok(res, 'Sensor retrieved', sensor);
  });

  create = asyncHandler(async (req, res) => {
    const sensor = await sensorService.create(req.body);
    ApiResponse.created(res, 'Sensor created', sensor);
  });

  update = asyncHandler(async (req, res) => {
    const sensor = await sensorService.update(req.params.id, req.body);
    ApiResponse.ok(res, 'Sensor updated', sensor);
  });

  delete = asyncHandler(async (req, res) => {
    await sensorService.delete(req.params.id);
    ApiResponse.ok(res, 'Sensor deleted');
  });

  calibrate = asyncHandler(async (req, res) => {
    const sensor = await sensorService.calibrate(req.params.id);
    ApiResponse.ok(res, 'Sensor set to calibration mode', sensor);
  });

  setMaintenanceMode = asyncHandler(async (req, res) => {
    const { enabled } = req.body;
    const sensor = await sensorService.setMaintenanceMode(req.params.id, enabled);
    ApiResponse.ok(res, `Sensor maintenance mode ${enabled ? 'enabled' : 'disabled'}`, sensor);
  });

  getHealth = asyncHandler(async (req, res) => {
    const health = await sensorService.getHealth(req.params.id);
    ApiResponse.ok(res, 'Sensor health retrieved', health);
  });

  ingestReading = asyncHandler(async (req, res) => {
    const { value } = req.body;
    const sensor = await sensorService.update(req.params.id, { value });
    ApiResponse.ok(res, 'Sensor reading ingested successfully', sensor);
  });
}

export default new SensorController();
