import type { PermitRecord, ScadaReading } from "../orchestrator/safetyOrchestrator.js";

/**
 * Every live-data connector implements this interface, regardless of the
 * underlying protocol (REST, WebSocket, MQTT, OPC UA, Modbus). This is what
 * lets safetyOrchestrator.ts call check_live_scada_sensors()/get_active_permits()
 * without knowing or caring which protocol is actually wired to the plant.
 */
export interface LiveDataConnector {
  readonly protocol: "rest" | "websocket" | "mqtt" | "opcua" | "modbus";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getScadaReadings(zoneId: string): Promise<ScadaReading[]>;
  getActivePermits(zoneId: string): Promise<PermitRecord[]>;
}

export interface RestConnectorConfig {
  type: "rest";
  baseUrl: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface WebSocketConnectorConfig {
  type: "websocket";
  url: string;
  /** How long to wait for a reading after subscribing before giving up (defensive posture triggers on timeout). */
  readTimeoutMs?: number;
}

export interface MqttConnectorConfig {
  type: "mqtt";
  brokerUrl: string;
  scadaTopicPrefix: string; // e.g. "plant/scada" -> subscribes to "plant/scada/{zoneId}"
  permitsTopicPrefix: string;
  readTimeoutMs?: number;
}

export interface OpcUaConnectorConfig {
  type: "opcua";
  endpointUrl: string; // e.g. "opc.tcp://plant-server:4840"
  nodeIdMap: Record<string, string>; // zoneId -> OPC UA NodeId for the relevant tag
}

export interface ModbusConnectorConfig {
  type: "modbus";
  host: string;
  port: number;
  unitIdMap: Record<string, number>; // zoneId -> Modbus unit/slave ID
}

export type ConnectorConfig =
  | RestConnectorConfig
  | WebSocketConnectorConfig
  | MqttConnectorConfig
  | OpcUaConnectorConfig
  | ModbusConnectorConfig;
