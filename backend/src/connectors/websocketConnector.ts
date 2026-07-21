import WebSocket from "ws";
import type { LiveDataConnector, WebSocketConnectorConfig } from "./types.js";
import type { PermitRecord, ScadaReading } from "../orchestrator/safetyOrchestrator.js";

/**
 * Protocol assumed (adjust to match your plant gateway):
 *   Client sends:  { "type": "subscribe", "channel": "scada"|"permits", "zoneId": "..." }
 *   Server replies: { "type": "scada"|"permits", "zoneId": "...", "data": [...] }
 * One persistent connection is reused across requests; each request/response
 * pair is correlated by (channel, zoneId) with a timeout, since raw WebSockets
 * have no built-in request/response correlation the way HTTP does.
 */
export class WebSocketConnector implements LiveDataConnector {
  readonly protocol = "websocket" as const;
  private socket: WebSocket | null = null;
  private pending = new Map<string, { resolve: (data: any) => void; reject: (err: Error) => void; timer: NodeJS.Timeout }>();

  constructor(private config: WebSocketConnectorConfig) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.config.url);
      this.socket.once("open", () => resolve());
      this.socket.once("error", (err) => reject(err));
      this.socket.on("message", (raw) => this.handleMessage(raw.toString()));
      this.socket.on("close", () => {
        for (const [, p] of this.pending) {
          clearTimeout(p.timer);
          p.reject(new Error("WebSocket connection closed while waiting for a response"));
        }
        this.pending.clear();
      });
    });
  }

  async disconnect(): Promise<void> {
    this.socket?.close();
    this.socket = null;
  }

  async getScadaReadings(zoneId: string): Promise<ScadaReading[]> {
    return this.request("scada", zoneId);
  }

  async getActivePermits(zoneId: string): Promise<PermitRecord[]> {
    return this.request("permits", zoneId);
  }

  private handleMessage(raw: string): void {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // ignore malformed frames
    }
    const key = `${parsed.type}:${parsed.zoneId}`;
    const pending = this.pending.get(key);
    if (pending) {
      clearTimeout(pending.timer);
      this.pending.delete(key);
      pending.resolve(parsed.data);
    }
  }

  private request(channel: "scada" | "permits", zoneId: string): Promise<any> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("WebSocket connector is not connected"));
    }
    const key = `${channel}:${zoneId}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(key);
        reject(new Error(`WebSocket request timed out for ${channel}/${zoneId}`));
      }, this.config.readTimeoutMs ?? 5000);

      this.pending.set(key, { resolve, reject, timer });
      this.socket!.send(JSON.stringify({ type: "subscribe", channel, zoneId }));
    });
  }
}
