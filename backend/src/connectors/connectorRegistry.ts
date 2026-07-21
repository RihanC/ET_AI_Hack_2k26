import type { ConnectorConfig, LiveDataConnector } from "./types.js";
import { RestConnector } from "./restConnector.js";
import { WebSocketConnector } from "./websocketConnector.js";
import { MqttConnector } from "./mqttConnector.js";
import { OpcUaConnector } from "./opcUaConnector.js";
import { ModbusConnector } from "./modbusConnector.js";

/**
 * Reads LIVE_DATA_PROTOCOL from the environment to decide which connector
 * powers check_live_scada_sensors/get_active_permits in safetyOrchestrator.ts.
 * If unset (or set to "mock"), the orchestrator keeps using its built-in mock
 * data — so local development and this sandbox both keep working without any
 * live infrastructure, and switching to a real plant connector is a config
 * change, not a code change.
 */
let activeConnector: LiveDataConnector | null = null;
let connectPromise: Promise<void> | null = null;

export function isLiveConnectorConfigured(): boolean {
  return (process.env.LIVE_DATA_PROTOCOL ?? "mock") !== "mock";
}

export async function getConnector(): Promise<LiveDataConnector> {
  if (activeConnector) return activeConnector;

  const config = loadConfigFromEnv();
  activeConnector = createConnector(config);

  // Only connect once, even if multiple requests race to call this concurrently.
  connectPromise ??= activeConnector.connect();
  await connectPromise;

  return activeConnector;
}

function loadConfigFromEnv(): ConnectorConfig {
  const protocol = process.env.LIVE_DATA_PROTOCOL;

  switch (protocol) {
    case "rest":
      return {
        type: "rest",
        baseUrl: requireEnv("LIVE_DATA_REST_BASE_URL"),
        timeoutMs: process.env.LIVE_DATA_TIMEOUT_MS ? Number(process.env.LIVE_DATA_TIMEOUT_MS) : undefined,
      };
    case "websocket":
      return {
        type: "websocket",
        url: requireEnv("LIVE_DATA_WS_URL"),
        readTimeoutMs: process.env.LIVE_DATA_TIMEOUT_MS ? Number(process.env.LIVE_DATA_TIMEOUT_MS) : undefined,
      };
    case "mqtt":
      return {
        type: "mqtt",
        brokerUrl: requireEnv("LIVE_DATA_MQTT_BROKER_URL"),
        scadaTopicPrefix: process.env.LIVE_DATA_MQTT_SCADA_PREFIX ?? "plant/scada",
        permitsTopicPrefix: process.env.LIVE_DATA_MQTT_PERMITS_PREFIX ?? "plant/permits",
        readTimeoutMs: process.env.LIVE_DATA_TIMEOUT_MS ? Number(process.env.LIVE_DATA_TIMEOUT_MS) : undefined,
      };
    case "opcua":
      return {
        type: "opcua",
        endpointUrl: requireEnv("LIVE_DATA_OPCUA_ENDPOINT"),
        nodeIdMap: JSON.parse(process.env.LIVE_DATA_OPCUA_NODE_MAP ?? "{}"),
      };
    case "modbus":
      return {
        type: "modbus",
        host: requireEnv("LIVE_DATA_MODBUS_HOST"),
        port: Number(process.env.LIVE_DATA_MODBUS_PORT ?? 502),
        unitIdMap: JSON.parse(process.env.LIVE_DATA_MODBUS_UNIT_MAP ?? "{}"),
      };
    default:
      throw new Error(`Unknown LIVE_DATA_PROTOCOL "${protocol}". Use rest | websocket | mqtt | opcua | modbus | mock.`);
  }
}

function createConnector(config: ConnectorConfig): LiveDataConnector {
  switch (config.type) {
    case "rest":
      return new RestConnector(config);
    case "websocket":
      return new WebSocketConnector(config);
    case "mqtt":
      return new MqttConnector(config);
    case "opcua":
      return new OpcUaConnector(config);
    case "modbus":
      return new ModbusConnector(config);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Test-only escape hatch to reset the singleton between test runs. */
export function _resetConnectorForTests(): void {
  activeConnector = null;
  connectPromise = null;
}
