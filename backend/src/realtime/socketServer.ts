import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import redisClient from "../config/redis";
import { socketAuthMiddleware, type AuthenticatedSocket } from "./socketAuth";
import { withSocketScope } from "./socketContext";
import { conversationRepository } from "../domains/conversation/conversation.repository";
import { messageService } from "../domains/message/message.service";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

/**
 * @ideas
 * 1. the socket connection (io) lives within each server process, and each server process has their own distinct connections
 * 2. the io is built from the SocketIOServer which depends on the http Server at startup and other options
 * 3. we made use of adapetrs to be able to broadcast to all clients irrespecutve of whihc process that are situated.
 * 4. client > server 1 > socket 1 > reids adapter > redis < server 2 < docket 2 < client 2 gets the message
 * 5.
 */
let io: SocketIOServer | null = null;

let pubClient: ReturnType<typeof redisClient.duplicate> | null = null;
let subClient: ReturnType<typeof redisClient.duplicate> | null = null;

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io server accessed before initialization.");
  return io;
}

function emitError(
  socket: AuthenticatedSocket,
  eventType: string,
  err: unknown,
): void {
  const message =
    err instanceof AppError ? err.message : "Something went wrong.";
  socket.emit("error", { eventType, message });
  if (!(err instanceof AppError) || !err.isOperational) {
    logger.error("socket_handler_failed", {
      event: "socket_handler_failed",
      eventType,
      userId: socket.user.userId,
      error: (err as Error).message,
    });
  }
}

export async function startSocketServer(httpServer: HttpServer): Promise<void> {
  pubClient = redisClient.duplicate();
  subClient = redisClient.duplicate();

  io = new SocketIOServer(httpServer, {
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const authed = socket as AuthenticatedSocket;
    const { userId, tenantId, userType } = authed.user;

    socket.join(`user:${userId}`);

    logger.info("socket_connected", {
      event: "socket_connected",
      userId,
      tenantId,
      socketId: socket.id,
    });

    socket.on(
      "join_conversation",
      async (conversationId: string, ack?: (ok: boolean) => void) => {
        try {
          const allowed = await withSocketScope(
            { userId, tenantId, userType, eventType: "join_conversation" },
            async () => {
              const conversation =
                await conversationRepository.findById(conversationId);
              return conversation
                ? conversationRepository.assertParticipant(conversation, userId)
                : false;
            },
          );
          if (!allowed) {
            ack?.(false);
            return;
          }
          socket.join(`conversation:${conversationId}`);
          ack?.(true);
        } catch (err) {
          emitError(authed, "join_conversation", err);
          ack?.(false);
        }
      },
    );

    socket.on(
      "send_message",
      async (
        payload: { conversationId: string; body: string },
        ack?: (message: unknown) => void,
      ) => {
        try {
          const message = await withSocketScope(
            { userId, tenantId, userType, eventType: "send_message" },
            () =>
              messageService.sendMessage({
                conversationId: payload.conversationId,
                senderId: userId,
                body: payload.body,
              }),
          );
          ack?.(message);
        } catch (err) {
          emitError(authed, "send_message", err);
        }
      },
    );

    socket.on("mark_read", async (conversationId: string) => {
      try {
        await withSocketScope(
          { userId, tenantId, userType, eventType: "mark_read" },
          () => messageService.markRead(conversationId, userId),
        );
      } catch (err) {
        emitError(authed, "mark_read", err);
      }
    });

    socket.on("typing", (conversationId: string) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("typing", { userId, conversationId });
    });

    socket.on("disconnect", (reason) => {
      logger.info("socket_disconnected", {
        event: "socket_disconnected",
        userId,
        socketId: socket.id,
        reason,
      });
    });
  });

  logger.info("socket_server_started", { event: "socket_server_started" });
}

export async function stopSocketServer(): Promise<void> {
  if (io) {
    await new Promise<void>((resolve) => io!.close(() => resolve()));
    io = null;
  }
  if (pubClient) {
    await pubClient.quit();
    pubClient = null;
  }
  if (subClient) {
    await subClient.quit();
    subClient = null;
  }
}
