import { Router } from "express";
import { authenticate, requireTenantMember, authorize } from "../../middleware/auth.middleware";
import {
  CreateCampaignHandler,
  SetAudienceHandler,
  PreviewAudienceHandler,
  AttachTemplateHandler,
  GetCampaignDetailHandler,
  ListCampaignsHandler,
  PrepareSendHandler,
} from "./campaign.controller";

const campaignRouter = Router();

// host:admin only
campaignRouter.post("/",                            authenticate, requireTenantMember, authorize("host:admin"), CreateCampaignHandler);
campaignRouter.get("/",                             authenticate, requireTenantMember,                          ListCampaignsHandler);
campaignRouter.get("/:campaignId",                  authenticate, requireTenantMember,                          GetCampaignDetailHandler);
campaignRouter.put("/:campaignId/audience",         authenticate, requireTenantMember, authorize("host:admin"), SetAudienceHandler);
campaignRouter.get("/:campaignId/audience-preview", authenticate, requireTenantMember,                          PreviewAudienceHandler);
campaignRouter.post("/:campaignId/templates",       authenticate, requireTenantMember, authorize("host:admin"), AttachTemplateHandler);
campaignRouter.post("/:campaignId/send",            authenticate, requireTenantMember, authorize("host:admin"), PrepareSendHandler);

export default campaignRouter;