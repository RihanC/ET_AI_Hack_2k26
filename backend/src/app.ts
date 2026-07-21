import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chatRoutes.js";
import { documentRouter } from "./routes/documentRoutes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "rag-backend" });
  });

  app.use("/api", chatRouter);
  app.use("/api", documentRouter);

  // Centralized error handler — ensures unhandled errors return JSON, not an HTML stack trace.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Internal server error";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  });

  return app;
}
