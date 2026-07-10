import {
  propertyRepository,
  PropertySearchFilters,
  RoomType,
} from "./property.repository";
import { availabilityRepository } from "../availability/availability.repository";
import { AppError } from "../../utils/AppError";
import { PropertyAddress, PropertyType } from "../../types";
import { query, withTransaction } from "@booking/shared";
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
    },
  ) {
    return propertyRepository.createProperty({ tenantId, ...body });
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
  const property = await propertyRepository.findPropertyById(propertyId, tenantId);
  if (!property) throw AppError.notFound("Property not found.");

  const roomTypes = await propertyRepository.listRoomTypesWithOccupancy(propertyId);

  const occupied    = roomTypes.filter((r) => r.occupancy_status === "occupied").length;
  const vacant      = roomTypes.filter((r) => r.occupancy_status === "vacant").length;
  const maintenance = roomTypes.filter((r) => r.occupancy_status === "maintenance").length;
  const revenue     = roomTypes.reduce((sum, r) => sum + Number(r.base_price_ngn), 0);

  return {
    property,
    roomTypes,
    summary: { total: roomTypes.length, occupied, vacant, maintenance, revenue },
  };
},
};
