# SafeMind Backend — Integration Guide

Everything from Phases 1–3 lives in one project already (`/mnt/user-data/outputs/backend`).
Nothing needs to be "merged" — the files were built into the same tree as they were
created. This guide is about getting it *running* and understanding how the pieces
call each other.

---

## 1. How the pieces fit together

```
                         ┌─────────────────────┐
  HTTP request  ───────► │   src/app.ts         │  (Express app, mounts routers)
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┴───────────────────┐
                 ▼                                       ▼
      src/routes/chatRoutes.ts              src/routes/documentRoutes.ts
      (conversations, streaming chat)        (file upload, indexing status)
                 │                                       │
                 ▼                                       ▼
      src/services/chatService.ts   ◄──uses──   src/rag/ragService.ts
      (tool-calling loop + SSE)                  (loaders → splitter →
                 │                                embeddings → vectorStore)
                 ▼
      src/tools/toolRegistry.ts
      (defines tools the model can call, dispatches + catches errors)
                 │
        ┌────────┼─────────────────────┬───────────────────────┐
        ▼        ▼                     ▼                       ▼
 orchestrator/  connectors/       rag/ragService.ts      connectors/
 safetyOrchestrator.ts  connectorRegistry.ts  (search_uploaded_   plantRecordsClient.ts
 (regulations,   (REST/WS/MQTT/            documents)        (incidents/equipment/
  scada, permits   OPC UA/Modbus,                             maintenance)
  — mock or live)  config-driven)
```

Everything is already wired — `toolRegistry.ts` imports from all four sources, and
`chatService.ts` is the only place that calls `toolRegistry.ts`. You don't need to
change import paths or glue anything together; it already typechecks and runs as one
program (verified in Phases 1–3).

---

## 2. Install and run

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set at minimum:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Everything else in `.env.example` is optional — leave `LIVE_DATA_PROTOCOL` unset and
the app runs entirely on mock SCADA/permit/records data, which is enough to fully
exercise the chatbot, RAG, and tool-calling loop with zero external infrastructure.

```bash
npm run dev
```

You should see:
```
SafeMind backend listening on http://localhost:4000
```

If you didn't set `ANTHROPIC_API_KEY`, you'll get a warning — the server still boots
(conversation/document CRUD endpoints work without it), but chat messages will fail
until it's set, since that's the one call that actually reaches Anthropic's API.

---

## 3. The one thing you must provide: `ANTHROPIC_API_KEY`

Every other integration point (RAG, SCADA, permits, incident history) already has a
working mock, so the chatbot is fully testable out of the box. The API key is the
only genuinely required external dependency.

---

## 4. Full request flow (what actually happens on a chat turn)

```bash
# 1. Create a conversation (session)
curl -X POST http://localhost:4000/api/conversations
# → { "conversation": { "id": "abc-123", ... } }

# 2. (Optional) Upload documents to that conversation
curl -X POST http://localhost:4000/api/conversations/abc-123/documents \
  -F "files=@sop.pdf" -F "files=@incidents.csv"
# → 202 { "uploaded": [...] }  (indexing continues in the background)

# 3. Check indexing finished (poll if needed)
curl http://localhost:4000/api/conversations/abc-123/documents
# → status: "queued" -> "processing" -> "indexed"

# 4. Send a chat message (streams back via SSE)
curl -N -X POST http://localhost:4000/api/conversations/abc-123/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Is it safe to start hot work in Zone 4 right now?"}'
```

Internally, step 4 does:
1. `chatRoutes.ts` receives the POST, calls `streamChatResponse()`
2. `chatService.ts` sends the message + tool definitions to Claude
3. If Claude requests a tool (e.g. `check_live_scada_sensors`), `toolRegistry.ts` dispatches to `safetyOrchestrator.ts`, which checks `LIVE_DATA_PROTOCOL` and either hits your real connector or returns mock data
4. The tool result goes back to Claude, which may call more tools (e.g. `get_active_permits`, `search_uploaded_documents` if you uploaded files) — up to 4 iterations
5. Once Claude stops requesting tools, the final answer streams token-by-token as SSE `event: token` frames
6. `event: done` carries the full saved message + citations from whichever tools were used

---

## 5. Turning on a real connector later

Nothing else in the app changes. In `.env`:

```
LIVE_DATA_PROTOCOL=rest
LIVE_DATA_REST_BASE_URL=https://your-plant-gateway.example.com/api
```

Restart the server. `safetyOrchestrator.ts` picks this up automatically (verified in
Phase 3 testing) — no code edits needed for REST, WebSocket, or MQTT. OPC UA/Modbus
need the extra setup noted in their file comments (install the driver package, fill
in register/node maps) before switching to them.

---

## 6. Connecting a frontend (not yet built — Phase 4/5)

No React app exists yet in the outputs. When you build one, the integration surface
is exactly the 6 REST endpoints above, plus SSE consumption for the chat stream. A
minimal example of consuming the stream from a browser:

```js
const res = await fetch(`http://localhost:4000/api/conversations/${id}/messages`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: userInput }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const events = buffer.split("\n\n");
  buffer = events.pop() ?? "";

  for (const evt of events) {
    const [eventLine, dataLine] = evt.split("\n");
    const type = eventLine.replace("event: ", "");
    const data = JSON.parse(dataLine.replace("data: ", ""));

    if (type === "token") appendToUI(data.text);
    if (type === "done") markMessageComplete(data.message);
    if (type === "error") showError(data.message);
  }
}
```

Say the word when you want to build the actual React chat UI (Phase 4/5) and I'll do
the same build-and-verify approach as the backend phases.

---

## 7. Quick sanity checklist before you consider this "integrated"

- [ ] `npm install && npm run dev` boots without errors
- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] `POST /api/conversations` creates a conversation
- [ ] With `ANTHROPIC_API_KEY` set: a chat message streams back a real answer
- [ ] Uploading a PDF/CSV/DOCX and asking about its contents triggers `search_uploaded_documents` (visible in the citations on the `done` event)
- [ ] Asking about a specific zone triggers `check_live_scada_sensors` / `get_active_permits` (visible in citations)
- [ ] With `LIVE_DATA_PROTOCOL` unset, all of the above works with zero external services running
