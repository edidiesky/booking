import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { paymentService } from "./payment.service";
import {
  normalizeWebhookPayload,
  verifyWebhookSignature,
  WebhookSignatureError,
} from "./webhookSignatures";

export function createPaymentController(pool: Pool) {
  return {
    async initiate(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await paymentService.initializePayment(pool, req.body);
        res.status(202).json(result);
      } catch (err) {
        next(err);
      }
    },

    async refund(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await paymentService.requestRefund(
          pool,
          req.params.bookingId as string,
        );
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    async webhook(req: Request, res: Response, next: NextFunction) {
      try {
        const gateway = req.params.gateway as "paystack" | "flutterwave";
        const raw =
          (req as Request & { rawBody?: Buffer }).rawBody ??
          Buffer.from(JSON.stringify(req.body));

        try {
          verifyWebhookSignature(gateway, req, raw);
        } catch (err) {
          if (err instanceof WebhookSignatureError) {
            res.status(401).json({ error: err.message });
            return;
          }
          throw err;
        }

        const normalized = normalizeWebhookPayload(
          gateway,
          req.body as Record<string, unknown>,
        );
        if (!normalized.transactionId) {
          res.status(400).json({ error: "transaction id missing in payload" });
          return;
        }

        const result = await paymentService.handleWebhook(pool, {
          transactionId: normalized.transactionId,
          amount: normalized.amount,
          gateway,
          amountUnit: normalized.amountUnit,
        });
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}
