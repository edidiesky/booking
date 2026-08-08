import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";
import {
  PropertyType,
  PropertyStatus,
  RoomStatus,
  PropertyAddress,
} from "../../types";

export interface Property {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  property_type: PropertyType;
  address: PropertyAddress;
  amenities: string[];
  images: string[];
  check_in_time: string;
  check_out_time: string;
  latitude?: number | null;
  longitude?: number | null;
  room_sort_mode?:
    | "alphabetical"
    | "price"
    | "rating"
    | "newest"
    | "oldest"
    | "custom";
  gantt_max_visible_rooms?: number;
  status: PropertyStatus;
  created_at: Date;
  updated_at: Date;
}

export interface PropertySearchFilters {
  search?: string;
  propertyType?: PropertyType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  sort?: "price_asc" | "price_desc" | "newest";
  page: number;
  limit: number;
  tenantId?: string; // set when the request came through a seller's subdomain
}

export interface RoomTypeWithOccupancy extends RoomType {
  occupancy_status: "occupied" | "vacant" | "maintenance";
  active_maintenance_count: number;
  current_tenant_name: string | null;
}

export interface RoomType {
  id: string;
  property_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  max_occupancy: number;
  base_price_ngn: number;
  images: string[];
  amenities: string[];
  quantity: number;
  status: RoomStatus;
  created_at: Date;
  updated_at: Date;
}

