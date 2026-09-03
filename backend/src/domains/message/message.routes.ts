import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  GetMessagesHandler,
  SendMessageHandler,
  MarkConversationReadHandler,
} from "./message.controller";
import { sendMessageSchema } from "./message.validator";
import { listQuerySchema } from "../conversation/conversation.validator";

const messageRouter = Router();

messageRouter.get(
  "/:conversationId/messages",
  authenticate,
  validate(listQuerySchema, "query"),
  GetMessagesHandler,
);
messageRouter.post(
  "/:conversationId/messages",
  authenticate,
  validate(sendMessageSchema),
  SendMessageHandler,
);
messageRouter.patch(
  "/:conversationId/read",
  authenticate,
  MarkConversationReadHandler,
);

export default messageRouter;
