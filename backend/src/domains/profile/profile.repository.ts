import { PoolClient } from "pg";
import { queryOne } from "@booking/shared";

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  address: Record<string, unknown>;
  preferences: Record<string, unknown>;
  job_title?: string | null;
  phone?: string | null;
  tax_id?: string | null;
  tax_id_verified_at?: Date | null;
  identity_verified_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type ProfileUpdate = Partial<{
  display_name: string;
  bio: string;
  avatar_url: string;
  address: Record<string, string>;
  preferences: Record<string, unknown>;
  job_title: string;
  phone: string;
  tax_id: string;
}>;

export const profileRepository = {
  async create(
    data: { userId: string; displayName?: string },
    client?: PoolClient,
  ): Promise<Profile> {
    const sql = `
      INSERT INTO profiles (user_id, display_name)
      VALUES ($1, $2)
      RETURNING *`;
    const params = [data.userId, data.displayName ?? null];
    if (client) {
      return (await client.query(sql, params)).rows[0] as Profile;
    }
    return (await queryOne<Profile>(sql, params))!;
  },

  async findByUserId(userId: string): Promise<Profile | null> {
    return queryOne<Profile>(
      `SELECT * FROM profiles WHERE user_id = $1`,
      [userId],
    );
  },

  async update(userId: string, data: ProfileUpdate): Promise<Profile | null> {
    return queryOne<Profile>(
      `INSERT INTO profiles (
         user_id, display_name, bio, avatar_url, address, preferences,
         job_title, phone, tax_id
       )
       VALUES (
         $1, $2, $3, $4,
         COALESCE($5::jsonb, '{}'::jsonb),
         COALESCE($6::jsonb, '{}'::jsonb),
         $7, $8, $9
       )
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
         bio          = COALESCE(EXCLUDED.bio, profiles.bio),
         avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
         address      = CASE WHEN $5::jsonb IS NOT NULL THEN EXCLUDED.address ELSE profiles.address END,
         preferences  = CASE WHEN $6::jsonb IS NOT NULL THEN EXCLUDED.preferences ELSE profiles.preferences END,
         job_title    = COALESCE(EXCLUDED.job_title, profiles.job_title),
         phone        = COALESCE(EXCLUDED.phone, profiles.phone),
         tax_id       = COALESCE(EXCLUDED.tax_id, profiles.tax_id),
         updated_at   = now()
       RETURNING *`,
      [
        userId,
        data.display_name ?? null,
        data.bio ?? null,
        data.avatar_url ?? null,
        data.address !== undefined ? JSON.stringify(data.address) : null,
        data.preferences !== undefined ? JSON.stringify(data.preferences) : null,
        data.job_title ?? null,
        data.phone ?? null,
        data.tax_id ?? null,
      ],
    );
  },
};