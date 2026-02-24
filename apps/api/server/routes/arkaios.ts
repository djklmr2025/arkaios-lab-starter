// apps/api/server/routes/arkaios.ts
// Endpoint: /api/arkaios/auto-register
// ARKAIOS Agent Auto-Registration System

import type { Request, Response } from "express";

// In-memory registry (persiste mientras el servidor esté vivo)
const agentRegistry: Record<string, {
  agentId: string;
  agentName: string;
  agentType: string;
  arkCode: string;
  registeredAt: string;
  lastSeen: string;
  status: "active" | "idle" | "offline";
}> = {};

// Genera un código ARK único tipo ARK-XXX-XXX
function generateArkCode(agentName: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const nameHash = agentName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 3)
    .padEnd(3, "X");
  return `ARK-${nameHash}-${timestamp.substring(timestamp.length - 3)}`;
}

// POST /api/arkaios/auto-register
export async function handleAutoRegister(req: Request, res: Response) {
  try {
    const { agentName, agentType, capabilities } = req.body;

    if (!agentName || typeof agentName !== "string") {
      return res.status(400).json({
        ok: false,
        error: "agentName is required and must be a string",
      });
    }

    const agentType_ = agentType || "generic";
    const agentId = `${agentName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const arkCode = generateArkCode(agentName);
    const now = new Date().toISOString();

    // Registrar o actualizar agente
    agentRegistry[agentId] = {
      agentId,
      agentName,
      agentType: agentType_,
      arkCode,
      registeredAt: now,
      lastSeen: now,
      status: "active",
    };

    console.log(`[ARKAIOS] Agent registered: ${agentName} -> ${arkCode}`);

    return res.status(200).json({
      ok: true,
      message: `Agent ${agentName} successfully registered in ARKAIOS Network`,
      agent: {
        agentId,
        agentName,
        agentType: agentType_,
        arkCode,
        registeredAt: now,
        status: "active",
        capabilities: capabilities || [],
        coreApi: process.env.ARKAIOS_CORE_API || "https://arkaios-core-api-2.onrender.com",
        network: "ARKAIOS-NEURAL-OS",
        version: "1.2.0 (Apostle)",
      },
    });
  } catch (error) {
    console.error("[ARKAIOS] Error in auto-register:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error during agent registration",
    });
  }
}

// GET /api/arkaios/auto-register
// Lista todos los agentes registrados
export async function handleListAgents(req: Request, res: Response) {
  try {
    const agents = Object.values(agentRegistry);
    return res.status(200).json({
      ok: true,
      total: agents.length,
      agents,
      network: "ARKAIOS-NEURAL-OS",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[ARKAIOS] Error listing agents:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error listing agents",
    });
  }
}

// GET /api/arkaios/heartbeat
// Estado del sistema ARKAIOS
export async function handleArkaiosHeartbeat(_req: Request, res: Response) {
  const activeAgents = Object.values(agentRegistry).filter(
    (a) => a.status === "active"
  );

  return res.status(200).json({
    ok: true,
    service: "ArkAIOS Core API",
    status: "Archetype Online \u0ca0\u0ca0\u2728",
    version: "1.2.0 (Apostle)",
    timestamp: new Date().toISOString(),
    registeredAgents: Object.keys(agentRegistry).length,
    activeAgents: activeAgents.length,
    network: "ARKAIOS-NEURAL-OS",
    endpoints: {
      autoRegister: "POST /api/arkaios/auto-register",
      listAgents: "GET /api/arkaios/auto-register",
      heartbeat: "GET /api/arkaios/heartbeat",
    },
  });
}
