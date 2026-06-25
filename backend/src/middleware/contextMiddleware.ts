import { Request, Response, NextFunction } from "express";
import { randomUUID }        from "crypto";
import { requestContext }    from "../context/requestContext";
import { tenantRepository }  from "../domains/tenant/tenant.repository";
import { reqReplyTime }      from "../utils/metrics";
import logger from "../utils/logger";

export function contextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId  = (req.headers["x-request-id"] as string) ?? randomUUID();
  const traceparent = req.headers["traceparent"] as string | undefined;
  const parts       = traceparent?.split("-") ?? [];

  const startTime = process.hrtime();

  const ctx = { requestId, traceId: parts[1], spanId: parts[2], method: req.method, path: req.path };

  requestContext.run(ctx, () => {
    logger.info("http_request", { event: "http_request", method: req.method, path: req.path, requestId });

    res.on("finish", () => {
      reqReplyTime(req, res, startTime);
    });

    next();
  });
}

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const host       = req.headers["host"] ?? "";
  const baseDomain = process.env.BASE_DOMAIN ?? "yourdomain.com";

  let slug = req.headers["x-tenant-slug"] as string | undefined;

  if (!slug) {
    const subdomain = host.replace(`.${baseDomain}`, "");
    if (subdomain && subdomain !== host && subdomain !== "www" && subdomain !== "api") {
      slug = subdomain;
    }
  }

  if (!slug) { next(); return; }

  tenantRepository.findBySlug(slug)
    .then((tenant) => {
      if (!tenant || tenant.status !== "active") {
        res.status(404).json({ success: false, message: "Tenant not found." });
        return;
      }
      req.tenantId   = tenant.id;
      req.tenantSlug = tenant.slug;
      requestContext.set({ tenantId: tenant.id, tenantSlug: tenant.slug });
      next();
    })
    .catch(next);
}
