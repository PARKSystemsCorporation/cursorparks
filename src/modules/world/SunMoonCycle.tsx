"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Real seconds for one full in-game day (6h wall clock). */
export const REAL_SECONDS_PER_GAME_DAY = 6 * 3600;
/** Game-world seconds in a 24h day (for clock display). */
export const GAME_SECONDS_PER_DAY = 24 * 3600;
/** 4x: one real 6h span = one game 24h day. */
export const CLOCK_ACCELERATION = 4;

// Adjust mid-afternoon parameters
const RADIUS = 80;
const SUN_COLOR = new THREE.Color("#ffbd33"); // Richer orange-yellow sun
const SUN_INTENSITY = 6; // Reduced from 12 to prevent washout
const MOON_COLOR = new THREE.Color("#e8eeff");
const MOON_INTENSITY = 3.2;

const AMBIENT_DAY = new THREE.Color("#e0f4ff"); // Light blue ambient
const AMBIENT_NIGHT = new THREE.Color("#1e2238");
const HEMI_SKY_DAY = new THREE.Color("#60a0ff"); // Deeper blue sky bounce
const HEMI_GROUND_DAY = new THREE.Color("#807050"); // Dusty ground bounce
const HEMI_SKY_NIGHT = new THREE.Color("#182038");
const HEMI_GROUND_NIGHT = new THREE.Color("#0c0e18");
const BG_DAY = new THREE.Color("#60a0ff"); // Deeper, richer blue sky
const BG_NIGHT = new THREE.Color("#0e1018");
const FOG_DAY = new THREE.Color("#80b0ff"); // Matching slightly lighter fog
const FOG_NIGHT = new THREE.Color("#0c0e18");

/** Phase 0–1 over 6h from page load. Sun peak at 0.25, moon peak at 0.75. Exported for night-gating in scene components. */
export function getPhase(): number {
  // Lock to mid-afternoon (approx 2:30 PM)
  return 0.32;
}

/** Game-world seconds since midnight (0–86400). Peak night (phase 0.75) = 0. */
export function getGameSecondsOfDay(): number {
  const phase = getPhase();
  return ((phase + 0.25) % 1) * GAME_SECONDS_PER_DAY;
}

/** Game-world hour (0–24). Midnight = peak night. */
export function getGameHour(): number {
  return (getGameSecondsOfDay() / 3600) % 24;
}

/** Day strength 0–1 (peak at noon). Night strength 0–1 (peak at midnight). Smooth transitions. */
export function getDayNightStrength(): { dayStrength: number; nightStrength: number } {
  const phase = getPhase();
  const isSun = phase < 0.5;
  const t = isSun ? phase * 2 : (phase - 0.5) * 2;
  const dayStrength = isSun ? Math.sin(Math.PI * t) : 0;
  const nightStrength = isSun ? 0 : Math.sin(Math.PI * t);
  return { dayStrength, nightStrength };
}

/** True when game clock is in night half (phase >= 0.5, i.e. from 18:00 to 06:00). Use for coliseum spotlights and other night-only visuals. */
export function isNight(): boolean {
  return getPhase() >= 0.5;
}

/** Elevation and azimuth for one arc: rise → peak → set. t in [0,1]. */
function arcPosition(t: number): { elevation: number; azimuth: number } {
  const elevation = (Math.sin(Math.PI * t) * 95 - 5) * (Math.PI / 180);
  const azimuth = (90 - 180 * t) * (Math.PI / 180);
  return { elevation, azimuth };
}

/** Spherical to Cartesian (y-up). */
function toPosition(elevation: number, azimuth: number): THREE.Vector3 {
  return new THREE.Vector3(
    RADIUS * Math.cos(elevation) * Math.cos(azimuth),
    RADIUS * Math.sin(elevation),
    RADIUS * Math.cos(elevation) * Math.sin(azimuth)
  );
}

/**
 * 6-hour real-time sun/moon cycle: sun peak at 1.5h, moon peak at 3h later, restart 1.5h after that.
 * One directional light + one disc (sun or moon) at a time to save resources.
 */
export function SunMoonCycle() {
  const { scene } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const pos = useRef(new THREE.Vector3());
  const bgColor = useRef(new THREE.Color());
  const fogColor = useRef(new THREE.Color());

  useFrame(() => {
    const phase = getPhase();
    const isSun = phase < 0.5;
    const t = isSun ? phase * 2 : (phase - 0.5) * 2;
    const { elevation, azimuth } = arcPosition(t);
    toPosition(elevation, azimuth).copy(pos.current);

    if (dirLightRef.current) {
      dirLightRef.current.position.copy(pos.current);
      dirLightRef.current.color.copy(isSun ? SUN_COLOR : MOON_COLOR);
      dirLightRef.current.intensity = isSun ? SUN_INTENSITY : MOON_INTENSITY;
    }

    if (discRef.current) {
      discRef.current.position.copy(pos.current);
      discRef.current.lookAt(0, 0, 0);
      discRef.current.visible = true;
      const mat = discRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        if (isSun) {
          mat.color.copy(SUN_COLOR); // Use the defined sun color for the disc
          mat.toneMapped = false;
        } else {
          mat.color.copy(new THREE.Color("#e8ecff"));
          mat.toneMapped = false;
        }
      }
    }

    const dayAmount = isSun ? Math.sin(Math.PI * t) : 0;
    const nightAmount = isSun ? 0 : Math.sin(Math.PI * t);
    if (ambientRef.current) {
      ambientRef.current.color.lerpColors(AMBIENT_NIGHT, AMBIENT_DAY, dayAmount * 0.95 + 0.05);
      ambientRef.current.intensity = 1.4 + dayAmount * 1.8 + nightAmount * 0.9;
    }
    if (hemiRef.current) {
      hemiRef.current.color.lerpColors(HEMI_SKY_NIGHT, HEMI_SKY_DAY, dayAmount * 0.95 + 0.05);
      hemiRef.current.groundColor.lerpColors(HEMI_GROUND_NIGHT, HEMI_GROUND_DAY, dayAmount * 0.95 + 0.05);
      hemiRef.current.intensity = 0.5 + dayAmount * 1.6 + nightAmount * 0.7;
    }
    if (scene.background && scene.background instanceof THREE.Color) {
      bgColor.current.lerpColors(BG_NIGHT, BG_DAY, dayAmount * 0.95 + 0.05);
      scene.background.copy(bgColor.current);
    }
    if (scene.fog && scene.fog instanceof THREE.FogExp2) {
      fogColor.current.lerpColors(FOG_NIGHT, FOG_DAY, dayAmount * 0.95 + 0.05);
      scene.fog.color.copy(fogColor.current);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={2.8} color={AMBIENT_DAY} />
      <hemisphereLight
        ref={hemiRef}
        args={[HEMI_SKY_DAY, HEMI_GROUND_DAY, 1.8]}
      />
      <directionalLight
        ref={dirLightRef}
        position={[50, 40, -10]}
        intensity={SUN_INTENSITY}
        color={SUN_COLOR}
        castShadow
        shadow-bias={-0.0005}
        shadow-mapSize={[2048, 2048]}
      />
      <mesh ref={discRef} position={[50, 40, -10]}>
        <circleGeometry args={[5, 24]} />
        <meshBasicMaterial
          color="#ffbd33" // Initial color matches SUN_COLOR
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
