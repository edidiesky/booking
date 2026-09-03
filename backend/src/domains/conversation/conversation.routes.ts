import { Router } from "express";
import { authenticate, authorize, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  StartConversationHandler,
  GetTenantConversationsHandler,
  GetMyConversationsHandler,
} from "./conversation.controller";
import { startConversationSchema, listQuerySchema } from "./conversation.validator";

const conversationRouter = Router();

/**
 * 1. RLS scoped for the tenant routes
 * 2. RLS not scoped for guest since they will not have tenant id
 */
conversationRouter.post("/",      authenticate, requireTenantMember, validate(startConversationSchema), StartConversationHandler);
conversationRouter.get("/tenant", authenticate, requireTenantMember, validate(listQuerySchema, "query"), GetTenantConversationsHandler);

conversationRouter.get("/mine",   authenticate, authorize("guest"), validate(listQuerySchema, "query"), GetMyConversationsHandler);

export default conversationRouter;