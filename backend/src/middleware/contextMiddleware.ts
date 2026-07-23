import { Request, Response, NextFunction } from "express";
import { randomUUID }        from "crypto";
import { requestContext }    from "../context/requestContext";
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

export function tenantMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  next();
}