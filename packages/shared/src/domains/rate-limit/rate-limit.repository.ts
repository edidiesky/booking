import { query, queryOne } from "../../config/database";
import type {
  RateLimitRuleRow,
  CreateRuleInput,
  UpdateRuleInput,
} from "./types";

export const rateLimitRepository = {
  async create(input: CreateRuleInput): Promise<RateLimitRuleRow> {
    const row = await queryOne<RateLimitRuleRow>(
      `INSERT INTO rate_limit_rules (id_type, id_value, resource, algorithm, max_request, interval_ms, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.idType,
        input.idValue,
        input.resource,
        input.algorithm,
        input.maxRequest,
        input.intervalMs,
        input.enabled ?? true,
      ],
    );
    return row!;
  },

  async update(id: string, input: UpdateRuleInput): Promise<RateLimitRuleRow | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    return queryOne<RateLimitRuleRow>(
      `UPDATE rate_limit_rules
       SET algorithm   = $2,
           max_request = $3,
           interval_ms = $4,
           enabled     = $5,
           updated_at  = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        input.algorithm ?? existing.algorithm,
        input.maxRequest ?? existing.max_request,
        input.intervalMs ?? existing.interval_ms,
        input.enabled ?? existing.enabled,
      ],
    );
  },

  async getById(id: string): Promise<RateLimitRuleRow | null> {
    return queryOne<RateLimitRuleRow>(`SELECT * FROM rate_limit_rules WHERE id = $1`, [id]);
  },

  async list(page: number, limit: number): Promise<RateLimitRuleRow[]> {
    return query<RateLimitRuleRow>(
      `SELECT * FROM rate_limit_rules ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit],
    );
  },

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `DELETE FROM rate_limit_rules WHERE id = $1 RETURNING id`,
      [id],
    );
    return result !== null;
  },

  async getEnabled(): Promise<RateLimitRuleRow[]> {
    return query<RateLimitRuleRow>(
      `SELECT * FROM rate_limit_rules WHERE enabled = true ORDER BY created_at ASC`,
    );
  },
};