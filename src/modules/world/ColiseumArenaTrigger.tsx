"use client";

import { useEffect, useRef } from "react";
import { useSceneState } from "./SceneStateContext";
import { cameraPos } from "@/src/modules/ui/CoordTracker";

const COLISEUM_CENTER_X = -31;
const COLISEUM_CENTER_Z = -7;
const ARENA_RADIUS = 8.4;
const POLL_MS = 150;

/**
 * When the player stands inside the coliseum arena circle, enter arena mode (fight AI exokin).
 * Uses camera position from FirstPersonController; only triggers on transition into the circle.
 */
export function ColiseumArenaTrigger() {
  const { sceneMode, setSceneMode } = useSceneState();
  const wasInCircleRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const dx = cameraPos.x - COLISEUM_CENTER_X;
      const dz = cameraPos.z - COLISEUM_CENTER_Z;
      const distSq = dx * dx + dz * dz;
      const inCircle = distSq <= ARENA_RADIUS * ARENA_RADIUS;

      if (inCircle && !wasInCircleRef.current && sceneMode !== "in_arena") {
        wasInCircleRef.current = true;
        setSceneMode("in_arena");
      }
      if (!inCircle) wasInCircleRef.current = false;
    }, POLL_MS);
    return () => clearInterval(id);
  }, [sceneMode, setSceneMode]);

  return null;
}
