import { query, redisClient, logger } from "@booking/shared";

const SSE_TENANT_CHANNEL = "sse:tenant_events";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

interface NotifyBookingPayload {
  notificationId: string;
  guestEmail: string;
  guestName: string;
  guestPhone?: string;
  bookingRef: string;
  propertyName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmountNgn: number;
  tenantId: string;
  bookingId: string;
  reason?: string;
}

async function insertAndPush(
  tenantId: string,
  bookingId: string,
  type: "booking_confirmed" | "booking_checked_in" | "booking_checked_out",
  title: string,
  body: string,
): Promise<void> {
  const row = await query<{ id: string; created_at: Date }>(
    `INSERT INTO seller_notifications (tenant_id, booking_id, type, title, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [tenantId, bookingId, type, title, body],
  );

  await redisClient.publish(SSE_TENANT_CHANNEL, JSON.stringify({
    tenantId,
    event: {
      type: "seller_notification",
      payload: { id: row[0]?.id, type, title, body, bookingId, createdAt: row[0]?.created_at, isRead: false },
    },
  }));

  logger.info("seller_notification_created", { event: "seller_notification_created", tenantId, bookingId, type });
}

export async function handleBookingConfirmed(data: unknown): Promise<void> {
  const e = data as NotifyBookingPayload;
  await insertAndPush(
    e.tenantId, e.bookingId, "booking_confirmed",
    "Payment received",
    `${e.guestName} paid for ${e.roomTypeName} at ${e.propertyName}, ${fmtDate(e.checkIn)} to ${fmtDate(e.checkOut)}. Ref ${e.bookingRef}.`,
  );
}

export async function handleBookingCheckedIn(data: unknown): Promise<void> {
  const e = data as NotifyBookingPayload;
  await insertAndPush(
    e.tenantId, e.bookingId, "booking_checked_in",
    "Guest checked in",
    `${e.guestName} checked in to ${e.roomTypeName} at ${e.propertyName}. Ref ${e.bookingRef}.`,
  );
}

export async function handleBookingCheckedOut(data: unknown): Promise<void> {
  const e = data as NotifyBookingPayload;
  await insertAndPush(
    e.tenantId, e.bookingId, "booking_checked_out",
    "Guest checked out",
    `${e.guestName} checked out of ${e.roomTypeName} at ${e.propertyName}. Escrow released. Ref ${e.bookingRef}.`,
  );
}