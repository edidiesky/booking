  import { randomUUIDv7 } from "crypto";
  import { User } from "../../domains/auth/auth.repository";
  import { Property, RoomType } from "../../domains/property/property.repository";
  import { Tenant } from "../../domains/tenant/tenant.repository";


  import jwt from "jsonwebtoken";


  export const USER_ID = randomUUIDv7();
  export const PROPERTY_ID = randomUUIDv7();
  export const ROOM_TYPE_ID = randomUUIDv7();
  export const TENANT_ID = randomUUIDv7();

  export function makeJwt(overrides: Partial<{ userId: string; userType: string; tenantId: string | null; name: string }> = {}): string {
    const payload = {
      userId: overrides.userId ?? randomUUIDv7(),
      userType: overrides.userType ?? "guest",
      tenantId: overrides.tenantId ?? null,
      name: overrides.name ?? "Test User",
    };
    return jwt.sign(payload, process.env.JWT_CODE ?? "test-secret", { expiresIn: "15m" });
  }

  export function makeGuestToken(userId = randomUUIDv7()): string {
    return makeJwt({ userId, userType: "guest" });
  }

export function makeHostToken(userId: string = randomUUIDv7(), tenantId: string = randomUUIDv7()): string {
    return makeJwt({ userId, userType: "host:admin", tenantId });
  }

  export function makePlatformAdminToken(userId = randomUUIDv7()): string {
    return makeJwt({ userId, userType: "platform:admin" });
  }

  export function makeUser(overrides: Partial<User> = {}): User {
    return {
      id:                      overrides.id                      ?? USER_ID,
      email:                   overrides.email                   ?? "guest@test.com",
      phone:                   overrides.phone,
      password_hash:           overrides.password_hash           ?? "$2b$10$fakehashfakehashfakehashfakehashfakehashfake",
      first_name:              overrides.first_name               ?? "Test",
      last_name:               overrides.last_name                ?? "User",
      profile_image:           overrides.profile_image,
      user_type:               overrides.user_type                ?? "guest",
      tenant_id:                overrides.tenant_id,
      status:                  overrides.status                   ?? "active",
      is_email_verified:       overrides.is_email_verified        ?? true,
      is_phone_verified:       overrides.is_phone_verified        ?? false,
      two_factor_enabled:      overrides.two_factor_enabled       ?? false,
      two_factor_secret:       overrides.two_factor_secret,
      two_factor_backup_codes: overrides.two_factor_backup_codes,
      google_id:               overrides.google_id,
      login_with_pin_enabled:  overrides.login_with_pin_enabled   ?? false,
      country_code:            overrides.country_code,
      pin_hash:                overrides.pin_hash,
      last_active_at:          overrides.last_active_at,
      created_at:              overrides.created_at               ?? new Date(),
      updated_at:              overrides.updated_at               ?? new Date(),
    };
  }



  export function makeProperty(overrides: Partial<Property> = {}): Property {
    return {
      id:               overrides.id               ?? PROPERTY_ID,
      tenant_id:        overrides.tenant_id         ?? TENANT_ID,
      name:             overrides.name              ?? "Test Property",
      description:      overrides.description,
      property_type:    overrides.property_type     ?? "hotel",
      address:          overrides.address           ?? { street: "1 Test St", city: "Lagos", state: "Lagos", country: "Nigeria" },
      amenities:        overrides.amenities         ?? [],
      images:           overrides.images            ?? [],
      check_in_time:    overrides.check_in_time     ?? "14:00",
      check_out_time:   overrides.check_out_time    ?? "11:00",
      latitude:         overrides.latitude,
      longitude:        overrides.longitude,
      room_sort_mode:   overrides.room_sort_mode,
      status:           overrides.status            ?? "active",
      created_at:       overrides.created_at        ?? new Date(),
      updated_at:       overrides.updated_at        ?? new Date(),
    };
  }

  export function makeRoomType(overrides: Partial<RoomType> = {}): RoomType {
    return {
      id:              overrides.id              ?? ROOM_TYPE_ID,
      property_id:     overrides.property_id     ?? PROPERTY_ID,
      tenant_id:       overrides.tenant_id       ?? TENANT_ID,
      name:            overrides.name            ?? "Deluxe Room",
      description:     overrides.description,
      max_occupancy:   overrides.max_occupancy   ?? 2,
      base_price_ngn:  overrides.base_price_ngn  ?? 50000,
      quantity:        overrides.quantity        ?? 5,
      images:          overrides.images          ?? [],
      amenities:       overrides.amenities       ?? [],
      status:          overrides.status          ?? "active",
      created_at:      overrides.created_at      ?? new Date(),
      updated_at:      overrides.updated_at      ?? new Date(),
    };
  }

  export function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
    return {
      id:                  overrides.id                  ?? TENANT_ID,
      slug:                overrides.slug                ?? "grand-hotel",
      name:                overrides.name                ?? "Grand Hotel",
      owner_user_id:       overrides.owner_user_id        ?? "host-id",
      platform_fee_pct:    overrides.platform_fee_pct     ?? 10,
      cancellation_policy: overrides.cancellation_policy  ?? [],
      status:              overrides.status               ?? "active",
      settings:            overrides.settings             ?? { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
      created_at:          overrides.created_at           ?? new Date(),
      updated_at:          overrides.updated_at           ?? new Date(),
    };
  }