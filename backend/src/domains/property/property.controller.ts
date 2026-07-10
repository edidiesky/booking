import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { propertyService }   from "./property.service";
import { AppError }          from "../../utils/AppError";
import { PropertyAddress, PropertyType } from "../../types";
import { propertyRepository } from "./property.repository";


export const CreatePropertyHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const body = req.body as {
    name:          string;
    description?:  string;
    propertyType:  PropertyType;
    address:       PropertyAddress;
    amenities?:    string[];
    images?:       string[];
    checkInTime?:  string;
    checkOutTime?: string;
  };
  const data = await propertyService.createProperty(req.tenantId, body);
  res.status(201).json({ success: true, data });
});

export const CreateRoomTypeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const body = req.body as {
    name:          string;
    description?:  string;
    maxOccupancy:  number;
    basePriceNgn:  number;
    images?:       string[];
    amenities?:    string[];
    quantity:      number;
  };
  const data = await propertyService.createRoomType(
    req.tenantId,
    req.params["propertyId"] as string,
    body,
  );
  res.status(201).json({ success: true, data });
});

export const ListPublicPropertiesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = req.query as Record<string, string>;
  const results = await propertyService.searchProperties({
    search:       q["search"],
    propertyType: q["propertyType"] as PropertyType | undefined,
    city:         q["city"],
    minPrice:     q["minPrice"] ? Number(q["minPrice"]) : undefined,
    maxPrice:     q["maxPrice"] ? Number(q["maxPrice"]) : undefined,
    guests:       q["guests"] ? Number(q["guests"]) : undefined,
    sort:         q["sort"] as "price_asc" | "price_desc" | "newest" | undefined,
    page:         Number(q["page"] ?? 1),
    limit:        Number(q["limit"] ?? 20),
  });
  res.status(200).json({ success: true, data: results });
});

export const SeedCalendarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { roomTypeId }       = req.params as Record<string, string>;
  const { startDate, endDate } = req.body as { startDate: string; endDate: string };
  await propertyService.seedCalendar(req.tenantId, roomTypeId, startDate, endDate);
  res.status(200).json({ success: true, message: "Calendar seeded." });
});

export const BlockDatesHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { roomTypeId }               = req.params as Record<string, string>;
  const { startDate, endDate, block } = req.body as { startDate: string; endDate: string; block: boolean };
  await propertyService.setDateBlock(req.tenantId, roomTypeId, startDate, endDate, block);
  res.status(200).json({ success: true, message: block ? "Dates blocked." : "Dates unblocked." });
});

export const GetAvailabilityHandler = asyncHandler(async (req: Request, res: Response) => {
  const { roomTypeId }        = req.params as Record<string, string>;
  const { checkIn, checkOut } = req.query  as Record<string, string>;
  if (!checkIn || !checkOut)  throw AppError.badRequest("checkIn and checkOut are required.");
  const data = await propertyService.getAvailability(roomTypeId, checkIn, checkOut);
  res.status(200).json({ success: true, data });
});

export const DeletePropertyHandler = asyncHandler(async (req, res) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  await propertyRepository.deleteProperty(req.params["propertyId"] as string, req.tenantId);
  res.status(200).json({ success: true, message: "Property deleted." });
});

export const GetTenantPropertiesHandler = asyncHandler(async (req, res) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 20);
  const data  = await propertyRepository.listPropertiesWithRoomTypes(req.tenantId, page, limit);
  res.status(200).json({ success: true, data });
});

export const GetPropertyHandler = asyncHandler(async (req, res) => {
  const data = await propertyRepository.findPropertyWithRoomTypes(
    req.params["propertyId"] as string,
    req.tenantId,
  );
  if (!data) throw AppError.notFound("Property not found.");
  res.status(200).json({ success: true, data });
});

export const GetRoomTypeDetailHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const result = await propertyService.getRoomTypeDetail(req.params["roomTypeId"] as string, req.tenantId);
  res.status(200).json({ success: true, data: result });
});

export const GetPropertyDetailHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const result = await propertyService.getPropertyDetail(req.params["propertyId"] as string, req.tenantId);
  res.status(200).json({ success: true, data: result });
});