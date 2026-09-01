import { Router } from "express";
import {
  authenticate,
  requireTenantMember,
} from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/require-permission.middleware";
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
  UpdateRoomTypeHandler,
  UpdatePropertyHandler,
} from "./property.controller";
import {
  blockDatesSchema,
  createPropertySchema,
  createRoomTypeSchema,
  seedCalendarSchema,
  updatePropertySchema,
  updateRoomTypeSchema,
} from "./property.validator";

const propertyRouter = Router();

// Tenant reads
propertyRouter.get(
  "/mine",
  authenticate,
  requireTenantMember,
  requirePermission("property", "read"),
  GetTenantPropertiesHandler,
);
propertyRouter.get(
  "/mine/stats",
  authenticate,
  requireTenantMember,
  requirePermission("property", "read"),
  GetTenantPropertyStatsHandler,
);
propertyRouter.post(
  "/mine/export",
  authenticate,
  requireTenantMember,
  requirePermission("report", "export"),
  ExportTenantRoomsHandler,
);
propertyRouter.get(
  "/dashboard/:propertyId",
  authenticate,
  requireTenantMember,
  requirePermission("property", "read"),
  GetPropertyDetailHandler,
);
propertyRouter.get(
  "/room-types/:roomTypeId",
  authenticate,
  requireTenantMember,
  requirePermission("room_type", "read"),
  GetRoomTypeDetailHandler,
);
propertyRouter.get(
  "/gantt/bookings-in-range",
  authenticate,
  requireTenantMember,
  requirePermission("booking", "read"),
  GetTenantBookingsInRangeHandler,
);

// Public
propertyRouter.get(
  "/room-types/:roomTypeId/availability",
  GetAvailabilityHandler,
);
propertyRouter.get(
  "/room-types/:roomTypeId/availability/stream",
  StreamRoomTypeAvailabilityHandler,
);
propertyRouter.get("/", ListPublicPropertiesHandler);
propertyRouter.get("/:propertyId", GetPropertyHandler);

// Mutations
propertyRouter.post(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("property", "create"),
  validate(createPropertySchema),
  CreatePropertyHandler,
);
propertyRouter.patch(
  "/:propertyId",
  authenticate,
  requireTenantMember,
  requirePermission("property", "update"),
  validate(updatePropertySchema),
  UpdatePropertyHandler,
);
propertyRouter.delete(
  "/:propertyId",
  authenticate,
  requireTenantMember,
  requirePermission("property", "delete"),
  DeletePropertyHandler,
);

propertyRouter.post(
  "/:propertyId/room-types",
  authenticate,
  requireTenantMember,
  requirePermission("room_type", "create"),
  validate(createRoomTypeSchema),
  CreateRoomTypeHandler,
);
propertyRouter.post(
  "/:propertyId/room-types/import",
  authenticate,
  requireTenantMember,
  requirePermission("room_type", "create"),
  ImportRoomTypesHandler,
);
propertyRouter.patch(
  "/room-types/:roomTypeId",
  authenticate,
  requireTenantMember,
  requirePermission("room_type", "update"),
  validate(updateRoomTypeSchema),
  UpdateRoomTypeHandler,
);
propertyRouter.patch(
  "/:propertyId/room-types/reorder",
  authenticate,
  requireTenantMember,
  requirePermission("room_type", "update"),
  ReorderRoomTypesHandler,
);
propertyRouter.patch(
  "/:propertyId/room-sort-mode",
  authenticate,
  requireTenantMember,
  requirePermission("property", "update"),
  SetRoomSortModeHandler,
);
propertyRouter.patch(
  "/:propertyId/gantt-max-visible-rooms",
  authenticate,
  requireTenantMember,
  requirePermission("property", "update"),
  SetGanttMaxVisibleRoomsHandler,
);
propertyRouter.post(
  "/room-types/:roomTypeId/calendar",
  authenticate,
  requireTenantMember,
  requirePermission("room_type", "update"),
  validate(seedCalendarSchema),
  SeedCalendarHandler,
);
propertyRouter.patch(
  "/room-types/:roomTypeId/block",
  authenticate,
  requireTenantMember,
  requirePermission("room_type", "update"),
  validate(blockDatesSchema),
  BlockDatesHandler,
);

export default propertyRouter;
