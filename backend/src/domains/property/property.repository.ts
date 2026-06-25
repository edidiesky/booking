import { PoolClient } from "pg";
import { query, queryOne } from "../../config/database";
import { PropertyType, PropertyStatus, RoomStatus, PropertyAddress } from "../../types";

export interface Property {
  id:             string;
  tenant_id:      string;
  name:           string;
  description?:   string;
  property_type:  PropertyType;
  address:        PropertyAddress;
  amenities:      string[];
  images:         string[];
  check_in_time:  string;
  check_out_time: string;
  status:         PropertyStatus;
  created_at:     Date;
  updated_at:     Date;
}

export interface RoomType {
  id:             string;
  property_id:    string;
  tenant_id:      string;
  name:           string;
  description?:   string;
  max_occupancy:  number;
  base_price_ngn: number;
  images:         string[];
  amenities:      string[];
  quantity:       number;
  status:         RoomStatus;
  created_at:     Date;
  updated_at:     Date;
}

export const propertyRepository = {
  async createProperty(data: {
    tenantId:       string;
    name:           string;
    description?:   string;
    propertyType:   PropertyType;
    address:        PropertyAddress;
    amenities?:     string[];
    images?:        string[];
    checkInTime?:   string;
    checkOutTime?:  string;
  }, client?: PoolClient): Promise<Property> {
    const sql = `
      INSERT INTO properties (tenant_id, name, description, property_type, address, amenities, images, check_in_time, check_out_time)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9) RETURNING *`;
    const params = [
      data.tenantId, data.name, data.description ?? null, data.propertyType,
      JSON.stringify(data.address), data.amenities ?? [], data.images ?? [],
      data.checkInTime ?? "14:00", data.checkOutTime ?? "11:00",
    ];
    const row = client
      ? (await client.query(sql, params)).rows[0] as Property
      : await queryOne<Property>(sql, params);
    return row!;
  },

  async findPropertyById(id: string, tenantId?: string): Promise<Property | null> {
    const sql = tenantId
      ? `SELECT * FROM properties WHERE id = $1 AND tenant_id = $2`
      : `SELECT * FROM properties WHERE id = $1`;
    return queryOne<Property>(sql, tenantId ? [id, tenantId] : [id]);
  },

  async listProperties(tenantId: string, page = 1, limit = 20): Promise<Property[]> {
    const offset = (page - 1) * limit;
    return query<Property>(
      `SELECT * FROM properties WHERE tenant_id = $1 AND status != 'archived'
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
  },

  async updateProperty(id: string, tenantId: string, data: Partial<Pick<Property,
    "name" | "description" | "amenities" | "images" | "check_in_time" | "check_out_time" | "status"
  >>): Promise<Property | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = $${idx++}`); values.push(val); }
    }
    if (!fields.length) return null;
    fields.push("updated_at = now()");
    values.push(id, tenantId);
    return queryOne<Property>(
      `UPDATE properties SET ${fields.join(", ")} WHERE id = $${idx} AND tenant_id = $${idx + 1} RETURNING *`,
      values
    );
  },

  async createRoomType(data: {
    propertyId:    string;
    tenantId:      string;
    name:          string;
    description?:  string;
    maxOccupancy:  number;
    basePriceNgn:  number;
    images?:       string[];
    amenities?:    string[];
    quantity:      number;
  }): Promise<RoomType> {
    return (await queryOne<RoomType>(
      `INSERT INTO room_types (property_id, tenant_id, name, description, max_occupancy, base_price_ngn, images, amenities, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [data.propertyId, data.tenantId, data.name, data.description ?? null,
       data.maxOccupancy, data.basePriceNgn, data.images ?? [], data.amenities ?? [], data.quantity]
    ))!;
  },

  async findRoomTypeById(id: string, tenantId?: string): Promise<RoomType | null> {
    const sql = tenantId
      ? `SELECT * FROM room_types WHERE id = $1 AND tenant_id = $2`
      : `SELECT * FROM room_types WHERE id = $1`;
    return queryOne<RoomType>(sql, tenantId ? [id, tenantId] : [id]);
  },

  async listRoomTypes(propertyId: string): Promise<RoomType[]> {
    return query<RoomType>(
      `SELECT * FROM room_types WHERE property_id = $1 AND status = 'active' ORDER BY base_price_ngn ASC`,
      [propertyId]
    );
  },
};
