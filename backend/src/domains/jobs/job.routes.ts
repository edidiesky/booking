import { Router } from "express";
import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { jobRepository } from "@booking/shared";
import { authenticate } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/AppError";

const router = Router();

// Generic job-status polling, reusable for any background job that uses
// jobRepository.setState (CSV import today, whatever else needs
// background-job-with-progress later, doesn't need its own status
// endpoint each time).
router.get("/:jobType/:jobId", authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { jobType, jobId } = req.params as { jobType: string; jobId: string };
  const state = await jobRepository.getState(jobType, jobId);
  if (!state) throw AppError.notFound("Job not found or expired.");
  res.status(200).json({ success: true, data: state });
}));

// Live push instead
router.get("/:jobType/:jobId/stream", authenticate, async (req: Request, res: Response): Promise<void> => {
  const { jobType, jobId } = req.params as { jobType: string; jobId: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (payload: unknown) => {
    res.write(`event: job_progress\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  const current = await jobRepository.getState(jobType, jobId);
  if (current) send(current);

  const unsubscribe = await jobRepository.subscribe(jobType, jobId, send);

  req.on("close", () => {
    void unsubscribe();
  });
});

export default router;