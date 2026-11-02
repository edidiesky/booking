/**
 * RLS under booking_app — proves INSERT policies, not superuser bypass.
 *
 * Requires:
 * - migrations applied (including roles + RLS on room_types)
 * - ability to SET ROLE booking_app and set_config app.current_tenant_id
 *
 * Skip if roles were not provisioned in the test DB image.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

describe("RLS room_types as booking_app", () => {
  let pool: Pool;
  let hasRole = false;

  beforeAll(async () => {
    if (!DATABASE_URL) return;
    pool = new Pool({ connectionString: DATABASE_URL });
    const r = await pool.query(
      `SELECT 1 FROM pg_roles WHERE rolname = 'booking_app'`,
    );
    hasRole = r.rowCount === 1;
  });

  it("INSERT fails without tenant GUC", async () => {
    if (!hasRole) return;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE booking_app");
      // no set_config
      await expect(
        client.query(
          `INSERT INTO room_types (id, property_id, tenant_id, name, quantity, base_price_ngn)
           VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'x', 1, 1000)`,
        ),
      ).rejects.toThrow(/row-level security|policy/i);
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  });

  it("INSERT succeeds with matching tenant GUC and owned property", async () => {
    if (!hasRole) return;
    // Seed tenant + property as superuser, then insert room_type as booking_app
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const tenant = await client.query(
        `INSERT INTO tenants (id, name, slug, status)
         VALUES (gen_random_uuid(), 'RLS Test', 'rls-test-' || substr(md5(random()::text),1,8), 'active')
         RETURNING id`,
      );
      const tenantId = tenant.rows[0].id;
      const prop = await client.query(
        `INSERT INTO properties (id, tenant_id, name, status)
         VALUES (gen_random_uuid(), $1, 'P', 'active')
         RETURNING id`,
        [tenantId],
      );
      const propertyId = prop.rows[0].id;

      await client.query("SET LOCAL ROLE booking_app");
      await client.query(
        `SELECT set_config('app.current_tenant_id', $1, true)`,
        [tenantId],
      );
      const rt = await client.query(
        `INSERT INTO room_types (id, property_id, tenant_id, name, quantity, base_price_ngn)
         VALUES (gen_random_uuid(), $1, $2, 'Deluxe', 2, 25000)
         RETURNING id`,
        [propertyId, tenantId],
      );
      expect(rt.rows[0].id).toBeTruthy();
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  });
});
