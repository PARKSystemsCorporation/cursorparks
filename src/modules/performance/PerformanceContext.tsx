"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { PerformanceMonitor, type PerformanceSnapshot } from "./PerformanceMonitor";
import { getSocket } from "@/src/engine/socketClient";

const defaultSnapshot: PerformanceSnapshot = {
  fps: 60,
  ping_ms: 0,
  netScore: 1,
  fpsScore: 1,
  budgetScore: 1,
  etherCap: 24,
  spawnProbability: 0.35,
};

type PerformanceContextValue = {
  snapshot: PerformanceSnapshot;
  activeEtherCount: number;
  setActiveEtherCount: (n: number) => void;
  tick: () => void;
};

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot>(defaultSnapshot);
  const tickRef = useRef(0);

  const tick = useCallback(() => {
    PerformanceMonitor.tick();
    tickRef.current++;
    if (tickRef.current % 3 === 0) {
      setSnapshot(PerformanceMonitor.getSnapshot());
    }
  }, []);

  const [activeEtherCount, setActiveEtherCountState] = useState(0);
  const setActiveEtherCount = useCallback((n: number) => {
    PerformanceMonitor.setActiveEtherCount(n);
    setActiveEtherCountState(n);
  }, []);

  // Ping from socket roundtrip (periodic)
  React.useEffect(() => {
    const socket = getSocket();
    const measurePing = () => {
      const start = Date.now();
      socket.emit("ping", () => {
        const latency = Date.now() - start;
        PerformanceMonitor.setPing(latency);
        setSnapshot(PerformanceMonitor.getSnapshot());
      });
    };
    const interval = setInterval(measurePing, 5000);
    measurePing();
    return () => clearInterval(interval);
  }, []);

  const value = React.useMemo<PerformanceContextValue>(
    () => ({
      snapshot,
      activeEtherCount,
      setActiveEtherCount,
      tick,
    }),
    [snapshot, activeEtherCount, setActiveEtherCount, tick]
  );

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance(): PerformanceContextValue {
  const ctx = useContext(PerformanceContext);
  if (!ctx) {
    return {
      snapshot: defaultSnapshot,
      activeEtherCount: 0,
      setActiveEtherCount: () => { },
      tick: () => { },
    };
  }
  return ctx;
}
