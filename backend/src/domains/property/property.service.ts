import {
  propertyRepository,
  PropertySearchFilters,
  RoomType,
} from "./property.repository";
import { availabilityRepository } from "../availability/availability.repository";
import { AppError } from "../../utils/AppError";
import {
  PropertyAddress,
  PropertyStatus,
  PropertyType,
  RoomStatus,
} from "../../types";
import { query, withTransaction } from "@booking/shared";
import { auditRepository } from "../audit/audit.repository";
const SEED_WINDOW_DAYS = 365;
export const propertyService = {
  async listPublicProperties(page: number, limit: number) {
    return propertyRepository.listPublicPropertiesWithRoomTypes(page, limit);
  },

  async searchProperties(filters: PropertySearchFilters) {
    return propertyRepository.searchPublicProperties(filters);
  },

  async listTenantProperties(tenantId: string, page: number, limit: number) {
    return propertyRepository.listProperties(tenantId, page, limit);
  },

  async getPropertyById(propertyId: string, tenantId?: string) {
    const property = await propertyRepository.findPropertyById(
      propertyId,
      tenantId,
    );
    if (!property) throw AppError.notFound("Property not found.");
    const roomTypes = await propertyRepository.listRoomTypes(property.id);
    return { ...property, roomTypes };
  },

  async createProperty(
    tenantId: string,
    body: {
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
  ) {
    const { outboxRepository, requestContext } =
      await import("@booking/shared");

    // Reuses the request's existing RLS-scoped transaction
    // (beginTenantScopedTransaction already opened one, for any
    // authenticated tenant-scoped request), rather than opening a
    // second, separate one via withTransaction. That matters concretely
    // for properties specifically: it's RLS-protected, a fresh pool
    // connection from withTransaction would have no
    // app.current_tenant_id set and the INSERT would be rejected by the
    // policy. Falls back to withTransaction only for callers with no
    // active request context (a script, a test), where there's nothing
    // to reuse.
    const existingClient = requestContext.get()?.dbClient;

    if (existingClient) {
      const property = await propertyRepository.createProperty(
        { tenantId, ...body },
        existingClient,
      );
      await outboxRepository.create(
        "property.created",
        {
          propertyId: property.id,
          tenantId,
          name: property.name,
          description: property.description,
          city: body.address?.city,
          propertyType: property.property_type,
          amenities: property.amenities,
          latitude: property.latitude,
          longitude: property.longitude,
          createdAt: property.created_at,
        },
        existingClient,
      );
      return property;
    }

    return withTransaction(async (client) => {
      const property = await propertyRepository.createProperty(
        { tenantId, ...body },
        client,
      );
      await outboxRepository.create(
        "property.created",
        {
          propertyId: property.id,
          tenantId,
          name: property.name,
          description: property.description,
          city: body.address?.city,
          propertyType: property.property_type,
          amenities: property.amenities,
          latitude: property.latitude,
          longitude: property.longitude,
          createdAt: property.created_at,
        },
        client,
      );
      await auditRepository.log({
        action: "created",
        resource: "property",
        resourceId: property.id,
        tenantId,
        newValue: { name: property.name, status: property.status },
      });
      return property;
    });
  },

  async createRoomType(
    tenantId: string,
    propertyId: string,
    body: {
      name: string;
      description?: string;
      maxOccupancy: number;
      basePriceNgn: number;
      images?: string[];
      amenities?: string[];
      quantity: number;
    },
  ) {
    const property = await propertyRepository.findPropertyById(
      propertyId,
      tenantId,
    );
    if (!property) throw AppError.notFound("Property not found.");

    let roomType!: RoomType;

    await withTransaction(async (client) => {
      roomType = await propertyRepository.createRoomType(
        { propertyId: property.id, tenantId, ...body },
        client,
      );

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + SEED_WINDOW_DAYS);

      await availabilityRepository.seedCalendar(
        {
          roomTypeId: roomType.id,
          tenantId,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          totalRooms: roomType.quantity,
        },
        client,
      );
    });

    return roomType;
  },

  async seedCalendar(
    tenantId: string,
    roomTypeId: string,
    startDate: string,
    endDate: string,
  ) {
    const roomType = await propertyRepository.findRoomTypeById(
      roomTypeId,
      tenantId,
    );
    if (!roomType) throw AppError.notFound("Room type not found.");

    await availabilityRepository.seedCalendar({
      roomTypeId,
      tenantId,
      startDate,
      endDate,
      totalRooms: roomType.quantity,
    });
  },

  async setDateBlock(
    tenantId: string,
    roomTypeId: string,
    startDate: string,
    endDate: string,
    block: boolean,
  ) {
    const roomType = await propertyRepository.findRoomTypeById(
      roomTypeId,
      tenantId,
    );
    if (!roomType) throw AppError.notFound("Room type not found.");
    if (block) {
      await availabilityRepository.blockDates({
        roomTypeId,
        tenantId,
        startDate,
        endDate,
      });
    } else {
      await availabilityRepository.unblockDates({
        roomTypeId,
        startDate,
        endDate,
      });
    }
  },

  async getAvailability(roomTypeId: string, checkIn: string, checkOut: string) {
    return availabilityRepository.getAvailability(
      roomTypeId,
      checkIn,
      checkOut,
    );
  },

  // property.service.ts, corrected
  async getRoomTypeDetail(roomTypeId: string, tenantId: string) {
    const roomType = await propertyRepository.findRoomTypeById(
      roomTypeId,
      tenantId,
    );
    if (!roomType) throw AppError.notFound("Room type not found.");

    const occupant = await query<{
      guest_name: string;
      check_out: string;
      status: string;
    }>(
      `SELECT u.first_name || ' ' || u.last_name AS guest_name, b.check_out, b.status
     FROM bookings b
     JOIN users u ON u.id = b.guest_user_id
     WHERE b.room_type_id = $1
       AND b.status IN ('confirmed', 'checked_in')
       AND b.check_in <= CURRENT_DATE AND b.check_out >= CURRENT_DATE
     ORDER BY b.check_in DESC
     LIMIT 1`,
      [roomTypeId],
    );

    return { roomType, occupant: occupant[0] ?? null };
  },
  // property.service.ts, add this method to the exported object

  async getPropertyDetail(propertyId: string, tenantId: string) {
    const property = await propertyRepository.findPropertyById(
      propertyId,
      tenantId,
    );
    if (!property) throw AppError.notFound("Property not found.");

    const roomTypes =
      await propertyRepository.listRoomTypesWithOccupancy(propertyId);

    const occupied = roomTypes.filter(
      (r) => r.occupancy_status === "occupied",
    ).length;
    const vacant = roomTypes.filter(
      (r) => r.occupancy_status === "vacant",
    ).length;
    const maintenance = roomTypes.filter(
      (r) => r.occupancy_status === "maintenance",
    ).length;
    const revenue = roomTypes.reduce(
      (sum, r) => sum + Number(r.base_price_ngn),
      0,
    );

    return {
      property,
      roomTypes,
      summary: {
        total: roomTypes.length,
        occupied,
        vacant,
        maintenance,
        revenue,
      },
    };
  },

  async updateRoomType(
    tenantId: string,
    roomTypeId: string,
    body: Partial<{
      name: string;
      description: string;
      maxOccupancy: number;
      basePriceNgn: number;
      images: string[];
      amenities: string[];
      quantity: number;
      status: RoomStatus;
    }>,
  ) {
    const existing = await propertyRepository.findRoomTypeById(
      roomTypeId,
      tenantId,
    );
    if (!existing) throw AppError.notFound("Room type not found.");

    const updated = await propertyRepository.updateRoomType(
      roomTypeId,
      tenantId,
      body,
    );
    if (!updated) throw AppError.notFound("Room type not found.");

    await auditRepository.log({
      action: "updated",
      resource: "room_type",
      resourceId: roomTypeId,
      tenantId,
      oldValue: {
        name: existing.name,
        base_price_ngn: existing.base_price_ngn,
        quantity: existing.quantity,
        status: existing.status,
      },
      newValue: body,
    });

    return updated;
  },
  async updateProperty(
    tenantId: string,
    propertyId: string,
    userId: string,
    body: Partial<{
      name: string;
      description: string;
      amenities: string[];
      images: string[];
      checkInTime: string;
      checkOutTime: string;
      status: PropertyStatus;
    }>,
  ) {
    const existing = await propertyRepository.findPropertyById(
      propertyId,
      tenantId,
    );
    if (!existing) throw AppError.notFound("Property not found.");

    const updated = await propertyRepository.updateProperty(
      propertyId,
      tenantId,
      {
        name: body.name,
        description: body.description,
        amenities: body.amenities,
        images: body.images,
        check_in_time: body.checkInTime,
        check_out_time: body.checkOutTime,
        status: body.status,
      },
    );
    if (!updated) throw AppError.notFound("Property not found.");

    await auditRepository.log({
      action: "updated",
      resource: "property",
      resourceId: propertyId,
      tenantId,
      userId,
      oldValue: {
        name: existing.name,
        status: existing.status,
        amenities: existing.amenities,
      },
      newValue: body,
    });

    return updated;
  },
};
