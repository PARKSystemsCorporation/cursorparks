"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useCameraOverride } from "./CameraOverrideContext";

const DURATION = 0.8;
const HOLD = 1.6;

export function CameraProfileMoment() {
  const { camera } = useThree();
  const { setActive } = useCameraOverride();
  const state = useRef<{
    phase: "idle" | "lerping" | "holding";
    startPos: THREE.Vector3;
    startQuat: THREE.Quaternion;
    targetPos: THREE.Vector3;
    lookAt: THREE.Vector3;
    t: number;
  }>({ phase: "idle", startPos: new THREE.Vector3(), startQuat: new THREE.Quaternion(), targetPos: new THREE.Vector3(), lookAt: new THREE.Vector3(), t: 0 });

  useEffect(() => {
    const handler = (e: CustomEvent<{ x: number; y: number; z: number }>) => {
      const { x, y, z } = e.detail || {};
      state.current.phase = "lerping";
      state.current.startPos.copy(camera.position);
      state.current.startQuat.copy(camera.quaternion);
      state.current.targetPos.set(x + 0.6, 1.4, z + 1.2);
      state.current.lookAt.set(x, 0.4, z);
      state.current.t = 0;
      setActive(true);
    };
    window.addEventListener("parks-spawn-occurred", handler as EventListener);
    return () => window.removeEventListener("parks-spawn-occurred", handler as EventListener);
  }, [camera, setActive]);

  useFrame((_, delta) => {
    const s = state.current;
    if (s.phase === "idle") return;

    if (s.phase === "lerping") {
      s.t += delta / DURATION;
      if (s.t >= 1) {
        s.t = 1;
        s.phase = "holding";
      }
      const u = 1 - (1 - s.t) * (1 - s.t);
      camera.position.lerpVectors(s.startPos, s.targetPos, u);
      camera.lookAt(s.lookAt);
      return;
    }

    if (s.phase === "holding") {
      s.t += delta;
      if (s.t >= HOLD) {
        s.phase = "idle";
        setActive(false);
      }
    }
  });

  return null;
}
