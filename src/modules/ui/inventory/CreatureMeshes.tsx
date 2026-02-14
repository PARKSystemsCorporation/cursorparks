"use client";

import React from "react";

export type MorphParams = {
  intensity?: string;
  head?: { scaleX: number; scaleY: number; scaleZ: number; tiltX: number; tiltZ: number; offsetX: number; offsetZ: number };
  body?: { scaleX: number; scaleY: number; scaleZ: number; tiltX: number; tiltZ: number; offsetX: number; offsetZ: number };
  tail?: { scaleX: number; scaleY: number; scaleZ: number; tiltX: number; tiltZ: number; offsetX: number; offsetZ: number };
};

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
  morphParams?: MorphParams;
};

function clampHexBrightness(color: string, fallback: string, minLuma: number): string {
  if (!/^#([0-9a-f]{6})$/i.test(color)) return fallback;
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < minLuma ? fallback : color;
}

function matFromProfile(profile: CreatureIdentity["color_profile"]) {
  const p = profile || {};
  const safePrimary =
    typeof p.primary === "string" ? clampHexBrightness(p.primary, "#4a4238", 0.18) : "#4a4238";
  const safeSecondary =
    typeof p.secondary === "string" ? clampHexBrightness(p.secondary, "#5a5147", 0.2) : "#5a5147";
  const safeEmissive =
    typeof p.emissive === "string" ? clampHexBrightness(p.emissive, "#221d18", 0.06) : "#221d18";
  return {
    color: safePrimary,
    secondary: safeSecondary,
    metalness: p.metalness ?? 0.5,
    roughness: p.roughness ?? 0.6,
    emissive: safeEmissive,
    emissiveIntensity: p.emissiveIntensity ?? 0.05,
  };
}

/** Eyes pair for all head types; uses accent for emissive. */
function CreatureEyes({
  headY,
  accent = "#877a6a",
}: {
  headY: number;
  accent?: string;
}) {
  return (
    <>
      <mesh position={[-0.04, headY + 0.02, 0.08]} castShadow>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0.04, headY + 0.02, 0.08]} castShadow>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </>
  );
}

/** Apply morph scale/tilt/offset to a group. */
function MorphGroup({
  morph,
  children,
}: {
  morph: MorphParams["head"] | MorphParams["body"] | MorphParams["tail"];
  children: React.ReactNode;
}) {
  if (!morph) return <>{children}</>;
  const sx = morph.scaleX ?? 1;
  const sy = morph.scaleY ?? 1;
  const sz = morph.scaleZ ?? 1;
  const tx = morph.tiltX ?? 0;
  const tz = morph.tiltZ ?? 0;
  const ox = morph.offsetX ?? 0;
  const oz = morph.offsetZ ?? 0;
  return (
    <group scale={[sx, sy, sz]} rotation={[tx, 0, tz]} position={[ox, 0, oz]}>
      {children}
    </group>
  );
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
  const sec = m.secondary;
  const accentColor = (identity.color_profile?.accent as string) ?? "#877a6a";
  const mp = identity.morphParams;

  return (
    <group>
      {/* BODY */}
      <MorphGroup morph={mp?.body}>
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
        {identity.body_type === "beetle_core" && (
          <>
            <mesh position={[0, 0.18, 0]} castShadow>
              <sphereGeometry args={[0.18, 12, 10]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[0, 0.08, 0.14]} castShadow>
              <cylinderGeometry args={[0.05, 0.06, 0.08, 6]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[0.12, 0.08, 0.08]} castShadow>
              <cylinderGeometry args={[0.035, 0.04, 0.08, 6]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[-0.12, 0.08, 0.08]} castShadow>
              <cylinderGeometry args={[0.035, 0.04, 0.08, 6]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </>
        )}
        {identity.body_type === "tripod_chassis" && (
          <>
            <mesh position={[0, 0.2, 0]} castShadow>
              <boxGeometry args={[0.22, 0.14, 0.2]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[0, 0.06, 0.15]} castShadow>
              <cylinderGeometry args={[0.04, 0.05, 0.1, 6]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[0.14, 0.06, -0.08]} castShadow>
              <cylinderGeometry args={[0.03, 0.035, 0.12, 6]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[-0.14, 0.06, -0.08]} castShadow>
              <cylinderGeometry args={[0.03, 0.035, 0.12, 6]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </>
        )}
        {!["slug_form", "dog_frame", "crawler_plate", "beetle_core", "tripod_chassis"].includes(identity.body_type) && (
          <mesh position={[0, 0.2, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.36, 4, 8]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        )}
      </MorphGroup>

      {/* HEAD */}
      <MorphGroup morph={mp?.head}>
      {identity.head_type === "sensor_dome" && (
        <>
          <mesh position={[0, 0.48, 0.06]} castShadow>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <CreatureEyes headY={0.48} accent={accentColor} />
        </>
      )}
      {identity.head_type === "narrow_visor" && (
        <>
          <mesh position={[0, 0.44, 0.08]} castShadow>
            <boxGeometry args={[0.2, 0.12, 0.1]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <CreatureEyes headY={0.44} accent={accentColor} />
        </>
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
          <CreatureEyes headY={0.46} accent={accentColor} />
        </>
      )}
      {identity.head_type === "prism_head" && (
        <>
          <mesh position={[0, 0.46, 0.06]} castShadow rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.08, 0.08, 0.14, 6]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <CreatureEyes headY={0.46} accent={accentColor} />
        </>
      )}
      {identity.head_type === "split_orb" && (
        <>
          <mesh position={[0, 0.48, 0.04]} castShadow>
            <sphereGeometry args={[0.1, 12, 10]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <mesh position={[-0.06, 0.48, 0.1]} castShadow>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <mesh position={[0.06, 0.48, 0.1]} castShadow>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <CreatureEyes headY={0.48} accent={accentColor} />
        </>
      )}
      {!["sensor_dome", "narrow_visor", "antenna_cluster", "prism_head", "split_orb"].includes(identity.head_type) && (
        <>
          <mesh position={[0, 0.46, 0.06]} castShadow>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color={sec} metalness={m.metalness} roughness={m.roughness} />
          </mesh>
          <CreatureEyes headY={0.46} accent={accentColor} />
        </>
      )}
      </MorphGroup>

      {/* TAIL */}
      <MorphGroup morph={mp?.tail}>
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
      {identity.tail_type === "fin_array" && (
        <>
          <mesh position={[0, 0.2, -0.24]} castShadow rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.02, 0.2, 0.12]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-0.06, 0.18, -0.22]} castShadow rotation={[0.2, 0, 0.3]}>
            <boxGeometry args={[0.02, 0.14, 0.08]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.06, 0.18, -0.22]} castShadow rotation={[0.2, 0, -0.3]}>
            <boxGeometry args={[0.02, 0.14, 0.08]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </>
      )}
      {identity.tail_type === "coil_whip" && (
        <mesh position={[0, 0.2, -0.26]} castShadow rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.015, 0.32, 6]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {!["cable_tail", "blade_tail", "stabilizer_tail", "fin_array", "coil_whip"].includes(identity.tail_type) && (
        <mesh position={[0, 0.18, -0.22]} castShadow rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.28, 6]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      </MorphGroup>
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
