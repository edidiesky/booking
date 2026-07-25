import { tenantRepository } from "./tenant.repository";
import { query, AppError } from "@booking/shared";
import { reviewRepository } from "../review/review.repository";
import { CancellationPolicyTier } from "../../types";

export const tenantService = {
  async getMyTenant(tenantId: string) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw AppError.notFound("Tenant not found.");
    return tenant;
  },

  async updateSettings(tenantId: string, body: { timezone?: string; currency?: string; locale?: string }) {
    return tenantRepository.updateSettings(tenantId, body);
  },

  async updateProfile(tenantId: string, body: { bio?: string; avatarUrl?: string; city?: string; state?: string; country?: string }) {
    return tenantRepository.updateProfile(tenantId, body);
  },

  async updateCancellationPolicy(tenantId: string, policy: CancellationPolicyTier[]) {
    return tenantRepository.updateCancellationPolicy(tenantId, policy);
  },

  async listAll(page: number, limit: number) {
    return tenantRepository.listAll(page, limit);
  },

  async suspend(tenantId: string) {
    const updated = await tenantRepository.updateStatus(tenantId, "suspended");
    if (!updated) throw AppError.notFound("Tenant not found.");
    return updated;
  },

  async activate(tenantId: string) {
    const updated = await tenantRepository.updateStatus(tenantId, "active");
    if (!updated) throw AppError.notFound("Tenant not found.");
    return updated;
  },

  /**
   * Public seller/host profile. No auth. Must never leak dashboard-only
   * fields (occupancy status, current tenant/guest names on room types),
   * same public-vs-dashboard boundary already enforced for properties.
   */
  // async getPublicProfile(tenantId: string) {
  //   const tenant = await tenantRepository.findById(tenantId);
  //   if (!tenant || tenant.status !== "active") throw AppError.notFound("Host not found.");

  //   const properties = await query<{ id: string; name: string; images: string[]; city: string; property_type: string }>(
  //     `SELECT id, name, images, address->>'city' AS city, property_type
  //      FROM properties WHERE tenant_id = $1 AND status = 'active'
  //      ORDER BY created_at DESC`,
  //     [tenantId],
  //   );

  //   const propertyIds = properties.map((p) => p.id);
  //   // Curated columns, same discipline as the properties query above,
  //   // not SELECT *: this is a public, unauthenticated endpoint, "probably
  //   // nothing sensitive on room_types" isn't a guarantee, explicit is.
  //   const roomTypes = await query<{ id: string; property_id: string; name: string; base_price_ngn: number; max_occupancy: number; images: string[] }>(
  //     `SELECT id, property_id, name, base_price_ngn, max_occupancy, images
  //      FROM room_types WHERE property_id = ANY($1::uuid[]) AND status = 'active'
  //      ORDER BY base_price_ngn ASC`,
  //     [propertyIds],
  //   );

  //   const propertiesWithRoomTypes = properties.map((p) => ({
  //     ...p,
  //     roomTypes: roomTypes.filter((r) => r.property_id === p.id),
  //   }));

  //   const [recentReviews, statsRow] = await Promise.all([
  //     reviewRepository.findByTenant(tenantId, 1, 5),
  //     query<{ avg_rating: string | null; total_reviews: string; total_bookings: string }>(
  //       `SELECT
  //          (SELECT AVG(rating) FROM reviews WHERE tenant_id = $1 AND status = 'approved') AS avg_rating,
  //          (SELECT COUNT(*) FROM reviews WHERE tenant_id = $1 AND status = 'approved') AS total_reviews,
  //          (SELECT COUNT(*) FROM bookings WHERE tenant_id = $1 AND status IN ('confirmed','checked_in','checked_out')) AS total_bookings`,
  //       [tenantId],
  //     ),
  //   ]);

  //   const stats = statsRow[0];

  //   return {
  //     tenant: {
  //       id: tenant.id, name: tenant.name, slug: tenant.slug,
  //       createdAt: tenant.created_at, settings: tenant.settings,
  //       bio: tenant.bio ?? null,
  //       avatarUrl: tenant.avatar_url ?? null,
  //       city: tenant.city ?? null,
  //       state: tenant.state ?? null,
  //       country: tenant.country ?? null,
  //     },
  //     properties: propertiesWithRoomTypes,
  //     recentReviews,
  //     stats: {
  //       avgRating:     stats?.avg_rating ? Number(Number(stats.avg_rating).toFixed(2)) : 0,
  //       totalReviews:  Number(stats?.total_reviews ?? 0),
  //       totalBookings: Number(stats?.total_bookings ?? 0),
  //     },
  //   };
  // },
  /**
   * Public seller/host profile. No auth. Must never leak dashboard-only
   * fields (occupancy status, current tenant/guest names on room types),
   * same public-vs-dashboard boundary already enforced for properties.
   */
  async getPublicProfile(tenantId: string) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant || tenant.status !== "active") throw AppError.notFound("Host not found.");

    // One round trip via LEFT JOIN (properties with zero active room types
    // still appear, room-type columns come back NULL for that row) rather
    // than two separate queries. Same pattern already used in
    // searchPublicProperties elsewhere in this file. Curated columns on
    // both sides, not SELECT *, this is a public unauthenticated
    // endpoint, "probably nothing sensitive" isn't a guarantee.
    // Denormalized: a property with 3 room types comes back as 3 rows,
    // its own columns repeated on each, grouped back into the nested
    // shape below.
    const rows = await query<{
      property_id: string; property_name: string; property_images: string[]; city: string; property_type: string;
      room_type_id: string | null; room_type_name: string | null; base_price_ngn: number | null; max_occupancy: number | null; room_type_images: string[] | null;
    }>(
      `SELECT
         p.id AS property_id, p.name AS property_name, p.images AS property_images,
         p.address->>'city' AS city, p.property_type,
         rt.id AS room_type_id, rt.name AS room_type_name, rt.base_price_ngn, rt.max_occupancy, rt.images AS room_type_images
       FROM properties p
       LEFT JOIN room_types rt ON rt.property_id = p.id AND rt.status = 'active'
       WHERE p.tenant_id = $1 AND p.status = 'active'
       ORDER BY p.created_at DESC, rt.base_price_ngn ASC`,
      [tenantId],
    );

    const byProperty = new Map<string, {
      id: string; name: string; images: string[]; city: string; property_type: string;
      roomTypes: { id: string; name: string; base_price_ngn: number; max_occupancy: number; images: string[] }[];
    }>();

    for (const row of rows) {
      if (!byProperty.has(row.property_id)) {
        byProperty.set(row.property_id, {
          id: row.property_id, name: row.property_name, images: row.property_images,
          city: row.city, property_type: row.property_type, roomTypes: [],
        });
      }
      if (row.room_type_id) {
        byProperty.get(row.property_id)!.roomTypes.push({
          id: row.room_type_id, name: row.room_type_name!,
          base_price_ngn: row.base_price_ngn!, max_occupancy: row.max_occupancy!,
          images: row.room_type_images ?? [],
        });
      }
    }

    const propertiesWithRoomTypes = Array.from(byProperty.values());

    const [recentReviews, statsRow] = await Promise.all([
      reviewRepository.findByTenant(tenantId, 1, 5),
      query<{ avg_rating: string | null; total_reviews: string; total_bookings: string }>(
        `SELECT
           (SELECT AVG(rating) FROM reviews WHERE tenant_id = $1 AND status = 'approved') AS avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE tenant_id = $1 AND status = 'approved') AS total_reviews,
           (SELECT COUNT(*) FROM bookings WHERE tenant_id = $1 AND status IN ('confirmed','checked_in','checked_out')) AS total_bookings`,
        [tenantId],
      ),
    ]);

    const stats = statsRow[0];

    return {
      tenant: {
        id: tenant.id, name: tenant.name, slug: tenant.slug,
        createdAt: tenant.created_at, settings: tenant.settings,
        bio: tenant.bio ?? null,
        avatarUrl: tenant.avatar_url ?? null,
        city: tenant.city ?? null,
        state: tenant.state ?? null,
        country: tenant.country ?? null,
      },
      properties: propertiesWithRoomTypes,
      recentReviews,
      stats: {
        avgRating:     stats?.avg_rating ? Number(Number(stats.avg_rating).toFixed(2)) : 0,
        totalReviews:  Number(stats?.total_reviews ?? 0),
        totalBookings: Number(stats?.total_bookings ?? 0),
      },
    };
  },
};