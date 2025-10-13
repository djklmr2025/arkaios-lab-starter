import type { Request, Response } from "express";

export function handleHealth(_req: Request, res: Response) {
  const mem = process.memoryUsage();
  const rssMB = Math.round((mem.rss / 1024 / 1024) * 100) / 100;
  const heapUsedMB = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
  const heapTotalMB = Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100;
  const uptimeSec = Math.round(process.uptime());

  res.json({
    ok: true,
    uptimeSec,
    memory: { rssMB, heapUsedMB, heapTotalMB },
    pid: process.pid,
    timestamp: Date.now(),
  });
}