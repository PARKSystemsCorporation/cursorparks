"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CompanionCreature, ModularCreature } from "./CreatureMeshes";
import type { CreatureIdentity } from "./CreatureMeshes";

const FOLLOW_SPEED = 2.5;
const FOLLOW_DISTANCE = 1.8;
const BOB_AMPLITUDE = 0.02;
const BOB_FREQ = 2;

export function CompanionFollow({
  position: initialPos,
  identity,
}: {
  position: [number, number, number];
  identity?: CreatureIdentity;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const target = new THREE.Vector3(
      camera.position.x - Math.sin(camera.rotation.y) * FOLLOW_DISTANCE,
      camera.position.y,
      camera.position.z - Math.cos(camera.rotation.y) * FOLLOW_DISTANCE
    );
    groupRef.current.position.lerp(target, delta * FOLLOW_SPEED);
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * BOB_FREQ) * BOB_AMPLITUDE;
  });

  return (
    <group ref={groupRef} position={initialPos}>
      {identity ? <ModularCreature identity={identity} /> : <CompanionCreature />}
    </group>
  );
}
