import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import { escrowRepository }  from "./escrow.repository";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { AppError }          from "../../utils/AppError";

const GetTenantEscrowHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const page    = Number(req.query["page"]  ?? 1);
  const limit   = Number(req.query["limit"] ?? 20);
  const records = await escrowRepository.listByTenant(req.tenantId, page, limit);
  res.status(200).json({ success: true, data: records });
});

const GetTenantEscrowStatsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const stats = await escrowRepository.getStatsForTenant(req.tenantId);
  res.status(200).json({ success: true, data: stats });
});

const GetEscrowByBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const record = await escrowRepository.findByBookingId(req.params["bookingId"] as string);
  if (!record) throw AppError.notFound("Escrow record not found.");
  if (req.user?.userType !== "platform:admin" && record.tenant_id !== req.tenantId) {
    throw AppError.forbidden("Access denied.");
  }
  res.status(200).json({ success: true, data: record });
});

const router = Router();

router.get("/",                     authenticate, requireTenantMember, GetTenantEscrowHandler);
router.get("/stats",                authenticate, requireTenantMember, GetTenantEscrowStatsHandler);
router.get("/booking/:bookingId",   authenticate, requireTenantMember, GetEscrowByBookingHandler);

export default router;