import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAiChat } from "./routes/ai-chat";
import { handleHealth } from "./routes/health";
import {
  handleAutoRegister,
  handleListAgents,
  handleArkaiosHeartbeat,
} from "./routes/arkaios";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/chat", handleAiChat);
  app.get("/health", handleHealth);

  // ARKAIOS Routes
  app.post("/api/arkaios/auto-register", handleAutoRegister);
  app.get("/api/arkaios/auto-register", handleListAgents);
  app.get("/api/arkaios/heartbeat", handleArkaiosHeartbeat);

  // Landing simple en la raiz
  app.get("/", (_req, res) => {
    res.type("text/html").send(
      `<!doctype html><html><head><meta charset='utf-8'><title>ArkAIOS API</title><style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:40px}code{background:#f6f8fa;padding:2px 6px;border-radius:4px}</style></head><body><h1>ArkAIOS Core API <span style='color:#28a745'>●</span> Online</h1><p>Version: <code>1.2.0 (Apostle)</code></p><h2>Endpoints disponibles</h2><ul><li><code>POST /api/arkaios/auto-register</code> — Registrar agente</li><li><code>GET /api/arkaios/auto-register</code> — Listar agentes</li><li><code>GET /api/arkaios/heartbeat</code> — Estado del sistema</li><li><code>GET /health</code> — Health check</li><li><code>GET /api/ping</code> — Ping</li></ul></body></html>`
    );
  });

  return app;
}

// Always start the server when this module is executed (bundled entry)
const app = createServer();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[ArkAIOS] Server running on http://0.0.0.0:${PORT}`);
  console.log(`[ArkAIOS] Auto-register endpoint: POST /api/arkaios/auto-register`);
});
