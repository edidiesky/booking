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

const router = Router();

// host:admin only
router.post("/",                            authenticate, requireTenantMember, authorize("host:admin"), CreateCampaignHandler);
router.get("/",                             authenticate, requireTenantMember,                          ListCampaignsHandler);
router.get("/:campaignId",                  authenticate, requireTenantMember,                          GetCampaignDetailHandler);
router.put("/:campaignId/audience",         authenticate, requireTenantMember, authorize("host:admin"), SetAudienceHandler);
router.get("/:campaignId/audience-preview", authenticate, requireTenantMember,                          PreviewAudienceHandler);
router.post("/:campaignId/templates",       authenticate, requireTenantMember, authorize("host:admin"), AttachTemplateHandler);
router.post("/:campaignId/send",            authenticate, requireTenantMember, authorize("host:admin"), PrepareSendHandler);

export default router;