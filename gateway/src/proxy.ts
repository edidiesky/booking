import axios, { AxiosResponse, Method } from "axios";
import { Readable } from "stream";
import { Request, Response } from "express";
import { logger } from "@booking/shared";
import { getBreakerFire } from "./utils/createBreaker";
import { getRealIp } from "./utils/identity";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:4000";
const GATEWAY_SHARED_SECRET = process.env.GATEWAY_SHARED_SECRET ?? "";

const WEBHOOK_SIGNATURE_HEADERS = ["x-paystack-signature", "verif-hash"];

const TENANT_CONTEXT_HEADERS = ["x-tenant-id", "x-tenant-slug"];

function toHeader(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return undefined;
}

function buildForwardHeaders(req: Request): Record<string, string> {
  const clientIp = getRealIp(req);

  const headers: Record<string, string> = {
    "content-type": toHeader(req.headers["content-type"]) || "application/json",
    "x-forwarded-for": clientIp,
    "x-client-ip": clientIp,
    "x-request-id": toHeader(req.headers["x-request-id"]) ?? "",
    host: new URL(BACKEND_ORIGIN).host,
  };

  const userAgent = toHeader(req.headers["user-agent"]);
  if (userAgent) headers["user-agent"] = userAgent;

  if (GATEWAY_SHARED_SECRET) {
    headers["x-gateway-secret"] = GATEWAY_SHARED_SECRET;
  }

  const auth = toHeader(req.headers.authorization);
  if (auth) headers.authorization = auth;

  const cookie = toHeader(req.headers.cookie);
  if (cookie) headers.cookie = cookie;

  for (const header of WEBHOOK_SIGNATURE_HEADERS) {
    const value = toHeader(req.headers[header]);
    if (value) headers[header] = value;
  }

  for (const header of TENANT_CONTEXT_HEADERS) {
    const value = toHeader(req.headers[header]);
    if (value) headers[header] = value;
  }

  return headers;
}

export function createProxyHandler() {
  return async (req: Request, res: Response): Promise<void> => {
    const requestId = toHeader(req.headers["x-request-id"]);
    const fullUrl = `${BACKEND_ORIGIN}${req.originalUrl}`;

    const proxyAction = (): Promise<AxiosResponse<Readable>> =>
      axios.request<Readable>({
        method: req.method as Method,
        url: fullUrl,
        data: req.body,
        headers: buildForwardHeaders(req),
        responseType: "stream",
        timeout: 30_000,
        validateStatus: () => true,
      });

    const fire = getBreakerFire("backend", proxyAction);

    try {
      const response = await fire();

      const contentType = toHeader(response.headers["content-type"]);
      res.setHeader("Content-Type", contentType ?? "application/json");
      res.setHeader("Cache-Control", "no-cache");

      const contentLength = toHeader(response.headers["content-length"]);
      if (contentLength !== undefined)
        res.setHeader("Content-Length", contentLength);

      res.status(response.status);

      const cleanup = () => response.data.destroy();
      res.on("close", cleanup);
      res.on("finish", cleanup);
      res.on("error", cleanup);

      response.data.on("error", (err: Error) => {
        logger.error("gateway_stream_error", {
          event: "gateway_stream_error",
          requestId,
          error: err.message,
        });
        cleanup();
        if (!res.headersSent) {
          res.status(502).json({ status: "error", error: "Stream error" });
        }
      });

      response.data.pipe(res);
    } catch (error: unknown) {
      const e = error as {
        isBreakerOpen?: boolean;
        code?: string;
        message?: string;
      };
      const isBreakerOpen = e.isBreakerOpen === true;
      const isTimeout =
        e.code === "ECONNABORTED" || e.message?.includes("timeout");

      const status = isBreakerOpen ? 503 : isTimeout ? 504 : 502;
      const message = isBreakerOpen
        ? "Backend is temporarily unavailable. Please try again later."
        : isTimeout
          ? "Request timed out"
          : "Backend unavailable";

      logger.error("gateway_proxy_failed", {
        event: "gateway_proxy_failed",
        requestId,
        fullUrl,
        status,
        error: e.message,
      });
      res.status(status).json({ status: "error", error: message });
    }
  };
}