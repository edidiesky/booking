import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { propertySearchRepository } from "./propertysearch.repository";

export const SearchPropertiesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = req.query as Record<string, string | undefined>;

  const result = await propertySearchRepository.search({
    q:            q["q"],
    city:         q["city"],
    propertyType: q["propertyType"],
    minPrice:     q["minPrice"] ? Number(q["minPrice"]) : undefined,
    maxPrice:     q["maxPrice"] ? Number(q["maxPrice"]) : undefined,
    amenities:    q["amenities"] ? q["amenities"].split(",") : undefined,
    lat:          q["lat"] ? Number(q["lat"]) : undefined,
    lon:          q["lon"] ? Number(q["lon"]) : undefined,
    radiusKm:     q["radiusKm"] ? Number(q["radiusKm"]) : undefined,
    page:         q["page"] ? Number(q["page"]) : undefined,
    limit:        q["limit"] ? Number(q["limit"]) : undefined,
  });

  res.status(200).json({ success: true, data: result.hits, total: result.total });
});