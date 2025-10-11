// apps/api/server/routes/fs.ts
import type { Request, Response } from "express";
import fetch from "node-fetch";

async function callGateway(action: string, params: Record<string, unknown>) {
  const gw = process.env.AIDA_GATEWAY_URL;
  const token = process.env.AIDA_AUTH_TOKEN;
  if (!gw || !token) {
    return { ok: false, status: 500, data: { error: "Gateway not configured" } };
  }
  const r = await fetch(gw, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ agent_id: "puter", action, params }),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function isOpenModeRejection(payload: any) {
  try {
    const msg = JSON.stringify(payload);
    return (
      msg.includes("open_mode") ||
      msg.includes("action_not_allowed_in_open_mode") ||
      msg.includes("not allowed")
    );
  } catch {
    return false;
  }
}

export async function fsList(req: Request, res: Response) {
  const path = String(req.body?.path ?? "/");
  const { ok, status, data } = await callGateway("list", { path });
  if (!ok && isOpenModeRejection(data)) return res.status(403).json(data);
  return res.status(ok ? 200 : 502).json(data);
}

export async function fsRead(req: Request, res: Response) {
  const path = String(req.body?.path ?? "/");
  const { ok, status, data } = await callGateway("read", { path });
  if (!ok && isOpenModeRejection(data)) return res.status(403).json(data);
  return res.status(ok ? 200 : 502).json(data);
}

export async function fsWrite(req: Request, res: Response) {
  const path = String(req.body?.path ?? "/new.txt");
  const content = String(req.body?.content ?? "");
  const { ok, status, data } = await callGateway("write", { path, content });
  if (!ok && isOpenModeRejection(data)) return res.status(403).json(data);
  return res.status(ok ? 200 : 502).json(data);
}

export async function fsMkdir(req: Request, res: Response) {
  const path = String(req.body?.path ?? "/new-folder");
  const { ok, status, data } = await callGateway("mkdir", { path });
  if (!ok && isOpenModeRejection(data)) return res.status(403).json(data);
  return res.status(ok ? 200 : 502).json(data);
}