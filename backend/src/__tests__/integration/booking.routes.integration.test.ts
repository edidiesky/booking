import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { seedTenant, seedProperty, seedRoomType } from "./helpers/seeders";
import buildApp from "./helpers/buildApp";
import { makeGuestToken } from "../setup/fixtures";

const app = buildApp();

describe("POST /api/v1/bookings", () => {
  it("creates a real row in the database and returns pending_payment", async () => {
    const tenant = await seedTenant();
    const property = await seedProperty({ tenantId: tenant.id });
    const roomType = await seedRoomType({
      propertyId: property.id,
      tenantId: tenant.id,
    });
    const token = makeGuestToken();

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        propertyId: property.id,
        roomTypeId: roomType.id,
        checkIn: "2099-01-15",
        checkOut: "2099-01-17",
        roomsCount: 1,
        guestCount: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending_payment");
  });

  it("400s when checkOut is before checkIn, against real validation, not a mock", async () => {
    const token = makeGuestToken();

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        propertyId: "x",
        roomTypeId: "y",
        checkIn: "2099-01-17",
        checkOut: "2099-01-15",
        roomsCount: 1,
        guestCount: 1,
      });

    expect(res.status).toBe(400);
  });
});
