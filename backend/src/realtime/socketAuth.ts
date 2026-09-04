import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import { JWTPayload } from "../types";
import logger from "../utils/logger";

export interface AuthenticatedSocket extends Socket {
  user: JWTPayload;
}
/**
 * @ideas
 * 1. retrieve token: socket.handshake.auth.token
 * 2. verify the otekne via jwt.verify
 * 3. check if the roken has been blocked via redis
 * 4. set the socket.user  = decoded.user
 * 5. next()
 * @param socket 
 * @param next 
 * @returns 
 */

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    next(new Error("Authentication required."));
    return;
  }

  let decoded: { user: JWTPayload };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: "booking-platform",
      audience: "booking-client",
    }) as { user: JWTPayload };
  } catch {
    next(new Error("Session expired. Please log in again."));
    return;
  }

  try {
    const blocked = await redisClient.get(`blocklist:${decoded.user.userId}`);
    if (blocked) {
      next(new Error("Session expired. Please log in again."));
      return;
    }
  } catch (err) {
    logger.error("socket_auth_blocklist_check_failed", {
      event: "socket_auth_blocklist_check_failed",
      error: (err as Error).message,
    });
    next(new Error("Service temporarily unavailable."));
    return;
  }

  (socket as AuthenticatedSocket).user = decoded.user;
  next();
}