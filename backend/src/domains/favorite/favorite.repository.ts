import { query, queryOne } from "@booking/shared";

export interface FavoriteProperty {
  id:            string;
  name:          string;
  images:        string[];
  city:          string;
  property_type: string;
  from_price:    number | null;
  favorited_at:  Date;
}

export const favoriteRepository = {
  async add(guestUserId: string, propertyId: string): Promise<void> {
    await query(
      `INSERT INTO favorites (guest_user_id, property_id) VALUES ($1, $2)
       ON CONFLICT (guest_user_id, property_id) DO NOTHING`,
      [guestUserId, propertyId],
    );
  },

  async remove(guestUserId: string, propertyId: string): Promise<void> {
    await query(`DELETE FROM favorites WHERE guest_user_id = $1 AND property_id = $2`, [guestUserId, propertyId]);
  },

  async isFavorited(guestUserId: string, propertyId: string): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM favorites WHERE guest_user_id = $1 AND property_id = $2) AS exists`,
      [guestUserId, propertyId],
    );
    return row?.exists ?? false;
  },

  // Which of the given property ids are favorited by this guest, used to
  // annotate a whole listing page in one query instead of one query per
  // card.
  async favoritedIdsAmong(guestUserId: string, propertyIds: string[]): Promise<Set<string>> {
    if (propertyIds.length === 0) return new Set();
    const rows = await query<{ property_id: string }>(
      `SELECT property_id FROM favorites WHERE guest_user_id = $1 AND property_id = ANY($2::uuid[])`,
      [guestUserId, propertyIds],
    );
    return new Set(rows.map((r) => r.property_id));
  },

  async listByGuest(guestUserId: string, page = 1, limit = 20): Promise<FavoriteProperty[]> {
    const offset = (page - 1) * limit;
    return query<FavoriteProperty>(
      `SELECT p.id, p.name, p.images, p.address->>'city' AS city, p.property_type,
              (SELECT MIN(rt.base_price_ngn) FROM room_types rt WHERE rt.property_id = p.id AND rt.status = 'active') AS from_price,
              f.created_at AS favorited_at
       FROM favorites f
       JOIN properties p ON p.id = f.property_id
       WHERE f.guest_user_id = $1 AND p.status = 'active'
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [guestUserId, limit, offset],
    );
  },
};