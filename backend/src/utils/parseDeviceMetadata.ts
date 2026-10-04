import { UAParser } from "ua-parser-js";

export interface DeviceMetadata {
  deviceLabel: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  os: string | null;
  browser: string | null;
}

export function parseDeviceMetadata(
  userAgent: string | undefined,
): DeviceMetadata {
  if (!userAgent) {
    return {
      deviceLabel: "Unknown device",
      deviceType: "unknown",
      os: null,
      browser: null,
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name ?? null;
  const os = result.os.name ?? null;
  const deviceType: DeviceMetadata["deviceType"] =
    result.device.type === "mobile"
      ? "mobile"
      : result.device.type === "tablet"
        ? "tablet"
        : result.device.type === undefined
          ? "desktop"
          : "unknown";

  const deviceLabel =
    browser && os ? `${browser} on ${os}` : (browser ?? os ?? "Unknown device");

  return { deviceLabel, deviceType, os, browser };
}
