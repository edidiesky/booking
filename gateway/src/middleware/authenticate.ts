import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { RateLimitUserType } from "@booking/shared";
import redisClient from "../config/redis";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        userType: RateLimitUserType;
        tenantId?: string;
        name: string;
      };
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ??
    (req.cookies as Record<string, string> | undefined)?.["jwt"];

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Authentication required." });
    return;
  }

  let decoded: {
    user: {
      userId: string;
      userType: RateLimitUserType;
      tenantId?: string;
      name: string;
    };
  };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: "booking-platform",
      audience: "booking-client",
    }) as typeof decoded;
  } catch {
    res
      .status(401)
      .json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    return;
  }

  redisClient
    .get(`blocklist:${decoded.user.userId}`)
    .then((blocked) => {
      if (blocked) {
        res
          .status(401)
          .json({
            success: false,
            message: "Session expired. Please log in again.",
          });
        return;
      }
      req.user = decoded.user;
      next();
    })
    .catch(() => {
      res
        .status(503)
        .json({ success: false, message: "Service temporarily unavailable." });
    });
}

export function authorize(...roles: RateLimitUserType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required." });
      return;
    }
    if (!roles.includes(req.user.userType)) {
      res.status(403).json({ success: false, message: "Access denied." });
      return;
    }
    next();
  };
}
