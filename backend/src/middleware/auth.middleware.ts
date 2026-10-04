import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import { JWTPayload, UserType } from "../types";
import { AppError } from "../utils/AppError";
import { requestContext } from "../context/requestContext";
import { sessionVersionRepository } from "../domains/auth/sessionVersion.repository";
// import { IdleTrackingRepository } from "../domains/auth/idleTracking.repository";
import { sessionRepository } from "../domains/session/session.repository";
import logger from "../utils/logger";

const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;
const lastTouchedCache = new Map<string, number>();
// const idleTracking = new IdleTrackingRepository(redisClient, 30 * 60);

type AccessTokenPayload = {
  user: JWTPayload;
  sessionId?: string;
  sessionVersion?: number;
  jti?: string;
};

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ??
    (req.cookies as Record<string, string> | undefined)?.["jwt"];

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  let decoded: AccessTokenPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: "booking-platform",
      audience: "booking-client",
    }) as AccessTokenPayload;
  } catch {
    res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
    });
    return;
  }

  const userId = decoded.user.userId;

  void (async () => {
    try {
      const blocked = await redisClient.get(
        `blocklist:${decoded.jti ?? userId}`,
      );
      if (blocked) {
        res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
        return;
      }

      // Session-bound tokens (post-rollout)
      if (decoded.sessionId) {
        const currentVersion = await sessionVersionRepository.get(userId);
        if (
          decoded.sessionVersion === undefined ||
          decoded.sessionVersion !== currentVersion
        ) {
          res.status(401).json({
            success: false,
            message: "Session revoked. Please log in again.",
          });
          return;
        }

        // if (await idleTracking.isIdle(decoded.sessionId)) {
        //   await sessionRepository.revoke(decoded.sessionId, "user_logout");
        //   await sessionVersionRepository.bump(userId);
        //   res.status(401).json({
        //     success: false,
        //     message: "Session expired due to inactivity. Please log in again.",
        //   });
        //   return;
        // }

        req.sessionId = decoded.sessionId;

        const lastTouched = lastTouchedCache.get(decoded.sessionId) ?? 0;
        if (Date.now() - lastTouched > LAST_ACTIVE_THROTTLE_MS) {
          lastTouchedCache.set(decoded.sessionId, Date.now());
          sessionRepository.touchLastActive(decoded.sessionId).catch((err) => {
            logger.error("session_touch_failed", {
              event: "session_touch_failed",
              error: (err as Error).message,
            });
          });
          // idleTracking.touch(decoded.sessionId).catch((err) => {
          //   logger.error("idle_tracking_touch_failed", {
          //     event: "idle_tracking_touch_failed",
          //     error: (err as Error).message,
          //   });
          // });
        }
      }

      req.user = decoded.user;
      requestContext.set({
        userId: decoded.user.userId,
        tenantId: decoded.user.tenantId,
        userType: decoded.user.userType,
      });
      next();
    } catch {
      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable.",
      });
    }
  })();
}

export function authorize(...roles: UserType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required. Please kindly register if you do not have an account or you can login.",
        });
      return;
    }
    if (!roles.includes(req.user.userType)) {
      res
        .status(403)
        .json({
          success: false,
          message:
            "Access denied.  Please kindly register if you do not have an account or you can login",
        });
      return;
    }
    next();
  };
}

import { beginTenantScopedTransaction } from "./rlsMiddleware";

export async function requireTenantMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const hostTypes: UserType[] = [
    "host:admin",
    "host:staff",
    "host:inspector",
    "platform:admin",
  ];

  if (!hostTypes.includes(req.user.userType)) {
    res.status(403).json({ success: false, message: "Host access required." });
    return;
  }

  const tenantId = req.user.tenantId ?? req.tenantId;

  if (!tenantId) {
    res
      .status(400)
      .json({ success: false, message: "Tenant context required." });
    return;
  }

  if (
    req.user.userType !== "platform:admin" &&
    req.user.tenantId !== tenantId
  ) {
    res
      .status(403)
      .json({ success: false, message: "Access denied to this tenant." });
    return;
  }

  req.tenantId = tenantId;
  const ok = await beginTenantScopedTransaction(req, res, tenantId);
  if (!ok) {
    next(new Error("Failed to establish tenant-scoped database session."));
    return;
  }

  next();
}
