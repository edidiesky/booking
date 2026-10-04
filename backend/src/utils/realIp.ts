import { Request } from "express";

export function normalizeIp(ip: string): string {
  if (!ip) return "unknown";
  return ip.replace(/^::ffff:/i, "");
}

const getRealIp = (req: Request): string => {
  const realIp = req.headers["x-real-ip"] as string;
  if (realIp) return normalizeIp(realIp.trim());
  const forwarded = req.headers["x-forwarded-for"] as string;
  if (forwarded) return normalizeIp(forwarded.split(",")[0].trim());

  const socketIp = req.socket?.remoteAddress || req.ip || "unknown";
  return normalizeIp(socketIp);
};

export default getRealIp;