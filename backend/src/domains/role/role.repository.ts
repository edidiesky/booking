import { query, queryOne } from "@booking/shared";
import { SeedRole } from "../../types";
import { trackError } from "../../utils/metrics";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

export interface Role {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  is_system:   boolean;
  tenant_id:   string | null;
  created_at:  Date;
  updated_at:  Date;
}

function ctx() { return requestContext.get() ?? {}; }

export const roleRepository = {
  async seed(roles: SeedRole[]): Promise<void> {
    for (const r of roles) {
      await query(
        `INSERT INTO roles (name, slug, description, is_system, tenant_id)
         VALUES ($1, $2, $3, $4, NULL)
         ON CONFLICT (slug) WHERE tenant_id IS NULL DO UPDATE
           SET name        = EXCLUDED.name,
               description = EXCLUDED.description,
               updated_at  = now()`,
        [r.name, r.slug, r.description, r.is_system]
      );
    }
    logger.info("roles_seeded", { event: "roles_seeded", count: roles.length });
  },

  async findBySlug(slug: string): Promise<Role | null> {
    return queryOne<Role>(`SELECT * FROM roles WHERE slug = $1`, [slug]);
  },

  async findById(id: string): Promise<Role | null> {
    return queryOne<Role>(`SELECT * FROM roles WHERE id = $1`, [id]);
  },

  // System roles (tenant_id IS NULL) are visible to everyone. Custom roles
  // are scoped to the tenant that created them, never leaked cross-tenant.
  async findAllForTenant(tenantId: string): Promise<Role[]> {
    return query<Role>(
      `SELECT * FROM roles WHERE tenant_id IS NULL OR tenant_id = $1
       ORDER BY is_system DESC, name ASC`,
      [tenantId],
    );
  },

  // Platform-wide system roles only, used where there's no tenant context
  // (e.g. the public role list endpoint).
  async findAllSystem(): Promise<Role[]> {
    return query<Role>(`SELECT * FROM roles WHERE tenant_id IS NULL ORDER BY name ASC`);
  },

  async create(data: {
    name: string; slug: string; description: string;
    is_system?: boolean; tenant_id: string | null;
  }): Promise<Role> {
    try {
      const row = await queryOne<Role>(
        `INSERT INTO roles (name, slug, description, is_system, tenant_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.name, data.slug, data.description, data.is_system ?? false, data.tenant_id]
      );
      logger.info("role_created", { event: "role_created", slug: data.slug, tenantId: data.tenant_id, ...ctx() });
      return row!;
    } catch (err) {
      trackError("role_create_failed", "role_repository", "medium");
      throw err;
    }
  },
};