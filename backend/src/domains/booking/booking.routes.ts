
import { Router } from "express";
import { authenticate, authorize, requireTenantMember } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/require-permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CancelBookingHandler,
  CheckInHandler,
  CheckOutHandler,
  GetBookingHandler,
  GetMyBookingsHandler,
  GetTenantBookingsHandler,
  GetTenantBookingStatsHandler,
  InitiateBookingHandler,
  InternalCancelBookingHandler,
  ExportTenantBookingsHandler,
  TransitionBookingStatusHandler,
  GetRevenueTrendHandler,
  GetPropertyPerformanceHandler,
} from "./booking.controller";

import {
  cancelSchema,
  initiateSchema,
  listQuerySchema,
  tenantListQuerySchema,
  transitionStatusSchema,
} from "./booking.validator";
import { requireInternalSecret } from "../../middleware/internal.middleware";

const router = Router();

// Guest
router.post("/", authenticate, authorize("guest"), validate(initiateSchema), InitiateBookingHandler);
router.get("/mine", authenticate, authorize("guest"), validate(listQuerySchema, "query"), GetMyBookingsHandler);
router.patch("/:bookingId/cancel", authenticate, authorize("guest"), validate(cancelSchema), CancelBookingHandler);

// Tenant reads
router.get(
  "/tenant",
  authenticate,
  requireTenantMember,
  requirePermission("booking", "read"),
  validate(tenantListQuerySchema, "query"),
  GetTenantBookingsHandler,
);
router.get(
  "/tenant/stats",
  authenticate,
  requireTenantMember,
  requirePermission("booking", "read"),
  GetTenantBookingStatsHandler,
);
router.get(
  "/tenant/revenue-trend",
  authenticate,
  requireTenantMember,
  requirePermission("report", "read"),
  GetRevenueTrendHandler,
);
router.post(
  "/tenant/export",
  authenticate,
  requireTenantMember,
  requirePermission("booking", "export"),
  ExportTenantBookingsHandler,
);
router.get(
  "/property/:propertyId/performance",
  authenticate,
  requireTenantMember,
  requirePermission("report", "read"),
  GetPropertyPerformanceHandler,
);

// Internal
router.post("/internal/:bookingId/cancel", requireInternalSecret, InternalCancelBookingHandler);

// Shared read
router.get("/:bookingId", authenticate, GetBookingHandler);

// Tenant mutations
router.patch(
  "/:bookingId/checkin",
  authenticate,
  requireTenantMember,
  requirePermission("booking", "update"),
  CheckInHandler,
);
router.patch(
  "/:bookingId/checkout",
  authenticate,
  requireTenantMember,
  requirePermission("booking", "update"),
  CheckOutHandler,
);
router.patch(
  "/:bookingId/status",
  authenticate,
  requireTenantMember,
  requirePermission("booking", "approve"),
  validate(transitionStatusSchema),
  TransitionBookingStatusHandler,
);

export default router;