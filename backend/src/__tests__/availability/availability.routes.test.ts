import request from "supertest";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { app } from "../../app";
import {
  makeGuestToken,
  makeHostToken,
  TENANT_ID,
  GUEST_ID,
  HOST_ID,
  PROPERTY_ID,
  ROOM_TYPE_ID,
} from "../setup/fixtures";

jest.mock("../../domains/property/property.repository");
jest.mock("../../domains/availability/availability.repository");
jest.mock("../../domains/tenant/tenant.repository");

import { propertyRepository }    from "../../domains/property/property.repository";
import { availabilityRepository } from "../../domains/availability/availability.repository";
import { tenantRepository }      from "../../domains/tenant/tenant.repository";

const mockPropertyRepo     = propertyRepository    as jest.Mocked<typeof propertyRepository>;
const mockAvailabilityRepo = availabilityRepository as jest.Mocked<typeof availabilityRepository>;
const mockTenantRepo       = tenantRepository      as jest.Mocked<typeof tenantRepository>;

const GUEST_TOKEN = makeGuestToken(GUEST_ID);
const HOST_TOKEN  = makeHostToken(HOST_ID, TENANT_ID);
const TENANT_SLUG = "test-hotel";

const MOCK_PROPERTY = {
  id: PROPERTY_ID, tenant_id: TENANT_ID, name: "Grand Hotel",
  description: "A great hotel", property_type: "hotel" as const,
  address: { street: "1 Main St", city: "Lagos", state: "Lagos", country: "Nigeria" },
  amenities: ["wifi", "pool"], images: [], check_in_time: "14:00", check_out_time: "11:00",
  status: "active" as const, created_at: new Date(), updated_at: new Date(),
};

const MOCK_ROOM_TYPE = {
  id: ROOM_TYPE_ID, property_id: PROPERTY_ID, tenant_id: TENANT_ID,
  name: "Deluxe Room", description: "Spacious room",
  max_occupancy: 2, base_price_ngn: 50000,
  images: [], amenities: [], quantity: 5,
  status: "active" as const, created_at: new Date(), updated_at: new Date(),
};

function mockActiveTenant() {
  mockTenantRepo.findBySlug.mockResolvedValue({
    id: TENANT_ID, slug: TENANT_SLUG, name: "Test Hotel",
    owner_user_id: HOST_ID, platform_fee_pct: 10,
    cancellation_policy: [], status: "active",
    settings: { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
    created_at: new Date(), updated_at: new Date(),
  });
  jest.spyOn(mockTenantRepo, 'findById').mockImplementation(() => Promise.resolve({
    id: TENANT_ID, slug: TENANT_SLUG, name: "Test Hotel",
    owner_user_id: HOST_ID, platform_fee_pct: 10,
    cancellation_policy: [], status: "active",
    settings: { timezone: "Africa/Lagos", currency: "NGN", locale: "en-NG" },
    created_at: new Date(), updated_at: new Date(),
  }));
}

describe("POST /api/v1/properties", () => {
  const validBody = {
    name:         "Grand Hotel",
    propertyType: "hotel",
    address:      { street: "1 Main", city: "Lagos", state: "Lagos", country: "Nigeria" },
  };

  beforeEach(() => {
    mockActiveTenant();
    mockPropertyRepo.createProperty.mockResolvedValue(MOCK_PROPERTY);
  });

  it("201 host creates property", async () => {
    const res = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(PROPERTY_ID);
    expect(mockPropertyRepo.createProperty).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, name: "Grand Hotel" })
    );
  });

  it("403 guest cannot create property", async () => {
    const res = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${GUEST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it("400 rejects missing name", async () => {
    const res = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ propertyType: "hotel", address: validBody.address });

    expect(res.status).toBe(400);
  });

  it("400 rejects invalid propertyType", async () => {
    const res = await request(app)
      .post("/api/v1/properties")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ ...validBody, propertyType: "apartment" });

    expect(res.status).toBe(400);
  });

  it("401 rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/v1/properties")
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validBody);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/properties", () => {
  beforeEach(() => {
    mockActiveTenant();
    mockPropertyRepo.listProperties.mockResolvedValue([MOCK_PROPERTY]);
  });

  it("200 host lists their properties", async () => {
    const res = await request(app)
      .get("/api/v1/properties")
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(mockPropertyRepo.listProperties).toHaveBeenCalledWith(TENANT_ID, 1, 20);
  });
});

