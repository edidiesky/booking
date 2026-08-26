import asyncHandler from "express-async-handler";
import type { Request, Response } from "express";
import { AppError, type RateLimitService } from "@booking/shared";
import type { CreateRuleInput, UpdateRuleInput } from "@booking/shared";

export function createRulesController(rateLimitService: RateLimitService) {
  return {
    CreateRuleHandler: asyncHandler(async (req: Request, res: Response) => {
      const rule = await rateLimitService.createRule(req.body as CreateRuleInput);
      res.status(201).json({ success: true, data: rule });
    }),

    ListRulesHandler: asyncHandler(async (req: Request, res: Response) => {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const rules = await rateLimitService.listRules(page, limit);
      res.json({ success: true, data: rules });
    }),

    GetRuleHandler: asyncHandler(async (req: Request, res: Response) => {
      const rule = await rateLimitService.getRule(req.params["id"] as string);
      if (!rule) throw AppError.notFound("Rule not found.");
      res.json({ success: true, data: rule });
    }),

    UpdateRuleHandler: asyncHandler(async (req: Request, res: Response) => {
      const rule = await rateLimitService.updateRule(
        req.params["id"] as string,
        req.body as UpdateRuleInput,
      );
      if (!rule) throw AppError.notFound("Rule not found.");
      res.json({ success: true, data: rule });
    }),

    DeleteRuleHandler: asyncHandler(async (req: Request, res: Response) => {
      const deleted = await rateLimitService.deleteRule(req.params["id"] as string);
      if (!deleted) throw AppError.notFound("Rule not found.");
      res.json({ success: true });
    }),
  };
}