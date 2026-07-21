import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  ListPublicPropertiesHandler,
  GetTenantPropertiesHandler,
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
} from "./property.controller";
import {
  blockDatesSchema,
  createPropertySchema,
  createRoomTypeSchema,
  seedCalendarSchema,
} from "./property.validator";

const propertyRouter = Router();
propertyRouter.get("/mine", authenticate, requireTenantMember, GetTenantPropertiesHandler);
propertyRouter.get("/room-types/:roomTypeId/availability", GetAvailabilityHandler);
propertyRouter.get("/dashboard/:propertyId", authenticate, requireTenantMember, GetPropertyDetailHandler);

propertyRouter.get("/", ListPublicPropertiesHandler);
propertyRouter.get("/:propertyId", GetPropertyHandler);


// Host mutations
propertyRouter.post("/", authenticate, requireTenantMember, validate(createPropertySchema), CreatePropertyHandler);
propertyRouter.delete("/:propertyId", authenticate, requireTenantMember, DeletePropertyHandler);
propertyRouter.get("/room-types/:roomTypeId", authenticate, requireTenantMember, GetRoomTypeDetailHandler);
propertyRouter.post("/:propertyId/room-types", authenticate, requireTenantMember, validate(createRoomTypeSchema), CreateRoomTypeHandler);
propertyRouter.post("/room-types/:roomTypeId/calendar", authenticate, requireTenantMember, validate(seedCalendarSchema), SeedCalendarHandler);
propertyRouter.patch("/room-types/:roomTypeId/block", authenticate, requireTenantMember, validate(blockDatesSchema), BlockDatesHandler);
propertyRouter.get("/room-types/:roomTypeId/availability/stream", StreamRoomTypeAvailabilityHandler);

export default propertyRouter;