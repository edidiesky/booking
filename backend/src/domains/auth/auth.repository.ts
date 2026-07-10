import { PoolClient } from "pg";
import { queryOne } from "@booking/shared";
import { UserType, UserStatus } from "../../types";
import { trackError } from "../../utils/metrics";

export interface User {
  id:                string;
  email:             string;
  phone?:            string;
  password_hash:     string;
  first_name?:       string;
  last_name?:        string;
  profile_image?:    string;
  user_type:         UserType;
  tenant_id?:        string;
  status:            UserStatus;
  is_email_verified: boolean;
  last_active_at?:   Date;
  created_at:        Date;
  updated_at:        Date;
}

export type UserWithoutHash = Omit<User, "password_hash">;

const SELECT_WITHOUT_HASH = `
  id, email, phone, first_name, last_name, profile_image,
  user_type, tenant_id, status, is_email_verified, last_active_at,
  created_at, updated_at
`;

export const userRepository = {
  async findByEmail(email: string, client?: PoolClient): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE email = lower(trim($1)) LIMIT 1`;
    if (client) {
      return (await client.query(sql, [email])).rows[0] as User | null ?? null;
    }
    return queryOne<User>(sql, [email]);
  },

  async findById(id: string): Promise<UserWithoutHash | null> {
    return queryOne<UserWithoutHash>(
      `SELECT ${SELECT_WITHOUT_HASH} FROM users WHERE id = $1`, [id]
    );
  },

  async create(data: {
    email:        string;
    passwordHash: string;
    userType:     UserType;
    firstName?:   string;
    lastName?:    string;
    phone?:       string;
    tenantId?:    string;
  }, client?: PoolClient): Promise<UserWithoutHash> {
    const sql = `
      INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone, tenant_id, is_email_verified)
      VALUES (lower(trim($1)), $2, $3, $4, $5, $6, $7, false)
      RETURNING ${SELECT_WITHOUT_HASH}`;
    const params = [
      data.email, data.passwordHash, data.userType,
      data.firstName ?? null, data.lastName ?? null,
      data.phone ?? null, data.tenantId ?? null,
    ];

    try {
      if (client) {
        return (await client.query(sql, params)).rows[0] as UserWithoutHash;
      }
      return (await queryOne<UserWithoutHash>(sql, params))!;
    } catch (err) {
      trackError("user_create_failed", "user_repository", "high");
      throw err;
    }
  },

  async updateById(
    id:     string,
    update: Partial<Pick<User,
      "status" | "is_email_verified" | "first_name" | "last_name"
      | "phone" | "profile_image" | "last_active_at" | "tenant_id"
    >>,
    client?: PoolClient
  ): Promise<UserWithoutHash | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(update)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (!fields.length) return null;
    fields.push("updated_at = now()");
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}
                 RETURNING ${SELECT_WITHOUT_HASH}`;

    if (client) return (await client.query(sql, values)).rows[0] as UserWithoutHash | null ?? null;
    return queryOne<UserWithoutHash>(sql, values);
  },

  async emailExists(email: string): Promise<boolean> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users WHERE email = lower(trim($1))`, [email]
    );
    return parseInt(row?.count ?? "0", 10) > 0;
  },
};
