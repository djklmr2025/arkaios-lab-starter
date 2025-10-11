// apps/api/server/index.ts
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { handleAiChat } from "./routes/ai-chat.js";
import { fsList, fsRead, fsWrite, fsMkdir } from "./routes/fs.js";

// Cargar variables de entorno
config();

// =============================
// Config
// =============================
const PORT = Number(process.env.PORT || 8080);
/**
 * Si pones SERVE_STATIC=true (y ya corriste `pnpm --filter @arkaios/ui build`),
 * el API servirá la UI empaquetada en / (index.html) y /assets/*
 */
const SERVE_STATIC = String(process.env.SERVE_STATIC || "false") === "true";

// =============================
// App base
// =============================
const app = express();

app.use(cors());
app.use(express.json());

// =============================
// Health
// =============================
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/health/deep", async (_req, res) => {
  try {
    // Verificar conectividad con el gateway
    const gw = process.env.AIDA_GATEWAY_URL;
    const token = process.env.AIDA_AUTH_TOKEN;
    
    console.log("[/health/deep] Environment check:", { 
      gw: gw ? `${gw.substring(0, 30)}...` : "not_set", 
      token: token ? "***set***" : "not_set" 
    });
    
    let gatewayStatus = "not_configured";
    if (gw && token) {
      try {
        const response = await fetch(gw, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agent_id: "puter",
            action: "ping",
            params: {},
            mode: "open"
          }),
        });
        gatewayStatus = response.ok ? "connected" : "error";
      } catch {
        gatewayStatus = "unreachable";
      }
    }

    res.json({
      status: "ok",
      env: {
        PORT,
        SERVE_STATIC,
        NODE_ENV: process.env.NODE_ENV || "development",
        GATEWAY_CONFIGURED: !!gw && !!token,
      },
      gateway: {
        status: gatewayStatus,
        url: gw ? `${gw.substring(0, 20)}...` : "not_set"
      },
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      error: err.message,
      time: new Date().toISOString(),
    });
  }
});

// =============================
// Rutas API
// =============================
app.post("/api/chat", handleAiChat);
app.post("/fs/list", fsList);
app.post("/fs/read", fsRead);
app.post("/fs/write", fsWrite);
app.post("/fs/mkdir", fsMkdir);

// =============================
// UI estática opcional (SPA)
// =============================
if (SERVE_STATIC) {
  // Cargamos dinámicamente para evitar que TS se queje en ESM
  (async () => {
    const path = await import("path");
    const url = await import("url");
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

    // dist de la UI: apps/ui/dist
    const dist = path.resolve(__dirname, "../../ui/dist");
    app.use(express.static(dist));
    app.get("/", (_req, res) => res.sendFile(path.resolve(dist, "index.html")));

    console.log("⚙️  Modo SPA estático activado (SERVE_STATIC=true). Sirviendo UI build.");
  })().catch((e) => {
    console.error("[SERVE_STATIC init error]", e);
  });
}

// =============================
// Arranque (siempre, también con tsx watch)
// =============================
export function createServer() {
  try {
    console.log("Booting ARKAIOS API...");
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ ARKAIOS API escuchando en http://0.0.0.0:${PORT}`);
    });
    server.on("error", (err) => {
      console.error("[listen error]", err);
      process.exitCode = 1;
    });
    return app;
  } catch (err) {
    console.error("[startup error]", err);
    process.exitCode = 1;
    return app;
  }
}

createServer();