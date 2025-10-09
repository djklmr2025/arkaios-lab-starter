// apps/api/server/routes/ai-chat.ts
import type { Request, Response } from "express";
import fetch from "node-fetch";

export async function handleAiChat(req: Request, res: Response) {
  try {
    const prompt = String(req.body?.prompt ?? "");
    if (!prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const gw = process.env.AIDA_GATEWAY_URL!;
    const token = process.env.AIDA_AUTH_TOKEN!;

    const r = await fetch(gw, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        agent_id: "puter",
        action: "ask",                    // 👈 usar "ask"
        params: { objective: prompt },    // el gateway espera "objective"
        mode: "open"                      // explícito para evitar dudas
      }),
    });

    const data = await r.json().catch(() => ({}));

    // si el gateway rechaza open mode, intenta fallback rápido a "closed"
    if (!r.ok && String(data?.error || "").includes("open_mode")) {
      const r2 = await fetch(gw, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_id: "puter",
          action: "ask",
          params: { objective: prompt },
          mode: "closed"
        }),
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
