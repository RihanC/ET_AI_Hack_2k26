import mqtt, { MqttClient } from "mqtt";
import type { LiveDataConnector, MqttConnectorConfig } from "./types.js";
import type { PermitRecord, ScadaReading } from "../orchestrator/safetyOrchestrator.js";

/**
 * Assumes the plant publishes retained or periodic messages on:
 *   {scadaTopicPrefix}/{zoneId}   -> JSON ScadaReading[]
 *   {permitsTopicPrefix}/{zoneId} -> JSON PermitRecord[]
 * MQTT is publish/subscribe rather than request/response, so "getScadaReadings"
 * subscribes and waits for the next message on that zone's topic (or times out).
 * If your broker uses retained messages, this returns almost immediately since
 * the broker delivers the last retained value on subscribe.
 */
export class MqttConnector implements LiveDataConnector {
  readonly protocol = "mqtt" as const;
  private client: MqttClient | null = null;

  constructor(private config: MqttConnectorConfig) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.config.brokerUrl);
      this.client.once("connect", () => resolve());
      this.client.once("error", (err) => reject(err));
    });
  }

  async disconnect(): Promise<void> {
    await new Promise<void>((resolve) => this.client?.end(false, {}, () => resolve()));
    this.client = null;
  }

  async getScadaReadings(zoneId: string): Promise<ScadaReading[]> {
    return this.waitForTopicMessage(`${this.config.scadaTopicPrefix}/${zoneId}`);
  }

  async getActivePermits(zoneId: string): Promise<PermitRecord[]> {
    return this.waitForTopicMessage(`${this.config.permitsTopicPrefix}/${zoneId}`);
  }

  private waitForTopicMessage(topic: string): Promise<any> {
    if (!this.client) {
      return Promise.reject(new Error("MQTT connector is not connected"));
    }
    const client = this.client;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        client.unsubscribe(topic);
        client.removeListener("message", onMessage);
        reject(new Error(`MQTT request timed out waiting for a message on ${topic}`));
      }, this.config.readTimeoutMs ?? 5000);

      function onMessage(receivedTopic: string, payload: Buffer) {
        if (receivedTopic !== topic) return;
        clearTimeout(timer);
        client.unsubscribe(topic);
        client.removeListener("message", onMessage);
        try {
          resolve(JSON.parse(payload.toString()));
        } catch (err) {
          reject(new Error(`Malformed JSON payload on topic ${topic}`));
        }
      }

      client.on("message", onMessage);
      client.subscribe(topic, (err) => {
        if (err) {
          clearTimeout(timer);
          client.removeListener("message", onMessage);
          reject(err);
        }
      });
    });
  }
}
