import type { Request } from "express";
import jwt from "jsonwebtoken";
import type { RateLimitUserType } from "@booking/shared";
import { createHash } from "crypto";

export interface RequestIdentity {
  key: string;
  userType?: RateLimitUserType;
  isAuthenticated: boolean;
}

export function getRealIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export function resolveIdentity(req: Request): RequestIdentity {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
        issuer: "booking-platform",
        audience: "booking-client",
      }) as { user: { userId: string; userType: RateLimitUserType } };

      return {
        key: decoded.user.userId,
        userType: decoded.user.userType,
        isAuthenticated: true,
      };
    } catch {
      // Falls through to anonymous identity below, deliberately not
    }
  }

  const ip = getRealIp(req);
  const uaHash = createHash("sha256")
    .update(req.headers["user-agent"] ?? "unknown")
    .digest("hex")
    .slice(0, 12);

  return { key: `${ip}:${uaHash}`, isAuthenticated: false };
}