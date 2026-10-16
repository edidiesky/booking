import { Request, Response, NextFunction } from "express";
import { permissionResolver } from "../domains/permission/permission.resolver";
import logger from "../utils/logger";
import { requestContext } from "../context/requestContext";

export function requirePermission(resource: string, action: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required." });
      return;
    }

    const tenantId =
      req.user.userType === "platform:admin"
        ? null
        : (req.tenantId ?? req.user.tenantId ?? null);

    try {
      const granted = await permissionResolver.has(
        req.user.userId,
        tenantId,
        resource,
        action,
      );

      if (!granted) {
        const ctx = requestContext.get();
        logger.warn("permission_denied", {
          event: "permission_denied",
          userId: req.user.userId,
          tenantId,
          resource,
          action,
          requestId: ctx?.requestId,
        });
        res.status(403).json({
          success: false,
          message: `Permission has been denied. You can kindly reach out to the adminstrator to resolve the issue if you deem if to be correct!`,
        });
        return;
      }

      next();
    } catch (err) {
      logger.error("permission_check_error", {
        event: "permission_check_error",
        userId: req.user.userId,
        tenantId,
        resource,
        action,
        error: (err as Error).message,
      });
      next(err);
    }
  };
}