describe("GET /api/v1/properties/:propertyId", () => {
  beforeEach(() => {
    mockActiveTenant();
    mockPropertyRepo.findPropertyById.mockResolvedValue(MOCK_PROPERTY);
    mockPropertyRepo.listRoomTypes.mockResolvedValue([MOCK_ROOM_TYPE]);
  });

  it("200 public access to property with room types", async () => {
    const res = await request(app)
      .get(`/api/v1/properties/${PROPERTY_ID}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(PROPERTY_ID);
    expect(res.body.data.roomTypes).toHaveLength(1);
  });

  it("404 property not found", async () => {
    mockPropertyRepo.findPropertyById.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/v1/properties/${PROPERTY_ID}`)
      .set("x-tenant-slug", TENANT_SLUG);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/properties/:propertyId/room-types", () => {
  const validRoomTypeBody = {
    name: "Deluxe Room", maxOccupancy: 2, basePriceNgn: 50000, quantity: 5,
  };

  beforeEach(() => {
    mockActiveTenant();
    mockPropertyRepo.findPropertyById.mockResolvedValue(MOCK_PROPERTY);
    mockPropertyRepo.createRoomType.mockResolvedValue(MOCK_ROOM_TYPE);
  });

  it("201 creates room type for property", async () => {
    const res = await request(app)
      .post(`/api/v1/properties/${PROPERTY_ID}/room-types`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validRoomTypeBody);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(ROOM_TYPE_ID);
  });

  it("400 rejects zero basePriceNgn", async () => {
    const res = await request(app)
      .post(`/api/v1/properties/${PROPERTY_ID}/room-types`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ ...validRoomTypeBody, basePriceNgn:100 });

    expect(res.status).toBe(400);
  });

  it("404 property not found for tenant", async () => {
    mockPropertyRepo.findPropertyById.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/v1/properties/${PROPERTY_ID}/room-types`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send(validRoomTypeBody);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/properties/room-types/:roomTypeId/availability", () => {
  beforeEach(() => {
    mockActiveTenant();
    mockAvailabilityRepo.getAvailability.mockResolvedValue([
      { id: "slot-1", room_type_id: ROOM_TYPE_ID, tenant_id: TENANT_ID,
        date: "2025-12-01", available_count: 3, price_override_ngn: null, is_blocked: false },
      { id: "slot-2", room_type_id: ROOM_TYPE_ID, tenant_id: TENANT_ID,
        date: "2025-12-02", available_count: 3, price_override_ngn: null, is_blocked: false },
    ]);
  });

  it("200 returns availability slots for date range", async () => {
    const res = await request(app)
      .get(`/api/v1/properties/room-types/${ROOM_TYPE_ID}/availability`)
      .set("x-tenant-slug", TENANT_SLUG)
      .query({ checkIn: "2025-12-01", checkOut: "2025-12-03" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(mockAvailabilityRepo.getAvailability).toHaveBeenCalledWith(ROOM_TYPE_ID, "2025-12-01", "2025-12-03");
  });

  it("400 rejects missing checkIn param", async () => {
    const res = await request(app)
      .get(`/api/v1/properties/room-types/${ROOM_TYPE_ID}/availability`)
      .set("x-tenant-slug", TENANT_SLUG)
      .query({ checkOut: "2025-12-03" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/properties/room-types/:roomTypeId/calendar", () => {
  beforeEach(() => {
    mockActiveTenant();
    mockPropertyRepo.findRoomTypeById.mockResolvedValue(MOCK_ROOM_TYPE);
    mockAvailabilityRepo.seedCalendar.mockResolvedValue(undefined);
  });

  it("200 seeds calendar for room type", async () => {
    const res = await request(app)
      .post(`/api/v1/properties/room-types/${ROOM_TYPE_ID}/calendar`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ startDate: "2025-12-01", endDate: "2025-12-31" });

    expect(res.status).toBe(200);
    expect(mockAvailabilityRepo.seedCalendar).toHaveBeenCalledWith(
      expect.objectContaining({ roomTypeId: ROOM_TYPE_ID, startDate: "2025-12-01", endDate: "2025-12-31" })
    );
  });

  it("400 rejects invalid date format", async () => {
    const res = await request(app)
      .post(`/api/v1/properties/room-types/${ROOM_TYPE_ID}/calendar`)
      .set("Authorization", `Bearer ${HOST_TOKEN}`)
      .set("x-tenant-slug", TENANT_SLUG)
      .send({ startDate: "Dec 1 2025", endDate: "2025-12-31" });

    expect(res.status).toBe(400);
  });
});
