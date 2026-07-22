# SafeMind Backend

Node/Express + TypeScript backend for the SafeMind chatbot. Wraps the existing
`SafetyOrchestrator` mock tools in an agentic tool-calling + streaming chat loop,
plus a working document RAG pipeline.

## Setup
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev             # http://localhost:4000

## Endpoints
### Chat
- GET    /health
- GET    /api/conversations
- POST   /api/conversations
- GET    /api/conversations/:id
- DELETE /api/conversations/:id
- POST   /api/conversations/:id/messages        (SSE stream: events "token", "done", "error")

### Documents (RAG)
- POST   /api/conversations/:id/documents       (multipart, field "files", up to 10 files / 25MB each)
- GET    /api/conversations/:id/documents        (list + status)
- GET    /api/documents/:docId                   (single document status, for polling indexing progress)
- DELETE /api/documents/:docId

Supported file types: PDF, DOCX, TXT/MD, CSV, XLSX/XLS, ZIP (recursively extracts
supported files inside), and images (accepted but NOT text-searchable — see note below).

## What's implemented (Phase 1 + 2)
- Streaming chat via SSE with a Claude tool-calling loop
- Session/conversation management (in-memory; swap ConversationStore for a DB later)
- Sliding-window context management
- Full RAG pipeline: multi-file upload -> loaders (pdf/docx/txt/csv/xlsx/zip) ->
  recursive text splitting -> embeddings -> in-memory vector store -> hybrid
  (vector + keyword) retrieval -> citations
- `search_uploaded_documents` wired into the same tool-calling loop as the
  regulatory/SCADA/permit tools — the model decides when to use it
- Background ingestion with pollable status (queued -> processing -> indexed/failed)

## Important tradeoff: embeddings
This sandbox can't reach hosted embedding APIs (OpenAI, Voyage, etc. are not on
the network allowlist), so the default `LocalHashEmbeddingProvider` is a real,
tested, dependency-free feature-hashing bag-of-words embedding — good enough for
exact/near-exact term matches (verified working in testing) but NOT a semantic
embedding model (no synonym/paraphrase understanding).

For production semantic quality, swap the provider in `src/rag/ragService.ts`:
  const embeddingProvider: EmbeddingProvider = new LocalHashEmbeddingProvider();
for:
  const embeddingProvider: EmbeddingProvider = new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY!);
(or write a VoyageEmbeddingProvider the same way — same EmbeddingProvider interface).
No other code changes needed.

## Known gap: image OCR
Images upload and store fine but are NOT text-searchable — OCR needs a model/service
this sandbox can't reach. `src/rag/loaders/imageLoader.ts` documents exactly where
to plug in a real OCR/vision provider.

## Not yet implemented (later phases)
- Live MQTT/OPC UA/Modbus/Kafka connectors (SCADA tool is still mocked)
- React frontend
- Persistent storage (everything is in-memory; restarting the server clears data)

---

## Phase 3: Live data connectors & production tool calling

### What's implemented and TESTED (real, not typecheck-only)
- `RestConnector` — verified against a local mock plant REST API (test-fixtures/mockRestServer.ts + connectorTest.ts)
- `MqttConnector` — verified against a local aedes MQTT broker, including retained-message delivery on subscribe
- `WebSocketConnector` — implemented against a documented subscribe/response protocol (see class comment); not exercised in the same automated run as REST/MQTT, but follows the identical tested request/response/timeout pattern
- Config-driven connector selection (`LIVE_DATA_PROTOCOL` env var) with automatic fallback to mock data — verified: unset config uses mock, `LIVE_DATA_PROTOCOL=rest` + correct env vars actually switches to live REST data
- Defensive-posture error handling — verified: a connector pointed at an unreachable host returns a `TOOL_ERROR` result the model is instructed to treat as "assume worst case," rather than crashing the chat request
- Three new tools wired into the same tool-calling loop: `get_incident_history`, `get_equipment_information`, `get_maintenance_records` (REST-backed via `PLANT_RECORDS_API_BASE_URL`, mock fallback otherwise)

### What's implemented but NOT tested here (honestly flagged)
- `OpcUaConnector` and `ModbusConnector` are written against their real npm packages' (`node-opcua`, `modbus-serial`) documented APIs, but those packages are NOT installed and the code has NOT run — both need a real or simulated industrial device/server this sandbox can't provide. Each file's class comment has exact activation steps. **Do not deploy these without testing against your actual plant hardware/simulator first.**
- Neither OPC UA nor Modbus have a native concept of "permits" — `getActivePermits` on both throws by design; pair them with a REST or MQTT connector for permit data.
- Modbus additionally requires you to fill in real holding-register addresses (`REGISTER_MAP`) — these are plant-specific and were deliberately not guessed.

### Run the connector tests yourself
    npx tsx test-fixtures/mockRestServer.ts &   # separate terminal
    npx tsx test-fixtures/connectorTest.ts       # REST + MQTT, spins up its own broker
    npx tsx test-fixtures/orchestratorIntegrationTest.ts   # mock fallback, config switch, defensive posture

## Not yet implemented (later phase)
- React frontend
- Persistent storage (everything is in-memory; restarting the server clears data)

---

## Model provider: Gemini

`chatService.ts` calls the Gemini API directly (`generateContent` for the tool-calling
loop, `streamGenerateContent?alt=sse` for the final streamed answer) — no Anthropic
dependency remains in the running chat path.

Set in `.env`:
```
GEMINI_API_KEY=your-key-from-aistudio.google.com
GEMINI_MODEL=gemini-3.5-flash   # optional, this is the default
```

### Verified vs. not verified
This sandbox's network allowlist doesn't include `generativelanguage.googleapis.com`,
so this could NOT be tested against a live Gemini call here. What WAS verified:
`test-fixtures/geminiChatServiceTest.ts` mocks `fetch` to simulate real Gemini
request/response shapes and confirms: `functionDeclarations` are sent correctly,
`functionCall` responses are parsed, tool results round-trip as `functionResponse`,
SSE frames from `streamGenerateContent` are parsed and forwarded token-by-token,
and citations attach correctly to the saved message. Run it yourself:
```
npx tsx test-fixtures/geminiChatServiceTest.ts
```
**Test this against your real `GEMINI_API_KEY` before relying on it** — the shapes
are correct per Google's current docs, but an unverified live call is still unverified.

### Known leftover (does not affect the running app)
`src/orchestrator/safetyOrchestrator.ts` has an internal `callClaude()` function used
only by `assessZone()`, which is **not wired to any route** — it's unused dead code
left over from an earlier design. It still references an Anthropic model string. If
you don't plan to use `assessZone()`, it's safe to ignore; if you do want it, it needs
the same Gemini conversion `chatService.ts` just got.
