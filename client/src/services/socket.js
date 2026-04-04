import { io } from "socket.io-client";

function createMockSocket() {
  return {
    connected: false,
    connect() {
      this.connected = true;
    },
    on() {},
    off() {},
    emit() {},
  };
}

const socketUrl =
  import.meta.env.VITE_SOCKET_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "";

export const socket = socketUrl
  ? io(socketUrl, {
      autoConnect: false,
    })
  : createMockSocket();
