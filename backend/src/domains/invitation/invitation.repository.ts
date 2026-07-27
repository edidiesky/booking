import { query, queryOne } from "@booking/shared";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Invitation {
  id:          string;
  tenant_id:   string;
  role_id:     string;
  email:       string;
  code_hash:   string;
  invited_by:  string;
  status:      InvitationStatus;
  expires_at:  Date;
  accepted_at?: Date;
  accepted_by?: string;
  created_at:  Date;
}

export const invitationRepository = {
  async create(data: { tenantId: string; roleId: string; email: string; codeHash: string; invitedBy: string; expiresAt: Date }): Promise<Invitation> {
    const row = await queryOne<Invitation>(
      `INSERT INTO invitations (tenant_id, role_id, email, code_hash, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.tenantId, data.roleId, data.email.toLowerCase().trim(), data.codeHash, data.invitedBy, data.expiresAt],
    );
    return row!;
  },

  async findPendingByTenantAndEmail(tenantId: string, email: string): Promise<Invitation | null> {
    return queryOne<Invitation>(
      `SELECT * FROM invitations WHERE tenant_id = $1 AND email = $2 AND status = 'pending'`,
      [tenantId, email.toLowerCase().trim()],
    );
  },

  async listByTenant(tenantId: string): Promise<(Invitation & { role_name: string })[]> {
    await query(
      `UPDATE invitations SET status = 'expired', updated_at = now()
       WHERE tenant_id = $1 AND status = 'pending' AND expires_at < now()`,
      [tenantId],
    );

    return query<Invitation & { role_name: string }>(
      `SELECT i.*, r.name AS role_name
       FROM invitations i
       JOIN roles r ON r.id = i.role_id
       WHERE i.tenant_id = $1
       ORDER BY i.created_at DESC`,
      [tenantId],
    );
  },

  async markAccepted(tenantId: string, email: string, userId: string): Promise<void> {
    await query(
      `UPDATE invitations SET status = 'accepted', accepted_at = now(), accepted_by = $3, updated_at = now()
       WHERE tenant_id = $1 AND email = $2 AND status = 'pending'`,
      [tenantId, email.toLowerCase().trim(), userId],
    );
  },

  async markRevoked(tenantId: string, email: string): Promise<void> {
    await query(
      `UPDATE invitations SET status = 'revoked', updated_at = now()
       WHERE tenant_id = $1 AND email = $2 AND status = 'pending'`,
      [tenantId, email.toLowerCase().trim()],
    );
  },
};