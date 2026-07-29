import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listTenantAuditLogsQuerySchema, listMyAuditLogsQuerySchema } from "./audit.validator";
import { GetTenantAuditLogsHandler, GetMyAuditLogsHandler } from "./audit.controller";

const router = Router();

router.get("/tenant", authenticate, requireTenantMember, validate(listTenantAuditLogsQuerySchema, "query"), GetTenantAuditLogsHandler);
router.get("/me",     authenticate,                      validate(listMyAuditLogsQuerySchema, "query"),    GetMyAuditLogsHandler);

export default router;