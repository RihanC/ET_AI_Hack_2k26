import { Aedes } from "aedes";
import { createServer } from "net";
import mqtt from "mqtt";
import { RestConnector } from "../src/connectors/restConnector.js";
import { MqttConnector } from "../src/connectors/mqttConnector.js";

async function testRestConnector() {
  console.log("\n=== Testing RestConnector ===");
  const connector = new RestConnector({ type: "rest", baseUrl: "http://localhost:5551" });
  await connector.connect();
  const scada = await connector.getScadaReadings("Zone4");
  const permits = await connector.getActivePermits("Zone4");
  console.log("SCADA:", JSON.stringify(scada));
  console.log("Permits:", JSON.stringify(permits));
  if (scada[0].gasPPM !== 41) throw new Error("RestConnector SCADA test FAILED");
  if (permits[0].permitId !== "PTW-REST-01") throw new Error("RestConnector permits test FAILED");
  console.log("RestConnector: PASS");
}

async function testMqttConnector() {
  console.log("\n=== Testing MqttConnector ===");

  // Start a local MQTT broker (aedes) on a plain TCP server.
  const aedes = await Aedes.createBroker();
  const server = createServer(aedes.handle);
  await new Promise<void>((resolve) => server.listen(1883, resolve));
  console.log("Local MQTT broker listening on :1883");

  // Publish a retained SCADA reading BEFORE the connector subscribes, so the
  // broker delivers it immediately on subscribe (matches how retained-message
  // plant gateways typically behave).
  const publisher = mqtt.connect("mqtt://localhost:1883");
  await new Promise<void>((resolve) => publisher.once("connect", () => resolve()));
  await new Promise<void>((resolve, reject) => {
    publisher.publish(
      "plant/scada/Zone4",
      JSON.stringify([{ zoneId: "Zone4", gasPPM: 55, pressurePSI: 150, temperatureC: 36, sensorHealth: "OK", timestamp: new Date().toISOString() }]),
      { retain: true },
      (err) => (err ? reject(err) : resolve())
    );
  });
  await new Promise<void>((resolve, reject) => {
    publisher.publish(
      "plant/permits/Zone4",
      JSON.stringify([{ permitId: "PTW-MQTT-01", type: "CONFINED_SPACE", zoneId: "Zone4", status: "ACTIVE", issuedAt: new Date().toISOString(), expiresAt: new Date().toISOString() }]),
      { retain: true },
      (err) => (err ? reject(err) : resolve())
    );
  });

  const connector = new MqttConnector({
    type: "mqtt",
    brokerUrl: "mqtt://localhost:1883",
    scadaTopicPrefix: "plant/scada",
    permitsTopicPrefix: "plant/permits",
    readTimeoutMs: 3000,
  });
  await connector.connect();

  const scada = await connector.getScadaReadings("Zone4");
  const permits = await connector.getActivePermits("Zone4");
  console.log("SCADA via MQTT:", JSON.stringify(scada));
  console.log("Permits via MQTT:", JSON.stringify(permits));
  if (scada[0].gasPPM !== 55) throw new Error("MqttConnector SCADA test FAILED");
  if (permits[0].permitId !== "PTW-MQTT-01") throw new Error("MqttConnector permits test FAILED");
  console.log("MqttConnector: PASS");

  await connector.disconnect();
  publisher.end();
  aedes.close();
  server.close();
}

async function main() {
  await testRestConnector();
  await testMqttConnector();
  console.log("\nAll connector tests PASSED");
  process.exit(0);
}

main().catch((err) => {
  console.error("CONNECTOR TEST FAILED:", err);
  process.exit(1);
});
