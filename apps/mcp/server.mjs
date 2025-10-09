// apps/mcp/server.mjs
// MCP minimal por STDIO con fallback: Gateway remoto -> API local.
// Node >=18: usa fetch global (no node-fetch).

/**
 * Protocolo súper simple por línea (stdin):
 *  echo '{"command":"arkaios.health"}' | node apps/mcp/server.mjs
 *  echo '{"command":"arkaios.chat","params":{"prompt":"Hola"}}' | node apps/mcp/server.mjs
 */
if (process.env.DEBUG_MCP) console.log("🔍 MCP server iniciado con debug activo");
const GATEWAY_URL = process.env.AIDA_GATEWAY_URL?.trim() || "";
const GATEWAY_TOKEN = process.env.AIDA_AUTH_TOKEN?.trim() || "";

// Endpoints locales (tu API en el puerto 8080/8081)
const LOCAL_BASE = process.env.LOCAL_BASE?.trim() || "http://localhost:8080";
const LOCAL_CHAT = `${LOCAL_BASE}/api/chat`;
const LOCAL_HEALTH = `${LOCAL_BASE}/health`;

// Helpers ---------------------------------------------------------

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
    // pequeño ping “inofensivo”
    const pingBody = {
      agent_id: "puter",
      action: "plan",
      params: { objective: "ping" }
    };
    await fetchJSON(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {})
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

// Tools -----------------------------------------------------------

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

  // 1) intenta gateway
  if (GATEWAY_URL) {
    try {
      const body = {
        agent_id: "puter",
        action: "plan",
        params: { objective: prompt }
      };
      const data = await fetchJSON(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {})
        },
        body: JSON.stringify(body)
      });
      return { via: "gateway", reply: data };
    } catch (e) {
      // cae al modo local
    }
  }

  // 2) fallback local
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

// (opcional) fuerza local, útil para pruebas
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

// Router ----------------------------------------------------------

const TOOLBOX = {
  "arkaios.health": tool_arkaios_health,
  "arkaios.chat": tool_arkaios_chat,
  "arkaios.local.chat": tool_arkaios_local_chat,
};

async function handleLine(line) {
  let msg;
  try { msg = JSON.parse(line); }
  catch { return JSON.stringify({ error: "bad_json", line }) + "\n"; }

  const { command, params } = msg;
  const fn = TOOLBOX[command];
  if (!fn) return JSON.stringify({ error: "unknown_command", command }) + "\n";

  try {
    const out = await fn(params || {});
    return JSON.stringify({ ok: true, command, result: out }) + "\n";
  } catch (e) {
    return JSON.stringify({ ok: false, command, error: String(e?.message || e) }) + "\n";
  }
}

// Loop STDIN ------------------------------------------------------

process.stdin.setEncoding("utf8");
let buf = "";
process.stdin.on("data", async chunk => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    const resp = await handleLine(line);
    process.stdout.write(resp);
  }
});

process.on("SIGINT", () => process.exit(0));
