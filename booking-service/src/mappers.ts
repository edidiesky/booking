/** Map DB snake_case rows to API camelCase contracts. */
export function toBookingDto(row: Record<string, unknown>) {
  return {
    id: row.id,
    bookingId: row.id,
    tenantId: row.tenant_id,
    roomTypeId: row.room_type_id,
    guestUserId: row.guest_user_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    roomsCount: row.rooms_count,
    totalAmountNgn: Number(row.total_amount_ngn),
    status: row.status,
    createdAt: row.created_at,
  };
}
