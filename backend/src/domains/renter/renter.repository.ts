import { query, queryOne } from "@booking/shared";
import { trackError } from "@booking/shared";

export interface Renter {
  id: string;
  owner_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export const renterRepository = {
  async create(data: {
    ownerId: string;
    fullName: string;
    email?: string;
    phone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }): Promise<Renter> {
    try {
      const row = await queryOne<Renter>(
        `INSERT INTO renters (owner_id, full_name, email, phone, emergency_contact_name, emergency_contact_phone)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          data.ownerId,
          data.fullName,
          data.email ?? null,
          data.phone ?? null,
          data.emergencyContactName ?? null,
          data.emergencyContactPhone ?? null,
        ],
      );
      return row!;
    } catch (err) {
      trackError("renter_create_failed", "renter_repository", "medium");
      throw err;
    }
  },

  async findById(id: string): Promise<Renter | null> {
    return queryOne<Renter>(`SELECT * FROM renters WHERE id = $1`, [id]);
  },

  async listByOwner(ownerId: string): Promise<Renter[]> {
    try {
      return await query<Renter>(
        `SELECT * FROM renters WHERE owner_id = $1 ORDER BY created_at DESC`,
        [ownerId],
      );
    } catch (err) {
      trackError("renter_list_failed", "renter_repository", "low");
      throw err;
    }
  },

  async upsertFromBooking(data: {
    ownerId: string;
    guestUserId: string;
    fullName: string;
    email: string;
    phone?: string;
  }): Promise<void> {
    await query(
      `INSERT INTO renters (owner_id, guest_user_id, full_name, email, phone)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (owner_id, guest_user_id) WHERE guest_user_id IS NOT NULL DO NOTHING`,
      [
        data.ownerId,
        data.guestUserId,
        data.fullName,
        data.email,
        data.phone ?? null,
      ],
    );
  },
};

