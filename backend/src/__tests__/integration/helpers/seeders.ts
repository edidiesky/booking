import { query } from "@booking/shared";
import { v4 as uuid } from "uuid";

export async function seedTenant(overrides: { id?: string } = {}) {
  const id = overrides.id ?? uuid();
  const rows = await query(
    `INSERT INTO tenants (id, slug, name, owner_user_id, platform_fee_pct, status)
     VALUES ($1, $2, $3, $4, 10, 'active') RETURNING *`,
    [id, `test-${id.slice(0, 8)}`, "Test Tenant", uuid()],
  );
  return rows[0] as { id: string };
}

export async function seedProperty(input: { tenantId: string }) {
  const id = uuid();
  const rows = await query(
    `INSERT INTO properties (id, tenant_id, name, property_type, address, check_in_time, check_out_time, status)
     VALUES ($1, $2, 'Test Property', 'hotel', $3, '14:00', '11:00', 'active') RETURNING *`,
    [id, input.tenantId, JSON.stringify({ street: "1 Test St", city: "Lagos", state: "Lagos", country: "Nigeria" })],
  );
  return rows[0] as { id: string };
}

export async function seedRoomType(input: { propertyId: string; tenantId: string }) {
  const id = uuid();
  const rows = await query(
    `INSERT INTO room_types (id, property_id, tenant_id, name, max_occupancy, base_price_ngn, quantity, status)
     VALUES ($1, $2, $3, 'Standard Room', 2, 50000, 5, 'active') RETURNING *`,
    [id, input.propertyId, input.tenantId],
  );
  return rows[0] as { id: string };
}