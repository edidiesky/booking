import { Pool } from "pg";

// direct SQL operation, matching booking-service's established
// repository shape exactly.
export const paymentRepository = {
  async findLatestByBooking(pool: Pool, tenantId: string, bookingId: string, gateway: string) {
    const result = await pool.query(
      `SELECT * FROM payments WHERE tenant_id = $1 AND booking_id = $2 AND gateway = $3 ORDER BY created_at DESC LIMIT 1`,
      [tenantId, bookingId, gateway],
    );
    return result.rows[0] ?? null;
  },

  async create(pool: Pool, bookingId: string, tenantId: string, amountNgn: number, gateway: string) {
    const result = await pool.query(
      `INSERT INTO payments (booking_id, tenant_id, amount_ngn, gateway, status) VALUES ($1, $2, $3, $4, 'processing') RETURNING *`,
      [bookingId, tenantId, amountNgn, gateway],
    );
    return result.rows[0];
  },

  async markPending(pool: Pool, id: string, transactionId: string, redirectUrl: string | undefined) {
    await pool.query(`UPDATE payments SET status = 'pending', transaction_id = $1, redirect_url = $2 WHERE id = $3`, [transactionId, redirectUrl, id]);
  },

  async markFailed(pool: Pool, id: string) {
    await pool.query(`UPDATE payments SET status = 'failed' WHERE id = $1`, [id]);
  },

  async markSuccess(pool: Pool, id: string) {
    await pool.query(`UPDATE payments SET status = 'success', paid_at = now() WHERE id = $1`, [id]);
  },

  async markRefundRequested(pool: Pool, bookingId: string) {
    await pool.query(`UPDATE payments SET status = 'refund_requested' WHERE booking_id = $1 AND status IN ('pending', 'success')`, [bookingId]);
  },

  async findByTransactionId(pool: Pool, transactionId: string) {
    const result = await pool.query(`SELECT * FROM payments WHERE transaction_id = $1`, [transactionId]);
    return result.rows[0] ?? null;
  },

  async writeOutboxEvent(pool: Pool, eventType: string, payload: Record<string, unknown>, tenantId: string) {
    await pool.query(`INSERT INTO outbox_events (event_type, payload, tenant_id) VALUES ($1, $2::jsonb, $3)`, [eventType, JSON.stringify(payload), tenantId]);
  },
};
