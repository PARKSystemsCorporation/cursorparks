"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTrainer } from "./TrainerContext";

const TRAINER_POSITION: [number, number, number] = [-1.5, 0, 2];
const APPROACH_DISTANCE = 3;

export function TrainerNPC() {
  const groupRef = useRef<THREE.Group>(null);
  const triggeredRef = useRef(false);
  const { triggerApproach } = useTrainer();
  const { camera } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = TRAINER_POSITION[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    if (!triggeredRef.current) {
      const dx = camera.position.x - TRAINER_POSITION[0];
      const dz = camera.position.z - TRAINER_POSITION[2];
      if (Math.sqrt(dx * dx + dz * dz) < APPROACH_DISTANCE) {
        triggeredRef.current = true;
        triggerApproach();
      }
    }
  });

  return (
    <group ref={groupRef} position={TRAINER_POSITION}>
      {/* Simple standing figure: construction-orange vest */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.5, 12]} />
        <meshStandardMaterial color="#ff6b1a" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 12]} />
        <meshStandardMaterial color="#2a1f15" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.1, 12]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} />
      </mesh>
    </group>
  );
}
