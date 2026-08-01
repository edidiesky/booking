import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { query } from "@booking/shared";

export const GetPopularPropertiesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query["limit"] ?? 12), 50);
  const rows = await query(
    `SELECT property_id AS id, name, images, property_type, address, latitude, longitude,
            booking_count, favorite_count, avg_rating, review_count
     FROM mv_popular_properties
     ORDER BY popularity_score DESC
     LIMIT $1`,
    [limit],
  );
  res.status(200).json({ success: true, data: rows });
});

export const GetNewPropertiesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query["limit"] ?? 12), 50);
  const rows = await query(
    `SELECT id, name, images, property_type, address, latitude, longitude, created_at
     FROM properties
     WHERE status = 'active'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  res.status(200).json({ success: true, data: rows });
});