export const propertyRepository = {
  async listPublicPropertiesWithRoomTypes(
    page = 1,
    limit = 20,
  ): Promise<(Property & { roomTypes: RoomType[] })[]> {
    const offset = (page - 1) * limit;
    const properties = await query<Property>(
      `SELECT * FROM properties WHERE status = 'active'
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    if (!properties.length) return [];
    const ids = properties.map((p) => p.id);
    const rooms = await query<RoomType>(
      `SELECT * FROM room_types WHERE property_id = ANY($1::uuid[]) AND status = 'active'
       ORDER BY base_price_ngn ASC`,
      [ids],
    );
    return properties.map((p) => ({
      ...p,
      roomTypes: rooms.filter((r) => r.property_id === p.id),
    }));
  },

  async listPropertiesWithRoomTypes(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<(Property & { roomTypes: RoomType[] })[]> {
    const offset = (page - 1) * limit;
    const properties = await query<Property>(
      `SELECT * FROM properties WHERE tenant_id = $1 AND status != 'archived'
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
    if (!properties.length) return [];
    const ids = properties.map((p) => p.id);
    const rooms = await query<RoomType>(
      `SELECT * FROM room_types WHERE property_id = ANY($1::uuid[])  AND status = 'active'
       ORDER BY base_price_ngn ASC`,
      [ids],
    );
    return properties.map((p) => ({
      ...p,
      roomTypes: rooms.filter((r) => r.property_id === p.id),
    }));
  },

  async searchPublicProperties(
    filters: PropertySearchFilters,
  ): Promise<
    (Property & { roomTypes: RoomType[]; fromPrice: number | null })[]
  > {
    const conditions: string[] = ["p.status = 'active'"];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(
        `(p.name ILIKE $${idx} OR p.address->>'city' ILIKE $${idx})`,
      );
      params.push(`%${filters.search}%`);
      idx++;
    }
    if (filters.propertyType) {
      conditions.push(`p.property_type = $${idx++}`);
      params.push(filters.propertyType);
    }
    if (filters.city) {
      conditions.push(`p.address->>'city' ILIKE $${idx++}`);
      params.push(`%${filters.city}%`);
    }
    if (filters.tenantId) {
      conditions.push(`p.tenant_id = $${idx++}`);
      params.push(filters.tenantId);
    }

    const havingConditions: string[] = [];
    if (filters.minPrice !== undefined) {
      havingConditions.push(`MIN(rt.base_price_ngn) >= $${idx++}`);
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      havingConditions.push(`MIN(rt.base_price_ngn) <= $${idx++}`);
      params.push(filters.maxPrice);
    }
    if (filters.guests !== undefined) {
      havingConditions.push(`MAX(rt.max_occupancy) >= $${idx++}`);
      params.push(filters.guests);
    }

    const orderBy = {
      price_asc: "from_price ASC NULLS LAST",
      price_desc: "from_price DESC NULLS LAST",
      newest: "p.created_at DESC",
    }[filters.sort ?? "newest"];

    const offset = (filters.page - 1) * filters.limit;
    params.push(filters.limit, offset);

    const rows = await query<Property & { from_price: number | null }>(
      `SELECT p.*, MIN(rt.base_price_ngn) AS from_price
     FROM properties p
     LEFT JOIN room_types rt ON rt.property_id = p.id AND rt.status = 'active'
     WHERE ${conditions.join(" AND ")}
     GROUP BY p.id
     ${havingConditions.length ? `HAVING ${havingConditions.join(" AND ")}` : ""}
     ORDER BY ${orderBy}
     LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );

    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const roomTypes = await query<RoomType>(
      `SELECT * FROM room_types WHERE property_id = ANY($1::uuid[]) AND status = 'active' ORDER BY base_price_ngn ASC`,
      [ids],
    );

    return rows.map((p) => ({
      ...p,
      fromPrice: p.from_price !== null ? Number(p.from_price) : null,
      roomTypes: roomTypes.filter((r) => r.property_id === p.id),
    }));
  },

  async findPropertyWithRoomTypes(
    id: string,
    tenantId?: string,
  ): Promise<(Property & { roomTypes: RoomType[] }) | null> {
    const sql = tenantId
      ? `SELECT * FROM properties WHERE id = $1 AND tenant_id = $2`
      : `SELECT * FROM properties WHERE id = $1`;
    const property = await queryOne<Property>(
      sql,
      tenantId ? [id, tenantId] : [id],
    );
    if (!property) return null;
    const roomTypes = await query<RoomType>(
      `SELECT * FROM room_types WHERE property_id = $1 AND status = 'active'
       ORDER BY base_price_ngn ASC`,
      [id],
    );
    return { ...property, roomTypes };
  },

  async createProperty(
    data: {
      tenantId: string;
      name: string;
      description?: string;
      propertyType: PropertyType;
      address: PropertyAddress;
      amenities?: string[];
      images?: string[];
      checkInTime?: string;
      checkOutTime?: string;
      latitude?: number;
      longitude?: number;
    },
    client?: PoolClient,
  ): Promise<Property> {
    const sql = `
      INSERT INTO properties
        (tenant_id, name, description, property_type, address, amenities, images, check_in_time, check_out_time, latitude, longitude, status)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,'active')
      RETURNING *`;
    const params = [
      data.tenantId,
      data.name,
      data.description ?? null,
      data.propertyType,
      JSON.stringify(data.address),
      data.amenities ?? [],
      data.images ?? [],
      data.checkInTime ?? "14:00",
      data.checkOutTime ?? "11:00",
      data.latitude ?? null,
      data.longitude ?? null,
    ];
    const row = client
      ? ((await client.query(sql, params)).rows[0] as Property)
      : await queryOne<Property>(sql, params);
    return row!;
  },

  async findPropertyById(
    id: string,
    tenantId?: string,
  ): Promise<Property | null> {
    const sql = tenantId
      ? `SELECT * FROM properties WHERE id = $1 AND tenant_id = $2`
      : `SELECT * FROM properties WHERE id = $1`;
    return queryOne<Property>(sql, tenantId ? [id, tenantId] : [id]);
  },

  async listProperties(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<Property[]> {
    const offset = (page - 1) * limit;
    return query<Property>(
      `SELECT * FROM properties WHERE tenant_id = $1 AND status != 'archived'
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
  },

  async updateProperty(
    id: string,
    tenantId: string,
    data: Partial<
      Pick<
        Property,
        | "name"
        | "description"
        | "amenities"
        | "images"
        | "check_in_time"
        | "check_out_time"
        | "status"
      >
    >,
  ): Promise<Property | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }
    if (!fields.length) return null;
    fields.push("updated_at = now()");
    values.push(id, tenantId);
    return queryOne<Property>(
      `UPDATE properties SET ${fields.join(", ")}
       WHERE id = $${idx} AND tenant_id = $${idx + 1}
       RETURNING *`,
      values,
    );
  },

  async deleteProperty(id: string, tenantId: string): Promise<void> {
    await query(`DELETE FROM properties WHERE id = $1 AND tenant_id = $2`, [
      id,
      tenantId,
    ]);
  },

  async createRoomType(
    data: {
      propertyId: string;
      tenantId: string;
      name: string;
      description?: string;
      maxOccupancy: number;
      basePriceNgn: number;
      images?: string[];
      amenities?: string[];
      quantity: number;
      status?: RoomStatus;
    },
    client?: PoolClient,
  ): Promise<RoomType> {
    const sql = `
    INSERT INTO room_types
      (property_id, tenant_id, name, description, max_occupancy, base_price_ngn, images, amenities, quantity, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`;
    const params = [
      data.propertyId,
      data.tenantId,
      data.name,
      data.description ?? null,
      data.maxOccupancy,
      data.basePriceNgn,
      data.images ?? [],
      data.amenities ?? [],
      data.quantity,
      data.status ?? "active",
    ];
    const row = client
      ? ((await client.query(sql, params)).rows[0] as RoomType)
      : await queryOne<RoomType>(sql, params);
    return row!;
  },
  async findRoomTypeById(
    id: string,
    tenantId?: string,
  ): Promise<RoomType | null> {
    const sql = tenantId
      ? `SELECT * FROM room_types WHERE id = $1 AND tenant_id = $2`
      : `SELECT * FROM room_types WHERE id = $1`;
    return queryOne<RoomType>(sql, tenantId ? [id, tenantId] : [id]);
  },

  // ORDER BY branch built from a fixed whitelist, never from raw user
  // input, room_sort_mode is a CHECK-constrained column we control, not
  // something a request body sets directly.
  async listRoomTypes(propertyId: string): Promise<RoomType[]> {
    const propertyRow = await queryOne<{ room_sort_mode: string }>(
      `SELECT room_sort_mode FROM properties WHERE id = $1`,
      [propertyId],
    );
    const sortMode = propertyRow?.room_sort_mode ?? "price";

    const ORDER_BY: Record<string, string> = {
      alphabetical: "rt.name ASC",
      price: "rt.base_price_ngn ASC",
      newest: "rt.created_at DESC",
      oldest: "rt.created_at ASC",
      custom: "rt.display_order ASC NULLS LAST, rt.base_price_ngn ASC",
      rating: "avg_rating DESC NULLS LAST, rt.base_price_ngn ASC",
    };
    const orderClause = ORDER_BY[sortMode] ?? ORDER_BY["price"];

    return query<RoomType>(
      `SELECT rt.*,
              (SELECT AVG(rating) FROM reviews WHERE room_type_id = rt.id AND status = 'approved') AS avg_rating
       FROM room_types rt
       WHERE rt.property_id = $1 AND rt.status = 'active'
       ORDER BY ${orderClause}`,
      [propertyId],
    );
  },

  async setRoomSortMode(
    propertyId: string,
    tenantId: string,
    mode: string,
  ): Promise<void> {
    await query(
      `UPDATE properties SET room_sort_mode = $1 WHERE id = $2 AND tenant_id = $3`,
      [mode, propertyId, tenantId],
    );
  },

  async setGanttMaxVisibleRooms(
    propertyId: string,
    tenantId: string,
    max: number,
  ): Promise<void> {
    await query(
      `UPDATE properties SET gantt_max_visible_rooms = $1 WHERE id = $2 AND tenant_id = $3`,
      [max, propertyId, tenantId],
    );
  },

  // Batched, not one UPDATE per room type: a host reordering 10 rooms via
  // drag-and-drop shouldn't fire 10 round trips.
  async reorderRoomTypes(
    propertyId: string,
    tenantId: string,
    orderedIds: string[],
  ): Promise<void> {
    await query(
      `UPDATE room_types rt SET display_order = data.ord
       FROM (SELECT * FROM UNNEST($1::uuid[], $2::int[]) AS t(id, ord)) data
       WHERE rt.id = data.id AND rt.property_id = $3 AND rt.tenant_id = $4`,
      [orderedIds, orderedIds.map((_, i) => i), propertyId, tenantId],
    );
  },

  async listRoomTypesWithOccupancy(
    propertyId: string,
  ): Promise<RoomTypeWithOccupancy[]> {
    return query<RoomTypeWithOccupancy>(
      `SELECT
       rt.*,
       CASE
         WHEN m.open_count > 0 THEN 'maintenance'
         WHEN l.lease_id IS NOT NULL THEN 'occupied'
         ELSE 'vacant'
       END AS occupancy_status,
       COALESCE(m.open_count, 0) AS active_maintenance_count
     FROM room_types rt
     LEFT JOIN LATERAL (
       SELECT id AS lease_id FROM bookings
       WHERE room_type_id = rt.id AND status IN ('confirmed', 'checked_in')
         AND check_in <= CURRENT_DATE AND check_out >= CURRENT_DATE
       LIMIT 1
     ) l ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS open_count FROM maintenance_requests
       WHERE room_type_id = rt.id AND status IN ('open', 'in_progress')
     ) m ON true
     WHERE rt.property_id = $1
     ORDER BY rt.name ASC`,
      [propertyId],
    );
  },

  // Atomic: one query, all status counts + month-over-month new-listing growth.
  async getStatsForTenant(tenantId: string): Promise<PropertyStats> {
    const row = await queryOne<{
      active_count: string;
      draft_count: string;
      paused_count: string;
      archived_count: string;
      current_month_new: string;
      previous_month_new: string;
    }>(
      `SELECT
       COUNT(*) FILTER (WHERE status = 'active')   AS active_count,
       COUNT(*) FILTER (WHERE status = 'draft')    AS draft_count,
       COUNT(*) FILTER (WHERE status = 'paused')   AS paused_count,
       COUNT(*) FILTER (WHERE status = 'archived') AS archived_count,
       COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS current_month_new,
       COUNT(*) FILTER (
         WHERE created_at >= date_trunc('month', now()) - interval '1 month'
           AND created_at <  date_trunc('month', now())
       ) AS previous_month_new
     FROM properties
     WHERE tenant_id = $1`,
      [tenantId],
    );

    const current = Number(row?.current_month_new ?? 0);
    const previous = Number(row?.previous_month_new ?? 0);
    const growthPct =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : ((current - previous) / previous) * 100;

    return {
      activeCount: Number(row?.active_count ?? 0),
      draftCount: Number(row?.draft_count ?? 0),
      pausedCount: Number(row?.paused_count ?? 0),
      archivedCount: Number(row?.archived_count ?? 0),
      currentMonthNewListings: current,
      previousMonthNewListings: previous,
      newListingsGrowthPct: Math.round(growthPct * 10) / 10,
    };
  },

  async countAllForAdmin(): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM properties WHERE status != 'archived'`,
    );
    return parseInt(row?.count ?? "0", 10);
  },

  async updateRoomType(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      description: string;
      maxOccupancy: number;
      basePriceNgn: number;
      images: string[];
      amenities: string[];
      quantity: number;
      status: RoomStatus;
    }>,
    client?: PoolClient,
  ): Promise<RoomType | null> {
    const fields: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    const columnMap: Record<string, string> = {
      name: "name",
      description: "description",
      maxOccupancy: "max_occupancy",
      basePriceNgn: "base_price_ngn",
      images: "images",
      amenities: "amenities",
      quantity: "quantity",
      status: "status",
    };

    for (const [key, column] of Object.entries(columnMap)) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) {
        fields.push(`${column} = $${i}`);
        params.push(value);
        i++;
      }
    }

    if (fields.length === 0) return this.findRoomTypeById(id, tenantId);

    params.push(id, tenantId);
    const sql = `
    UPDATE room_types
    SET ${fields.join(", ")}, updated_at = now()
    WHERE id = $${i} AND tenant_id = $${i + 1}
    RETURNING *`;

    // const exec = client
    //   ? client.query.bind(client)
    //   : (query as unknown as typeof client extends undefined ? never : never);
    const row = client
      ? ((await client.query(sql, params)).rows[0] as RoomType | undefined)
      : await queryOne<RoomType>(sql, params);
    return row ?? null;
  },

  async listAllForAdmin(page = 1, limit = 20, tenantId?: string) {
    const params: unknown[] = [limit, (page - 1) * limit];
    const tenantClause = tenantId
      ? `AND p.tenant_id = $${params.push(tenantId)}`
      : "";
    return query<
      Property & {
        tenant_name: string;
        tenant_id: string;
        tenant_email: string;
      }
    >(
      `SELECT p.*, t.name AS tenant_name, t.id AS tenant_id, u.email AS tenant_email
     FROM properties p
     JOIN tenants t ON t.id = p.tenant_id
     JOIN users   u ON u.id = t.owner_user_id
     WHERE p.status != 'archived' ${tenantClause}
     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
      params,
    );
  },

  async getStatsAllForAdmin(): Promise<{
    active: number;
    draft: number;
    paused: number;
    archived: number;
  }> {
    const row = await queryOne<{
      active: string;
      draft: string;
      paused: string;
      archived: string;
    }>(
      `SELECT
       COUNT(*) FILTER (WHERE status = 'active')   AS active,
       COUNT(*) FILTER (WHERE status = 'draft')    AS draft,
       COUNT(*) FILTER (WHERE status = 'paused')   AS paused,
       COUNT(*) FILTER (WHERE status = 'archived') AS archived
     FROM properties`,
    );
    return {
      active: Number(row?.active ?? 0),
      draft: Number(row?.draft ?? 0),
      paused: Number(row?.paused ?? 0),
      archived: Number(row?.archived ?? 0),
    };
  },
};

export interface PropertyStats {
  activeCount: number;
  draftCount: number;
  pausedCount: number;
  archivedCount: number;
  currentMonthNewListings: number;
  previousMonthNewListings: number;
  newListingsGrowthPct: number;
}
