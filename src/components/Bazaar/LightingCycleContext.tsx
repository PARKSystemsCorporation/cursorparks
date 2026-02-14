"use client";

import { createContext, useContext, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { getEmissiveScale, getPracticalLightIntensity } from "./lightingMode";

type LightingCycle = {
  emissiveScale: number;
  practicalLightIntensity: number;
};

const LightingCycleContext = createContext<LightingCycle | null>(null);

const THROTTLE_MS = 120;

/**
 * Provider that updates emissive scale and practical light intensity from the day/night cycle.
 * Throttled to avoid excessive re-renders. Must be used inside Canvas (useFrame).
 */
export function LightingCycleProvider({ children }: { children: React.ReactNode }) {
  const [cycle, setCycle] = useState<LightingCycle>(() => ({
    emissiveScale: getEmissiveScale(),
    practicalLightIntensity: getPracticalLightIntensity(),
  }));
  const lastRef = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 1000;
    if (t - lastRef.current < THROTTLE_MS) return;
    lastRef.current = t;
    const emissiveScale = getEmissiveScale();
    const practicalLightIntensity = getPracticalLightIntensity();
    setCycle((prev) =>
      prev.emissiveScale !== emissiveScale || prev.practicalLightIntensity !== practicalLightIntensity
        ? { emissiveScale, practicalLightIntensity }
        : prev
    );
  });

  return (
    <LightingCycleContext.Provider value={cycle}>
      {children}
    </LightingCycleContext.Provider>
  );
}

export function useLightingCycle(): LightingCycle {
  const ctx = useContext(LightingCycleContext);
  if (ctx == null) {
    return {
      emissiveScale: getEmissiveScale(),
      practicalLightIntensity: getPracticalLightIntensity(),
    };
  }
  return ctx;
}
