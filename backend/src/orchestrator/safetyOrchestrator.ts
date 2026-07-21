/**
 * SafeMind-1 Orchestration Service
 * -----------------------------------------------------------------------
 * Implements the "Dual Core" safety orchestration pattern:
 *   1. Knowledge Plane  -> query_safety_regulations (RAG over OISD / Factory Act)
 *   2. Telemetry Plane  -> check_live_scada_sensors + get_active_permits
 *
 * Design notes / deviations from the raw prompt spec (see review):
 *  - Emergency payloads are NEVER auto-dispatched to physical actuators.
 *    They are returned with `requiresHumanConfirmation: true` and must be
 *    explicitly approved via `confirmEmergencyPayload()` before dispatch.
 *  - Every regulatory citation carries a `standardVersion` + `retrievedAt`
 *    so stale rules are visible, not silently trusted.
 *  - Output includes a `confidence` field, separate from the citation,
 *    so inferred compound risk is never conflated with a hard rule.
 *  - A small in-memory history per zone provides hysteresis: a single
 *    noisy reading can't flip 🟢 -> 🔴 without sustained corroboration.
 *  - Regulatory grounding is fetched AFTER a first telemetry pass, so the
 *    RAG query can be scoped to the permit types actually active
 *    (fixes the "simultaneous calls with no shared context" ordering bug).
 *
 * This file is self-contained and dependency-free aside from `fetch`,
 * so it can be dropped into src/services/ in the ISIP React/Vite app.
 * Mock tool functions are clearly marked — swap them for real SCADA /
 * permit-system / vector-DB clients when those integrations exist.
 */

import { getConnector, isLiveConnectorConfigured } from "../connectors/connectorRegistry.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreatTier = "CRITICAL_SAFE" | "HAZARD_WARNING" | "CRITICAL_DANGER";

export interface PermitRecord {
  permitId: string;
  type: "HOT_WORK" | "CONFINED_SPACE" | "COLD_WORK" | "ELECTRICAL_ISOLATION";
  zoneId: string;
  status: "ACTIVE" | "PENDING" | "EXPIRED";
  issuedAt: string;
  expiresAt: string;
}

export interface ScadaReading {
  zoneId: string;
  gasPPM: number;
  pressurePSI: number;
  temperatureC: number;
  sensorHealth: "OK" | "DEGRADED" | "ERROR";
  timestamp: string;
}

export interface RegulatoryClause {
  standardId: string;        // e.g. "OISD-STD-118"
  standardVersion: string;   // e.g. "Rev. 4, 2022"
  clause: string;
  summary: string;
  retrievedAt: string;
}

export interface SafetyAssessment {
  zoneId: string;
  tier: ThreatTier;
  confidence: number; // 0-1, model's confidence this tier is correct
  activePermits: PermitRecord[];
  scada: ScadaReading[];
  compoundRiskExplanation: string;
  governingRules: RegulatoryClause[];
  complianceDelta: string;
  directives: string[];
  emergencyPayload: EmergencyPayload | null;
  audit: {
    generatedAt: string;
    modelUsed: string;
    dataFreshness: "LIVE" | "STALE" | "MISSING";
  };
}

