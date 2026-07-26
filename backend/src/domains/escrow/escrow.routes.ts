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

const ExportTenantEscrowHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const tenantId = req.tenantId;

  const { nanoid } = await import("nanoid");
  const { enqueueExportJob, runExportJob } = await import("../../utils/runExportJob");

  const jobId = nanoid(21);
  await enqueueExportJob(jobId);
  res.status(202).json({ success: true, data: { jobId } });

  const { auditRepository } = await import("../audit/audit.repository");
  await auditRepository.log({ action: "exported", resource: "escrow_pdf", tenantId, userId: req.user?.userId, req });

  void runExportJob(jobId, async () => {
    const records = await escrowRepository.listByTenant(tenantId, 1, 1000);
    return {
      title: "Escrow Export",
      subtitle: "All escrow records for your properties",
      generatedAt: new Date(),
      columns: [
        { key: "ref", label: "Booking Ref" },
        { key: "status", label: "Status" },
        { key: "amount", label: "Amount (₦)", align: "right" as const },
        { key: "payout", label: "Host Payout (₦)", align: "right" as const },
        { key: "heldAt", label: "Held" },
        { key: "releasedAt", label: "Released" },
      ],
      rows: records.map((e) => ({
        ref: e.booking_ref ?? "—",
        status: e.status,
        amount: Number(e.amount_ngn).toLocaleString("en-NG"),
        payout: Number(e.host_payout_ngn).toLocaleString("en-NG"),
        heldAt: new Date(e.held_at).toLocaleDateString("en-NG"),
        releasedAt: e.released_at ? new Date(e.released_at).toLocaleDateString("en-NG") : "—",
      })),
    };
  }, `escrow_export_${tenantId}`);
});

const router = Router();

router.get("/",                     authenticate, requireTenantMember, GetTenantEscrowHandler);
router.get("/export",               authenticate, requireTenantMember, ExportTenantEscrowHandler);
router.get("/stats",                authenticate, requireTenantMember, GetTenantEscrowStatsHandler);
router.get("/booking/:bookingId",   authenticate, requireTenantMember, GetEscrowByBookingHandler);

export default router;