import { query, queryOne } from "@booking/shared";
import { trackError } from "../../utils/metrics";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

export interface UserPermission {
  id: string;
  user_id: string;
  tenant_id: string;
  permission_id: string;
  granted: boolean;
  assigned_by: string;
  assigned_at: Date;
  reason?: string;
  created_at: Date;
  updated_at: Date;
}

function ctx() {
  return requestContext.get() ?? {};
}

export const userPermissionRepository = {
  async upsert(data: {
    userId: string;
    tenantId: string;
    permissionId: string;
    granted: boolean;
    assignedBy: string;
    reason?: string;
  }): Promise<UserPermission> {
    try {
      const row = await queryOne<UserPermission>(
        `INSERT INTO user_permissions (user_id, tenant_id, permission_id, granted, assigned_by, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, tenant_id, permission_id) DO UPDATE
           SET granted     = EXCLUDED.granted,
               assigned_by = EXCLUDED.assigned_by,
               assigned_at = now(),
               reason      = EXCLUDED.reason,
               updated_at  = now()
         RETURNING *`,
        [
          data.userId,
          data.tenantId,
          data.permissionId,
          data.granted,
          data.assignedBy,
          data.reason ?? null,
        ],
      );

      logger.info("user_permission_upserted", {
        event: "user_permission_upserted",
        userId: data.userId,
        tenantId: data.tenantId,
        permissionId: data.permissionId,
        granted: data.granted,
        ...ctx(),
      });

      return row!;
    } catch (err) {
      trackError(
        "user_permission_upsert_failed",
        "user_permission_repository",
        "medium",
      );
      throw err;
    }
  },

  async findByUserAndTenant(
    userId: string,
    tenantId: string,
  ): Promise<UserPermission[]> {
    return query<UserPermission>(
      `SELECT * FROM user_permissions
       WHERE user_id = $1 AND tenant_id = $2
       ORDER BY assigned_at DESC`,
      [userId, tenantId],
    );
  },

  async findByUserTenantAndPermission(
    userId: string,
    tenantId: string,
    permissionId: string,
  ): Promise<UserPermission | null> {
    return queryOne<UserPermission>(
      `SELECT * FROM user_permissions
       WHERE user_id = $1 AND tenant_id = $2 AND permission_id = $3`,
      [userId, tenantId, permissionId],
    );
  },

  async revoke(
    userId: string,
    tenantId: string,
    permissionId: string,
  ): Promise<void> {
    await query(
      `DELETE FROM user_permissions
       WHERE user_id = $1 AND tenant_id = $2 AND permission_id = $3`,
      [userId, tenantId, permissionId],
    );
    logger.info("user_permission_revoked", {
      event: "user_permission_revoked",
      userId,
      tenantId,
      permissionId,
      ...ctx(),
    });
  },

  async getPermissionIdsByUser(
    userId: string,
    tenantId: string | null,
  ): Promise<{ permission_id: string; granted: boolean }[]> {
    return query(
      `SELECT permission_id, granted FROM user_permissions
     WHERE user_id = $1 AND tenant_id IS NOT DISTINCT FROM $2`,
      [userId, tenantId],
    );
  },
};
