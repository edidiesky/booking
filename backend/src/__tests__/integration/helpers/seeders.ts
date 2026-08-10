import { query, queryOne } from "@booking/shared";
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

export async function seedUser(overrides: { email?: string; userType?: string } = {}) {
  const id = uuid();
  const email = overrides.email ?? `test-${id.slice(0, 8)}@example.com`;
  const passwordHash = "$2b$10$lcYAMbfTfbwhxg/ZRLtwlOWxVuwyFcb5USASKPtz9ZoDs0O6UhibW";
  const rows = await query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, user_type, status, is_email_verified)
     VALUES ($1, $2, $3, 'Test', 'User', $4, 'active', true) RETURNING *`,
    [id, email, passwordHash, overrides.userType ?? "guest"],
  );
  return rows[0] as { id: string; email: string };
}

export async function seedPlatformAdmin() {
  const user = await seedUser({ userType: "platform:admin" });
  const role = await queryOne<{ id: string }>(
    `SELECT id FROM roles WHERE slug = 'platform:admin' AND tenant_id IS NULL`,
  );
  if (!role) {
    throw new Error("platform:admin role not seeded, run seedService.seedAll() against the test DB first.");
  }
  await query(
    `INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by) VALUES ($1, NULL, $2, 'test-seed')`,
    [user.id, role.id],
  );
  return user;
}


export async function seedBooking(input: {
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  guestUserId: string;
  status?: string;
  totalAmountNgn?: number;
}) {
  const id = uuid();
  const rows = await query(
    `INSERT INTO bookings (
       id, booking_ref, tenant_id, property_id, room_type_id, guest_user_id, status,
       check_in, check_out, rooms_count, guest_count,
       total_amount_ngn, platform_fee_ngn, host_payout_ngn
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, '2099-01-15', '2099-01-17', 1, 2, $8, $9, $10)
     RETURNING *`,
    [
      id, `BK-TEST-${id.slice(0, 6)}`, input.tenantId, input.propertyId, input.roomTypeId, input.guestUserId,
      input.status ?? "pending_payment",
      input.totalAmountNgn ?? 50000,
      (input.totalAmountNgn ?? 50000) * 0.1,
      (input.totalAmountNgn ?? 50000) * 0.9,
    ],
  );
  return rows[0] as { id: string; booking_ref: string };
}

export async function seedPendingInvitation(input: {
  tenantId: string;
  roleId: string;
  email: string;
  invitedBy: string;
}) {
  const id = uuid();
  const codeHash = "$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ";
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const rows = await query(
    `INSERT INTO invitations (id, tenant_id, role_id, email, code_hash, invited_by, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
    [id, input.tenantId, input.roleId, input.email, codeHash, input.invitedBy, expiresAt],
  );
  return rows[0] as { id: string; email: string };
}