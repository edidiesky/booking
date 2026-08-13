import { v4 as uuid } from "uuid";
import { availabilityBroadcaster, outboxRepository, withTransaction } from "@booking/shared";
import { bookingRepository, Booking } from "./booking.repository";
import { availabilityRepository } from "../availability/availability.repository";
import { propertyRepository } from "../property/property.repository";
import { tenantRepository } from "../tenant/tenant.repository";
import { escrowRepository } from "../escrow/escrow.repository";
import { auditRepository } from "../audit/audit.repository";
import { sseService } from "../sse/sse.service";
import { redisClient } from "@booking/shared";
import { userRepository } from "../auth/auth.repository";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";
import { CancellationPolicyTier, BookingStatus } from "../../types";
import {
  bookingCreatedCounter,
  bookingConfirmedCounter,
  bookingCancelledCounter,
} from "../../utils/metrics";
import {
  publishNotifyBookingConfirmed,
  publishNotifyBookingCancelled,
  publishNotifyBookingCheckedIn,
  publishNotifyBookingCheckedOut,
} from "../../messaging/publisher";

export interface InitiateBookingInput {
  propertyId: string;
  roomTypeId: string;
  guestUserId: string;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  specialRequests?: string;
}

export interface BookingDto {
  bookingId: string;
  bookingRef: string;
  status: BookingStatus;
  guestUserId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomsCount: number;
  guestCount: number;
  totalAmountNgn: number;
  platformFeeNgn: number;
  hostPayoutNgn: number;
  propertyId: string;
  roomTypeId: string;
  tenantId: string;
  sessionId: string;
  specialRequests?: string;
  createdAt: Date;
  receiptUrl?: string;
  room_type_images?: string[];
  propertyName?: string;
  propertyCity?: string;
  roomTypeName?: string;
  roomTypeQuantity?: number;
  roomTypeImage?: string;
  guestFirstName?: string;
  guestLastName?: string;
}

export function toDto(
  b: Booking,
  sessionId = "",
  enrichment?: {
    propertyName?: string;
    propertyCity?: string;
    roomTypeName?: string;
    roomTypeImage?: string;
  },
): BookingDto {
  return {
    bookingId: b.id,
    bookingRef: b.booking_ref,
    status: b.status,
    guestUserId: b.guest_user_id,
    checkIn: b.check_in,
    checkOut: b.check_out,
    nights: b.nights,
    roomsCount: b.rooms_count,
    guestCount: b.guest_count,
    totalAmountNgn: Number(b.total_amount_ngn),
    platformFeeNgn: Number(b.platform_fee_ngn),
    hostPayoutNgn: Number(b.host_payout_ngn),
    propertyId: b.property_id,
    roomTypeId: b.room_type_id,
    tenantId: b.tenant_id,
    sessionId,
    specialRequests: b.special_requests,
    createdAt: b.created_at,
    // b is a raw pg row: the joins in listByTenant/listByGuest alias these
    // as property_name/property_city/room_type_name (snake_case), reading
    // b.propertyName/b.roomTypeName off that row was always undefined,
    // that's why these fields never showed up on the frontend. Falls back
    // to the explicit `enrichment` argument for call sites that pass it
    // separately instead of joining it onto the row.
    propertyName: b.property_name ?? enrichment?.propertyName,
    roomTypeImage: b.room_types_image?.[0] ?? enrichment?.roomTypeImage,
    receiptUrl: b.receipt_url ?? undefined,
    room_type_images: b.room_type_images ?? [],
    propertyCity: b.property_city ?? enrichment?.propertyCity,
    roomTypeName: b.room_type_name ?? enrichment?.roomTypeName,
    roomTypeQuantity: b.room_type_quantity,
    guestFirstName: b.guest_first_name,
    guestLastName: b.guest_last_name,
  };
}

