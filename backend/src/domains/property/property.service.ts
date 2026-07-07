import { propertyRepository, PropertySearchFilters, RoomType }    from "./property.repository";
import { availabilityRepository } from "../availability/availability.repository";
import { AppError }               from "../../utils/AppError";
import { PropertyAddress, PropertyType } from "../../types";
import { withTransaction } from "../../config/database";
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
    const property = await propertyRepository.findPropertyById(propertyId, tenantId);
    if (!property) throw AppError.notFound("Property not found.");
    const roomTypes = await propertyRepository.listRoomTypes(property.id);
    return { ...property, roomTypes };
  },

  async createProperty(tenantId: string, body: {
    name:          string;
    description?:  string;
    propertyType:  PropertyType;
    address:       PropertyAddress;
    amenities?:    string[];
    images?:       string[];
    checkInTime?:  string;
    checkOutTime?: string;
  }) {
    return propertyRepository.createProperty({ tenantId, ...body });
  },

async createRoomType(tenantId: string, propertyId: string, body: {
  name:          string;
  description?:  string;
  maxOccupancy:  number;
  basePriceNgn:  number;
  images?:       string[];
  amenities?:    string[];
  quantity:      number;
}) {
  const property = await propertyRepository.findPropertyById(propertyId, tenantId);
  if (!property) throw AppError.notFound("Property not found.");

  let roomType!: RoomType;

  await withTransaction(async (client) => {
    roomType = await propertyRepository.createRoomType(
      { propertyId: property.id, tenantId, ...body },
      client
    );

    const startDate = new Date();
    const endDate   = new Date();
    endDate.setDate(endDate.getDate() + SEED_WINDOW_DAYS);

    await availabilityRepository.seedCalendar({
      roomTypeId: roomType.id,
      tenantId,
      startDate:  startDate.toISOString().split("T")[0],
      endDate:    endDate.toISOString().split("T")[0],
      totalRooms: roomType.quantity,
    }, client);
  });

  return roomType;
},

  async seedCalendar(tenantId: string, roomTypeId: string, startDate: string, endDate: string) {
    const roomType = await propertyRepository.findRoomTypeById(roomTypeId, tenantId);
    if (!roomType) throw AppError.notFound("Room type not found.");
    
    await availabilityRepository.seedCalendar({
      roomTypeId,
      tenantId,
      startDate,
      endDate,
      totalRooms: roomType.quantity,
    });
  },

  async setDateBlock(tenantId: string, roomTypeId: string, startDate: string, endDate: string, block: boolean) {
    const roomType = await propertyRepository.findRoomTypeById(roomTypeId, tenantId);
    if (!roomType) throw AppError.notFound("Room type not found.");
    if (block) {
      await availabilityRepository.blockDates({ roomTypeId, tenantId, startDate, endDate });
    } else {
      await availabilityRepository.unblockDates({ roomTypeId, startDate, endDate });
    }
  },

  async getAvailability(roomTypeId: string, checkIn: string, checkOut: string) {
    return availabilityRepository.getAvailability(roomTypeId, checkIn, checkOut);
  },
};

