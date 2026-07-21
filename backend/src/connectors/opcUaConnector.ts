import type { LiveDataConnector, OpcUaConnectorConfig } from "./types.js";
import type { PermitRecord, ScadaReading } from "../orchestrator/safetyOrchestrator.js";

/**
 * IMPORTANT: This connector is written against node-opcua's documented client
 * API (OPCUAClient.create / connect / createSession / session.read), but
 * node-opcua is NOT installed and this code has NOT been run in this sandbox —
 * exercising it needs a real or simulated OPC UA server (e.g. node-opcua's own
 * example server), which is out of scope for this environment. Treat this as a
 * correct starting point to test against your actual plant OPC UA endpoint, not
 * as verified-working code the way the REST/WebSocket/MQTT connectors are.
 *
 * To activate: `npm install node-opcua`, then uncomment the real implementation
 * below and remove the "not implemented" throws.
 *
 * SCADA/permit split: OPC UA doesn't have a native "permit" concept — most
 * OPC UA plant servers expose only sensor/equipment tags. `getActivePermits`
 * is left throwing "not supported" by design; pair OPC UA with a REST or MQTT
 * connector for permits if your permit-to-work system isn't exposed over OPC UA.
 */
export class OpcUaConnector implements LiveDataConnector {
  readonly protocol = "opcua" as const;

  constructor(private config: OpcUaConnectorConfig) {}

  async connect(): Promise<void> {
    throw new Error(
      "OpcUaConnector requires `npm install node-opcua` and has not been tested in this sandbox. " +
        "See the class-level comment for activation steps."
    );

    /* Reference implementation once node-opcua is installed:
    import { OPCUAClient, AttributeIds } from "node-opcua";
    this.client = OPCUAClient.create({ endpointMustExist: false });
    await this.client.connect(this.config.endpointUrl);
    this.session = await this.client.createSession();
    */
  }

  async disconnect(): Promise<void> {
    /* await this.session?.close(); await this.client?.disconnect(); */
  }

  async getScadaReadings(zoneId: string): Promise<ScadaReading[]> {
    const nodeId = this.config.nodeIdMap[zoneId];
    if (!nodeId) throw new Error(`No OPC UA NodeId configured for zone ${zoneId}`);

    throw new Error("OpcUaConnector.getScadaReadings is not implemented — see class-level comment.");

    /* Reference implementation:
    const dataValue = await this.session.read({ nodeId, attributeId: AttributeIds.Value });
    // Map dataValue.value.value (whatever structure your plant's OPC UA server exposes)
    // into the ScadaReading[] shape used elsewhere in this app.
    */
  }

  async getActivePermits(_zoneId: string): Promise<PermitRecord[]> {
    throw new Error(
      "OPC UA does not natively expose permit-to-work data in most plant configurations. " +
        "Pair OpcUaConnector with a REST or MQTT connector for permits."
    );
  }
}
