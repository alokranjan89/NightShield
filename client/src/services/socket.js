import { io } from "socket.io-client";

const configuredSocketUrl =
  import.meta.env.VITE_SOCKET_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "";

export const socketUrl = configuredSocketUrl || "http://localhost:5000";

export const socket = io(socketUrl, {
  autoConnect: false,
});

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.socket = socket;
  globalThis.socket = socket;
  console.log("[socket] debug handle attached to window.socket", socketUrl);
}
