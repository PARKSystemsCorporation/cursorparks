"use client";

import { useFrame } from "@react-three/fiber";
import { usePerformance } from "@/src/modules/performance";

/** Call performance tick each frame so snapshot stays updated. */
export function PerformanceTicker() {
  const { tick } = usePerformance();
  useFrame(() => tick());
  return null;
}
