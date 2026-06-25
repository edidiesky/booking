import { query, queryOne } from "../../config/database";
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
  created_at:  Date;
  updated_at:  Date;
}

function ctx() { return requestContext.get() ?? {}; }

export const roleRepository = {
  async seed(roles: SeedRole[]): Promise<void> {
    for (const r of roles) {
      await query(
        `INSERT INTO roles (name, slug, description, is_system)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE
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

  async findAll(): Promise<Role[]> {
    return query<Role>(`SELECT * FROM roles ORDER BY is_system DESC, name ASC`);
  },

  async create(data: { name: string; slug: string; description: string; is_system?: boolean }): Promise<Role> {
    try {
      const row = await queryOne<Role>(
        `INSERT INTO roles (name, slug, description, is_system)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.name, data.slug, data.description, data.is_system ?? false]
      );
      logger.info("role_created", { event: "role_created", slug: data.slug, ...ctx() });
      return row!;
    } catch (err) {
      trackError("role_create_failed", "role_repository", "medium");
      throw err;
    }
  },
};
