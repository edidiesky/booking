import { Request } from "express";
import { UAParser } from "ua-parser-js";
import axios from "axios";
import logger from "./logger";
import redisClient from "../config/redis";
import getRealIp from "./realIp";

interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
}

function isPrivateOrLocal(ip: string): boolean {
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return true;

  return [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^fc00:/i,
    /^fe80:/i,
  ].some((r) => r.test(ip));
}

export async function getLocationFromIP(ip: string): Promise<string> {
  if (isPrivateOrLocal(ip)) return "Local Network";

  const cacheKey = `ip_location:${ip}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return cached;
  } catch (_) {}

  try {
    const response = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,country,city,regionName`,
      { timeout: 3000 },
    );

    if (response.data.status === "success") {
      const { city, regionName, country } = response.data;
      const location =
        regionName && regionName !== city
          ? `${city}, ${regionName}, ${country}`
          : `${city}, ${country}`;

      await redisClient.setex(cacheKey, 14 * 24 * 60 * 60, location).catch(() => {});

      logger.info("getLocationFromIP: resolved", { ip, location });
      return location;
    }

    logger.warn("getLocationFromIP: api returned failure", {
      ip,
      status: response.data.status,
    });
    return "Unknown Location";
  } catch (err: any) {
    logger.error("getLocationFromIP: request failed", {
      ip,
      error: err.message,
    });
    return "Unknown Location";
  }
}

export async function extractDeviceInfo(req: Request): Promise<DeviceInfo> {
  const parser = new UAParser(req.headers["user-agent"]);
  const result = parser.getResult();

  // single source of truth — same function used everywhere
  const ipAddress = getRealIp(req);
  const location = await getLocationFromIP(ipAddress);

  return {
    device: result.device.type || "Desktop",
    browser: `${result.browser.name || "Unknown"} ${result.browser.version || ""}`.trim(),
    os: result.os.name || "Unknown",
    ipAddress,
    location,
  };
}