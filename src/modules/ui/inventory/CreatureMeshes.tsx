"use client";

import React from "react";
import * as THREE from "three";

/** Warform: angular combat frame. Industrial, low, tank-like. */
export function WarformCreature() {
  return (
    <group>
      <mesh position={[0, 0.18, 0]} castShadow rotation={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.32]} />
        <meshStandardMaterial color="#2a2520" roughness={0.85} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.36, 0.28, 0.22]} />
        <meshStandardMaterial color="#3d3630" roughness={0.8} metalness={0.5} />
      </mesh>
      <mesh position={[0.22, 0.42, 0]} castShadow>
        <boxGeometry args={[0.08, 0.14, 0.08]} />
        <meshStandardMaterial color="#4a4238" roughness={0.75} metalness={0.5} />
      </mesh>
      <mesh position={[-0.22, 0.42, 0]} castShadow>
        <boxGeometry args={[0.08, 0.14, 0.08]} />
        <meshStandardMaterial color="#4a4238" roughness={0.75} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.58, 0.08]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.06]} />
        <meshStandardMaterial color="#5c5044" roughness={0.7} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.06, 8]} />
        <meshStandardMaterial color="#1a1612" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 0.08, 0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.05, 6]} />
        <meshStandardMaterial color="#1a1612" roughness={0.9} />
      </mesh>
      <mesh position={[-0.18, 0.08, 0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.05, 6]} />
        <meshStandardMaterial color="#1a1612" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Companion: compact support unit. Rounded, single body + sensor. */
export function CompanionCreature() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.28, 4, 8]} />
        <meshStandardMaterial color="#3d3630" roughness={0.7} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.52, 0.12]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#4a4238" roughness={0.65} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.52, 0.2]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#6b5d4d" emissive="#3a3328" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.04, 8]} />
        <meshStandardMaterial color="#2a2520" roughness={0.85} />
      </mesh>
    </group>
  );
}
