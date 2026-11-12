import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { ledgerService } from "../services/ledger.service";
import { publishAuditLog } from "../auditPublisher";

export function createLedgerController(pool: Pool) {
  return {
    async releaseEscrow(req: Request, res: Response, next: NextFunction) {
      try {
        const input = req.body as {
          bookingId: string;
          tenantId: string;
          paymentId?: string;
          totalAmountNgn: number;
          platformFeeNgn: number;
        };
        const result = await ledgerService.releaseEscrowWithPool(pool, input);

        if (!result.idempotent) {
          publishAuditLog({
            tenantId: input.tenantId,
            action: "escrow.released",
            resource: "booking",
            resourceId: input.bookingId,
            newValue: {
              totalAmountNgn: input.totalAmountNgn,
              platformFeeNgn: input.platformFeeNgn,
              ...result,
            },
          });
        }
        res.status(200).json({ released: true, ...result });
      } catch (err) {
        next(err);
      }
    },

    async refund(req: Request, res: Response, next: NextFunction) {
      try {
        const input = req.body as {
          bookingId: string;
          tenantId: string;
          paymentId?: string;
          amountNgn: number;
        };
        const result = await ledgerService.refundWithPool(pool, input);

        if (!result.idempotent) {
          publishAuditLog({
            tenantId: input.tenantId,
            action: "payment.refunded",
            resource: "booking",
            resourceId: input.bookingId,
            newValue: { amountNgn: input.amountNgn, ...result },
          });
        }
        res.status(200).json({ refunded: true, ...result });
      } catch (err) {
        next(err);
      }
    },
  };
}
