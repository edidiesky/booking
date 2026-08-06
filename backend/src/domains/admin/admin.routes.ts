import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/auth.middleware";
import {
  ListGuestsHandler, ListAdministratorsHandler,
  PromoteAdministratorHandler, DemoteAdministratorHandler,
  ListAuditLogsHandler,
  ListPropertiesAdminHandler,
  ListBookingsAdminHandler,
  ListPaymentsAdminHandler,
  GetCalendarAdminHandler,
  GetTenantActivityHandler
} from "./admin.controller";

const router = Router();
router.use(authenticate, authorize("platform:admin"));
router.get("/properties", ListPropertiesAdminHandler);
router.get("/bookings", ListBookingsAdminHandler);
router.get("/payments", ListPaymentsAdminHandler);
router.get("/calendar", GetCalendarAdminHandler);
router.get("/guests", ListGuestsHandler);
router.get("/audit-logs", ListAuditLogsHandler);
router.get("/administrators", ListAdministratorsHandler);
router.post("/administrators/:userId/promote", PromoteAdministratorHandler);
router.post("/administrators/:userId/demote", DemoteAdministratorHandler);
router.get("/tenants/:tenantId/activity", GetTenantActivityHandler);


export default router;