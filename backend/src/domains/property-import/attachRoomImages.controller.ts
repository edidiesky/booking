import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { attachRoomImages } from "./attachRoomImages";

export const AttachRoomImagesHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

    const body = req.body as {
      attachments: { fileName: string; url: string }[];
      batchId?: string;
    };

    const result = await attachRoomImages({
      tenantId: req.tenantId,
      attachments: body.attachments,
      batchId: body.batchId,
    });

    res.status(200).json({
      success: true,
      message:
        result.unmatched === 0
          ? `Linked ${result.linked} photo(s).`
          : `Linked ${result.linked} photo(s); ${result.unmatched} could not be matched.`,
      data: result,
    });
  },
);
