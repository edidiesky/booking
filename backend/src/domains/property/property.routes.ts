// property.routes.ts
import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import Joi from "joi";
import { propertyRepository }    from "./property.repository";
import { availabilityRepository } from "../availability/availability.repository";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate }              from "../../middleware/validate.middleware";
import { AppError }              from "../../utils/AppError";
import { PropertyAddress, PropertyType } from "../../types";

const createPropertySchema = Joi.object({
  name:         Joi.string().min(3).max(200).required(),
  description:  Joi.string().max(5000).optional(),
  propertyType: Joi.string().valid("shortlet","hotel","guesthouse").required(),
  address:      Joi.object({
    street: Joi.string().required(), city: Joi.string().required(),
    state:  Joi.string().required(), country: Joi.string().required(),
    lat:    Joi.number().optional(), lng: Joi.number().optional(),
  }).required(),
  amenities:    Joi.array().items(Joi.string()).optional(),
  images:       Joi.array().items(Joi.string().uri()).optional(),
  checkInTime:  Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
});

const createRoomTypeSchema = Joi.object({
  name:         Joi.string().min(2).max(100).required(),
  description:  Joi.string().max(2000).optional(),
  maxOccupancy: Joi.number().integer().min(1).required(),
  basePriceNgn: Joi.number().min(0).required(),
  images:       Joi.array().items(Joi.string().uri()).optional(),
  amenities:    Joi.array().items(Joi.string()).optional(),
  quantity:     Joi.number().integer().min(1).required(),
});

const seedCalendarSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

const blockDatesSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  block:     Joi.boolean().default(true),
});

// Handlers
const CreatePropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const body = req.body as { name: string; description?: string; propertyType: PropertyType; address: PropertyAddress; amenities?: string[]; images?: string[]; checkInTime?: string; checkOutTime?: string };
  const property = await propertyRepository.createProperty({ tenantId: req.tenantId, ...body });
  res.status(201).json({ success: true, data: property });
});

const GetPropertiesHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const props = await propertyRepository.listProperties(req.tenantId, Number(req.query["page"] ?? 1), Number(req.query["limit"] ?? 20));
  res.status(200).json({ success: true, data: props });
});

const GetPropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  const prop = await propertyRepository.findPropertyById(req.params["propertyId"] as string, req.tenantId);
  if (!prop) throw AppError.notFound("Property not found.");
  const roomTypes = await propertyRepository.listRoomTypes(prop.id);
  res.status(200).json({ success: true, data: { ...prop, roomTypes } });
});

const CreateRoomTypeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const property = await propertyRepository.findPropertyById(req.params["propertyId"] as string, req.tenantId);
  if (!property) throw AppError.notFound("Property not found.");
  const body = req.body as { name: string; description?: string; maxOccupancy: number; basePriceNgn: number; images?: string[]; amenities?: string[]; quantity: number };
  const roomType = await propertyRepository.createRoomType({ propertyId: property.id, tenantId: req.tenantId!, ...body });
  res.status(201).json({ success: true, data: roomType });
});

const SeedCalendarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { roomTypeId } = req.params as Record<string, string>;
  const { startDate, endDate } = req.body as { startDate: string; endDate: string };
  const roomType = await propertyRepository.findRoomTypeById(roomTypeId, req.tenantId);
  if (!roomType) throw AppError.notFound("Room type not found.");
  await availabilityRepository.seedCalendar({ roomTypeId, tenantId: req.tenantId!, startDate, endDate, totalRooms: roomType.quantity });
  res.status(200).json({ success: true, message: "Calendar seeded." });
});

const BlockDatesHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { roomTypeId } = req.params as Record<string, string>;
  const { startDate, endDate, block } = req.body as { startDate: string; endDate: string; block: boolean };
  if (block) {
    await availabilityRepository.blockDates({ roomTypeId, tenantId: req.tenantId!, startDate, endDate });
  } else {
    await availabilityRepository.unblockDates({ roomTypeId, startDate, endDate });
  }
  res.status(200).json({ success: true, message: block ? "Dates blocked." : "Dates unblocked." });
});

const GetAvailabilityHandler = asyncHandler(async (req: Request, res: Response) => {
  const { roomTypeId }    = req.params as Record<string, string>;
  const { checkIn, checkOut } = req.query as Record<string, string>;
  if (!checkIn || !checkOut) throw AppError.badRequest("checkIn and checkOut are required.");
  const slots = await availabilityRepository.getAvailability(roomTypeId, checkIn, checkOut);
  res.status(200).json({ success: true, data: slots });
});

const propertyRouter = Router();
propertyRouter.post("/",                                     authenticate, requireTenantMember, validate(createPropertySchema), CreatePropertyHandler);
propertyRouter.get("/",                                      authenticate, requireTenantMember, GetPropertiesHandler);
propertyRouter.get("/:propertyId",                           GetPropertyHandler);
propertyRouter.post("/:propertyId/room-types",               authenticate, requireTenantMember, validate(createRoomTypeSchema), CreateRoomTypeHandler);
propertyRouter.post("/room-types/:roomTypeId/calendar",      authenticate, requireTenantMember, validate(seedCalendarSchema), SeedCalendarHandler);
propertyRouter.patch("/room-types/:roomTypeId/block",        authenticate, requireTenantMember, validate(blockDatesSchema), BlockDatesHandler);
propertyRouter.get("/room-types/:roomTypeId/availability",   GetAvailabilityHandler);
export default propertyRouter;
