import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { AppError } from "@booking/shared";
import { sessionRepository } from "./session.repository";
import { sessionVersionRepository } from "../auth/sessionVersion.repository";
import logger from "../../utils/logger";

async function revokeAndSync(
  sessionId: string,
  userId: string,
  reason: Parameters<typeof sessionRepository.revoke>[1],
) {
  const revoked = await sessionRepository.revoke(sessionId, reason);
  if (revoked) await sessionVersionRepository.bump(userId);
  return revoked;
}

export const ListMySessionsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const sessions = await sessionRepository.listActive(req.user.userId);
    const data = sessions.map((s) => ({
      ...s,
      isCurrent: s.id === req.sessionId,
    }));
    res.status(200).json({ success: true, data });
  },
);

export const RevokeSessionHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const { sessionId } = req.params as { sessionId: string };

    const session = await sessionRepository.findById(sessionId);
    if (!session || session.user_id !== req.user.userId) {
      throw AppError.notFound("Session not found.");
    }

    const revoked = await revokeAndSync(
      sessionId,
      req.user.userId,
      "user_logout",
    );
    if (!revoked)
      throw AppError.notFound("Session not found or already revoked.");

    res.status(200).json({ success: true, message: "Device logged out." });
  },
);

export const LogoutOtherSessionsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !req.sessionId) throw AppError.unauthorized();

    const count = await sessionRepository.revokeAllForUser(
      req.user.userId,
      "user_logout_all",
      req.sessionId,
    );
    await sessionVersionRepository.bump(req.user.userId);

    res
      .status(200)
      .json({ success: true, message: `Logged out ${count} other device(s).` });
  },
);

export const LogoutAllSessionsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();

    const count = await sessionRepository.revokeAllForUser(
      req.user.userId,
      "user_logout_all",
    );
    await sessionVersionRepository.bump(req.user.userId);

    res
      .status(200)
      .json({
        success: true,
        message: `Logged out ${count} device(s). Please log in again.`,
      });
  },
);

export const AdminListUserSessionsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params as { userId: string };
    const sessions = await sessionRepository.listForUserAdmin(userId);
    res.status(200).json({ success: true, data: sessions });
  },
);

export const AdminRevokeSessionHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params as { sessionId: string };

    const session = await sessionRepository.findById(sessionId);
    if (!session) throw AppError.notFound("Session not found.");

    const revoked = await sessionRepository.adminRevoke(sessionId);
    if (revoked) await sessionVersionRepository.bump(session.user_id);

    logger.info("admin_session_revoked", {
      event: "admin_session_revoked",
      sessionId,
      targetUserId: session.user_id,
      adminId: req.user?.userId,
    });

    res.status(200).json({ success: true, message: "Session revoked." });
  },
);
