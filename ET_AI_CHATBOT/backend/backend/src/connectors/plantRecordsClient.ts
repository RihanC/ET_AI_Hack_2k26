/**
 * Incident history, equipment info, and maintenance records don't fit the
 * LiveDataConnector interface (they're not per-zone SCADA/permit reads), so
 * they get a lighter-weight REST client here with the same config-driven
 * mock-fallback pattern as connectorRegistry.ts: set PLANT_RECORDS_API_BASE_URL
 * to point at a real records API, or leave it unset to use mock data.
 */

export interface IncidentRecord {
  incidentId: string;
  zoneId: string;
  date: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
}

export interface EquipmentInfo {
  equipmentId: string;
  name: string;
  zoneId: string;
  status: "Operational" | "Maintenance Due" | "Out of Service";
  lastInspection: string;
}

export interface MaintenanceRecord {
  recordId: string;
  equipmentId: string;
  performedAt: string;
  description: string;
  performedBy: string;
}

function baseUrl(): string | null {
  return process.env.PLANT_RECORDS_API_BASE_URL || null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Plant records API error (${res.status}) for ${path}`);
  return (await res.json()) as T;
}

export async function get_incident_history(zoneId: string): Promise<IncidentRecord[]> {
  if (!baseUrl()) {
    return [
      {
        incidentId: "INC-3391",
        zoneId,
        date: new Date(Date.now() - 86400_000 * 45).toISOString(),
        description: "Gas alarm triggered during welding operation, permit suspended pending investigation.",
        severity: "High",
      },
    ];
  }
  return fetchJson<IncidentRecord[]>(`/incidents/${encodeURIComponent(zoneId)}`);
}

export async function get_equipment_information(equipmentId: string): Promise<EquipmentInfo> {
  if (!baseUrl()) {
    return {
      equipmentId,
      name: "Compressor Unit A",
      zoneId: "Zone4",
      status: "Operational",
      lastInspection: new Date(Date.now() - 86400_000 * 20).toISOString(),
    };
  }
  return fetchJson<EquipmentInfo>(`/equipment/${encodeURIComponent(equipmentId)}`);
}

export async function get_maintenance_records(equipmentId: string): Promise<MaintenanceRecord[]> {
  if (!baseUrl()) {
    return [
      {
        recordId: "MNT-1042",
        equipmentId,
        performedAt: new Date(Date.now() - 86400_000 * 20).toISOString(),
        description: "Routine inspection and gasket replacement.",
        performedBy: "Maintenance Team B",
      },
    ];
  }
  return fetchJson<MaintenanceRecord[]>(`/maintenance/${encodeURIComponent(equipmentId)}`);
}
