let ioInstance: { emit: (...args: any[]) => void } | null = null;

export function setIO(io: { emit: (...args: any[]) => void }) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}
