// apps/api/server/index.ts
import express from "express";
import cors from "cors";

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

app.get("/health/deep", (_req, res) => {
  res.json({
    status: "ok",
    env: {
      PORT,
      SERVE_STATIC,
      NODE_ENV: process.env.NODE_ENV || "development",
    },
    time: new Date().toISOString(),
  });
});

// =============================
// Rutas API (ejemplo /api/chat)
// =============================
// Si aún no tienes el handler real, deja este stub.
// Cuando lo tengas, reemplaza el cuerpo por tu lógica (gateway, modelos, etc.).
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt requerido (string)" });
    }
    // TODO: integra tu lógica real aquí (gateway, openai, etc.)
    return res.json({
      ok: true,
      echo: prompt,
      note: "Stub de /api/chat; reemplázame por tu implementación.",
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[/api/chat error]", err);
    return res.status(500).json({ error: "internal_error", detail: String(err?.message || err) });
  }
});

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
