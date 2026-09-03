import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { conversationService } from "./conversation.service";
import { AppError } from "../../utils/AppError";

export const StartConversationHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

    const body = req.body as { guestUserId: string; propertyId?: string; bookingId?: string };

    const conversation = await conversationService.startConversation({
      tenantId: req.tenantId,
      hostUserId: req.user.userId,
      guestUserId: body.guestUserId,
      propertyId: body.propertyId,
      bookingId: body.bookingId,
    });

    res.status(201).json({ success: true, message: "Conversation ready.", data: conversation });
  },
);

export const GetTenantConversationsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const { page, limit } = req.query as unknown as { page: number; limit: number };

    const conversations = await conversationService.listForHost(req.user.userId, page, limit);
    res.json({ success: true, data: conversations });
  },
);

export const GetMyConversationsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const { page, limit } = req.query as unknown as { page: number; limit: number };

    const conversations = await conversationService.listForGuest(req.user.userId, page, limit);
    res.json({ success: true, data: conversations });
  },
);