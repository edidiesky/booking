import { renterRepository } from "./renter.repository";
import { query } from "@booking/shared";
import { AppError } from "@booking/shared";

export const renterService = {
  async createRenter(ownerId: string, body: {
    fullName: string; email?: string; phone?: string;
    emergencyContactName?: string; emergencyContactPhone?: string;
  }) {
    return renterRepository.create({ ownerId, ...body });
  },

  async listRenters(ownerId: string) {
    const renters = await renterRepository.listByOwner(ownerId);
    return {
      renters,
      stats: {
        total:         renters.length,
        withPhone:     renters.filter((r) => Boolean(r.phone)).length,
        withEmergency: renters.filter((r) => Boolean(r.emergency_contact_name)).length,
      },
    };
  },

  async getRenterDetail(renterId: string) {
    const renter = await renterRepository.findById(renterId);
    if (!renter) throw AppError.notFound("Renter not found.");

    const occupancy = await query<{ property_name: string; room_type_name: string; check_out: string; status: string }>(
      `SELECT p.name AS property_name, rt.name AS room_type_name, b.check_out, b.status
       FROM bookings b
       JOIN room_types rt ON rt.id = b.room_type_id
       JOIN properties p  ON p.id = rt.property_id
       WHERE b.guest_user_id = $1
         AND b.status IN ('confirmed', 'checked_in')
         AND b.check_in <= CURRENT_DATE AND b.check_out >= CURRENT_DATE
       ORDER BY b.check_in DESC
       LIMIT 1`,
      [renterId],
    );

    return { renter, occupancy: occupancy[0] ?? null };
  },
};