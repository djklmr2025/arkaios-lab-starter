// apps/mcp/http.mjs
// HTTP wrapper del MCP por STDIO, expone endpoints simples para salud y ejecución.
// Node >=18: usa fetch global.

const PORT = Number(process.env.MCP_HTTP_PORT || 8090);
const GATEWAY_URL = process.env.AIDA_GATEWAY_URL?.trim() || "";
const GATEWAY_TOKEN = process.env.AIDA_AUTH_TOKEN?.trim() || "";
const LOCAL_BASE = process.env.LOCAL_BASE?.trim() || "http://localhost:8080";
const LOCAL_CHAT = `${LOCAL_BASE}/api/chat`;
const LOCAL_HEALTH = `${LOCAL_BASE}/health`;

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

async function fetchJSON(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  return data;
}

async function gatewayHealth() {
  if (!GATEWAY_URL) return { ok: false, reason: "no_gateway_url" };
  try {
    const authHeader = GATEWAY_TOKEN
      ? (GATEWAY_TOKEN.startsWith("Bearer ") ? GATEWAY_TOKEN : `Bearer ${GATEWAY_TOKEN}`)
      : "";
    const pingBody = {
      agent_id: "puter",
      action: "plan",
      params: { objective: "ping" }
    };
    await fetchJSON(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify(pingBody)
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
}

async function localHealth() {
  try {
    await fetchJSON(LOCAL_HEALTH);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
}

async function tool_arkaios_health() {
  const gw = await gatewayHealth();
  const lc = await localHealth();
  return {
    tool: "arkaios.health",
    gateway: gw,
    local: lc,
    time: new Date().toISOString()
  };
}

async function tool_arkaios_chat(params = {}) {
  const prompt = String(params.prompt ?? "").trim();
  if (!prompt) return { error: "missing_prompt" };

  if (GATEWAY_URL) {
    try {
      const body = {
        agent_id: "puter",
        action: "plan",
        params: { objective: prompt }
      };
      const authHeader = GATEWAY_TOKEN
        ? (GATEWAY_TOKEN.startsWith("Bearer ") ? GATEWAY_TOKEN : `Bearer ${GATEWAY_TOKEN}`)
        : "";
      const data = await fetchJSON(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: JSON.stringify(body)
      });
      return { via: "gateway", reply: data };
    } catch (e) {
      // fallback
    }
  }

  try {
    const data = await fetchJSON(LOCAL_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    return { via: "local", reply: data };
  } catch (e) {
    return { error: "both_failed", reason: String(e?.message || e) };
  }
}

async function tool_arkaios_local_chat(params = {}) {
  const prompt = String(params.prompt ?? "").trim();
  if (!prompt) return { error: "missing_prompt" };
  const data = await fetchJSON(LOCAL_CHAT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  return { via: "local_only", reply: data };
}

const TOOLBOX = {
  "arkaios.health": tool_arkaios_health,
  "arkaios.chat": tool_arkaios_chat,
  "arkaios.local.chat": tool_arkaios_local_chat,
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { resolve({}); }
    });
  });
}

import { createServer } from "node:http";

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (req.method === "GET" && url.pathname === "/mcp/health") {
    const out = await tool_arkaios_health();
    return json(res, 200, { ok: true, result: out });
  }

  if (req.method === "POST" && url.pathname === "/mcp/run") {
    const body = await parseBody(req);
    const { command, params } = body || {};
    const fn = TOOLBOX[command];
    if (!fn) return json(res, 400, { ok: false, error: "unknown_command", command });
    try {
      const result = await fn(params || {});
      return json(res, 200, { ok: true, command, result });
    } catch (e) {
      return json(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  json(res, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, () => {
  console.log(`🛰️ MCP HTTP server listening on http://localhost:${PORT}`);
});