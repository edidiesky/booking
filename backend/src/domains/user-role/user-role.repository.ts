import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

export interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
  assigned_by: string;
  assigned_at: Date;
  reason?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // joined fields
  role_name?: string;
  role_slug?: string;
}

function ctx() {
  return requestContext.get() ?? {};
}

export const userRoleRepository = {
  async assign(
    data: {
      userId: string;
      tenantId: string | null;
      roleId: string;
      assignedBy: string;
      reason?: string;
    },
    client?: PoolClient,
  ): Promise<UserRole> {
    const sql = data.tenantId
      ? `INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by, reason)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, tenant_id) WHERE tenant_id IS NOT NULL DO UPDATE
         SET role_id = EXCLUDED.role_id, assigned_by = EXCLUDED.assigned_by,
             assigned_at = now(), reason = EXCLUDED.reason, is_active = true, updated_at = now()
       RETURNING *`
      : `INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by, reason)
       VALUES ($1, NULL, $3, $4, $5)
       ON CONFLICT (user_id) WHERE tenant_id IS NULL DO UPDATE
         SET role_id = EXCLUDED.role_id, assigned_by = EXCLUDED.assigned_by,
             assigned_at = now(), reason = EXCLUDED.reason, is_active = true, updated_at = now()
       RETURNING *`;
    const params = [
      data.userId,
      data.tenantId,
      data.roleId,
      data.assignedBy,
      data.reason ?? null,
    ];
    const row = client
      ? ((await client.query(sql, params)).rows[0] as UserRole)
      : (await queryOne<UserRole>(sql, params))!;
    logger.info("user_role_assigned", {
      event: "user_role_assigned",
      userId: data.userId,
      tenantId: data.tenantId,
      roleId: data.roleId,
      ...ctx(),
    });
    return row;
  },

  // getRoleIdsByUserId: signature widens, and the WHERE clause needs
  // null-safe equality, plain `tenant_id = $2` never matches a NULL
  // tenantId under standard SQL comparison semantics.
  async getRoleIdsByUserId(
    userId: string,
    tenantId: string | null,
  ): Promise<string[]> {
    const rows = await query<{ role_id: string }>(
      `SELECT role_id FROM user_roles
     WHERE user_id = $1 AND tenant_id IS NOT DISTINCT FROM $2 AND is_active = true`,
      [userId, tenantId],
    );
    return rows.map((r) => r.role_id);
  },

  async findByUserAndTenant(
    userId: string,
    tenantId: string,
  ): Promise<UserRole | null> {
    return queryOne<UserRole>(
      `SELECT ur.*, r.name AS role_name, r.slug AS role_slug
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.tenant_id = $2 AND ur.is_active = true`,
      [userId, tenantId],
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
      [tenantId],
    );
  },

  async findByUserId(userId: string): Promise<UserRole[]> {
    return query<UserRole>(
      `SELECT ur.*, r.name AS role_name, r.slug AS role_slug
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.is_active = true`,
      [userId],
    );
  },

  async findActiveByRole(
    roleId: string,
    tenantId: string,
  ): Promise<
    Array<
      UserRole & { first_name?: string; last_name?: string; email?: string }
    >
  > {
    return query(
      `SELECT ur.*, u.first_name, u.last_name, u.email
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       WHERE ur.role_id = $1 AND ur.tenant_id = $2 AND ur.is_active = true
       ORDER BY u.first_name ASC`,
      [roleId, tenantId],
    );
  },

  async deactivate(userId: string, tenantId: string): Promise<void> {
    await query(
      `UPDATE user_roles SET is_active = false, updated_at = now()
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId],
    );
    logger.info("user_role_deactivated", {
      event: "user_role_deactivated",
      userId,
      tenantId,
      ...ctx(),
    });
  },
};
