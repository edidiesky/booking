import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { invitationService } from "./invitation.service";
import { AppError } from "../../utils/AppError";

export const CreateInvitationHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId || !req.user) throw AppError.badRequest("Tenant context required.");
  const result = await invitationService.create(req.tenantId, req.user.userId, req.body);
  res.status(201).json({ success: true, data: result });
});

export const ListInvitationsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const invitations = await invitationService.list(req.tenantId);
  res.status(200).json({ success: true, data: invitations });
});

export const AcceptInvitationHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tokens = await invitationService.accept(req.body);
  res.status(200).json({ success: true, data: tokens });
});

export const RevokeInvitationHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId || !req.user) throw AppError.badRequest("Tenant context required.");
  const { email } = req.params as { email: string };
  await invitationService.revoke(req.tenantId, email, req.user.userId);
  res.status(200).json({ success: true, message: "Invitation revoked." });
});