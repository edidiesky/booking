import { query } from "@booking/shared";
import { sellerBookingConfirmedTemplate } from "../../templates/seller-booking-confirmed.template";
import { notificationRepository } from "../notification/notification.repository";
import { sellerNotificationRepository } from "./seller.notification.repository";
import { getDispatcher } from "../../infra/providers/notification.dispatcher";
import logger from "../../utils/logger";

export interface SellerBookingConfirmedInput {
  bookingId: string;
  bookingRef: string;
  tenantId: string;
  propertyName: string;
  roomTypeName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmountNgn: number;
  hostPayoutNgn?: number;
}

export async function notifySellerOnBookingConfirmed(
  input: SellerBookingConfirmedInput,
): Promise<void> {
  const {
    bookingId,
    bookingRef,
    tenantId,
    propertyName,
    roomTypeName,
    guestName,
    checkIn,
    checkOut,
    nights,
    totalAmountNgn,
    hostPayoutNgn,
  } = input;

  const owners = await query<{
    id: string;
    email: string;
    first_name: string;
  }>(
    `SELECT u.id, u.email, u.first_name
     FROM tenants t
     JOIN users u ON u.id = t.owner_user_id
     WHERE t.id = $1`,
    [tenantId],
  );

  const owner = owners[0];
  if (!owner?.email) {
    logger.warn("seller_notification_no_owner", {
      event: "seller_notification_no_owner",
      tenantId,
      bookingId,
    });
    return;
  }

  const { subject, html } = sellerBookingConfirmedTemplate({
    ownerFirstName: owner.first_name || "there",
    guestName,
    bookingRef,
    propertyName,
    roomTypeName,
    checkIn,
    checkOut,
    nights,
    totalAmountNgn,
    hostPayoutNgn,
    dashboardUrl: `${process.env.WEB_ORIGIN}/seller/bookings/${bookingId}`,
    supportUrl: `${process.env.WEB_ORIGIN}/support`,
  });

  await sellerNotificationRepository.create({
    tenantId,
    bookingId,
    type: "booking_confirmed",
    title: "New booking confirmed",
    body: `${guestName} booked ${propertyName} (${bookingRef}) for ${checkIn} → ${checkOut}.`,
  });

  const notification = await notificationRepository.create({
    type: "booking_confirmed",
    channel: "email",
    recipientEmail: owner.email,
    tenantId,
    userId: owner.id,
    subject,
    message: `Seller notification for ${bookingRef}`,
    metadata: { role: "seller", bookingId, bookingRef },
  });

  try {
    await getDispatcher().sendEmail(owner.email, subject, html);
    await notificationRepository.markSent(notification.id);
  } catch (err) {
    await notificationRepository.markFailed(
      notification.id,
      (err as Error).message,
    );
    throw err;
  }
}