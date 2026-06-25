import { Request, Response, NextFunction } from "express";
import { permissionResolver } from "../domains/permission/permission.resolver";
import logger from "../utils/logger";
import { requestContext } from "../context/requestContext";

/**
 * ABAC middleware - checks resolved permissions from Redis cache or DB.
 * Usage: requirePermission("booking", "create")
 *
 * Falls through to next() on platform:admin (superuser bypass).
 * Denies with 403 if user lacks the required permission.
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    // platform:admin bypasses all permission checks
    if (req.user.userType === "platform:admin") {
      next();
      return;
    }

    const tenantId = req.tenantId ?? req.user.tenantId;
    if (!tenantId) {
      res.status(403).json({ success: false, message: "Tenant context required for permission check." });
      return;
    }

    try {
      const granted = await permissionResolver.has(req.user.userId, tenantId, resource, action);

      if (!granted) {
        const ctx = requestContext.get();
        logger.warn("permission_denied", {
          event:    "permission_denied",
          userId:   req.user.userId,
          tenantId,
          resource,
          action,
          requestId: ctx?.requestId,
        });
        res.status(403).json({
          success: false,
          message: `Permission denied: ${resource}:${action}`,
        });
        return;
      }

      next();
    } catch (err) {
      logger.error("permission_check_error", {
        event:   "permission_check_error",
        userId:  req.user.userId,
        tenantId,
        resource,
        action,
        error:   (err as Error).message,
      });
      next(err);
    }
  };
}
