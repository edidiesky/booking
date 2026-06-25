import { query, queryOne } from "../../config/database";
import { trackError } from "../../utils/metrics";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

export interface RolePermission {
  id:            string;
  role_id:       string;
  permission_id: string;
  created_at:    Date;
}

function ctx() { return requestContext.get() ?? {}; }

export const rolePermissionRepository = {
  async seed(
    records: { role_id: string; permission_id: string }[]
  ): Promise<void> {
    if (!records.length) return;
    for (const r of records) {
      await query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [r.role_id, r.permission_id]
      );
    }
    logger.info("role_permissions_seeded", { event: "role_permissions_seeded", count: records.length });
  },

  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    return query<RolePermission>(
      `SELECT * FROM role_permissions WHERE role_id = $1`,
      [roleId]
    );
  },

  async findByRoleIds(roleIds: string[]): Promise<RolePermission[]> {
    if (!roleIds.length) return [];
    return query<RolePermission>(
      `SELECT * FROM role_permissions WHERE role_id = ANY($1::uuid[])`,
      [roleIds]
    );
  },

  async add(roleId: string, permissionId: string): Promise<void> {
    try {
      await query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [roleId, permissionId]
      );
      logger.info("role_permission_added", { event: "role_permission_added", roleId, permissionId, ...ctx() });
    } catch (err) {
      trackError("role_permission_add_failed", "role_permission_repository", "medium");
      throw err;
    }
  },

  async remove(roleId: string, permissionId: string): Promise<void> {
    await query(
      `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permissionId]
    );
    logger.info("role_permission_removed", { event: "role_permission_removed", roleId, permissionId, ...ctx() });
  },

  async exists(roleId: string, permissionId: string): Promise<boolean> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permissionId]
    );
    return parseInt(row?.count ?? "0", 10) > 0;
  },
};
