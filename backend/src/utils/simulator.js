// ============================================================
// ISIP — IoT Sensor Simulator
// ============================================================

import prisma from '../config/database.js';
import sensorService from '../modules/sensors/sensor.service.js';
import logger from './logger.js';

let intervalId = null;

/**
 * Start the background IoT sensor simulation.
 * Simulates readings fluctuating over time for active sensors.
 */
export function startSensorSimulation() {
  if (intervalId) return;

  logger.info('🚀 Starting live IoT sensor simulator...');

  intervalId = setInterval(async () => {
    try {
      // 1. Fetch all active/non-offline sensors from the DB
      const sensors = await prisma.sensor.findMany({
        where: {
          status: { not: 'OFFLINE' }
        }
      });

      if (sensors.length === 0) return;

      // Select 2 to 3 sensors to update per tick
      const countToUpdate = Math.min(sensors.length, Math.floor(Math.random() * 2) + 2);
      const shuffledSensors = [...sensors].sort(() => 0.5 - Math.random());
      const selectedSensors = shuffledSensors.slice(0, countToUpdate);

      for (const sensor of selectedSensors) {
        let variance = sensor.threshold * 0.04;
        if (variance === 0) variance = 1.0;

        let delta = (Math.random() - 0.5) * variance * 2;

        // 3% chance of crossing threshold (triggering warning/critical status)
        if (Math.random() < 0.03) {
          if (sensor.type === 'GAS' && sensor.name.includes('O₂')) {
            delta = -2.0; // drop below threshold
          } else {
            delta = sensor.threshold * 0.3; // rise above threshold
          }
        }

        let newValue = sensor.value + delta;
        const minVal = sensor.min ?? 0;
        const maxVal = sensor.max ?? 10000;
        newValue = Math.max(minVal, Math.min(maxVal, newValue));
        newValue = parseFloat(newValue.toFixed(2));

        logger.debug(`[Simulator] Updating sensor ${sensor.name} (${sensor.id}) value: ${newValue}`);

        // Update sensor via service layer to broadcast 'sensor:update' Socket event
        await sensorService.update(sensor.id, { value: newValue });
      }
    } catch (err) {
      logger.error(`[Simulator Error] Sensor telemetry simulation loop encountered an error: ${err.message}`);
    }
  }, 4000);
}

/**
 * Stop the background IoT sensor simulation.
 */
export function stopSensorSimulation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('🛑 Stopped live IoT sensor simulator');
  }
}
