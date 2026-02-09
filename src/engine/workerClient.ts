import type { WorkerMessage } from "./types";

type Listener = (msg: WorkerMessage) => void;

export function createMarketWorker() {
  const worker = new Worker(new URL("./marketWorker.ts", import.meta.url), {
    type: "module"
  });
  const listeners = new Set<Listener>();

  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    listeners.forEach((cb) => cb(event.data));
  };

  return {
    onMessage: (cb: Listener) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    terminate: () => worker.terminate()
  };
}
