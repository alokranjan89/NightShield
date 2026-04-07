const users = {};

let ioInstance = null;

export function setIO(nextIO) {
  ioInstance = nextIO;
}

export function getIO() {
  return ioInstance;
}

export { users };
