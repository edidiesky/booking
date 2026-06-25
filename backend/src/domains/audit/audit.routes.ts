import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import { auditRepository }   from "./audit.repository";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { AppError }          from "../../utils/AppError";

const GetTenantAuditLogsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 50);
  const logs  = await auditRepository.listByTenant(req.tenantId, page, limit);
  res.status(200).json({ success: true, data: logs });
});

const GetMyAuditLogsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 50);
  const logs  = await auditRepository.listByUser(req.user.userId, page, limit);
  res.status(200).json({ success: true, data: logs });
});

const router = Router();

router.get("/tenant",  authenticate, requireTenantMember,           GetTenantAuditLogsHandler);
router.get("/me",      authenticate,                                 GetMyAuditLogsHandler);

export default router;
