import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) {
    logger.error("request_failed", {
      error: err.message,
      stack: err.stack,
      status,
    });
  } else {
    logger.warn("request_rejected", {
      error: err.message,
      status,
    });
  }
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : err.message,
  });
}
