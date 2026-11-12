import { toBookingDto } from "../mappers";

describe("BookingDto contract", () => {
  it("maps snake_case DB row to camelCase API fields required by payment-service", () => {
    const dto = toBookingDto({
      id: "11111111-1111-1111-1111-111111111111",
      tenant_id: "22222222-2222-2222-2222-222222222222",
      room_type_id: "33333333-3333-3333-3333-333333333333",
      guest_user_id: "44444444-4444-4444-4444-444444444444",
      check_in: "2026-11-01",
      check_out: "2026-11-03",
      rooms_count: 1,
      total_amount_ngn: "15000.00",
      status: "pending_payment",
      created_at: new Date().toISOString(),
    });
    expect(dto.guestUserId).toBe("44444444-4444-4444-4444-444444444444");
    expect(dto.tenantId).toBe("22222222-2222-2222-2222-222222222222");
    expect(dto.totalAmountNgn).toBe(15000);
    expect(dto.status).toBe("pending_payment");
  });
});
