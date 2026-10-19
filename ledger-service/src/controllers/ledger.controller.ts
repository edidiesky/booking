import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { ledgerService } from "../services/ledger.service";
import { publishAuditLog } from "../auditPublisher";

export function createLedgerController(pool: Pool) {
  return {
    async releaseEscrow(req: Request, res: Response, next: NextFunction) {
      const { bookingId, tenantId, totalAmountNgn, platformFeeNgn } = req.body as {
        bookingId: string;
        tenantId: string;
        totalAmountNgn: number;
        platformFeeNgn: number;
      };

      try {
        const result = await ledgerService.releaseEscrowWithPool(pool, {
          bookingId,
          tenantId,
          totalAmountNgn,
          platformFeeNgn,
        });

        // Outbox only on first write
        if (!result.idempotent) {
          const client = await pool.connect();
          try {
            await client.query(
              `INSERT INTO outbox_events (event_type, payload, tenant_id)
               VALUES ('booking.escrow_released', $1::jsonb, $2)`,
              [
                JSON.stringify({
                  bookingId,
                  totalAmountNgn,
                  platformFeeNgn,
                  transactionId: result.transactionId,
                }),
                tenantId,
              ],
            );
          } finally {
            client.release();
          }
        }

        publishAuditLog({
          tenantId,
          action: "escrow.released",
          resource: "booking",
          resourceId: bookingId,
          newValue: { totalAmountNgn, platformFeeNgn, ...result },
        });

        res.status(200).json({ released: true, ...result });
      } catch (err) {
        next(err);
      }
    },
  };
}
