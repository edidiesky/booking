import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { messageService } from "./message.service";
import { AppError } from "../../utils/AppError";

export const GetMessagesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const conversationId = req.params["conversationId"] as string;

    const messages = await messageService.listMessages(
      conversationId,
      req.user.userId,
      page,
      limit,
    );
    res.json({ success: true, data: messages });
  },
);

export const SendMessageHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const conversationId = req.params["conversationId"] as string;
    const { body } = req.body as { body: string };

    const message = await messageService.sendMessage({
      conversationId,
      senderId: req.user.userId,
      body,
    });

    res.status(201).json({ success: true, data: message });
  },
);

export const MarkConversationReadHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const conversationId = req.params["conversationId"] as string;

    await messageService.markRead(conversationId, req.user.userId);
    res.json({ success: true });
  },
);