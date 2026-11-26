import type { Request, Response, NextFunction } from "express";
import { paymentInitHandlerDuration } from "../utils/metrics";

type InitializePaymentBody = { gateway: string };

/**
 * Route-scoped timer for POST /api/v1/payments/initialize.
 *
 * Registered after auth and Joi validation, so req.body.gateway is already
 * the closed set "paystack" | "flutterwave". The cast below is the contract,
 * not a runtime check — Joi is the boundary, this is trusted application code.
 */
export function paymentInitTimer(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = process.hrtime.bigint();
  const { gateway } = req.body as InitializePaymentBody;

  res.on("finish", () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const status = res.statusCode < 400 ? "success" : "error";
    paymentInitHandlerDuration.observe({ gateway, status }, seconds);
  });

  next();
}
