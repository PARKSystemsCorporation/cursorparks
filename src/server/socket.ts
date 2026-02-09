type IOEmitter = { emit: (...args: any[]) => void };

let ioInstance: IOEmitter | null = null;

export function setIO(io: IOEmitter) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}
