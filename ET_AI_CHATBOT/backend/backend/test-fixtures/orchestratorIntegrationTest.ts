import { check_live_scada_sensors, get_active_permits } from "../src/orchestrator/safetyOrchestrator.js";
import { executeTool } from "../src/tools/toolRegistry.js";
import { _resetConnectorForTests } from "../src/connectors/connectorRegistry.js";

async function testMockFallback() {
  console.log("\n=== Testing mock fallback (no LIVE_DATA_PROTOCOL set) ===");
  delete process.env.LIVE_DATA_PROTOCOL;
  const scada = await check_live_scada_sensors("Zone4");
  if (scada[0].gasPPM !== 38) throw new Error("Expected mock data (gasPPM 38), got " + JSON.stringify(scada));
  console.log("Mock fallback: PASS (gasPPM =", scada[0].gasPPM, ")");
}

async function testRestConfigSwitch() {
  console.log("\n=== Testing config-driven switch to RestConnector ===");
  process.env.LIVE_DATA_PROTOCOL = "rest";
  process.env.LIVE_DATA_REST_BASE_URL = "http://localhost:5551";

  const scada = await check_live_scada_sensors("Zone4");
  const permits = await get_active_permits("Zone4");
  if (scada[0].gasPPM !== 41) throw new Error("Expected REST data (gasPPM 41), got " + JSON.stringify(scada));
  if (permits[0].permitId !== "PTW-REST-01") throw new Error("Expected REST permit data, got " + JSON.stringify(permits));
  console.log("Config-driven REST switch: PASS (gasPPM =", scada[0].gasPPM, ", permit =", permits[0].permitId, ")");
}

async function testDefensivePostureOnFailure() {
  console.log("\n=== Testing defensive-posture fallback on connector failure ===");
  _resetConnectorForTests();
  process.env.LIVE_DATA_PROTOCOL = "rest";
  process.env.LIVE_DATA_REST_BASE_URL = "http://localhost:9999"; // nothing listening here

  const result = await executeTool("check_live_scada_sensors", { zoneId: "Zone4" }, "test-conv");
  console.log("Tool result on failure:", result.resultText.slice(0, 120));
  if (!result.resultText.startsWith("TOOL_ERROR")) {
    throw new Error("Expected a TOOL_ERROR defensive-posture result, got: " + result.resultText);
  }
  console.log("Defensive posture on failure: PASS (did not throw/crash the request)");
}

async function main() {
  await testMockFallback();
  await testRestConfigSwitch();
  await testDefensivePostureOnFailure();
  console.log("\nAll orchestrator/connector integration tests PASSED");
  process.exit(0);
}

main().catch((err) => {
  console.error("INTEGRATION TEST FAILED:", err);
  process.exit(1);
});
