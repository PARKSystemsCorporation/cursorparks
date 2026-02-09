"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  socket = io({
    path: "/socket"
  });
  return socket;
}
