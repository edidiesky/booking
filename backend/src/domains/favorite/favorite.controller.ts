import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { favoriteRepository } from "./favorite.repository";
import { AppError } from "../../utils/AppError";

export const AddFavoriteHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { propertyId } = req.params as { propertyId: string };
  await favoriteRepository.add(req.user.userId, propertyId);
  res.status(200).json({ success: true, message: "Added to favorites." });
});

export const RemoveFavoriteHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { propertyId } = req.params as { propertyId: string };
  await favoriteRepository.remove(req.user.userId, propertyId);
  res.status(200).json({ success: true, message: "Removed from favorites." });
});

export const ListFavoritesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 20);
  const favorites = await favoriteRepository.listByGuest(req.user.userId, page, limit);
  res.status(200).json({ success: true, data: favorites });
});

export const ListFavoritedIdsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const idsParam = (req.query["propertyIds"] as string | undefined) ?? "";
  const propertyIds = idsParam.split(",").filter(Boolean);
  const favorited = await favoriteRepository.favoritedIdsAmong(req.user.userId, propertyIds);
  res.status(200).json({ success: true, data: Array.from(favorited) });
});