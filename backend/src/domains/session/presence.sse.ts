import type { Request, Response } from "express";
import type { PresenceEngine } from "./PresenceEngine";

export function createPresenceSSEHandler(engine: PresenceEngine) {
  return (req: Request, res: Response): void => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.write(
      `data: ${JSON.stringify({ onlineSessionIds: engine.listOnline() })}\n\n`,
    );

    const unsubscribe = engine.onChange((sessionId, isOnline) => {
      res.write(
        `data: ${JSON.stringify({ sessionId, isOnline })}\n\n`,
      );
    });

    req.on("close", () => {
      unsubscribe();
    });
  };
}