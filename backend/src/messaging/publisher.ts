import { getRabbitMQChannel, EXCHANGES, ROUTING_KEYS } from "./connection";
import { requestContext } from "../context/requestContext";
import logger from "../utils/logger";
import { BookingStatus } from "../types";

function publish(exchange: string, routingKey: string, payload: unknown): void {
  try {
    const channel = getRabbitMQChannel();
    const ctx     = requestContext.get();
    channel.publish(
      exchange, routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent:  true,
        contentType: "application/json",
        timestamp:   Date.now(),
        appId:       "booking-platform",
        headers: {
          "x-request-id": ctx?.requestId ?? "",
          "x-tenant-id":  ctx?.tenantId  ?? "",
        },
      }
    );
  } catch (err) {
    logger.error("publish_failed", { event: "publish_failed", exchange, routingKey, error: (err as Error).message });
  }
}

export interface BookingEventPayload {
  bookingId:    string;
  bookingRef:   string;
  tenantId:     string;
  guestUserId:  string;
  status:       BookingStatus;
  propertyId:   string;
  roomTypeId:   string;
  checkIn:      string;
  checkOut:     string;
  totalAmount:  number;
  reason?:      string;
}

export interface PaymentEventPayload {
  bookingId:         string;
  tenantId:          string;
  guestUserId:       string;
  amountNgn:         number;
  transactionId:     string;
  gateway:           string;
}

export interface EscrowEventPayload {
  escrowId:        string;
  bookingId:       string;
  tenantId:        string;
  hostPayoutNgn:   number;
  refundAmountNgn?: number;
}

export function publishBookingCreated(p: BookingEventPayload):    void { publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CREATED,    p); }
export function publishBookingConfirmed(p: BookingEventPayload):  void { publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CONFIRMED,  p); }
export function publishBookingCancelled(p: BookingEventPayload):  void { publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CANCELLED,  p); }
export function publishBookingCheckedIn(p: BookingEventPayload):  void { publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CHECKED_IN, p); }
export function publishBookingCheckedOut(p: BookingEventPayload): void { publish(EXCHANGES.BOOKING, ROUTING_KEYS.BOOKING_CHECKED_OUT,p); }
export function publishPaymentConfirmed(p: PaymentEventPayload):  void { publish(EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_CONFIRMED,  p); }
export function publishPaymentFailed(p: PaymentEventPayload):     void { publish(EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_FAILED,     p); }
export function publishPaymentInitiated(p: PaymentEventPayload):  void { publish(EXCHANGES.PAYMENT, ROUTING_KEYS.PAYMENT_INITIATED,  p); }
export function publishEscrowReleased(p: EscrowEventPayload):     void { publish(EXCHANGES.BOOKING, ROUTING_KEYS.ESCROW_RELEASED,    p); }
export function publishEscrowRefunded(p: EscrowEventPayload):     void { publish(EXCHANGES.BOOKING, ROUTING_KEYS.ESCROW_REFUNDED,    p); }
