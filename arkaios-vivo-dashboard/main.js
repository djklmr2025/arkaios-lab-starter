// =============================
// CONFIG DEL ECOSISTEMA
// =============================
const AIDA_ENDPOINT = "https://arkaios-gateway-open.onrender.com/aida/gateway"; // tu Render
const PUTER_MODEL = "claude-3.5-sonnet"; // referencia lógica inicial
// TODO: si cambias el modelo o token en el futuro, ajusta aquí.

// Estado interno global
const state = {
  uptimeStart: Date.now(),
  thoughts: 0,
  modules: [],
  agents: {
    claude: { online: false, desc: "Error de conexión" },
    aida:   { online: false, desc: "Esperando gateway…" },
    puterjs:{ online: false, desc: "Iniciando" }
  },
  gatewayOnline: false
};

// =============================
// UTILIDADES DE UI
// =============================
function $(sel) {
  return document.querySelector(sel);
}
function logToConsole(msg, type="error") {
  const logEl = $("#console-log");
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `[${time}] ${msg}\n`;
}
function pushCollectiveThought(text) {
  const box = $("#collective-log");
  const div = document.createElement("div");
  div.className = "collective-entry";
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  state.thoughts++;
  $("#thought-count").textContent = state.thoughts;
}

// Actualiza los chips del header y las tarjetas en "Agentes IA Activos"
function renderAgentStatus() {
  // header chips
  Object.entries(state.agents).forEach(([key, data]) => {
    const chip = document.querySelector(`.estado-chip[data-agent="${key}"]`);
    if (chip) {
      chip.innerHTML = `
        <span class="dot ${data.online ? "dot-online" : "dot-offline"}"></span>
        ${key === "puterjs" ? "Puter.js" :
         key === "aida" ? "A.I.D.A." :
         key === "claude" ? "Claude" : key}
      `;
    }
  });

  // agent cards
  // Claude
  {
    const card = document.querySelector(`[data-agent-details="claude"]`);
    if (card) {
      const pill = card.querySelector(".status-pill");
      const desc = card.querySelector(".agent-desc");
      pill.textContent = state.agents.claude.online ? "Online" : "Offline";
      pill.className = "status-pill " + (state.agents.claude.online ? "online" : "offline");
      desc.textContent = state.agents.claude.desc;
    }
  }
  // A.I.D.A.
  {
    const card = document.querySelector(`[data-agent-details="aida"]`);
    if (card) {
      const pill = card.querySelector(".status-pill");
      const desc = card.querySelector(".agent-desc");
      pill.textContent = state.agents.aida.online ? "Online" : "Conectando...";
      pill.className = "status-pill " + (state.agents.aida.online ? "online" : "wait");
      desc.textContent = state.agents.aida.desc;
    }
  }
  // Puter.js
  {
    const card = document.querySelector(`[data-agent-details="puterjs"]`);
    if (card) {
      const pill = card.querySelector(".status-pill");
      const desc = card.querySelector(".agent-desc");
      pill.textContent = state.agents.puterjs.online ? "Online" : "Iniciando";
      pill.className = "status-pill " + (state.agents.puterjs.online ? "online" : "wait");
      desc.textContent = state.agents.puterjs.desc;
    }
  }

  // gateway pill
  const gw = $("#gateway-status");
  if (gw) {
    gw.textContent = state.gatewayOnline ? "Online" : "Offline";
    gw.className = "gateway-pill " + (state.gatewayOnline ? "gateway-on" : "gateway-off");
  }
}

// uptime / módulos / contadores
function tickFooter() {
  const mins = Math.floor((Date.now() - state.uptimeStart)/60000);
  const h = Math.floor(mins/60);
  const m = mins % 60;
  $("#uptime").textContent = `${h}h ${m}m`;
  $("#module-count").textContent = state.modules.length;
}

