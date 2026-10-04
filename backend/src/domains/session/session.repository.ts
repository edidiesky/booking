import { query, queryOne } from "@booking/shared";

export type RevokedReason =
  | "user_logout"
  | "user_logout_all"
  | "admin_revoke"
  | "session_cap_evicted"
  | "password_changed";

export interface Session {
  id: string;
  user_id: string;
  device_label: string;
  device_type: "desktop" | "mobile" | "tablet" | "unknown";
  os: string | null;
  browser: string | null;
  ip_address: string;
  city: string | null;
  country: string | null;
  created_at: Date;
  last_active_at: Date;
  revoked_at: Date | null;
  revoked_reason: RevokedReason | null;
}

const MAX_SESSIONS_PER_USER = 10;

export const sessionRepository = {
  async create(data: {
    userId: string;
    deviceLabel: string;
    deviceType: Session["device_type"];
    os: string | null;
    browser: string | null;
    ipAddress: string;
    city: string | null;
    country: string | null;
  }): Promise<Session> {
    const session = await queryOne<Session>(
      `INSERT INTO sessions (user_id, device_label, device_type, os, browser, ip_address, city, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.userId,
        data.deviceLabel,
        data.deviceType,
        data.os,
        data.browser,
        data.ipAddress,
        data.city,
        data.country,
      ],
    );
    await this.enforceSessionCap(data.userId);
    return session!;
  },

  async enforceSessionCap(userId: string): Promise<void> {
    await query(
      `UPDATE sessions
       SET revoked_at = now(), revoked_reason = 'session_cap_evicted'
       WHERE id IN (
         SELECT id FROM sessions
         WHERE user_id = $1 AND revoked_at IS NULL
         ORDER BY created_at DESC
         OFFSET $2
       )`,
      [userId, MAX_SESSIONS_PER_USER],
    );
  },

  async listActive(userId: string): Promise<Session[]> {
    return query<Session>(
      `SELECT * FROM sessions WHERE user_id = $1 AND revoked_at IS NULL ORDER BY last_active_at DESC`,
      [userId],
    );
  },

  async findById(sessionId: string): Promise<Session | null> {
    return queryOne<Session>(`SELECT * FROM sessions WHERE id = $1`, [
      sessionId,
    ]);
  },

  async touchLastActive(sessionId: string): Promise<void> {
    await query(
      `UPDATE sessions SET last_active_at = now() WHERE id = $1 AND revoked_at IS NULL`,
      [sessionId],
    );
  },

  async revoke(sessionId: string, reason: RevokedReason): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `UPDATE sessions SET revoked_at = now(), revoked_reason = $1
       WHERE id = $2 AND revoked_at IS NULL
       RETURNING id`,
      [reason, sessionId],
    );
    return !!result;
  },

  async revokeAllForUser(
    userId: string,
    reason: RevokedReason,
    exceptSessionId?: string,
  ): Promise<number> {
    const params: unknown[] = [reason, userId];
    let exceptClause = "";
    if (exceptSessionId) {
      params.push(exceptSessionId);
      exceptClause = `AND id != $${params.length}`;
    }
    const result = await query<{ id: string }>(
      `UPDATE sessions SET revoked_at = now(), revoked_reason = $1
       WHERE user_id = $2 AND revoked_at IS NULL ${exceptClause}
       RETURNING id`,
      params,
    );
    return result.length;
  },

  async adminRevoke(sessionId: string): Promise<boolean> {
    return this.revoke(sessionId, "admin_revoke");
  },

  async listForUserAdmin(userId: string): Promise<Session[]> {
    return query<Session>(
      `SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId],
    );
  },
};