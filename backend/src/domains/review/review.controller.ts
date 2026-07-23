import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { reviewService } from "./review.service";
import { AppError } from "@booking/shared";

export const CreateReviewHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const review = await reviewService.createReview({
      guestUserId: req.user.userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: review });
  },
);

export const GetRoomTypeReviewsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const q = req.query as Record<string, string>;
    const result = await reviewService.getRoomTypeReviews(
      req.params["roomTypeId"] as string,
      {
        rating: q["rating"] ? Number(q["rating"]) : undefined,
        verified: q["verified"] ? q["verified"] === "true" : undefined,
        page: Number(q["page"] ?? 1),
        limit: Number(q["limit"] ?? 10),
      },
    );
    res.status(200).json({ success: true, data: result });
  },
);

export const GetTenantReviewsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const q = req.query as Record<string, string>;
    const reviews = await reviewService.getTenantReviews(
      req.tenantId,
      Number(q["page"] ?? 1),
      Number(q["limit"] ?? 20),
    );
    res.status(200).json({ success: true, data: reviews });
  },
);

export const GetTenantReviewStatsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const stats = await reviewService.getTenantReviewStats(req.tenantId);
    res.status(200).json({ success: true, data: stats });
  },
);

export const RespondToReviewHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const review = await reviewService.respondToReview(
      req.params["reviewId"] as string,
      req.body.text,
      req.user.userId,
    );
    res.status(200).json({ success: true, data: review });
  },
);

export const MarkHelpfulHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.markHelpful(
      req.params["reviewId"] as string,
      req.body.helpful,
    );
    res.status(200).json({ success: true, data: review });
  },
);