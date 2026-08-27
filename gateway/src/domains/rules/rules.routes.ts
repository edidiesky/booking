import { Router } from "express";
import type { RateLimitService } from "@booking/shared";
import { authenticate, authorize } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createRulesController } from "./rules.controller";
import { createRuleSchema, updateRuleSchema, listQuerySchema } from "./rules.validator";

export function createRulesRouter(rateLimitService: RateLimitService): Router {
  const { CreateRuleHandler, ListRulesHandler, GetRuleHandler, UpdateRuleHandler, DeleteRuleHandler } =
    createRulesController(rateLimitService);

  const router = Router();
  router.use(authenticate, authorize("platform:admin"));

  router.post("/",     validate(createRuleSchema), CreateRuleHandler);
  router.get("/",      validate(listQuerySchema, "query"), ListRulesHandler);
  router.get("/:id",   GetRuleHandler);
  router.patch("/:id", validate(updateRuleSchema), UpdateRuleHandler);
  router.delete("/:id", DeleteRuleHandler);

  return router;
}