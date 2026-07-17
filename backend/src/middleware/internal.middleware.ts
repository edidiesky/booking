import { Request, Response, NextFunction } from "express";
import { AppError } from "@booking/shared";

export function requireInternalSecret(req: Request, _res: Response, next: NextFunction): void {
  const provided = req.headers["x-internal-secret"];
  const expected = process.env.INTERNAL_SECRET;

  if (!expected) {
    throw AppError.internal("INTERNAL_SECRET not configured on this server.");
  }
  if (provided !== expected) {
    throw AppError.unauthorized("Invalid internal secret.");
  }
  next();
}