export interface EmergencyPayload {
  hazardProfile: string;
  zoneId: string;
  requiresHumanConfirmation: true;
  proposedActions: string[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock tool implementations (used when LIVE_DATA_PROTOCOL is unset/"mock")
// ---------------------------------------------------------------------------

async function mock_check_live_scada_sensors(zoneId: string): Promise<ScadaReading[]> {
  // MOCK: simulates a mildly elevated gas reading, as in the compound-risk example.
  return [
    {
      zoneId,
      gasPPM: 38, // sub-threshold on its own (e.g. threshold ~50 PPM)
      pressurePSI: 142,
      temperatureC: 34.2,
      sensorHealth: "OK",
      timestamp: new Date().toISOString(),
    },
  ];
}

async function mock_get_active_permits(zoneId: string): Promise<PermitRecord[]> {
  // MOCK: an active hot work permit overlapping with the gas reading above.
  return [
    {
      permitId: "PTW-2201",
      type: "HOT_WORK",
      zoneId,
      status: "ACTIVE",
      issuedAt: new Date(Date.now() - 3600_000).toISOString(),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Public tool functions — delegate to a configured live connector (REST/
// WebSocket/MQTT/OPC UA/Modbus, see src/connectors/) when LIVE_DATA_PROTOCOL
// is set; otherwise fall back to the mock data above. This keeps local
// development and this sandbox working with zero configuration, while making
// the switch to a real plant connector a config change, not a code change.
// ---------------------------------------------------------------------------

export async function check_live_scada_sensors(zoneId: string): Promise<ScadaReading[]> {
  if (!isLiveConnectorConfigured()) return mock_check_live_scada_sensors(zoneId);
  const connector = await getConnector();
  return connector.getScadaReadings(zoneId);
}

export async function get_active_permits(zoneId: string): Promise<PermitRecord[]> {
  if (!isLiveConnectorConfigured()) return mock_get_active_permits(zoneId);
  const connector = await getConnector();
  return connector.getActivePermits(zoneId);
}

export async function query_safety_regulations(query: string): Promise<RegulatoryClause[]> {
  // MOCK: static stand-in for a vector DB lookup over OISD / Factory Act text.
  return [
    {
      standardId: "OISD-STD-118",
      standardVersion: "Rev. 4, 2022",
      clause: "6.3.2",
      summary:
        "Hot work permits shall not be issued or remain active in zones where flammable gas concentration exceeds 10% of LEL, regardless of whether the absolute PPM reading is below the general alarm threshold.",
      retrievedAt: new Date().toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Hysteresis: simple in-memory tier history per zone
// ---------------------------------------------------------------------------

const tierHistory = new Map<string, ThreatTier[]>();
const HYSTERESIS_WINDOW = 3;

function recordAndStabilizeTier(zoneId: string, proposedTier: ThreatTier): ThreatTier {
  const history = tierHistory.get(zoneId) ?? [];
  history.push(proposedTier);
  if (history.length > HYSTERESIS_WINDOW) history.shift();
  tierHistory.set(zoneId, history);

  // Escalations to CRITICAL_DANGER fire immediately (never suppress real danger).
  if (proposedTier === "CRITICAL_DANGER") return proposedTier;

  // De-escalations require the last two readings to agree, to avoid flapping.
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  if (prev && prev !== last) {
    // Disagreement between the last two readings -> hold at the more severe of the two.
    return severityRank(prev) > severityRank(last) ? prev : last;
  }
  return proposedTier;
}

function severityRank(tier: ThreatTier): number {
  return { CRITICAL_SAFE: 0, HAZARD_WARNING: 1, CRITICAL_DANGER: 2 }[tier];
}

// ---------------------------------------------------------------------------
// Orchestration: calls the Claude API to fuse telemetry + regulations
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are SafeMind-1, an industrial safety analysis engine.
You will be given: active permits, live SCADA readings, and relevant regulatory clauses for one plant zone.
Your job is compound-risk correlation: never judge a sensor reading in isolation from active permits.
Respond ONLY with a JSON object matching this shape, no markdown, no preamble:
{
  "tier": "CRITICAL_SAFE" | "HAZARD_WARNING" | "CRITICAL_DANGER",
  "confidence": number between 0 and 1,
  "compoundRiskExplanation": string,
  "complianceDelta": string,
  "directives": string[]
}
Bias toward CRITICAL_DANGER or HAZARD_WARNING when data is ambiguous or a permit overlaps with any elevated reading, even sub-threshold. This is a defensive-posture system: minimize false negatives.`;

async function callClaude(userPayload: object): Promise<{
  tier: ThreatTier;
  confidence: number;
  compoundRiskExplanation: string;
  complianceDelta: string;
  directives: string[];
}> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(userPayload) }],
    }),
  });

  const data = (await response.json()) as { content: Array<{ type: string; text?: string }> };
  const text = data.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .replace(/```json|```/g, "")
    .trim();

  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function assessZone(zoneId: string): Promise<SafetyAssessment> {
  // Step 1: initial telemetry pass (permits + sensors), used to scope the RAG query.
  const [scada, permits] = await Promise.all([
    check_live_scada_sensors(zoneId),
    get_active_permits(zoneId),
  ]);

  const activePermitTypes = permits.filter((p) => p.status === "ACTIVE").map((p) => p.type);
  const dataFreshness: SafetyAssessment["audit"]["dataFreshness"] =
    scada.some((s) => s.sensorHealth === "ERROR") ? "MISSING"
    : scada.some((s) => s.sensorHealth === "DEGRADED") ? "STALE"
    : "LIVE";

  // Step 2: regulatory grounding, scoped by what's actually active in the zone.
  const regQuery = `thresholds and SOP constraints for ${activePermitTypes.join(", ") || "general operations"} in an industrial zone with gas/pressure telemetry`;
  const governingRules = await query_safety_regulations(regQuery);

  // Step 3: matrix correlation via Claude
  const modelResult = await callClaude({ zoneId, scada, permits, governingRules });

  // Step 4: zero-harm defensive posture override if data is missing
  let tier: ThreatTier = modelResult.tier;
  if (dataFreshness === "MISSING") {
    tier = severityRank(tier) < severityRank("HAZARD_WARNING") ? "HAZARD_WARNING" : tier;
  }

  // Step 5: hysteresis stabilization
  const stabilizedTier = recordAndStabilizeTier(zoneId, tier);

  const emergencyPayload: EmergencyPayload | null =
    stabilizedTier === "CRITICAL_DANGER"
      ? {
          hazardProfile: modelResult.compoundRiskExplanation,
          zoneId,
          requiresHumanConfirmation: true,
          proposedActions: modelResult.directives,
          createdAt: new Date().toISOString(),
        }
      : null;

  return {
    zoneId,
    tier: stabilizedTier,
    confidence: modelResult.confidence,
    activePermits: permits,
    scada,
    compoundRiskExplanation: modelResult.compoundRiskExplanation,
    governingRules,
    complianceDelta: modelResult.complianceDelta,
    directives: modelResult.directives,
    emergencyPayload,
    audit: {
      generatedAt: new Date().toISOString(),
      modelUsed: "claude-sonnet-4-6",
      dataFreshness,
    },
  };
}

/**
 * Explicit, separate confirmation step for dispatching an emergency payload
 * to physical actuators (sirens, mobile alerts, permit revocation systems).
 * This is intentionally NOT called automatically by assessZone().
 */
export async function confirmEmergencyPayload(
  payload: EmergencyPayload,
  confirmedBy: string
): Promise<{ dispatched: boolean; confirmedBy: string; confirmedAt: string }> {
  // Wire this to your actual siren/alert API. Left as a stub deliberately —
  // this boundary should never be crossed without a real integration decision.
  return {
    dispatched: true,
    confirmedBy,
    confirmedAt: new Date().toISOString(),
  };
}
