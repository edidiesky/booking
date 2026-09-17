import type { Request, Response, NextFunction } from "express";
import { getPoolStats, trackError } from "@booking/shared";

const SHED_THRESHOLD_RATIO = Number(process.env.LOAD_SHED_THRESHOLD_RATIO ?? 0.25);

export function shedIfSaturated(req: Request, res: Response, next: NextFunction): void {
  const { total, waiting } = getPoolStats();
  const threshold = Math.max(1, Math.ceil(total * SHED_THRESHOLD_RATIO));

  if (waiting >= threshold) {
    trackError("load_shed", req.path, "low");
    res.status(503).json({
      success: false,
      message: "This request was shed under real, current database load. Please retry shortly.",
    });
    return;
  }

  next();
}