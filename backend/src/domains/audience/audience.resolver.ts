import { query } from "@booking/shared";
import type { AudienceFilter, AudienceCondition } from "./audience.types";

export interface ResolvedUser {
  id:    string;
  email: string;
  phone: string | null;
}

// Translates each condition into one WHERE fragment (direct column
// comparisons) or one correlated-subquery fragment (bookings/properties
// derived conditions), joined by AND. Building this as fragments rather
// than one big hand-written query per possible combination is what keeps
// this extensible: adding a new AudienceField later is "add one case to
// this switch", not "touch a monolithic query".
function buildCondition(
  condition: AudienceCondition,
  params: unknown[],
): string {
  const { field, operator, value } = condition;

  switch (field) {
    case "userType":
      params.push(value);
      return `u.user_type = $${params.length}`;

    case "status":
      params.push(value);
      return `u.status = $${params.length}`;

    case "countryCode":
      params.push(value);
      return `u.country_code = $${params.length}`;

    case "createdWithinDays":
      params.push(value);
      return `u.created_at >= now() - ($${params.length}::int || ' days')::interval`;

    case "lastActiveWithinDays":
      params.push(value);
      return `u.last_active_at >= now() - ($${params.length}::int || ' days')::interval`;

    case "lastBookingWithinDays":
      params.push(value);
      return `EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.guest_user_id = u.id
          AND b.created_at >= now() - ($${params.length}::int || ' days')::interval
      )`;

    case "noBookingWithinDays":
      params.push(value);
      return `NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.guest_user_id = u.id
          AND b.created_at >= now() - ($${params.length}::int || ' days')::interval
      )`;

    case "totalBookings": {
      const op = operator === "gte" ? ">=" : operator === "lte" ? "<=" : "=";
      params.push(value);
      return `(SELECT COUNT(*) FROM bookings b WHERE b.guest_user_id = u.id) ${op} $${params.length}`;
    }

    case "hasActiveProperty":
      return value
        ? `EXISTS (SELECT 1 FROM properties p WHERE p.tenant_id = u.tenant_id AND p.status = 'active')`
        : `NOT EXISTS (SELECT 1 FROM properties p WHERE p.tenant_id = u.tenant_id AND p.status = 'active')`;

    default: {
      // Exhaustiveness check: if a new AudienceField is added to the
      // union without a case here, this is a compile error, not a
      // silent no-op filter that quietly matches everyone.
      const _exhaustive: never = field;
      throw new Error(`Unhandled audience field: ${_exhaustive}`);
    }
  }
}

function buildWhereClause(filter: AudienceFilter, params: unknown[]): string {
  if (filter.conditions.length === 0) return "1=1";
  return filter.conditions.map((c) => buildCondition(c, params)).join(" AND ");
}

export const audienceResolver = {
  // Same query, two purposes: preview (count only, cheap) and resolve
  // (full rows, used at send time to snapshot into campaign_recipients).
  // Kept as one function with a `countOnly` flag rather than two
  // near-duplicate queries, so the preview a campaign creator sees is
  // provably the same audience that gets sent to, not two queries that
  // could drift out of sync with each other.
  async count(filter: AudienceFilter, tenantId?: string): Promise<number> {
    const params: unknown[] = [];
    let where = buildWhereClause(filter, params);
    if (tenantId) {
      params.push(tenantId);
      where += ` AND u.tenant_id = $${params.length}`;
    }
    const row = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users u WHERE ${where}`,
      params,
    );
    return parseInt(row[0]?.count ?? "0", 10);
  },

  async resolve(filter: AudienceFilter, tenantId?: string, limit?: number): Promise<ResolvedUser[]> {
    const params: unknown[] = [];
    let where = buildWhereClause(filter, params);
    if (tenantId) {
      params.push(tenantId);
      where += ` AND u.tenant_id = $${params.length}`;
    }
    let sql = `SELECT u.id, u.email, u.phone FROM users u WHERE ${where}`;
    if (limit != null) {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }
    return query<ResolvedUser>(sql, params);
  },

  async preview(filter: AudienceFilter, tenantId?: string, sampleSize = 5): Promise<{ count: number; sample: ResolvedUser[] }> {
    const [count, sample] = await Promise.all([
      audienceResolver.count(filter, tenantId),
      audienceResolver.resolve(filter, tenantId, sampleSize),
    ]);
    return { count, sample };
  },
};