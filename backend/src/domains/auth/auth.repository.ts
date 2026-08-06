import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
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
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  login_with_pin_enabled: boolean;
  country_code?:     string;
  pin_hash?:         string;
  last_active_at?:   Date;
  created_at:        Date;
  updated_at:        Date;
  google_id?: string;
  two_factor_secret?: string | null;
  two_factor_backup_codes?: string[] | null;
}

export type UserWithoutHash = Omit<User, "password_hash" | "pin_hash">;

const SELECT_WITHOUT_HASH = `
  id, email, phone, first_name, last_name, profile_image,
  user_type, tenant_id, status, is_email_verified, is_phone_verified,
  two_factor_enabled, login_with_pin_enabled, country_code,
  last_active_at, created_at, updated_at
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

  async findByIdWithSecrets(id: string): Promise<User | null> {
    return queryOne<User>(`SELECT * FROM users WHERE id = $1`, [id]);
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
      | "is_phone_verified" | "two_factor_enabled" | "pin_hash"
      | "login_with_pin_enabled" | "country_code"
      | "two_factor_secret" | "two_factor_backup_codes" | "google_id"
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

  // Deliberately separate from updateById: password_hash isn't in that
  // method's allowlist, so a caller can't accidentally overwrite it via a
  // generic partial-update call, this is the one explicit path for it.
  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [passwordHash, id],
    );
  },

  async emailExists(email: string): Promise<boolean> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users WHERE email = lower(trim($1))`, [email]
    );
    return parseInt(row?.count ?? "0", 10) > 0;
  },
  async findByGoogleId(googleId: string): Promise<User | null> {
    return queryOne<User>(`SELECT * FROM users WHERE google_id = $1`, [googleId]);
  },

  async listByType(userType: UserType, page = 1, limit = 20): Promise<User[]> {
  const offset = (page - 1) * limit;
  return query<User>(
    `SELECT * FROM users WHERE user_type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userType, limit, offset],
  );
},

async countByType(userType: UserType): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) AS count FROM users WHERE user_type = $1`,
    [userType],
  );
  return parseInt(row?.count ?? "0", 10);
},

async updateUserType(userId: string, userType: UserType): Promise<User | null> {
  return queryOne<User>(
    `UPDATE users SET user_type = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [userType, userId],
  );
},
};