import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { propertyService }   from "./property.service";
import { AppError }          from "../../utils/AppError";
import { PropertyAddress, PropertyType } from "../../types";
import { propertyRepository } from "./property.repository";
import { availabilityBroadcaster, logger, jobRepository } from "@booking/shared";
import { nanoid } from "nanoid";
import { auditRepository } from "../audit/audit.repository";

export const StreamRoomTypeAvailabilityHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const roomTypeId = req.params["roomTypeId"] as string;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const unsubscribe = await availabilityBroadcaster.subscribe(roomTypeId, (payload) => {
    logger.info("sse_availability_frame_sent", { event: "sse_availability_frame_sent", roomTypeId, payload });
    res.write(`event: availability\ndata: ${JSON.stringify(payload)}\n\n`);
  });

  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    void unsubscribe();
  });
});


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
    tenantId:     req.tenantId,
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


export const GetTenantPropertiesHandler = asyncHandler(async (req, res) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 20);
  const data  = await propertyRepository.listPropertiesWithRoomTypes(req.tenantId, page, limit);
  res.status(200).json({ success: true, data });
});

export const GetTenantPropertyStatsHandler = asyncHandler(async (req, res) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const stats = await propertyRepository.getStatsForTenant(req.tenantId);
  res.status(200).json({ success: true, data: stats });
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

export const ImportRoomTypesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { propertyId } = req.params as { propertyId: string };
  const { fileUrl } = req.body as { fileUrl?: string };
  if (!fileUrl) throw AppError.badRequest("fileUrl is required, upload the CSV first, then pass its URL here.");

  const property = await propertyRepository.findPropertyById(propertyId, req.tenantId);
  if (!property) throw AppError.notFound("Property.");

  const jobId = nanoid(21);
  // Initial state set before the worker even picks it up, so a client
  // that starts polling immediately after this responds doesn't get a
  // 404 (job not found) in the gap before the worker's first setState
  // call actually runs.
  await jobRepository.setState("csv_room_import", jobId, {
    jobId, jobType: "csv_room_import", state: "queued", progress: 0,
    updatedAt: new Date().toISOString(),
  });
  jobRepository.publishToQueue("room.import", "process", { jobId, propertyId, tenantId: req.tenantId, fileUrl });

  res.status(202).json({ success: true, data: { jobId } });
});
const SORT_MODES = ["alphabetical", "price", "rating", "newest", "oldest", "custom"];

export const SetRoomSortModeHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { propertyId } = req.params as { propertyId: string };
  const { mode } = req.body as { mode?: string };
  if (!mode || !SORT_MODES.includes(mode)) {
    throw AppError.badRequest(`mode must be one of: ${SORT_MODES.join(", ")}`);
  }
  await propertyRepository.setRoomSortMode(propertyId, req.tenantId, mode);
  res.status(200).json({ success: true, message: "Sort mode updated." });
});

export const ReorderRoomTypesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { propertyId } = req.params as { propertyId: string };
  const { roomTypeIds } = req.body as { roomTypeIds?: string[] };
  if (!roomTypeIds?.length) throw AppError.badRequest("roomTypeIds (ordered array) is required.");
  await propertyRepository.reorderRoomTypes(propertyId, req.tenantId, roomTypeIds);
  res.status(200).json({ success: true, message: "Order updated." });
});

export const ExportTenantRoomsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const tenantId = req.tenantId;

  const { enqueueExportJob, runExportJob } = await import("../../utils/runExportJob");

  const jobId = nanoid(21);
  await enqueueExportJob(jobId);
  res.status(202).json({ success: true, data: { jobId } });

  const { auditRepository } = await import("../audit/audit.repository");
  await auditRepository.log({ action: "exported", resource: "rooms_pdf", tenantId, userId: req.user?.userId, req });

  void runExportJob(jobId, async () => {
    const properties = await propertyRepository.listPropertiesWithRoomTypes(tenantId, 1, 200);
    const allRooms = properties.flatMap((p) => p.roomTypes);

    return {
      title: "Rooms Export",
      subtitle: "All room types across your properties",
      generatedAt: new Date(),
      columns: [
        { key: "name", label: "Room Type", width: "34%" },
        { key: "quantity", label: "Units", align: "right" as const, width: "14%" },
        { key: "occupancy", label: "Max Occupancy", align: "right" as const, width: "18%" },
        { key: "price", label: "Price (₦/night)", align: "right" as const, width: "20%" },
        { key: "status", label: "Status", width: "14%" },
      ],
      rows: allRooms.map((r) => ({
        name: r.name,
        quantity: String(r.quantity),
        occupancy: String(r.max_occupancy),
        price: Number(r.base_price_ngn).toLocaleString("en-NG"),
        status: r.status,
      })),
    };
  }, `rooms_export_${tenantId}`);
});

export const SetGanttMaxVisibleRoomsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { propertyId } = req.params as { propertyId: string };
  const { max } = req.body as { max?: number };
  if (!max || max < 1 || max > 50) throw AppError.badRequest("max must be between 1 and 50.");
  await propertyRepository.setGanttMaxVisibleRooms(propertyId, req.tenantId, max);
  res.status(200).json({ success: true, message: "Updated." });
});

export const GetTenantBookingsInRangeHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) throw AppError.badRequest("from and to (ISO dates) are required.");

  const { query } = await import("@booking/shared");
  const { toDto } = await import("../booking/booking.service");
  const rows = await query(
    `SELECT b.*, rt.name AS room_type_name, rt.images AS room_type_images, rt.quantity AS room_type_quantity,
            u.first_name AS guest_first_name, u.last_name AS guest_last_name
     FROM bookings b
     JOIN room_types rt ON rt.id = b.room_type_id
     JOIN users u ON u.id = b.guest_user_id
     WHERE b.tenant_id = $1
       AND b.status IN ('confirmed','checked_in','checked_out')
       AND b.check_in < $3::timestamptz
       AND b.check_out > $2::timestamptz
     ORDER BY b.check_in ASC`,
    [req.tenantId, from, to],
  );

  const bookings = rows.map((r: any) => toDto(r));
  res.status(200).json({ success: true, data: bookings });
});

export const UpdateRoomTypeHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const roomTypeId = req.params["roomTypeId"] as string;
  const data = await propertyService.updateRoomType(req.tenantId, roomTypeId, req.body);
  res.status(200).json({ success: true, message: "Room type updated.", data });
});

export const UpdatePropertyHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const propertyId = req.params["propertyId"] as string;
  const data = await propertyService.updateProperty(req.tenantId, propertyId, req.user.userId, req.body);
  res.status(200).json({ success: true, message: "Property updated.", data });
});

export const DeletePropertyHandler = asyncHandler(async (req, res) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const propertyId = req.params["propertyId"] as string;
  await propertyRepository.deleteProperty(propertyId, req.tenantId);

  await auditRepository.log({
    action: "deleted",
    resource: "property",
    resourceId: propertyId,
    tenantId: req.tenantId,
    userId: req.user?.userId,
  });

  const { outboxRepository, requestContext } = await import("@booking/shared");
  const client = requestContext.get()?.dbClient;
  if (client) {
    await outboxRepository.create("property.deleted", { propertyId }, client);
  }

  res.status(200).json({ success: true, message: "Property deleted." });
});