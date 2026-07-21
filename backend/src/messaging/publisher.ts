import { requestContext } from "../context/requestContext";
import logger from "../utils/logger";
import { BookingStatus } from "../types";
import { EXCHANGES, getRabbitMQChannel, ROUTING_KEYS } from "./connection";

function publish(exchange: string, routingKey: string, payload: unknown): void {
  try {
    const channel = getRabbitMQChannel();
    const ctx = requestContext.get();
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: "application/json",
        timestamp: Date.now(),
        appId: "booking-platform",
        headers: {
          "x-request-id": ctx?.requestId ?? "",
          "x-tenant-id": ctx?.tenantId ?? "",
        },
      },
    );
  } catch (err) {
    logger.error("publish_failed", {
      event: "publish_failed",
      exchange,
      routingKey,
      error: (err as Error).message,
    });
  }
}

export interface BookingEventPayload {
  bookingId: string;
  bookingRef: string;
  tenantId: string;
  guestUserId: string;
  status: BookingStatus;
  propertyId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  reason?: string;
}

export interface PaymentEventPayload {
  bookingId: string;
  tenantId: string;
  guestUserId: string;
  amountNgn: number;
  transactionId: string;
  gateway: string;
}

export interface EscrowEventPayload {
  escrowId: string;
  bookingId: string;
  tenantId: string;
  hostPayoutNgn: number;
  refundAmountNgn?: number;
}

export interface NotifyBookingPayload {
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

export interface NotifyPaymentPayload {
 notificationId: string;
  guestEmail: string;
  guestName: string;
  bookingRef: string;
  amountNgn: number;
  gateway: string;
  transactionId: string;
  tenantId: string;
  bookingId: string;
  failureReason?: string;
  roomTypeName?: string;
}

export interface NotifyAuthOtpPayload {
  notificationId: string;
  email: string;
  firstName: string;
  phone?: string;
  otp: string;
}

export interface NotifyAuthRegisteredPayload {
  notificationId: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantName?: string;
  tenantSlug?: string;
  userType: string;
}

export interface NotifyEscrowPayload {
  notificationId: string;
  hostEmail: string;
  hostName: string;
  bookingRef: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  hostPayoutNgn: number;
  tenantId: string;
  refundAmountNgn?: number;
}

export interface BookingReceiptRequestedPayload {
  bookingId: string;
  bookingRef: string;
  propertyId: string;
  roomTypeId: string;
  guestUserId: string;
  totalAmountNgn: number;
  platformFeeNgn: number;
  transactionId: string;
  gateway: string;
  paidAt: string;
}


export interface RentalsRecordUpsertedPayload {
  ownerId: string;
  guestUserId: string;
  fullName: string;
  email: string;
  phone: string;
}
export function publishBookingCreated(p: BookingEventPayload): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CREATED, p);
}
export function publishBookingConfirmed(p: BookingEventPayload): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CONFIRMED, p);
}
export function publishBookingCancelled(p: BookingEventPayload): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CANCELLED, p);
}
export function publishBookingCheckedIn(p: BookingEventPayload): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CHECKED_IN, p);
}
export function publishBookingCheckedOut(p: BookingEventPayload): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CHECKED_OUT, p);
}
export function publishPaymentConfirmed(p: PaymentEventPayload): void {
  publish(EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_CONFIRMED, p);
}
export function publishPaymentFailed(p: PaymentEventPayload): void {
  publish(EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_FAILED, p);
}
export function publishPaymentInitiated(p: PaymentEventPayload): void {
  publish(EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_INITIATED, p);
}
export function publishEscrowReleased(p: EscrowEventPayload): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.ESCROW_RELEASED, p);
}
export function publishEscrowRefunded(p: EscrowEventPayload): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.ESCROW_REFUNDED, p);
}

export function publishNotifyBookingConfirmed(p: NotifyBookingPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED, p);
}
export function publishNotifyBookingCancelled(p: NotifyBookingPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED, p);
}
export function publishNotifyBookingCheckedIn(p: NotifyBookingPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN, p);
}
export function publishNotifyBookingCheckedOut(p: NotifyBookingPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT, p);
}
export function publishNotifyPaymentConfirmed(p: NotifyPaymentPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED, p);
}
export function publishNotifyPaymentFailed(p: NotifyPaymentPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_PAYMENT_FAILED, p);
}
export function publishNotifyAuthOtp(p: NotifyAuthOtpPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_AUTH_OTP, p);
}
export function publishNotifyAuthRegistered(
  p: NotifyAuthRegisteredPayload,
): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_AUTH_REGISTERED, p);
}
export function publishNotifyEscrowReleased(p: NotifyEscrowPayload): void {
  publish(EXCHANGES.NOTIFICATION, ROUTING_KEYS.NOTIFY_ESCROW_RELEASED, p);
}

export function publishBookingReceiptRequested(
  p: BookingReceiptRequestedPayload,
): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_RECEIPT_REQUESTED, p);
}

export function publishRentalsRecordUpserted(
  p: RentalsRecordUpsertedPayload,
): void {
  publish(EXCHANGES.BOOKING, ROUTING_KEYS.RENTERS_RECORED_UPSERTED, p);
}
