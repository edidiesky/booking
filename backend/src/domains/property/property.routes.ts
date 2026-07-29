import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  ListPublicPropertiesHandler,
  GetTenantPropertiesHandler,
  GetTenantPropertyStatsHandler,
  GetPropertyHandler,
  CreatePropertyHandler,
  CreateRoomTypeHandler,
  SeedCalendarHandler,
  BlockDatesHandler,
  GetAvailabilityHandler,
  DeletePropertyHandler,
  GetRoomTypeDetailHandler,
  GetPropertyDetailHandler,
  StreamRoomTypeAvailabilityHandler,
  ImportRoomTypesHandler,
  SetRoomSortModeHandler,
  ReorderRoomTypesHandler,
  ExportTenantRoomsHandler,
  SetGanttMaxVisibleRoomsHandler,
  GetTenantBookingsInRangeHandler,
} from "./property.controller";
import {
  blockDatesSchema,
  createPropertySchema,
  createRoomTypeSchema,
  seedCalendarSchema,
} from "./property.validator";

const propertyRouter = Router();
propertyRouter.get("/mine", authenticate, requireTenantMember, GetTenantPropertiesHandler);
propertyRouter.post("/mine/export", authenticate, requireTenantMember, ExportTenantRoomsHandler);
propertyRouter.get("/mine/stats", authenticate, requireTenantMember, GetTenantPropertyStatsHandler);
propertyRouter.get("/room-types/:roomTypeId/availability", GetAvailabilityHandler);
propertyRouter.get("/dashboard/:propertyId", authenticate, requireTenantMember, GetPropertyDetailHandler);

propertyRouter.get("/", ListPublicPropertiesHandler);
propertyRouter.get("/:propertyId", GetPropertyHandler);


// Host mutations
propertyRouter.post("/", authenticate, requireTenantMember, validate(createPropertySchema), CreatePropertyHandler);
propertyRouter.delete("/:propertyId", authenticate, requireTenantMember, DeletePropertyHandler);
propertyRouter.get("/room-types/:roomTypeId", authenticate, requireTenantMember, GetRoomTypeDetailHandler);
propertyRouter.post("/:propertyId/room-types", authenticate, requireTenantMember, validate(createRoomTypeSchema), CreateRoomTypeHandler);
propertyRouter.post("/:propertyId/room-types/import", authenticate, requireTenantMember, ImportRoomTypesHandler);
propertyRouter.patch("/:propertyId/room-sort-mode", authenticate, requireTenantMember, SetRoomSortModeHandler);
propertyRouter.patch("/:propertyId/gantt-max-visible-rooms", authenticate, requireTenantMember, SetGanttMaxVisibleRoomsHandler);
propertyRouter.get("/gantt/bookings-in-range", authenticate, requireTenantMember, GetTenantBookingsInRangeHandler);
propertyRouter.patch("/:propertyId/room-types/reorder", authenticate, requireTenantMember, ReorderRoomTypesHandler);
propertyRouter.post("/room-types/:roomTypeId/calendar", authenticate, requireTenantMember, validate(seedCalendarSchema), SeedCalendarHandler);
propertyRouter.patch("/room-types/:roomTypeId/block", authenticate, requireTenantMember, validate(blockDatesSchema), BlockDatesHandler);
propertyRouter.get("/room-types/:roomTypeId/availability/stream", StreamRoomTypeAvailabilityHandler);

export default propertyRouter;