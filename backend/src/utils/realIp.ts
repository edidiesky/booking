import { Request } from "express";
import { timingSafeEqual } from "node:crypto";

const GATEWAY_SHARED_SECRET = process.env.GATEWAY_SHARED_SECRET ?? "";

export function normalizeIp(ip: string | undefined | null): string {
  if (!ip) return "unknown";
  const first = ip.split(",")[0].trim();
  return first.replace(/^::ffff:/i, "") || "unknown";
}

function isFromGateway(req: Request): boolean {
  if (!GATEWAY_SHARED_SECRET) return false;
  const provided = req.headers["x-gateway-secret"];
  if (typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(GATEWAY_SHARED_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

const getRealIp = (req: Request): string => {
  if (isFromGateway(req)) {
    const clientIp = req.headers["x-client-ip"];
    if (typeof clientIp === "string" && clientIp.trim()) {
      return normalizeIp(clientIp);
    }
  }
  return normalizeIp(req.ip ?? req.socket?.remoteAddress);
};

export default getRealIp;