function computeRefundAmount(
  totalPaid: number,
  cancellationPolicy: CancellationPolicyTier[],
  checkInDate: string,
): number {
  const hoursUntilCheckIn =
    (new Date(checkInDate).getTime() - Date.now()) / 3_600_000;
  const sorted = [...cancellationPolicy].sort(
    (a, b) => b.hours_before - a.hours_before,
  );
  for (const tier of sorted) {
    if (hoursUntilCheckIn >= tier.hours_before) {
      return parseFloat(((totalPaid * tier.refund_pct) / 100).toFixed(2));
    }
  }
  return 0;
}

async function resolveNotificationContext(booking: Booking): Promise<{
  guestEmail: string;
  guestName: string;
  guestPhone?: string;
  propertyName: string;
  roomTypeName: string;
}> {
  const [guest, property, roomType] = await Promise.all([
    userRepository.findById(booking.guest_user_id),
    propertyRepository.findPropertyById(booking.property_id),
    propertyRepository.findRoomTypeById(booking.room_type_id),
  ]);

  return {
    guestEmail: guest?.email ?? "",
    guestName:
      [guest?.first_name, guest?.last_name].filter(Boolean).join(" ") ||
      "Guest",
    guestPhone: undefined,
    propertyName: property?.name ?? "the property",
    roomTypeName: roomType?.name ?? "room",
  };
}

// Single source of truth for legal booking status transitions.
const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  refunded: [],
};

