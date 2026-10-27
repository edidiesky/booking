import { Pool, PoolClient } from "pg";
import { randomUUID } from "crypto";

/**
 * Operates on the MONOLITH's `payments` table (shared database).
 * FORCE RLS: run writes inside withTenant() so app.current_tenant_id is set.
 */
export async function withTenant<T>(
  pool: Pool,
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      tenantId,
    ]);
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

export interface PaymentRow {
  id: string;
  booking_id: string;
  tenant_id: string;
  guest_user_id: string;
  gateway: "paystack" | "flutterwave";
  transaction_id: string | null;
  amount_ngn: string;
  status: "pending" | "success" | "failed" | "refunded";
  metadata: Record<string, unknown>;
}

export const paymentRepository = {
  async findLatestByBooking(
    client: PoolClient,
    bookingId: string,
    gateway?: string,
    lock = false,
  ) {
    const r = await client.query<PaymentRow>(
      `SELECT * FROM payments
        WHERE booking_id = $1 ${gateway ? "AND gateway = $2::payment_gateway" : ""}
        ORDER BY created_at DESC LIMIT 1 ${lock ? "FOR UPDATE" : ""}`,
      gateway ? [bookingId, gateway] : [bookingId],
    );
    return r.rows[0] ?? null;
  },

  /** New attempt starts as default 'pending' (monolith enum) — never 'processing'. */
  async create(
    client: PoolClient,
    d: {
      bookingId: string;
      tenantId: string;
      guestUserId: string;
      amountNgn: number;
      gateway: string;
    },
  ) {
    const r = await client.query<PaymentRow>(
      `INSERT INTO payments (
         booking_id, tenant_id, guest_user_id, gateway, amount_ngn,
         idempotency_key, metadata
       )
       VALUES ($1, $2, $3, $4::payment_gateway, $5, $6, $7::jsonb)
       RETURNING *`,
      [
        d.bookingId,
        d.tenantId,
        d.guestUserId,
        d.gateway,
        d.amountNgn,
        `payment-service:${d.bookingId}:${d.gateway}:${randomUUID()}`,
        JSON.stringify({ source: "payment-service" }),
      ],
    );
    return r.rows[0]!;
  },

  async markPending(
    client: PoolClient,
    id: string,
    transactionId: string,
    redirectUrl?: string,
  ) {
    await client.query(
      `UPDATE payments
          SET transaction_id = $2,
              status = 'pending',
              metadata = metadata || $3::jsonb,
              updated_at = now()
        WHERE id = $1`,
      [id, transactionId, JSON.stringify({ redirectUrl })],
    );
  },

  async markFailed(client: PoolClient, id: string, reason: string) {
    await client.query(
      `UPDATE payments
          SET status = 'failed',
              metadata = metadata || $2::jsonb,
              updated_at = now()
        WHERE id = $1`,
      [id, JSON.stringify({ failureReason: reason })],
    );
  },

  async markSuccess(client: PoolClient, id: string) {
    await client.query(
      `UPDATE payments
          SET status = 'success',
              paid_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [id],
    );
  },

  async markRefunded(client: PoolClient, id: string) {
    await client.query(
      `UPDATE payments
          SET status = 'refunded',
              refunded_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [id],
    );
  },

  /** Prefer SECURITY DEFINER lookup if you have payment_by_transaction_id. */
  async findByTransactionId(pool: Pool, transactionId: string) {
    const r = await pool.query<PaymentRow>(
      `SELECT * FROM payments WHERE transaction_id = $1 LIMIT 1`,
      [transactionId],
    );
    return r.rows[0] ?? null;
  },

  async writeOutboxEvent(
    client: PoolClient,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    await client.query(
      `INSERT INTO outbox_events (event_type, payload) VALUES ($1, $2::jsonb)`,
      [eventType, JSON.stringify(payload)],
    );
  },
};