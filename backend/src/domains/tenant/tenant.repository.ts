import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
import { TenantStatus, CancellationPolicyTier, TenantSettings } from "../../types";

export interface Tenant {
  id:                  string;
  slug:                string;
  name:                string;
  owner_user_id:       string;
  platform_fee_pct:    number;
  cancellation_policy: CancellationPolicyTier[];
  status:              TenantStatus;
  settings:            TenantSettings;
  created_at:          Date;
  updated_at:          Date;
}

export const tenantRepository = {
  async findBySlug(slug: string): Promise<Tenant | null> {
    return queryOne<Tenant>(`SELECT * FROM tenants WHERE slug = $1 LIMIT 1`, [slug]);
  },

  async findById(id: string): Promise<Tenant | null> {
    return queryOne<Tenant>(`SELECT * FROM tenants WHERE id = $1`, [id]);
  },

async create(data: {
  slug:           string;
  name:           string;
  ownerUserId:    string;
  platformFeePct?: number;
}, client?: PoolClient): Promise<Tenant> {
  const sql = `INSERT INTO tenants (slug, name, owner_user_id, platform_fee_pct, status)
               VALUES ($1, $2, $3, $4, 'active') RETURNING *`;
  const params = [data.slug, data.name, data.ownerUserId, data.platformFeePct ?? 10.00];
  const row = client
    ? (await client.query(sql, params)).rows[0] as Tenant
    : await queryOne<Tenant>(sql, params);
  return row!;
},

  async updateStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
    return queryOne<Tenant>(
      `UPDATE tenants SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
  },

  async updateSettings(id: string, settings: Partial<TenantSettings>): Promise<Tenant | null> {
    return queryOne<Tenant>(
      `UPDATE tenants SET settings = settings || $1::jsonb, updated_at = now() WHERE id = $2 RETURNING *`,
      [JSON.stringify(settings), id]
    );
  },

  async updateCancellationPolicy(id: string, policy: CancellationPolicyTier[]): Promise<Tenant | null> {
    return queryOne<Tenant>(
      `UPDATE tenants SET cancellation_policy = $1::jsonb, updated_at = now() WHERE id = $2 RETURNING *`,
      [JSON.stringify(policy), id]
    );
  },

  async slugExists(slug: string): Promise<boolean> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM tenants WHERE slug = $1`, [slug]
    );
    return parseInt(row?.count ?? "0", 10) > 0;
  },

  async listAll(page = 1, limit = 20): Promise<Tenant[]> {
    const offset = (page - 1) * limit;
    return query<Tenant>(
      `SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  },
};
