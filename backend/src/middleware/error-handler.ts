import { Request, Response, NextFunction } from "express";
import { AppError }       from "../utils/AppError";
import logger             from "../utils/logger";
import { requestContext } from "../context/requestContext";
import { trackError }     from "../utils/metrics";

export function NotFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const ctx = requestContext.get();

  if (err instanceof AppError && err.isOperational) {
    logger.warn("operational_error", {
      event:      "operational_error",
      statusCode: err.statusCode,
      message:    err.message,
      requestId:  ctx?.requestId,
      details:    err.details,
    });
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  trackError("unhandled_error", "express", "critical");
  logger.error("unhandled_error", {
    event:     "unhandled_error",
    message:   err.message,
    stack:     err.stack,
    requestId: ctx?.requestId,
  });
  res.status(500).json({ success: false, message: "An unexpected error occurred." });
}
