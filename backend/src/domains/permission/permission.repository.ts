import { query, queryOne } from "../../config/database";
import { SeedPermission } from "../../types";
import logger from "../../utils/logger";

export interface Permission {
  id:          string;
  resource:    string;
  action:      string;
  description?: string;
  created_at:  Date;
  updated_at:  Date;
}

export const permissionRepository = {
  async seed(permissions: SeedPermission[]): Promise<void> {
    for (const p of permissions) {
      await query(
        `INSERT INTO permissions (resource, action, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (resource, action) DO UPDATE
           SET description = EXCLUDED.description,
               updated_at  = now()`,
        [p.resource, p.action, p.description]
      );
    }
    logger.info("permissions_seeded", { event: "permissions_seeded", count: permissions.length });
  },

  async findAll(): Promise<Permission[]> {
    return query<Permission>(
      `SELECT * FROM permissions ORDER BY resource ASC, action ASC`
    );
  },

  async findById(id: string): Promise<Permission | null> {
    return queryOne<Permission>(`SELECT * FROM permissions WHERE id = $1`, [id]);
  },

  async findByIds(ids: string[]): Promise<Permission[]> {
    if (!ids.length) return [];
    return query<Permission>(
      `SELECT * FROM permissions WHERE id = ANY($1::uuid[])`,
      [ids]
    );
  },

  async findByResourceAction(resource: string, action: string): Promise<Permission | null> {
    return queryOne<Permission>(
      `SELECT * FROM permissions WHERE resource = $1 AND action = $2`,
      [resource, action]
    );
  },

  async listByResource(resource: string): Promise<Permission[]> {
    return query<Permission>(
      `SELECT * FROM permissions WHERE resource = $1 ORDER BY action ASC`,
      [resource]
    );
  },
};
