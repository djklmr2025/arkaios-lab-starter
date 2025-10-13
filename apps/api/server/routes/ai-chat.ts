// apps/api/server/routes/ai-chat.ts
import type { Request, Response } from "express";

export async function handleAiChat(req: Request, res: Response) {
  try {
    const prompt = String(req.body?.prompt ?? "");
    if (!prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const gw = process.env.AIDA_GATEWAY_URL; // ej: https://<host>/aida/gateway
    const token = process.env.AIDA_AUTH_TOKEN; // bearer para modo seguro

    if (!gw || !token) {
      console.error("[/api/chat] Missing environment variables:", { gw, token: token ? "***" : "missing" });
      return res.status(500).json({ error: "Gateway not configured" });
    }

    const requestedAction = String(req.body?.action ?? "plan").toLowerCase();
    const basePayload = {
      agent_id: "puter",
      action: requestedAction,
      params: { objective: prompt },
    } as const;

    const r = await fetch(gw, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(basePayload),
    });

    const data = await r.json().catch(() => ({}));

    // Fallback seguro: si el gateway rechaza por open_mode o acción no permitida,
    // reintenta con una acción pública conocida (plan) y mismo bearer.
    const rejectedByOpenMode = (
      !r.ok && (
        (typeof data === 'object' && data !== null && 'error' in data && String((data as { error: unknown }).error || "").includes("open_mode")) ||
        (typeof data === 'object' && data !== null && 'reason' in data && String((data as { reason: unknown }).reason || "").includes("open_mode")) ||
        (typeof data === 'object' && data !== null && 'reason' in data && String((data as { reason: unknown }).reason || "").includes("action_not_allowed_in_open_mode"))
      )
    );

    if (rejectedByOpenMode) {
      const payload2 = { ...basePayload, action: "plan" };
      const r2 = await fetch(gw, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload2),
      });
      const data2 = await r2.json().catch(() => ({}));
      return res.status(r2.ok ? 200 : 502).json(data2);
    }

    return res.status(r.ok ? 200 : 502).json(data);
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return res.status(500).json({ error: "Chat route failed" });
  }
}
