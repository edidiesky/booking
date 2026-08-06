import { userRepository } from "../auth/auth.repository";
import { auditRepository } from "../audit/audit.repository";
import { AppError } from "@booking/shared";
import { paymentRepository } from "../payment/payment.repository";
import { BookingStatus } from "../../types";
import { propertyRepository } from "../property/property.repository";
import { bookingRepository } from "../booking/booking.repository";

export class AdminService {
  async listGuests(page: number, limit: number) {
    const [guests, totalCount] = await Promise.all([
      userRepository.listByType("guest", page, limit),
      userRepository.countByType("guest"),
    ]);
    return {
      guests,
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };
  }

  async listAdministrators(page: number, limit: number) {
    const [administrators, totalCount] = await Promise.all([
      userRepository.listByType("platform:admin", page, limit),
      userRepository.countByType("platform:admin"),
    ]);
    return {
      administrators,
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };
  }

  async promoteToAdministrator(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound("User not found.");
    if (user.user_type === "platform:admin")
      throw AppError.conflict("Already a platform administrator.");
    return userRepository.updateUserType(userId, "platform:admin");
  }

  async demoteAdministrator(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound("User not found.");
    if (user.user_type !== "platform:admin")
      throw AppError.conflict("Not currently a platform administrator.");
    return userRepository.updateUserType(userId, "guest");
  }

  async listAuditLogs(page: number, limit: number) {
    const [rows, totalCount] = await Promise.all([
      auditRepository.listAll(page, limit),
      auditRepository.countAll(),
    ]);
    const logs = rows.map((l) => ({
      id: l.id,
      action: l.action,
      resource: l.resource,
      resourceId: l.resource_id,
      oldValue: l.old_value,
      newValue: l.new_value,
      ipAddress: l.ip_address,
      actorFirstName: l.actor_first_name,
      actorLastName: l.actor_last_name,
      tenantName: l.tenant_name,
      createdAt: l.created_at,
    }));
    return {
      logs,
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };
  }
  async listProperties(page: number, limit: number) {
    const [rows, totalCount] = await Promise.all([
      propertyRepository.listAllForAdmin(page, limit),
      propertyRepository.countAllForAdmin(),
    ]);
    const properties = rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      propertyType: p.property_type,
      address: p.address,
      status: p.status,
      checkInTime: p.check_in_time,
      checkOutTime: p.check_out_time,
      tenantId: p.tenant_id,
      tenantName: p.tenant_name,
      tenantEmail: p.tenant_email,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
    return {
      properties,
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };
  }

  async listBookings(page: number, limit: number, status?: BookingStatus) {
    const rows = await bookingRepository.listAllForAdmin({
      status,
      page,
      limit,
    });
    const bookings = rows.map((b) => ({
      id: b.id,
      bookingRef: b.booking_ref,
      status: b.status,
      checkIn: b.check_in,
      checkOut: b.check_out,
      nights: b.nights,
      guestCount: b.guest_count,
      roomsCount: b.rooms_count,
      totalAmountNgn: b.total_amount_ngn,
      platformFeeNgn: b.platform_fee_ngn,
      hostPayoutNgn: b.host_payout_ngn,
      createdAt: b.created_at,
      tenantName: b.tenant_name,
      guestFirstName: b.guest_first_name,
      guestLastName: b.guest_last_name,
      guestUserId: b.guest_user_id,
      propertyName: b.property_name,
      roomTypeName: b.room_type_name,
    }));
    return { bookings, page, limit };
  }

  async listPayments(page: number, limit: number) {
    const rows = await paymentRepository.listAllForAdmin(page, limit);
    const payments = rows.map((p) => ({
      id: p.id,
      bookingId: p.booking_id,
      gateway: p.gateway,
      transactionId: p.transaction_id,
      amountNgn: p.amount_ngn,
      status: p.status,
      channel: p.channel,
      paidAt: p.paid_at,
      createdAt: p.created_at,
      tenantName: p.tenant_name,
      bookingRef: p.booking_ref,
      checkIn: p.check_in,
      checkOut: p.check_out,
      receiptUrl: p.receipt_url,
      guestFirstName: p.guest_first_name,
      guestLastName: p.guest_last_name,
      guestEmail: p.guest_email,
      roomTypeName: p.room_type_name,
    }));
    return { payments, page, limit };
  }

  async getCalendar(startDate: string, endDate: string) {
    return bookingRepository.listForDateRange(startDate, endDate);
  }
}

export const adminService = new AdminService();
