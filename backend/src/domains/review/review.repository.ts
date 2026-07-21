import { query, queryOne } from "@booking/shared";
import { trackError } from "@booking/shared";

export interface Review {
  id: string; room_type_id: string; property_id: string; tenant_id: string;
  guest_user_id: string; booking_id: string; rating: number; title: string;
  comment: string; images: string[]; is_verified_purchase: boolean;
  status: "approved" | "rejected"; helpful_count: number; unhelpful_count: number;
  response_text: string | null; response_by: string | null; response_at: Date | null;
  created_at: Date; updated_at: Date;
}

export interface ReviewWithGuest extends Review {
  guest_first_name: string; guest_last_name: string; guest_profile_image: string | null;
}

export const reviewRepository = {
  async create(data: {
    roomTypeId: string; propertyId: string; tenantId: string; guestUserId: string;
    bookingId: string; rating: number; title: string; comment: string; images?: string[];
    isVerifiedPurchase: boolean;
  }): Promise<Review> {
    try {
      const row = await queryOne<Review>(
        `INSERT INTO reviews (room_type_id, property_id, tenant_id, guest_user_id, booking_id, rating, title, comment, images, is_verified_purchase)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [data.roomTypeId, data.propertyId, data.tenantId, data.guestUserId, data.bookingId,
         data.rating, data.title, data.comment, data.images ?? [], data.isVerifiedPurchase],
      );
      return row!;
    } catch (err) {
      trackError("review_create_failed", "review_repository", "medium");
      throw err;
    }
  },

  async existsByBooking(bookingId: string, roomTypeId: string): Promise<boolean> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reviews WHERE booking_id = $1 AND room_type_id = $2`,
      [bookingId, roomTypeId],
    );
    return parseInt(row?.count ?? "0", 10) > 0;
  },

  async findByRoomType(roomTypeId: string, filters: { rating?: number; verified?: boolean; page: number; limit: number }): Promise<ReviewWithGuest[]> {
    const conditions = [`r.room_type_id = $1`, `r.status = 'approved'`];
    const params: unknown[] = [roomTypeId];
    let idx = 2;
    if (filters.rating !== undefined)   { conditions.push(`r.rating = $${idx++}`); params.push(filters.rating); }
    if (filters.verified !== undefined) { conditions.push(`r.is_verified_purchase = $${idx++}`); params.push(filters.verified); }
    const offset = (filters.page - 1) * filters.limit;
    params.push(filters.limit, offset);

    return query<ReviewWithGuest>(
      `SELECT r.*, u.first_name AS guest_first_name, u.last_name AS guest_last_name, u.profile_image AS guest_profile_image
       FROM reviews r JOIN users u ON u.id = r.guest_user_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY r.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );
  },

  async countByRoomType(roomTypeId: string, filters: { rating?: number; verified?: boolean } = {}): Promise<number> {
    const conditions = [`room_type_id = $1`, `status = 'approved'`];
    const params: unknown[] = [roomTypeId];
    let idx = 2;
    if (filters.rating !== undefined)   { conditions.push(`rating = $${idx++}`); params.push(filters.rating); }
    if (filters.verified !== undefined) { conditions.push(`is_verified_purchase = $${idx++}`); params.push(filters.verified); }
    const row = await queryOne<{ count: string }>(`SELECT COUNT(*) AS count FROM reviews WHERE ${conditions.join(" AND ")}`, params);
    return parseInt(row?.count ?? "0", 10);
  },

  async findByTenant(tenantId: string, page = 1, limit = 20): Promise<ReviewWithGuest[]> {
    return query<ReviewWithGuest>(
      `SELECT r.*, u.first_name AS guest_first_name, u.last_name AS guest_last_name, u.profile_image AS guest_profile_image
       FROM reviews r JOIN users u ON u.id = r.guest_user_id
       WHERE r.tenant_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, (page - 1) * limit],
    );
  },

  async findById(id: string): Promise<Review | null> {
    return queryOne<Review>(`SELECT * FROM reviews WHERE id = $1`, [id]);
  },

  async addResponse(id: string, text: string, respondedBy: string): Promise<Review | null> {
    return queryOne<Review>(
      `UPDATE reviews SET response_text = $1, response_by = $2, response_at = now(), updated_at = now() WHERE id = $3 RETURNING *`,
      [text, respondedBy, id],
    );
  },

  async markHelpful(id: string, helpful: boolean): Promise<Review | null> {
    const field = helpful ? "helpful_count" : "unhelpful_count";
    return queryOne<Review>(`UPDATE reviews SET ${field} = ${field} + 1, updated_at = now() WHERE id = $1 RETURNING *`, [id]);
  },

  async getStats(roomTypeId: string): Promise<{
    averageRating: number; totalReviews: number; verifiedCount: number;
    ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  }> {
    const rows = await query<{ rating: number; count: string; verified_count: string }>(
      `SELECT rating, COUNT(*) AS count, SUM(CASE WHEN is_verified_purchase THEN 1 ELSE 0 END) AS verified_count
       FROM reviews WHERE room_type_id = $1 AND status = 'approved' GROUP BY rating`,
      [roomTypeId],
    );

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0, weighted = 0, verified = 0;
    for (const row of rows) {
      const count = parseInt(row.count, 10);
      distribution[row.rating as 1 | 2 | 3 | 4 | 5] = count;
      total += count;
      weighted += row.rating * count;
      verified += parseInt(row.verified_count, 10);
    }

    return {
      averageRating: total > 0 ? Number((weighted / total).toFixed(2)) : 0,
      totalReviews: total, verifiedCount: verified, ratingDistribution: distribution,
    };
  },
};