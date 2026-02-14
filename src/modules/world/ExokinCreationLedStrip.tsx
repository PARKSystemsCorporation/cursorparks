"use client";

import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";

type SpawnGlow = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  startedAt: number;
};

const LED_DURATION_MS = 1800;
const STRIP_LENGTH = 1.5;
const TOP_STRIP_Y = 0.62;

/**
 * Temporary light-blue LED strip that flashes across the spawn point
 * to highlight EXOKIN creation.
 */
export function ExokinCreationLedStrip() {
  const [spawnGlow, setSpawnGlow] = useState<SpawnGlow | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const onSpawn = (e: Event) => {
      const custom = e as CustomEvent<{ x?: number; y?: number; z?: number; yaw?: number }>;
      const x = custom.detail?.x;
      const y = custom.detail?.y ?? 0;
      const z = custom.detail?.z;
      const yaw = custom.detail?.yaw ?? 0;
      if (typeof x !== "number" || typeof z !== "number") return;
      setPulse(1);
      setSpawnGlow({ x, y, z, yaw, startedAt: performance.now() });
    };

    window.addEventListener("parks-spawn-occurred", onSpawn as EventListener);
    return () => window.removeEventListener("parks-spawn-occurred", onSpawn as EventListener);
  }, []);

  useFrame(() => {
    if (!spawnGlow) return;
    const elapsed = performance.now() - spawnGlow.startedAt;
    if (elapsed > LED_DURATION_MS) {
      setSpawnGlow(null);
      setPulse(0);
      return;
    }
    const progress = Math.min(1, Math.max(0, elapsed / LED_DURATION_MS));
    setPulse(1 - progress);
  });

  if (!spawnGlow) return null;

  const stripOpacity = 0.35 + pulse * 0.65;
  const lightIntensity = 2.6 + pulse * 7.6;
  const lightDistance = 6.5 + pulse * 4.5;

  return (
    <group position={[spawnGlow.x, spawnGlow.y, spawnGlow.z]} rotation={[0, spawnGlow.yaw, 0]}>
      {/* Left-to-right creation strip at platform top for visibility */}
      <mesh position={[0, TOP_STRIP_Y, 0]}>
        <boxGeometry args={[STRIP_LENGTH, 0.035, 0.08]} />
        <meshBasicMaterial color="#9befff" transparent opacity={0.48 + pulse * 0.52} toneMapped={false} />
      </mesh>

      {/* Bright laser core on the top strip */}
      <mesh position={[0, TOP_STRIP_Y + 0.02, 0]}>
        <boxGeometry args={[STRIP_LENGTH, 0.012, 0.024]} />
        <meshBasicMaterial color="#e9fbff" transparent opacity={0.65 + pulse * 0.35} toneMapped={false} />
      </mesh>

      {/* Ground anchor strip to keep the spawn point readable */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[STRIP_LENGTH, 0.03, 0.08]} />
        <meshBasicMaterial color="#7ee7ff" transparent opacity={stripOpacity * 0.65} toneMapped={false} />
      </mesh>

      {/* Soft floor bleed for stronger LED read */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[STRIP_LENGTH + 0.55, 0.32]} />
        <meshBasicMaterial color="#3cb9ff" transparent opacity={0.16 + pulse * 0.28} toneMapped={false} />
      </mesh>

      <pointLight
        position={[0, TOP_STRIP_Y + 0.22, 0]}
        intensity={lightIntensity}
        distance={lightDistance}
        decay={2}
        color="#99eeff"
      />
      <pointLight
        position={[0, TOP_STRIP_Y + 0.9, 0]}
        intensity={1.9 + pulse * 4.2}
        distance={7.5 + pulse * 3.8}
        decay={2}
        color="#8cecff"
      />
    </group>
  );
}
