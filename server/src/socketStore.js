const users = new Map();

let ioInstance = null;

export function setIO(nextIO) {
  ioInstance = nextIO;
}

export function getIO() {
  return ioInstance;
}

export function registerUserSocket(userId, socketId) {
  if (!userId || !socketId) {
    return;
  }

  const socketIds = users.get(userId) || new Set();
  socketIds.add(socketId);
  users.set(userId, socketIds);
}

export function unregisterSocket(socketId) {
  if (!socketId) {
    return;
  }

  for (const [userId, socketIds] of users.entries()) {
    socketIds.delete(socketId);

    if (socketIds.size === 0) {
      users.delete(userId);
    }
  }
}

export function getUserSocketIds(userId) {
  return [...(users.get(userId) || [])];
}

export function getConnectedUsers() {
  return Object.fromEntries(
    [...users.entries()].map(([userId, socketIds]) => [userId, [...socketIds]])
  );
}
