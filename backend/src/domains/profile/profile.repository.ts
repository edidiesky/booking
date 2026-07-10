import { PoolClient } from "pg";
import { queryOne } from "@booking/shared";

export interface Profile {
  id:           string;
  user_id:      string;
  display_name?: string;
  bio?:         string;
  avatar_url?:  string;
  address:      Record<string, unknown>;
  preferences:  Record<string, unknown>;
  created_at:   Date;
  updated_at:   Date;
}

export const profileRepository = {
  async create(data: {
    userId:       string;
    displayName?: string;
  }, client?: PoolClient): Promise<Profile> {
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
    return queryOne<Profile>(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
  },

  async update(userId: string, data: Partial<Pick<Profile, "display_name" | "bio" | "avatar_url" | "address" | "preferences">>): Promise<Profile | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(data.display_name); }
    if (data.bio          !== undefined) { fields.push(`bio = $${idx++}`);           values.push(data.bio); }
    if (data.avatar_url   !== undefined) { fields.push(`avatar_url = $${idx++}`);    values.push(data.avatar_url); }
    if (data.address      !== undefined) { fields.push(`address = $${idx++}::jsonb`); values.push(JSON.stringify(data.address)); }
    if (data.preferences  !== undefined) { fields.push(`preferences = $${idx++}::jsonb`); values.push(JSON.stringify(data.preferences)); }

    if (!fields.length) return null;
    fields.push("updated_at = now()");
    values.push(userId);

    return queryOne<Profile>(
      `UPDATE profiles SET ${fields.join(", ")} WHERE user_id = $${idx} RETURNING *`,
      values
    );
  },
};
