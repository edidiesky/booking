import type { Request, Response, NextFunction } from "express";
import type { Redis } from "ioredis";
import { logger } from "@booking/shared";

const BACKEND_ORIGIN   = process.env.BACKEND_ORIGIN ?? "http://localhost:4000";
const INTERNAL_SECRET  = process.env.INTERNAL_SECRET!;
const PLATFORM_DOMAIN  = process.env.PLATFORM_DOMAIN ?? "bukkings.space";
const CACHE_TTL_SEC    = 60;

function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0]!.toLowerCase();
  if (!hostname.endsWith(`.${PLATFORM_DOMAIN}`)) return null;
  const subdomain = hostname.slice(0, -(PLATFORM_DOMAIN.length + 1));
  if (!subdomain || subdomain === "www") return null;
  return subdomain;
}

export function createSubdomainResolver(redis: Redis) {
  return async function subdomainResolver(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const host = req.headers.host;
    if (!host) { next(); return; }

    const subdomain = extractSubdomain(host);
    if (!subdomain) { next(); return; }

    try {
      const cacheKey = `gw:subdomain:${subdomain}`;
      const cached = await redis.get(cacheKey);

      if (cached === "__none__") { next(); return; }

      if (cached) {
        const tenant = JSON.parse(cached) as { tenantId: string; tenantName: string; tenantSlug: string };
        req.headers["x-tenant-id"] = tenant.tenantId;
        req.headers["x-tenant-slug"] = tenant.tenantSlug;
        next();
        return;
      }

      const res = await fetch(`${BACKEND_ORIGIN}/api/v1/tenants/internal/subdomain/${subdomain}`, {
        headers: { "x-internal-secret": INTERNAL_SECRET },
      });

      if (!res.ok) {
        await redis.set(cacheKey, "__none__", "EX", CACHE_TTL_SEC);
        next();
        return;
      }

      const body = await res.json() as { data: { tenantId: string; tenantName: string; tenantSlug: string } };
      await redis.set(cacheKey, JSON.stringify(body.data), "EX", CACHE_TTL_SEC);

      req.headers["x-tenant-id"] = body.data.tenantId;
      req.headers["x-tenant-slug"] = body.data.tenantSlug;
      next();
    } catch (err) {
      logger.error("subdomain_resolution_failed", {
        event: "subdomain_resolution_failed",
        host,
        error: (err as Error).message,
      });
      next();
    }
  };
}