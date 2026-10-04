
import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { withTransaction } from "@booking/shared";
import { AppError } from "../../utils/AppError";
import { requestContext } from "../../context/requestContext";
import { sessionRepository } from "./session.repository";
import { sessionVersionRepository } from "../auth/sessionVersion.repository";
import { auditEventRepository } from "../audit/auditEvent.repository";
import { auditRepository } from "../audit/audit.repository";

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

export const AdminListUserSessionsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params as { userId: string };
    const sessions = await sessionRepository.listForUserAdmin(userId);
    res.status(200).json({ success: true, data: sessions });
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
    if (!revoked) {
      throw AppError.notFound("Session not found or already revoked.");
    }

    const tenantId = req.user.tenantId;
    if (tenantId) {
      await withTransaction(async (client) => {
        await auditEventRepository.record(
          {
            tenantId,
            actor: { type: "user", id: req.user!.userId },
            action: "session.revoked",
            targetType: "session",
            targetId: sessionId,
            metadata: {
              deviceLabel: session.device_label,
              reason: "user_logout",
            },
            outcome: "allowed",
            requestId: requestContext.get()?.requestId,
          },
          client, // required second arg
        );
      });
    } else {
      await auditRepository.log({
        action: "logout",
        resource: "session",
        resourceId: sessionId,
        userId: req.user.userId,
        newValue: { reason: "user_logout", deviceLabel: session.device_label },
      });
    }

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

    const tenantId = req.user.tenantId;
    if (tenantId) {
      await withTransaction(async (client) => {
        await auditEventRepository.record(
          {
            tenantId,
            actor: { type: "user", id: req.user!.userId },
            action: "session.logout_others",
            targetType: "user",
            targetId: req.user!.userId,
            metadata: { revokedCount: count },
            outcome: "allowed",
            requestId: requestContext.get()?.requestId,
          },
          client,
        );
      });
    } else {
      await auditRepository.log({
        action: "logout",
        resource: "session",
        resourceId: req.user.userId,
        userId: req.user.userId,
        newValue: { reason: "user_logout_all", revokedCount: count },
      });
    }

    res.status(200).json({
      success: true,
      message: `Logged out ${count} other device(s).`,
    });
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

    const tenantId = req.user.tenantId;
    if (tenantId) {
      await withTransaction(async (client) => {
        await auditEventRepository.record(
          {
            tenantId,
            actor: { type: "user", id: req.user!.userId },
            action: "session.logout_all",
            targetType: "user",
            targetId: req.user!.userId,
            metadata: { revokedCount: count },
            outcome: "allowed",
            requestId: requestContext.get()?.requestId,
          },
          client,
        );
      });
    } else {
      await auditRepository.log({
        action: "logout",
        resource: "session",
        resourceId: req.user.userId,
        userId: req.user.userId,
        newValue: { reason: "logout_all", revokedCount: count },
      });
    }

    res.status(200).json({
      success: true,
      message: `Logged out ${count} device(s). Please log in again.`,
    });
  },
);

export const AdminRevokeSessionHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params as { sessionId: string };

    const session = await sessionRepository.findById(sessionId);
    if (!session) throw AppError.notFound("Session not found.");

    const revoked = await sessionRepository.adminRevoke(sessionId);
    if (revoked) await sessionVersionRepository.bump(session.user_id);

    const tenantId = req.user?.tenantId;
    if (tenantId && req.user) {
      await withTransaction(async (client) => {
        await auditEventRepository.record(
          {
            tenantId,
            actor: { type: "user", id: req.user!.userId },
            action: "session.admin_revoked",
            targetType: "session",
            targetId: sessionId,
            metadata: {
              targetUserId: session.user_id,
              deviceLabel: session.device_label,
            },
            outcome: "allowed",
            requestId: requestContext.get()?.requestId,
          },
          client,
        );
      });
    }

    res.status(200).json({ success: true, message: "Session revoked." });
  },
);