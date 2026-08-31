import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listQuerySchema } from "./auditEvent.validator";
import { ListAuditEventsHandler, GetAuditEventHandler } from "./auditEvent.controller";

const router = Router();

router.get("/",    authenticate, requireTenantMember, validate(listQuerySchema, "query"), ListAuditEventsHandler);
router.get("/:id", authenticate, requireTenantMember, GetAuditEventHandler);

export default router;