export const bookingService = {
  async initiateBooking(input: InitiateBookingInput): Promise<BookingDto> {
    const {
      propertyId,
      roomTypeId,
      guestUserId,
      roomsCount,
      checkIn,
      checkOut,
      guestCount,
      specialRequests,
    } = input;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const property = await propertyRepository.findPropertyById(propertyId);
    if (!property || property.status !== "active")
      throw AppError.notFound("Property not found or unavailable.");

    const tenantId = property.tenant_id;

    const [roomType, tenant] = await Promise.all([
      propertyRepository.findRoomTypeById(roomTypeId, tenantId),
      tenantRepository.findById(tenantId),
    ]);

    if (!roomType || roomType.status !== "active")
      throw AppError.notFound("Room type not found or unavailable.");
    if (roomType.property_id !== propertyId)
      throw AppError.badRequest("Room type does not belong to this property.");
    if (!tenant || tenant.status !== "active")
      throw AppError.notFound("Tenant not found.");
    if (roomsCount > roomType.quantity) {
      throw AppError.badRequest(
        `Cannot book more than ${roomType.quantity} rooms of this type.`,
      );
    }

    const sessionId = uuid();
    let booking!: Booking;

    await withTransaction(async (client) => {
      const available = await availabilityRepository.isAvailable(
        roomTypeId,
        checkIn,
        checkOut,
        roomsCount,
        client,
      );
      if (!available)
        throw AppError.conflict(
          "Selected dates are not available for the requested rooms.",
        );

      await availabilityRepository.acquireLock(
        { roomTypeId, checkIn, checkOut, roomsHeld: roomsCount, sessionId },
        client,
      );

      const nights = Math.round(
        (checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000,
      );
      const pricePerNight = Number(roomType.base_price_ngn);
      const totalAmount = parseFloat(
        (pricePerNight * nights * roomsCount).toFixed(2),
      );
      const platformFee = parseFloat(
        ((totalAmount * Number(tenant.platform_fee_pct)) / 100).toFixed(2),
      );
      const hostPayout = parseFloat((totalAmount - platformFee).toFixed(2));

      booking = await bookingRepository.create(
        {
          tenantId,
          propertyId,
          roomTypeId,
          guestUserId,
          roomsCount,
          checkIn,
          checkOut,
          guestCount,
          totalAmountNgn: totalAmount,
          platformFeeNgn: platformFee,
          hostPayoutNgn: hostPayout,
          specialRequests,
          metadata: { sessionId, lockAcquiredAt: new Date().toISOString() },
        },
        client,
      );

      await outboxRepository.create(
        "booking.created",
        {
          bookingId: booking.id,
          bookingRef: booking.booking_ref,
          tenantId,
          guestUserId,
          status: "pending_payment",
          propertyId,
          roomTypeId,
          checkIn,
          checkOut,
          totalAmount,
        },
        client,
      );

      await redisClient.zadd(
        "schedule:booking_expiry",
        Date.now() + 30 * 60_000,
        booking.id,
      );
    });

    availabilityBroadcaster.publish(roomTypeId, {
      type: "locked",
      checkIn,
      checkOut,
    });

    bookingCreatedCounter.inc({
      tenant_id: tenantId,
      property_type: property.property_type,
    });
    await auditRepository.log({
      action: "created",
      resource: "booking",
      resourceId: booking.id,
      tenantId,
      userId: guestUserId,
    });

    logger.info("booking_initiated", {
      event: "booking_initiated",
      bookingId: booking.id,
      tenantId,
      guestUserId,
      requestId: requestContext.get()?.requestId,
    });

    return toDto(booking, sessionId);
  },

  async confirmBookingByPayment(
    bookingId: string,
    transactionId: string,
  ): Promise<Booking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");
    if (booking.status !== "pending_payment") {
      if (booking.status === "confirmed") return booking;
      throw AppError.conflict(
        `Booking is already in status: ${booking.status}`,
      );
    }

    const guest = await userRepository.findById(booking.guest_user_id);
    if (!guest) throw AppError.notFound("Guest user not found.");

    let confirmed!: Booking;

    await withTransaction(async (client) => {
      confirmed = (await bookingRepository.updateStatus(
        bookingId,
        "confirmed",
        undefined,
        client,
      ))!;

      await availabilityRepository.decrementAvailability(
        booking.room_type_id,
        booking.check_in,
        booking.check_out,
        booking.rooms_count,
        client,
      );

      await escrowRepository.create(
        {
          bookingId,
          tenantId: booking.tenant_id,
          amountNgn: Number(booking.total_amount_ngn),
          platformFeeNgn: Number(booking.platform_fee_ngn),
          hostPayoutNgn: Number(booking.host_payout_ngn),
        },
        client,
      );

      await outboxRepository.create(
        "booking.confirmed",
        {
          bookingId,
          bookingRef: booking.booking_ref,
          tenantId: booking.tenant_id,
          guestUserId: booking.guest_user_id,
          status: "confirmed",
          propertyId: booking.property_id,
          roomTypeId: booking.room_type_id,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          totalAmount: Number(booking.total_amount_ngn),
        },
        client,
      );

      // Booking receipt reqested
      await outboxRepository.create(
        "booking.receipt.requested",
        {
          bookingId: booking.id,
          bookingRef: booking.booking_ref,
          propertyId: booking.property_id,
          roomTypeId: booking.room_type_id,
          guestUserId: booking.guest_user_id,
          totalAmountNgn: Number(booking.total_amount_ngn),
          platformFeeNgn: Number(booking.platform_fee_ngn),
          transactionId,
          gateway: "unknown",
          paidAt: new Date().toISOString(),
        },
        client,
      );

      // adding customer insert to seller records
      await outboxRepository.create(
        "renter.upsert.requested",
        {
          ownerId: booking.tenant_id,
          guestUserId: booking.guest_user_id,
          fullName: guest.first_name + " " + guest.last_name,
          email: guest.email,
          phone: guest.phone ?? undefined,
        },
        client,
      );
    });

    availabilityBroadcaster.publish(booking.room_type_id, {
      type: "booked",
      checkIn: booking.check_in,
      checkOut: booking.check_out,
    });

    const sessionId =
      (booking.metadata as Record<string, string>)["sessionId"] ?? "";
    if (sessionId)
      await availabilityRepository.releaseLock(sessionId).catch(() => null);

    bookingConfirmedCounter.inc({ tenant_id: booking.tenant_id });
    await auditRepository.log({
      action: "status_changed",
      resource: "booking",
      resourceId: bookingId,
      tenantId: booking.tenant_id,
      newValue: { status: "confirmed", transactionId },
    });

    await sseService.pushToUser(booking.guest_user_id, {
      type: "booking.confirmed",
      payload: { bookingId, bookingRef: booking.booking_ref, transactionId },
    });
    await sseService.pushToTenant(booking.tenant_id, {
      type: "booking.new",
      payload: {
        bookingId,
        bookingRef: booking.booking_ref,
        guestUserId: booking.guest_user_id,
      },
    });

    // Resolve guest/property display data then publish notification
    void resolveNotificationContext(booking)
      .then(
        ({ guestEmail, guestName, guestPhone, propertyName, roomTypeName }) => {
          const nights = Math.round(
            (new Date(booking.check_out).getTime() -
              new Date(booking.check_in).getTime()) /
              86_400_000,
          );
          void Promise.allSettled([
            publishNotifyBookingConfirmed({
              notificationId: uuid(),
              guestEmail,
              guestName,
              guestPhone,
              bookingRef: booking.booking_ref,
              propertyName,
              roomTypeName,
              checkIn: booking.check_in,
              checkOut: booking.check_out,
              nights,
              totalAmountNgn: Number(booking.total_amount_ngn),
              tenantId: booking.tenant_id,
              bookingId,
            }),
          ]);
        },
      )
      .catch((err) =>
        logger.error("notify_booking_confirmed_failed", {
          event: "notify_booking_confirmed_failed",
          bookingId,
          error: (err as Error).message,
        }),
      );

    logger.info("booking_confirmed", {
      event: "booking_confirmed",
      bookingId,
      tenantId: booking.tenant_id,
    });
    return confirmed;
  },

  async cancelBooking(
    bookingId: string,
    requestingUserId: string,
    reason?: string,
  ): Promise<BookingDto> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");

    const cancelable: BookingStatus[] = ["pending_payment", "confirmed"];
    if (!cancelable.includes(booking.status)) {
      throw AppError.conflict(
        `Cannot cancel a booking with status: ${booking.status}`,
      );
    }
    if (
      requestingUserId !== "system" &&
      booking.guest_user_id !== requestingUserId
    )
      throw AppError.forbidden("You can only cancel your own bookings.");

    const tenant = await tenantRepository.findById(booking.tenant_id);
    const refundAmount = tenant
      ? computeRefundAmount(
          Number(booking.total_amount_ngn),
          tenant.cancellation_policy as CancellationPolicyTier[],
          booking.check_in,
        )
      : 0;

    let cancelled!: Booking;

    await withTransaction(async (client) => {
      cancelled = (await bookingRepository.updateStatus(
        bookingId,
        "cancelled",
        { cancellation_reason: reason, cancelled_at: new Date() },
        client,
      ))!;

      if (booking.status === "confirmed") {
        await availabilityRepository.incrementAvailability(
          booking.room_type_id,
          booking.check_in,
          booking.check_out,
          booking.rooms_count,
          client,
        );
        await escrowRepository.initiateRefund(bookingId, refundAmount, client);
      }

      await outboxRepository.create(
        "booking.cancelled",
        {
          bookingId,
          bookingRef: booking.booking_ref,
          tenantId: booking.tenant_id,
          guestUserId: booking.guest_user_id,
          status: "cancelled",
          propertyId: booking.property_id,
          roomTypeId: booking.room_type_id,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          totalAmount: Number(booking.total_amount_ngn),
          reason,
        },
        client,
      );
    });
    // broadcast cancel booking
    availabilityBroadcaster.publish(booking.room_type_id, {
      type: "released",
      checkIn: booking.check_in,
      checkOut: booking.check_out,
    });

    if (booking.status === "pending_payment") {
      const sessionId =
        (booking.metadata as Record<string, string>)["sessionId"] ?? "";
      if (sessionId)
        await availabilityRepository.releaseLock(sessionId).catch(() => null);
    }

    bookingCancelledCounter.inc({
      tenant_id: booking.tenant_id,
      reason_type: reason ? "guest_reason" : "no_reason",
    });
    await auditRepository.log({
      action: "status_changed",
      resource: "booking",
      resourceId: bookingId,
      tenantId: booking.tenant_id,
      newValue: { status: "cancelled", reason, refundAmount },
    });

    await sseService.pushToUser(booking.guest_user_id, {
      type: "booking.cancelled",
      payload: { bookingId, bookingRef: booking.booking_ref, refundAmount },
    });

    // Resolve and publish cancellation notification
    void resolveNotificationContext(booking)
      .then(({ guestEmail, guestName, propertyName }) => {
        void Promise.allSettled([
          publishNotifyBookingCancelled({
            notificationId: uuid(),
            guestEmail,
            guestName,
            bookingRef: booking.booking_ref,
            propertyName,
            roomTypeName: "", // not needed in cancelled template
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            nights: 0, // not needed in cancelled template
            totalAmountNgn: Number(booking.total_amount_ngn),
            tenantId: booking.tenant_id,
            bookingId,
            reason,
          }),
        ]);
      })
      .catch((err) =>
        logger.error("notify_booking_cancelled_failed", {
          event: "notify_booking_cancelled_failed",
          bookingId,
          error: (err as Error).message,
        }),
      );

    logger.info("booking_cancelled", {
      event: "booking_cancelled",
      bookingId,
      refundAmount,
      requestingUserId,
    });
    return toDto(cancelled);
  },

  async checkIn(bookingId: string, hostUserId: string): Promise<BookingDto> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");
    if (booking.status !== "confirmed")
      throw AppError.conflict("Only confirmed bookings can be checked in.");

    const updated = await withTransaction(async (client) => {
      const b = (await bookingRepository.updateStatus(
        bookingId,
        "checked_in",
        undefined,
        client,
      ))!;
      await outboxRepository.create(
        "booking.checked_in",
        {
          bookingId,
          bookingRef: booking.booking_ref,
          tenantId: booking.tenant_id,
          guestUserId: booking.guest_user_id,
          status: "checked_in",
          propertyId: booking.property_id,
          roomTypeId: booking.room_type_id,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          totalAmount: Number(booking.total_amount_ngn),
        },
        client,
      );
      return b;
    });

    await sseService.pushToUser(booking.guest_user_id, {
      type: "booking.checked_in",
      payload: { bookingId, bookingRef: booking.booking_ref },
    });
    await auditRepository.log({
      action: "status_changed",
      resource: "booking",
      resourceId: bookingId,
      tenantId: booking.tenant_id,
      userId: hostUserId,
      newValue: { status: "checked_in" },
    });

    void resolveNotificationContext(booking)
      .then(({ guestEmail, guestName, propertyName }) => {
        void Promise.allSettled([
          publishNotifyBookingCheckedIn({
            notificationId: uuid(),
            guestEmail,
            guestName,
            bookingRef: booking.booking_ref,
            propertyName,
            roomTypeName: "",
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            nights: 0,
            totalAmountNgn: Number(booking.total_amount_ngn),
            tenantId: booking.tenant_id,
            bookingId,
          }),
        ]);
      })
      .catch((err) =>
        logger.error("notify_checkin_failed", {
          event: "notify_checkin_failed",
          bookingId,
          error: (err as Error).message,
        }),
      );

    logger.info("booking_checked_in", {
      event: "booking_checked_in",
      bookingId,
      hostUserId,
    });
    return toDto(updated);
  },

  async checkOut(bookingId: string, hostUserId: string): Promise<BookingDto> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");
    if (booking.status !== "checked_in")
      throw AppError.conflict("Only checked-in bookings can be checked out.");

    const updated = await withTransaction(async (client) => {
      const b = (await bookingRepository.updateStatus(
        bookingId,
        "checked_out",
        undefined,
        client,
      ))!;
      await escrowRepository.release(bookingId, client);
      await outboxRepository.create(
        "booking.host_statement.requested",
        {
          bookingId,
          bookingRef: booking.booking_ref,
          propertyId: booking.property_id,
          roomTypeId: booking.room_type_id,
          tenantId: booking.tenant_id,
          totalAmountNgn: Number(booking.total_amount_ngn),
          platformFeeNgn: Number(booking.platform_fee_ngn),
          hostPayoutNgn: Number(booking.host_payout_ngn),
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          releasedAt: new Date().toISOString(),
        },
        client,
      );
      await outboxRepository.create(
        "booking.checked_out",
        {
          bookingId,
          bookingRef: booking.booking_ref,
          tenantId: booking.tenant_id,
          guestUserId: booking.guest_user_id,
          status: "checked_out",
          propertyId: booking.property_id,
          roomTypeId: booking.room_type_id,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          totalAmount: Number(booking.total_amount_ngn),
        },
        client,
      );
      return b;
    });

    await auditRepository.log({
      action: "status_changed",
      resource: "booking",
      resourceId: bookingId,
      tenantId: booking.tenant_id,
      userId: hostUserId,
      newValue: { status: "checked_out" },
    });

    void resolveNotificationContext(booking)
      .then(({ guestEmail, guestName, propertyName }) => {
        void Promise.allSettled([
          publishNotifyBookingCheckedOut({
            notificationId: uuid(),
            guestEmail,
            guestName,
            bookingRef: booking.booking_ref,
            propertyName,
            roomTypeName: "",
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            nights: 0,
            totalAmountNgn: Number(booking.total_amount_ngn),
            tenantId: booking.tenant_id,
            bookingId,
          }),
        ]);
      })
      .catch((err) =>
        logger.error("notify_checkout_failed", {
          event: "notify_checkout_failed",
          bookingId,
          error: (err as Error).message,
        }),
      );

    logger.info("booking_checked_out", {
      event: "booking_checked_out",
      bookingId,
      hostUserId,
    });
    return toDto(updated);
  },

  async getBookingById(id: string): Promise<BookingDto> {
    const b = await bookingRepository.findById(id);
    if (!b) throw AppError.notFound("Booking not found.");

    const [property, roomType] = await Promise.all([
      propertyRepository.findPropertyById(b.property_id),
      propertyRepository.findRoomTypeById(b.room_type_id),
    ]);

    return toDto(b, "", {
      propertyName: property?.name,
      roomTypeImage: roomType?.images?.[0],
      propertyCity: property?.address?.city,
      roomTypeName: roomType?.name,
    });
  },

  async getGuestBookings(
    guestUserId: string,
    page = 1,
    limit = 20,
  ): Promise<BookingDto[]> {
    return (await bookingRepository.listByGuest(guestUserId, page, limit)).map(
      (b) => toDto(b),
    );
  },
