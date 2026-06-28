import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate }                          from "../../middleware/validate.middleware";
import {
  ListPublicPropertiesHandler,
  GetTenantPropertiesHandler,
  GetPropertyHandler,
  CreatePropertyHandler,
  CreateRoomTypeHandler,
  SeedCalendarHandler,
  BlockDatesHandler,
  GetAvailabilityHandler,
} from "./property.controller";
import { blockDatesSchema, createPropertySchema, createRoomTypeSchema, seedCalendarSchema } from "./property.validator";

//  Routes 

const propertyRouter = Router();

// Public: no auth required
propertyRouter.get("/",                                    ListPublicPropertiesHandler);
propertyRouter.get("/:propertyId",                         GetPropertyHandler);
propertyRouter.get("/room-types/:roomTypeId/availability", GetAvailabilityHandler);

// Host: tenant context required
propertyRouter.get(   "/mine",                                  authenticate, requireTenantMember, GetTenantPropertiesHandler);
propertyRouter.post(  "/",                                      authenticate, requireTenantMember, validate(createPropertySchema),  CreatePropertyHandler);
propertyRouter.post(  "/:propertyId/room-types",                authenticate, requireTenantMember, validate(createRoomTypeSchema),  CreateRoomTypeHandler);
propertyRouter.post(  "/room-types/:roomTypeId/calendar",       authenticate, requireTenantMember, validate(seedCalendarSchema),    SeedCalendarHandler);
propertyRouter.patch( "/room-types/:roomTypeId/block",          authenticate, requireTenantMember, validate(blockDatesSchema),      BlockDatesHandler);

export default propertyRouter;