import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { campaignService } from "./campaign.service";
import { AppError } from "../../utils/AppError";

export const CreateCampaignHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const campaign = await campaignService.create(req.tenantId, req.user.userId, req.body);
  res.status(201).json({ success: true, data: campaign });
});

export const SetAudienceHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { campaignId } = req.params as { campaignId: string };
  const preview = await campaignService.setAudience(campaignId, req.tenantId, req.body);
  res.status(200).json({ success: true, data: preview });
});

export const PreviewAudienceHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { campaignId } = req.params as { campaignId: string };
  const preview = await campaignService.previewAudience(campaignId, req.tenantId);
  res.status(200).json({ success: true, data: preview });
});

export const AttachTemplateHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { campaignId } = req.params as { campaignId: string };
  const template = await campaignService.attachTemplate(campaignId, req.tenantId, req.body);
  res.status(200).json({ success: true, data: template });
});

export const GetCampaignDetailHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { campaignId } = req.params as { campaignId: string };
  const detail = await campaignService.getDetail(campaignId, req.tenantId);
  res.status(200).json({ success: true, data: detail });
});

export const ListCampaignsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 20);
  const campaigns = await campaignService.list(req.tenantId, page, limit);
  res.status(200).json({ success: true, data: campaigns });
});

// Snapshots the audience and marks the campaign "sending", it does not
// itself dispatch any messages, that's the isolated campaign-worker's
// job (not built in this pass, this endpoint hands it a durable,
// idempotent queue to consume via campaign_recipients).
export const PrepareSendHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { campaignId } = req.params as { campaignId: string };
  const result = await campaignService.prepareSend(campaignId, req.tenantId);
  res.status(200).json({ success: true, data: result });
});