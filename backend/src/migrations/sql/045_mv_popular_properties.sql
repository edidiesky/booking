/* Popular properties materialized view. Deliberately NOT used for
     "new properties" too, ORDER BY created_at DESC LIMIT N on an
     indexed column is already fast, materializing it would add
     refresh overhead for zero real gain. Popularity is different: it's
     a genuine aggregation across bookings, favorites, and reviews,
     expensive to compute per-request at real traffic, worth
     precomputing on a schedule instead.
 
     Score weights (bookings x3, avg rating x2, favorites x1) are a
     starting point, not a tuned formula, revisit once there's real
     usage data to see whether bookings should actually dominate this
     much relative to favorites.
 
     CONCURRENTLY-refreshable (see refreshPopularProperties in
     bootstrap.ts) requires a unique index, included below, without it
     REFRESH MATERIALIZED VIEW CONCURRENTLY fails outright. */

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_properties AS
   SELECT
     p.id AS property_id,
     p.tenant_id,
     p.name,
     p.images,
     p.property_type,
     p.address,
     p.latitude,
     p.longitude,
     COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed','checked_in','checked_out')) AS booking_count,
     COUNT(DISTINCT f.id) AS favorite_count,
     COALESCE(AVG(r.rating), 0)::numeric(3,2) AS avg_rating,
     COUNT(DISTINCT r.id) AS review_count,
     (
       COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed','checked_in','checked_out')) * 3
       + COALESCE(AVG(r.rating), 0) * 2
       + COUNT(DISTINCT f.id) * 1
     ) AS popularity_score
   FROM properties p
   LEFT JOIN bookings b ON b.property_id = p.id
   LEFT JOIN favorites f ON f.property_id = p.id
   LEFT JOIN reviews r ON r.property_id = p.id AND r.status = 'approved'
   WHERE p.status = 'active'
   GROUP BY p.id
   WITH NO DATA;
 
   CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_popular_properties_id ON mv_popular_properties(property_id);
   CREATE INDEX IF NOT EXISTS idx_mv_popular_properties_score ON mv_popular_properties(popularity_score DESC);
