import type { LiveDataConnector, RestConnectorConfig } from "./types.js";
import type { PermitRecord, ScadaReading } from "../orchestrator/safetyOrchestrator.js";

/**
 * Assumes the plant's REST gateway exposes:
 *   GET {baseUrl}/scada/{zoneId}   -> ScadaReading[]
 *   GET {baseUrl}/permits/{zoneId} -> PermitRecord[]
 * If your gateway uses different paths/shapes, adjust the two fetch calls below —
 * everything else (timeout handling, error surfacing) stays the same.
 */
export class RestConnector implements LiveDataConnector {
  readonly protocol = "rest" as const;

  constructor(private config: RestConnectorConfig) {}

  async connect(): Promise<void> {
    // Stateless HTTP — nothing to hold open, but verify reachability up front
    // so config errors surface at startup rather than on the first live query.
    const res = await this.fetchWithTimeout(`${this.config.baseUrl}/health`).catch(() => null);
    if (!res || !res.ok) {
      console.warn(`RestConnector: health check to ${this.config.baseUrl}/health did not succeed — continuing anyway.`);
    }
  }

  async disconnect(): Promise<void> {
    // No-op for stateless REST.
  }

  async getScadaReadings(zoneId: string): Promise<ScadaReading[]> {
    const res = await this.fetchWithTimeout(`${this.config.baseUrl}/scada/${encodeURIComponent(zoneId)}`);
    if (!res.ok) throw new Error(`REST SCADA fetch failed (${res.status}) for zone ${zoneId}`);
    return (await res.json()) as ScadaReading[];
  }

  async getActivePermits(zoneId: string): Promise<PermitRecord[]> {
    const res = await this.fetchWithTimeout(`${this.config.baseUrl}/permits/${encodeURIComponent(zoneId)}`);
    if (!res.ok) throw new Error(`REST permits fetch failed (${res.status}) for zone ${zoneId}`);
    return (await res.json()) as PermitRecord[];
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 5000);
    try {
      return await fetch(url, { headers: this.config.headers, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}
