import { Router } from "express";
import { authenticate }                   from "../../middleware/auth.middleware";
import { sseManager, HEARTBEAT_INTERVAL_MS } from "./sse.service";
import logger                             from "../../utils/logger";
import { requestContext }                 from "../../context/requestContext";

const router = Router();

router.get("/connect", authenticate, (req, res) => {
  const userId = req.user!.userId;
  const tenantId = req.tenantId ?? req.user!.tenantId;

  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ userId, tenantId, ts: Date.now() })}\n\n`);

  sseManager.addConnection(userId, res, tenantId);

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
  }, HEARTBEAT_INTERVAL_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseManager.removeConnection(userId, res, tenantId);
    logger.info("sse_client_disconnected", {
      event:     "sse_client_disconnected",
      userId,
      tenantId,
      ...requestContext.get(),
    });
  });
});

export default router;