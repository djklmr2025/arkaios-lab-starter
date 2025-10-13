import type { Request, Response } from "express";

export function handleDemo(_req: Request, res: Response) {
  res.json({ data: "Demo data from server" });
}