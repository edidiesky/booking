import { io, type Socket } from "socket.io-client";
import { BASE } from "@/constants/api";

let socket: Socket | null = null;

export function getSocket(accessToken: string): Socket {
  if (
    socket?.connected &&
    (socket.auth as { token: string }).token === accessToken
  ) {
    return socket;
  }
  if (socket) socket.disconnect();

  socket = io(BASE, {
    auth: { token: accessToken },
    transports: ["websocket"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

