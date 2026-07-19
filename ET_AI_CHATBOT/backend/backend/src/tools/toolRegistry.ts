import {
  check_live_scada_sensors,
  get_active_permits,
  query_safety_regulations,
} from "../orchestrator/safetyOrchestrator.js";
import { retrieveContext } from "../rag/ragService.js";
import { get_incident_history, get_equipment_information, get_maintenance_records } from "../connectors/plantRecordsClient.js";
import type { ToolDefinition, ToolHandlerResult } from "../types.js";

/**
 * search_uploaded_documents is scoped by conversationId, which is passed
 * explicitly into executeTool() by the caller (chatService) rather than
 * supplied by the model — the LLM shouldn't be trusted to pick its own
 * retrieval scope across conversations.
 */

/**
 * Bridges the existing SafetyOrchestrator mock tools into the chatbot's
 * agentic tool-calling loop. These are the SAME functions imported from
 * safetyOrchestrator.ts — not reimplemented — per the "never duplicate"
 * rule. When real SCADA/permit/vector-DB connectors replace the mocks in
 * safetyOrchestrator.ts, this registry picks up the change automatically.
 */

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "query_safety_regulations",
    description:
      "Search OISD standards, the Factory Act, and internal SOPs for regulatory clauses relevant to a described activity or hazard.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language description of the activity or hazard to look up regulations for." },
      },
      required: ["query"],
    },
  },
  {
    name: "check_live_scada_sensors",
    description: "Fetch live gas PPM, pressure, and temperature readings, plus sensor health, for a specific plant zone.",
    input_schema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "Identifier of the plant zone, e.g. 'Zone4' or 'Compressor Bay'." },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "get_active_permits",
    description: "Fetch active, pending, or expired permits (hot work, confined space, cold work, electrical isolation) for a specific plant zone.",
    input_schema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "Identifier of the plant zone." },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "search_uploaded_documents",
    description:
      "Search the documents the user has uploaded in this conversation (PDF, DOCX, TXT, CSV, XLSX, or files inside a ZIP) for relevant passages.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for in the uploaded documents." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_incident_history",
    description: "Fetch past safety incidents recorded for a specific plant zone.",
    input_schema: {
      type: "object",
      properties: {
        zoneId: { type: "string", description: "Identifier of the plant zone." },
      },
      required: ["zoneId"],
    },
  },
  {
    name: "get_equipment_information",
    description: "Fetch status and inspection info for a specific piece of equipment.",
    input_schema: {
      type: "object",
      properties: {
        equipmentId: { type: "string", description: "Identifier of the equipment, e.g. 'COMP-A-01'." },
      },
      required: ["equipmentId"],
    },
  },
  {
    name: "get_maintenance_records",
    description: "Fetch maintenance history for a specific piece of equipment.",
    input_schema: {
      type: "object",
      properties: {
        equipmentId: { type: "string", description: "Identifier of the equipment." },
      },
      required: ["equipmentId"],
    },
  },
];

type ToolInput = Record<string, unknown>;

export async function executeTool(
  toolName: string,
  input: ToolInput,
  conversationId: string
): Promise<ToolHandlerResult> {
  try {
    return await dispatchTool(toolName, input, conversationId);
  } catch (err) {
    // Defensive posture (see SafetyOrchestrator docs): a failed live-data call
    // must never crash the chat turn or be silently swallowed. Surface it to
    // the model as an explicit failure so it can flag missing/unreliable data
    // instead of answering as if everything were nominal.
    const message = err instanceof Error ? err.message : "Unknown tool error";
    return {
      toolName,
      resultText: `TOOL_ERROR: ${toolName} failed — ${message}. Treat this data as unavailable and apply a defensive (assume-worst-case) posture rather than assuming it is safe.`,
      citation: { toolName, summary: `${toolName} failed: ${message}` },
    };
  }
}

async function dispatchTool(toolName: string, input: ToolInput, conversationId: string): Promise<ToolHandlerResult> {
  switch (toolName) {
    case "get_incident_history": {
      const zoneId = String(input.zoneId ?? "");
      const incidents = await get_incident_history(zoneId);
      return {
        toolName,
        resultText: JSON.stringify(incidents),
        citation: {
          toolName,
          summary: incidents.length ? `${incidents.length} incident(s) on record for ${zoneId}` : `No incidents on record for ${zoneId}`,
        },
      };
    }
    case "get_equipment_information": {
      const equipmentId = String(input.equipmentId ?? "");
      const info = await get_equipment_information(equipmentId);
      return {
        toolName,
        resultText: JSON.stringify(info),
        citation: { toolName, summary: `${info.name} (${info.equipmentId}) — status: ${info.status}` },
      };
    }
    case "get_maintenance_records": {
      const equipmentId = String(input.equipmentId ?? "");
      const records = await get_maintenance_records(equipmentId);
      return {
        toolName,
        resultText: JSON.stringify(records),
        citation: {
          toolName,
          summary: records.length ? `${records.length} maintenance record(s) for ${equipmentId}` : `No maintenance records for ${equipmentId}`,
        },
      };
    }
    case "search_uploaded_documents": {
      const query = String(input.query ?? "");
      const { contextText, citations } = await retrieveContext(conversationId, query);
      return {
        toolName,
        resultText: contextText || "No relevant passages found in the uploaded documents for this conversation.",
        citation: {
          toolName,
          summary: citations.length
            ? `${citations.length} passage(s) from: ${[...new Set(citations.map((c) => c.fileName))].join(", ")}`
            : "No matching uploaded-document passages found",
        },
      };
    }
    case "query_safety_regulations": {
      const clauses = await query_safety_regulations(String(input.query ?? ""));
      return {
        toolName,
        resultText: JSON.stringify(clauses),
        citation: {
          toolName,
          summary: clauses.length
            ? `${clauses[0].standardId} (${clauses[0].standardVersion}), clause ${clauses[0].clause}`
            : "No matching regulatory clause found",
        },
      };
    }
    case "check_live_scada_sensors": {
      const zoneId = String(input.zoneId ?? "");
      const readings = await check_live_scada_sensors(zoneId);
      return {
        toolName,
        resultText: JSON.stringify(readings),
        citation: {
          toolName,
          summary: `Live SCADA reading for ${zoneId} as of ${readings[0]?.timestamp ?? "unknown time"}`,
        },
      };
    }
    case "get_active_permits": {
      const zoneId = String(input.zoneId ?? "");
      const permits = await get_active_permits(zoneId);
      return {
        toolName,
        resultText: JSON.stringify(permits),
        citation: {
          toolName,
          summary: permits.length
            ? `${permits.length} permit(s) on record for ${zoneId}`
            : `No permits on record for ${zoneId}`,
        },
      };
    }
    default:
      throw new Error(`Unknown tool requested: ${toolName}`);
  }
}
