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
}


export interface RoomTypeWithOccupancy extends RoomType {
  occupancy_status:         "occupied" | "vacant" | "maintenance";
  active_maintenance_count: number;
  current_tenant_name:      string | null;
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
    },
    client?: PoolClient,
  ): Promise<Property> {
    const sql = `
      INSERT INTO properties
        (tenant_id, name, description, property_type, address, amenities, images, check_in_time, check_out_time, status)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,'active')
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

  async listRoomTypes(propertyId: string): Promise<RoomType[]> {
    return query<RoomType>(
      `SELECT * FROM room_types WHERE property_id = $1 AND status = 'active'
       ORDER BY base_price_ngn ASC`,
      [propertyId],
    );
  },
  async listRoomTypesWithOccupancy(propertyId: string): Promise<RoomTypeWithOccupancy[]> {
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
};
