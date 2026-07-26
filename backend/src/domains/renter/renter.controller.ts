import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { renterService } from "./renter.service";
import { AppError } from "@booking/shared";

export const CreateRenterHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const result = await renterService.createRenter(req.tenantId, req.body);
  res.status(201).json({ success: true, data: result });
});

export const ListRentersHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const result = await renterService.listRenters(req.tenantId);
  res.status(200).json({ success: true, data: result });
});

export const GetRenterDetailHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await renterService.getRenterDetail(req.params["id"] as string);
  res.status(200).json({ success: true, data: result });
});
export const ExportTenantRentersHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const tenantId = req.tenantId;

  const { nanoid } = await import("nanoid");
  const { enqueueExportJob, runExportJob } = await import("../../utils/runExportJob");

  const jobId = nanoid(21);
  await enqueueExportJob(jobId);
  res.status(202).json({ success: true, data: { jobId } });

  const { auditRepository } = await import("../audit/audit.repository");
  await auditRepository.log({ action: "exported", resource: "tenants_pdf", tenantId, userId: req.user?.userId, req });

  void runExportJob(jobId, async () => {
    const { renters } = await renterService.listRenters(tenantId);
    return {
      title: "Tenants Export",
      subtitle: "All long-term lease tenants",
      generatedAt: new Date(),
      columns: [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "emergency", label: "Emergency Contact" },
      ],
      rows: renters.map((r: { full_name: string; email: string | null; phone: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null }) => ({
        name: r.full_name,
        email: r.email ?? "—",
        phone: r.phone ?? "—",
        emergency: r.emergency_contact_name ? `${r.emergency_contact_name} · ${r.emergency_contact_phone ?? "—"}` : "—",
      })),
    };
  }, `renters_export_${tenantId}`);
});