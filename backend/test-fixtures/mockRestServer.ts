import express from "express";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/scada/:zoneId", (req, res) => {
  res.json([
    {
      zoneId: req.params.zoneId,
      gasPPM: 41,
      pressurePSI: 138,
      temperatureC: 33.1,
      sensorHealth: "OK",
      timestamp: new Date().toISOString(),
    },
  ]);
});

app.get("/permits/:zoneId", (req, res) => {
  res.json([
    {
      permitId: "PTW-REST-01",
      type: "HOT_WORK",
      zoneId: req.params.zoneId,
      status: "ACTIVE",
      issuedAt: new Date(Date.now() - 1800_000).toISOString(),
      expiresAt: new Date(Date.now() + 1800_000).toISOString(),
    },
  ]);
});

app.listen(5551, () => console.log("Mock plant REST API on :5551"));
