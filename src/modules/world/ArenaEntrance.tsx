"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneState } from "./SceneStateContext";

/** Arena entrance at far end of alley. Click to enter arena (Phase 7). */
const ENTRANCE_POSITION: [number, number, number] = [0, 1.2, -28.5];

export function ArenaEntrance() {
  const { setSceneMode } = useSceneState();
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = ENTRANCE_POSITION[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    ref.current.lookAt(state.camera.position);
  });

  return (
    <group
      ref={ref}
      position={ENTRANCE_POSITION}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSceneMode("in_arena");
      }}
    >
      <mesh>
        <planeGeometry args={[1.5, 0.6]} />
        <meshBasicMaterial
          color={hovered ? "#ff6b1a" : "#c0392b"}
          transparent
          opacity={0.85}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}
