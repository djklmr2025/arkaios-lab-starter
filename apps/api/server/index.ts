import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAiChat } from "./routes/ai-chat";
import { handleHealth } from "./routes/health";

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

  // Landing simple en la raíz
  app.get("/", (_req, res) => {
    res.type("text/html").send(
      "<!doctype html><html><head><meta charset='utf-8'><title>ArkAIOS API</title><style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:40px}code{background:#f6f8fa;padding:2px 6px;border-radius:4px}</style></head><body><h1>ArkAIOS API</h1><p>El servicio está activo.</p><p>Pruebas rápidas:</p><ul><li><code>GET /health</code></li><li><code>GET /api/demo</code></li></ul></body></html>"
    );
  });

  return app;
}

// Always start the server when this module is executed (bundled entry)
const app = createServer();
const port = Number(process.env.PORT ?? 10000);
const host = process.env.HOST ?? "0.0.0.0";
app.listen(port, host, () => {
  console.log(`[api] listening on ${host}:${port}`);
});