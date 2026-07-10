import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
import { trackError } from "../../utils/metrics";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

export interface UserRole {
  id:          string;
  user_id:     string;
  tenant_id:   string;
  role_id:     string;
  assigned_by: string;
  assigned_at: Date;
  reason?:     string;
  is_active:   boolean;
  created_at:  Date;
  updated_at:  Date;
  // joined fields
  role_name?:  string;
  role_slug?:  string;
}

function ctx() { return requestContext.get() ?? {}; }

export const userRoleRepository = {
  async assign(data: {
    userId:     string;
    tenantId:   string;
    roleId:     string;
    assignedBy: string;
    reason?:    string;
  }, client?: PoolClient): Promise<UserRole> {
    const sql = `
      INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by, reason)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, tenant_id) DO UPDATE
        SET role_id     = EXCLUDED.role_id,
            assigned_by = EXCLUDED.assigned_by,
            assigned_at = now(),
            reason      = EXCLUDED.reason,
            is_active   = true,
            updated_at  = now()
      RETURNING *`;
    const params = [data.userId, data.tenantId, data.roleId, data.assignedBy, data.reason ?? null];

    try {
      const row = client
        ? (await client.query(sql, params)).rows[0] as UserRole
        : (await queryOne<UserRole>(sql, params))!;

      logger.info("user_role_assigned", {
        event:    "user_role_assigned",
        userId:   data.userId,
        tenantId: data.tenantId,
        roleId:   data.roleId,
        ...ctx(),
      });
      return row;
    } catch (err) {
      trackError("user_role_assign_failed", "user_role_repository", "high");
      throw err;
    }
  },

  async findByUserAndTenant(userId: string, tenantId: string): Promise<UserRole | null> {
    return queryOne<UserRole>(
      `SELECT ur.*, r.name AS role_name, r.slug AS role_slug
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.tenant_id = $2 AND ur.is_active = true`,
      [userId, tenantId]
    );
  },

  async findAllByTenant(tenantId: string): Promise<UserRole[]> {
    return query<UserRole>(
      `SELECT ur.*, r.name AS role_name, r.slug AS role_slug,
              u.first_name, u.last_name, u.email
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       JOIN users u ON u.id  = ur.user_id
       WHERE ur.tenant_id = $1 AND ur.is_active = true
       ORDER BY ur.assigned_at DESC`,
      [tenantId]
    );
  },

  async findByUserId(userId: string): Promise<UserRole[]> {
    return query<UserRole>(
      `SELECT ur.*, r.name AS role_name, r.slug AS role_slug
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.is_active = true`,
      [userId]
    );
  },

  async deactivate(userId: string, tenantId: string): Promise<void> {
    await query(
      `UPDATE user_roles SET is_active = false, updated_at = now()
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );
    logger.info("user_role_deactivated", {
      event:    "user_role_deactivated",
      userId,
      tenantId,
      ...ctx(),
    });
  },

  async getRoleIdsByUserId(userId: string, tenantId: string): Promise<string[]> {
    const rows = await query<{ role_id: string }>(
      `SELECT role_id FROM user_roles
       WHERE user_id = $1 AND tenant_id = $2 AND is_active = true`,
      [userId, tenantId]
    );
    return rows.map((r) => r.role_id);
  },
};
