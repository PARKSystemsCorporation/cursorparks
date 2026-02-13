"use client";

import React from "react";

/** Minimal 3D arena floor for when in_arena. Rendered as overlay scene or same canvas. */
export function ArenaRoom() {
  return (
    <group position={[0, 0, -20]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[8, 10, 32]} />
        <meshStandardMaterial color="#3d2a1a" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[-3, 0.3, -20]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.25]} />
        <meshStandardMaterial color="#ff6b1a" roughness={0.6} />
      </mesh>
      <mesh position={[3, 0.3, -20]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.25]} />
        <meshStandardMaterial color="#c0392b" roughness={0.6} />
      </mesh>
    </group>
  );
}
