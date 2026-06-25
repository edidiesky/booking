import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";
import { Booking } from "../../domains/booking/booking.repository";
import { Payment } from "../../domains/payment/payment.repository";

export function makeJwt(overrides: Partial<{
  userId:   string;
  userType: string;
  email:    string;
  name:     string;
  tenantId: string;
}> = {}): string {
  const payload = {
    userId:   overrides.userId   ?? uuid(),
    userType: overrides.userType ?? "guest",
    email:    overrides.email    ?? "guest@test.com",
    name:     overrides.name     ?? "Test User",
    tenantId: overrides.tenantId ?? undefined,
  };
  return jwt.sign(
    { user: payload },
    process.env["JWT_SECRET"] ?? "test-jwt-secret-at-least-32-chars-long",
    { expiresIn: 900, issuer: "booking-platform", audience: "booking-client" }
  );
}

export function makeGuestToken(userId = uuid()): string {
  return makeJwt({ userId, userType: "guest" });
}

export function makeHostToken(userId = uuid(), tenantId = uuid()): string {
  return makeJwt({ userId, userType: "host:admin", tenantId });
}

export function makePlatformAdminToken(userId = uuid()): string {
  return makeJwt({ userId, userType: "platform:admin" });
}

export const TENANT_ID  = uuid();
export const GUEST_ID   = uuid();
export const HOST_ID    = uuid();
export const PROPERTY_ID = uuid();
export const ROOM_TYPE_ID = uuid();
export const BOOKING_ID  = uuid();
export const PAYMENT_ID  = uuid();

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id:               overrides.id              ?? BOOKING_ID,
    booking_ref:      overrides.booking_ref     ?? "BK-TEST-001",
    tenant_id:        overrides.tenant_id       ?? TENANT_ID,
    property_id:      overrides.property_id     ?? PROPERTY_ID,
    room_type_id:     overrides.room_type_id    ?? ROOM_TYPE_ID,
    guest_user_id:    overrides.guest_user_id   ?? GUEST_ID,
    rooms_count:      overrides.rooms_count     ?? 1,
    check_in:         overrides.check_in        ?? "2025-12-01",
    check_out:        overrides.check_out       ?? "2025-12-03",
    nights:           overrides.nights          ?? 2,
    guest_count:      overrides.guest_count     ?? 2,
    total_amount_ngn: overrides.total_amount_ngn ?? 100000,
    platform_fee_ngn: overrides.platform_fee_ngn ?? 10000,
    host_payout_ngn:  overrides.host_payout_ngn  ?? 90000,
    status:           overrides.status           ?? "pending_payment",
    metadata:         overrides.metadata         ?? { sessionId: uuid() },
    special_requests: overrides.special_requests,
    cancellation_reason: overrides.cancellation_reason,
    cancelled_at:     overrides.cancelled_at,
    created_at:       overrides.created_at      ?? new Date(),
    updated_at:       overrides.updated_at      ?? new Date(),
  };
}

export function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id:              overrides.id              ?? PAYMENT_ID,
    booking_id:      overrides.booking_id      ?? BOOKING_ID,
    tenant_id:       overrides.tenant_id       ?? TENANT_ID,
    guest_user_id:   overrides.guest_user_id   ?? GUEST_ID,
    gateway:         overrides.gateway         ?? "paystack",
    transaction_id:  overrides.transaction_id  ?? `ref_${uuid()}`,
    amount_ngn:      overrides.amount_ngn      ?? 100000,
    status:          overrides.status          ?? "pending",
    idempotency_key: overrides.idempotency_key ?? `pay:${BOOKING_ID}:paystack`,
    metadata:        overrides.metadata        ?? {},
    created_at:      overrides.created_at      ?? new Date(),
    updated_at:      overrides.updated_at      ?? new Date(),
  };
}