// =============================
// CARGA DE MÓDULOS HTML
// =============================
function setupModulesDropzone() {
  const dz = $("#modules-dropzone");
  const fileInput = $("#modules-file-input");
  const list = $("#modules-list");

  function addModule(fileName, fileContent) {
    // Guardar en memoria
    state.modules.push({ name: fileName, content: fileContent });
    // Render lista
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${fileName}</span>
      <button class="btn-open">Abrir</button>
    `;
    li.querySelector(".btn-open").addEventListener("click", () => {
      // TODO: Aquí podrías abrir el módulo en nueva ventana, o inyectarlo en un iframe modal
      // Por ahora sólo log:
      logToConsole(`Módulo "${fileName}" ejecutado.`);
      pushCollectiveThought(`🔧 Ejecutando módulo ${fileName}`);
    });
    list.appendChild(li);
    $("#module-count").textContent = state.modules.length;
  }

  dz.addEventListener("click", () => fileInput.click());
  dz.addEventListener("dragover", (e) => {
    e.preventDefault();
    dz.style.borderColor = "#9f7bff";
  });
  dz.addEventListener("dragleave", () => {
    dz.style.borderColor = "rgba(138,75,255,0.5)";
  });
  dz.addEventListener("drop", async (e) => {
    e.preventDefault();
    dz.style.borderColor = "rgba(138,75,255,0.5)";
    const files = e.dataTransfer.files;
    for (const f of files) {
      const text = await f.text();
      addModule(f.name, text);
    }
  });
  fileInput.addEventListener("change", async (e) => {
    const files = e.target.files;
    for (const f of files) {
      const text = await f.text();
      addModule(f.name, text);
    }
  });
}

// =============================
// CHAT
// =============================
function appendChatMessage(sender, text) {
  const box = $("#chat-messages");
  const div = document.createElement("div");
  div.className = "chat-msg " + (sender === "yo" ? "me" : "agent");
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// Envía mensaje al ecosistema (en este punto tú decides a quién mandar primero)
async function handleSendMessage(evt) {
  evt.preventDefault();
  const input = $("#chat-input");
  const msg = input.value.trim();
  if (!msg) return;
  appendChatMessage("yo", msg);
  input.value = "";

  // Ejemplo simple:
  // 1. intentamos responder con Puter.js (Claude)
  // 2. fallback A.I.D.A.
  let reply = null;

  try {
    reply = await askPuter(msg);
  } catch (err) {
    logToConsole("Puter.js error: " + err.message);
  }

  if (!reply) {
    try {
      reply = await askAIDA(msg);
    } catch (err2) {
      logToConsole("A.I.D.A. error: " + err2.message);
    }
  }

  if (!reply) {
    reply = "Ningún agente respondió 🤖💤";
  }

  appendChatMessage("agent", reply);
  pushCollectiveThought(`📡 Interacción de chat procesada.`);
}

// =============================
// INTEGRACIONES DE AGENTES
// =============================

// --- Puter.js (Claude, imágenes, etc.) ---
async function initPuter() {
  try {
    // checar que la lib de Puter existe
    if (!window.puter || !puter.ai || !puter.ai.chat) {
      throw new Error("Puter.js SDK no disponible todavía.");
    }

    // pequeño ping: pedimos que genere un saludo corto
    const res = await puter.ai.chat(PUTER_MODEL, [
      { role: "user", content: "Responde 'pong' si estás vivo." }
    ]);

    // res debería tener .message o similar dependiendo del SDK actual
    const text =
      (res && res.message && res.message.content) ||
      (res && res.output) ||
      JSON.stringify(res);

    // si no truena, marcamos online
    state.agents.puterjs.online = true;
    state.agents.puterjs.desc = "Listo para conversar.";
    renderAgentStatus();
    logToConsole("Puter.js conectado ✔");
    pushCollectiveThought("🤖 Puter.js inicializado correctamente.");

  } catch (err) {
    state.agents.puterjs.online = false;
    state.agents.puterjs.desc = "Error de conexión Puter.js";
    renderAgentStatus();
    logToConsole("Error Puter.js: " + err.message);
  }
}

// función para preguntar a Puter/Claude
async function askPuter(userMsg) {
  if (!state.agents.puterjs.online) return null;
  const res = await puter.ai.chat(PUTER_MODEL, [
    { role: "user", content: userMsg }
  ]);
  // misma normalización que arriba
  const text =
    (res && res.message && res.message.content) ||
    (res && res.output) ||
    JSON.stringify(res);
  return text;
}

// --- A.I.D.A. (tu gateway Render) ---
async function initAIDA() {
  try {
    // ping rápido al gateway
    const pingRes = await fetch(AIDA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ping",
        message: "status?"
      })
    });

    if (!pingRes.ok) throw new Error("Gateway no respondió 200");

    const data = await pingRes.json();

    state.agents.aida.online = true;
    state.agents.aida.desc = "Gateway activo";
    state.gatewayOnline = true;

    renderAgentStatus();
    logToConsole("A.I.D.A. conectada ✔");
    pushCollectiveThought("🛰️ A.I.D.A. gateway listo.");

  } catch (err) {
    state.agents.aida.online = false;
    state.agents.aida.desc = "No disponible";
    renderAgentStatus();
    state.gatewayOnline = false;
    logToConsole("Error A.I.D.A.: " + err.message);
  }
}

// función para preguntarle a A.I.D.A.
async function askAIDA(userMsg) {
  if (!state.agents.aida.online) return null;
  const res = await fetch(AIDA_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "chat",
      message: userMsg
    })
  });
  if (!res.ok) throw new Error("A.I.D.A. devolvió status " + res.status);
  const data = await res.json();
  // ajusta esto al formato real que devuelva tu gateway:
  return data.reply || data.message || JSON.stringify(data);
}

// =============================
// BOOTSTRAP DE LA APP
// =============================
function initChatUI() {
  $("#chat-form").addEventListener("submit", handleSendMessage);
  // Ctrl+Enter = enviar
  $("#chat-input").addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      $("#chat-form").dispatchEvent(new Event("submit"));
    }
  });
}

function boot() {
  tickFooter();
  setInterval(tickFooter, 5000);

  renderAgentStatus();
  initChatUI();
  setupModulesDropzone();

  // Intentar inicializar agentes
  initPuter();
  initAIDA();

  pushCollectiveThought("🧠 Sistema ARKAIOS VIVO inicializado.");
  logToConsole("Sistema cargado.");
}

// Listo
document.addEventListener("DOMContentLoaded", boot);
