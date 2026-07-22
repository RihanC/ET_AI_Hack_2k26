import type { LiveDataConnector, ModbusConnectorConfig } from "./types.js";
import type { PermitRecord, ScadaReading } from "../orchestrator/safetyOrchestrator.js";

/**
 * IMPORTANT: Written against modbus-serial's documented TCP client API
 * (ModbusRTU.connectTCP / setID / readHoldingRegisters), but modbus-serial is
 * NOT installed and this code has NOT been run in this sandbox — exercising it
 * needs a real or simulated Modbus TCP device. Treat this as a correct starting
 * point to test against your actual plant Modbus gateway, not as verified-working
 * code the way the REST/WebSocket/MQTT connectors are.
 *
 * To activate: `npm install modbus-serial`, then uncomment the real
 * implementation below and remove the "not implemented" throws.
 *
 * Register mapping is plant-specific and NOT guessed here: you must fill in
 * REGISTER_MAP with the actual holding-register addresses your PLC/RTU uses
 * for gas PPM, pressure, and temperature — these vary per installation and
 * guessing them would silently produce wrong readings, which is worse than
 * refusing to guess.
 *
 * Modbus has no concept of permits — pair with a REST or MQTT connector.
 */
export class ModbusConnector implements LiveDataConnector {
  readonly protocol = "modbus" as const;

  // Fill in with your PLC's actual register addresses before use.
  private static REGISTER_MAP: { gasPPM: number; pressurePSI: number; temperatureC: number } | null = null;

  constructor(private config: ModbusConnectorConfig) {}

  async connect(): Promise<void> {
    throw new Error(
      "ModbusConnector requires `npm install modbus-serial`, a filled-in REGISTER_MAP, " +
        "and has not been tested in this sandbox. See the class-level comment for activation steps."
    );

    /* Reference implementation once modbus-serial is installed:
    import ModbusRTU from "modbus-serial";
    this.client = new ModbusRTU();
    await this.client.connectTCP(this.config.host, { port: this.config.port });
    */
  }

  async disconnect(): Promise<void> {
    /* this.client?.close(() => {}); */
  }

  async getScadaReadings(zoneId: string): Promise<ScadaReading[]> {
    const unitId = this.config.unitIdMap[zoneId];
    if (unitId === undefined) throw new Error(`No Modbus unit ID configured for zone ${zoneId}`);
    if (!ModbusConnector.REGISTER_MAP) {
      throw new Error("ModbusConnector.REGISTER_MAP is not configured — fill in real register addresses first.");
    }

    throw new Error("ModbusConnector.getScadaReadings is not implemented — see class-level comment.");

    /* Reference implementation:
    this.client.setID(unitId);
    const gas = await this.client.readHoldingRegisters(ModbusConnector.REGISTER_MAP.gasPPM, 1);
    const pressure = await this.client.readHoldingRegisters(ModbusConnector.REGISTER_MAP.pressurePSI, 1);
    const temp = await this.client.readHoldingRegisters(ModbusConnector.REGISTER_MAP.temperatureC, 1);
    return [{
      zoneId, gasPPM: gas.data[0], pressurePSI: pressure.data[0], temperatureC: temp.data[0],
      sensorHealth: "OK", timestamp: new Date().toISOString(),
    }];
    */
  }

  async getActivePermits(_zoneId: string): Promise<PermitRecord[]> {
    throw new Error("Modbus does not expose permit-to-work data. Pair ModbusConnector with a REST or MQTT connector.");
  }
}
