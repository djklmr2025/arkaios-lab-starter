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

  return app;
}

// Always start the server when this module is executed (bundled entry)
const app = createServer();
const port = Number(process.env.PORT ?? 10000);
const host = process.env.HOST ?? "0.0.0.0";
app.listen(port, host, () => {
  console.log(`[api] listening on ${host}:${port}`);
});