import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import { JWTPayload, UserType } from "../types";
import { AppError } from "../utils/AppError";
import { requestContext } from "../context/requestContext";

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

  let decoded: { user: JWTPayload };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: "booking-platform",
      audience: "booking-client",
    }) as { user: JWTPayload };
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
      requestContext.set({
        userId: decoded.user.userId,
        tenantId: decoded.user.tenantId,
        userType: decoded.user.userType,
      });
      next();
    })
    .catch(() =>
      res
        .status(503)
        .json({ success: false, message: "Service temporarily unavailable." }),
    );
}

export function authorize(...roles: UserType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required." });
      return;
    }
    if (!roles.includes(req.user.userType)) {
      res.status(403).json({ success: false, message: "Permission denied." });
      return;
    }
    next();
  };
}

export function requireTenantMember(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
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
    res.status(400).json({ success: false, message: "Tenant context required." });
    return;
  }

  if (
    req.user.userType !== "platform:admin" &&
    req.user.tenantId !== tenantId
  ) {
    res.status(403).json({ success: false, message: "Access denied to this tenant." });
    return;
  }

  req.tenantId = tenantId;

  next();
}