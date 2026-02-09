type IOEmitter = {
  emit: (...args: unknown[]) => void;
  to?: (room: string) => IOEmitter;
};

let ioInstance: IOEmitter | null = null;

export function setIO(io: IOEmitter) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}