async getTenantBookings(
  tenantId: string,
  opts: { status?: BookingStatus; page?: number; limit?: number } = {},
): Promise<BookingDto[]> {
  return (await bookingRepository.listByTenant(tenantId, opts.status, opts.page, opts.limit)).map((b) =>
    toDto(b),
  );
},

  async getTenantBookingStats(tenantId: string) {
    return bookingRepository.getStatsForTenant(tenantId);
  },

  async transitionStatus(
    tenantId: string,
    bookingId: string,
    targetStatus: BookingStatus,
    actorUserId: string,
  ): Promise<BookingDto> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");
    if (booking.tenant_id !== tenantId)
      throw AppError.notFound("Booking not found.");

    const allowed = BOOKING_STATUS_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(targetStatus)) {
      throw AppError.conflict(
        allowed.length
          ? `Cannot move a booking from "${booking.status}" to "${targetStatus}". Valid next states: ${allowed.join(", ")}.`
          : `"${booking.status}" is a terminal state, no further transitions are allowed.`,
      );
    }

    const updated = await withTransaction(async (client) => {
      const b = (await bookingRepository.updateStatus(
        bookingId,
        targetStatus,
        undefined,
        client,
      ))!;

      await auditRepository.log({
        action: "status_changed",
        resource: "booking",
        resourceId: bookingId,
        tenantId,
        userId: actorUserId,
        oldValue: { status: booking.status },
        newValue: { status: targetStatus },
      });

      await outboxRepository.create(
        "booking.status_changed",
        {
          bookingId,
          bookingRef: booking.booking_ref,
          tenantId,
          fromStatus: booking.status,
          toStatus: targetStatus,
      },
        client,
      );

      return b;
    });

    logger.info("booking_status_transitioned", {
      event: "booking_status_transitioned",
      bookingId,
      from: booking.status,
      to: targetStatus,
    });

    return toDto(updated);
  },
};
