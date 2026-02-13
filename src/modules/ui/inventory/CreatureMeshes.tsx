"use client";

import React from "react";

export type CreatureIdentity = {
  gender: string;
  role: string;
  head_type: string;
  body_type: string;
  tail_type: string;
  color_profile: {
    primary?: string;
    secondary?: string;
    accent?: string;
    metal?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
};

function matFromProfile(profile: CreatureIdentity["color_profile"]) {
  const p = profile || {};
  return {
    color: p.primary ?? "#3d3630",
    metalness: p.metalness ?? 0.5,
    roughness: p.roughness ?? 0.6,
    emissive: p.emissive ?? "#1a1816",
    emissiveIntensity: p.emissiveIntensity ?? 0.05,
  };
}

/** Modular creature from identity: head + body + tail, mechanical constructs. */
export function ModularCreature({ identity }: { identity: CreatureIdentity }) {
  const m = matFromProfile(identity.color_profile);
  const matProps = {
    color: m.color,
    metalness: m.metalness,
    roughness: m.roughness,
    emissive: m.emissive,
    emissiveIntensity: m.emissiveIntensity,
  };
  const sec = identity.color_profile?.secondary ?? "#4a4238";

  return (
    <group>
      {/* BODY */}
      {identity.body_type === "slug_form" && (
        <mesh position={[0, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.36, 4, 8]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {identity.body_type === "dog_frame" && (
        <>
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.4, 0.12, 0.28]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.18, 0.1, 0.12]} castShadow>
            <cylinderGeometry args={[0.04, 0.045, 0.1, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-0.18, 0.1, 0.12]} castShadow>
            <cylinderGeometry args={[0.04, 0.045, 0.1, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </>
      )}
      {identity.body_type === "crawler_plate" && (
        <>
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.48, 0.08, 0.3]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.28, 0.16, 0.2]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </>
      )}

      {/* HEAD */}
      {identity.head_type === "sensor_dome" && (
        <mesh position={[0, 0.48, 0.06]} castShadow>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
        </mesh>
      )}
      {identity.head_type === "narrow_visor" && (
        <mesh position={[0, 0.44, 0.08]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.1]} />
          <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
        </mesh>
      )}
      {identity.head_type === "antenna_cluster" && (
        <>
          <mesh position={[0, 0.46, 0.06]} castShadow>
            <sphereGeometry args={[0.08, 10, 8]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <mesh position={[0.04, 0.56, 0.06]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-0.04, 0.56, 0.06]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </>
      )}

      {/* TAIL */}
      {identity.tail_type === "cable_tail" && (
        <mesh position={[0, 0.18, -0.22]} castShadow rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.28, 6]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {identity.tail_type === "blade_tail" && (
        <mesh position={[0, 0.2, -0.2]} castShadow rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.06, 0.24, 0.08]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {identity.tail_type === "stabilizer_tail" && (
        <mesh position={[0, 0.22, -0.18]} castShadow rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.12]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
    </group>
  );
}

/** Warform: angular combat frame. Industrial, low, tank-like. Fallback when no identity. */
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

/** Companion: compact support unit. Fallback when no identity. */
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
