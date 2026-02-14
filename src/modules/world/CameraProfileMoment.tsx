"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useCameraOverride } from "./CameraOverrideContext";

const DURATION = 0.9;
const RETURN_DURATION = 0.7;

export function CameraProfileMoment() {
  const { camera } = useThree();
  const { setActive } = useCameraOverride();
  const state = useRef<{
    phase: "idle" | "toFocus" | "awaitName" | "toReturn";
    startPos: THREE.Vector3;
    startQuat: THREE.Quaternion;
    returnPos: THREE.Vector3;
    returnQuat: THREE.Quaternion;
    targetPos: THREE.Vector3;
    lookAt: THREE.Vector3;
    t: number;
    onboardingPending: boolean;
  }>({
    phase: "idle",
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    returnPos: new THREE.Vector3(),
    returnQuat: new THREE.Quaternion(),
    targetPos: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    t: 0,
    onboardingPending: false,
  });

  useEffect(() => {
    const arm = () => {
      state.current.onboardingPending = true;
    };
    const handler = (e: CustomEvent<{ x: number; y: number; z: number }>) => {
      if (!state.current.onboardingPending) return;
      const { x, y, z } = e.detail || {};
      state.current.phase = "toFocus";
      state.current.startPos.copy(camera.position);
      state.current.startQuat.copy(camera.quaternion);
      state.current.returnPos.copy(camera.position);
      state.current.returnQuat.copy(camera.quaternion);
      state.current.targetPos.set(x + 0.9, 1.15, z + 0.9);
      state.current.lookAt.set(x, 0.55, z);
      state.current.t = 0;
      state.current.onboardingPending = false;
      setActive(true);
    };
    const doneNaming = () => {
      if (state.current.phase !== "awaitName") return;
      state.current.phase = "toReturn";
      state.current.startPos.copy(camera.position);
      state.current.startQuat.copy(camera.quaternion);
      state.current.t = 0;
    };
    window.addEventListener("parks-onboarding-focus-start", arm as EventListener);
    window.addEventListener("parks-spawn-occurred", handler as EventListener);
    window.addEventListener("parks-onboarding-name-saved", doneNaming as EventListener);
    return () => {
      window.removeEventListener("parks-onboarding-focus-start", arm as EventListener);
      window.removeEventListener("parks-spawn-occurred", handler as EventListener);
      window.removeEventListener("parks-onboarding-name-saved", doneNaming as EventListener);
    };
  }, [camera, setActive]);

  useFrame((_, delta) => {
    const s = state.current;
    if (s.phase === "idle") return;

    if (s.phase === "toFocus") {
      s.t += delta / DURATION;
      if (s.t >= 1) {
        s.t = 1;
        s.phase = "awaitName";
      }
      const u = 1 - (1 - s.t) * (1 - s.t);
      camera.position.lerpVectors(s.startPos, s.targetPos, u);
      // Add a cinematic 180 spin while moving toward the EXOKIN.
      const spin = Math.PI * u;
      const qSpin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin);
      camera.quaternion.copy(s.startQuat).multiply(qSpin);
      camera.lookAt(s.lookAt);
      return;
    }

    if (s.phase === "toReturn") {
      s.t += delta / RETURN_DURATION;
      if (s.t >= 1) {
        s.t = 1;
        s.phase = "idle";
        setActive(false);
      }
      const u = 1 - (1 - s.t) * (1 - s.t);
      camera.position.lerpVectors(s.startPos, s.returnPos, u);
      camera.quaternion.copy(s.startQuat).slerp(s.returnQuat, u);
    }
  });

  return null;
}
