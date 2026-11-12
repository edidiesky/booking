import type { Request } from "express";
import jwt from "jsonwebtoken";
import type { RateLimitUserType } from "@booking/shared";

export interface RequestIdentity {
  key: string;
  userType?: RateLimitUserType;
  isAuthenticated: boolean;
}

export function getRealIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export function resolveIdentity(req: Request): RequestIdentity {
  const headerToken = req.headers["authorization"]?.startsWith("Bearer ")
    ? req.headers["authorization"].slice(7)
    : undefined;
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.["jwt"];
  const token = headerToken ?? cookieToken;

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
      // fall through to anonymous
    }
  }

  const ip = getRealIp(req);
  return { key: ip, isAuthenticated: false };
}