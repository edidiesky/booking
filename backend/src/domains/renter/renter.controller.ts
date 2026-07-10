import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { renterService } from "./renter.service";
import { AppError } from "@booking/shared";

export const CreateRenterHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const result = await renterService.createRenter(req.tenantId, req.body);
  res.status(201).json({ success: true, data: result });
});

export const ListRentersHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const result = await renterService.listRenters(req.tenantId);
  res.status(200).json({ success: true, data: result });
});

export const GetRenterDetailHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await renterService.getRenterDetail(req.params["id"] as string);
  res.status(200).json({ success: true, data: result });
});