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
  async getPublicProfile(tenantId: string) {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant || tenant.status !== "active") throw AppError.notFound("Host not found.");

    const properties = await query<{ id: string; name: string; images: string[]; city: string; property_type: string }>(
      `SELECT id, name, images, address->>'city' AS city, property_type
       FROM properties WHERE tenant_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [tenantId],
    );

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
      },
      properties,
      recentReviews,
      stats: {
        avgRating:     stats?.avg_rating ? Number(Number(stats.avg_rating).toFixed(2)) : 0,
        totalReviews:  Number(stats?.total_reviews ?? 0),
        totalBookings: Number(stats?.total_bookings ?? 0),
      },
    };
  },
};