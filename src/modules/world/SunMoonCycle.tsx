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
// Adjust mid-afternoon parameters
const RADIUS = 80;
const SUN_COLOR = new THREE.Color("#ffbd33"); // Richer orange-yellow sun
const SUN_INTENSITY = 6;
const MOON_COLOR = new THREE.Color("#e8eeff");
const MOON_INTENSITY = 3.2;

const AMBIENT_DAY = new THREE.Color("#e0f4ff");
const AMBIENT_NIGHT = new THREE.Color("#1e2238");
const HEMI_SKY_DAY = new THREE.Color("#60a0ff");
const HEMI_GROUND_DAY = new THREE.Color("#807050");
const HEMI_SKY_NIGHT = new THREE.Color("#182038");
const HEMI_GROUND_NIGHT = new THREE.Color("#0c0e18");
const BG_DAY = new THREE.Color("#60a0ff");
const BG_NIGHT = new THREE.Color("#0e1018");
const FOG_DAY = new THREE.Color("#80b0ff");
const FOG_NIGHT = new THREE.Color("#0c0e18");

// --- SUNSET PALETTE ---
const SUN_SUNSET = new THREE.Color("#ff4500"); // Deep orange-red
const SKY_SUNSET = new THREE.Color("#fd5e53"); // Warm hazy orange-red
const FOG_SUNSET = new THREE.Color("#ff8c69"); // Dense orange haze
const AMBIENT_SUNSET = new THREE.Color("#8a4b3d"); // Warm low light
const HEMI_SKY_SUNSET = new THREE.Color("#ff7f50");
const HEMI_GROUND_SUNSET = new THREE.Color("#4a3b2a");

/** Phase 0–1 over 6h from page load. Sun peak at 0.25, moon peak at 0.75. Exported for night-gating in scene components. */
export function getPhase(): number {
  // Lock to Sunset (approx 0.46 - just before 0.5 night switch)
  return 0.46;
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

  // ADJUSTED: Sweep from 0 (East) to 180 (West)
  // This ensures the sun sets at azimuth 180 -> X = -Radius (West)
  const azimuth = (t * 180) * (Math.PI / 180);

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

  // Reuse color objects for lerping to avoid GC
  const targetBg = useRef(new THREE.Color());
  const targetFog = useRef(new THREE.Color());
  const targetAmbient = useRef(new THREE.Color());
  const targetHemiSky = useRef(new THREE.Color());
  const targetHemiGround = useRef(new THREE.Color());
  const targetSun = useRef(new THREE.Color());

  useFrame(() => {
    const phase = getPhase();
    const isSun = phase < 0.5;
    const t = isSun ? phase * 2 : (phase - 0.5) * 2;
    const { elevation, azimuth } = arcPosition(t);

    pos.current.set(
      RADIUS * Math.cos(elevation) * Math.cos(azimuth),
      RADIUS * Math.sin(elevation),
      RADIUS * Math.cos(elevation) * Math.sin(azimuth)
    );

    // Calculate Sunset Factor
    // Peaks when t is near 1.0 (Sunset) or 0.0 (Sunrise). 
    // We focus on Sunset (t > 0.7).
    let sunsetFactor = 0;
    if (isSun) {
      // Ramps up from 0 at t=0.6 to 1 at t=0.9, then back down
      if (t > 0.6) {
        sunsetFactor = Math.max(0, 1 - Math.abs((t - 0.9) * 4));
        // Simple ease: starts at 0.65, peaks at 0.9, fades by 1.15
        // Actually let's just ramp it up heavily at the end
        sunsetFactor = THREE.MathUtils.smoothstep(t, 0.6, 0.95);
      }
    }

    const dayAmount = isSun ? Math.sin(Math.PI * t) : 0;
    const nightAmount = isSun ? 0 : Math.sin(Math.PI * t);

    // --- COLOR INTERPOLATION ---

    // Background (Sky)
    targetBg.current.lerpColors(BG_NIGHT, BG_DAY, dayAmount * 0.95 + 0.05);
    if (sunsetFactor > 0) targetBg.current.lerp(SKY_SUNSET, sunsetFactor);

    // Fog
    targetFog.current.lerpColors(FOG_NIGHT, FOG_DAY, dayAmount * 0.95 + 0.05);
    if (sunsetFactor > 0) targetFog.current.lerp(FOG_SUNSET, sunsetFactor);

    // Ambient
    targetAmbient.current.lerpColors(AMBIENT_NIGHT, AMBIENT_DAY, dayAmount * 0.95 + 0.05);
    if (sunsetFactor > 0) targetAmbient.current.lerp(AMBIENT_SUNSET, sunsetFactor);

    // Hemi
    targetHemiSky.current.lerpColors(HEMI_SKY_NIGHT, HEMI_SKY_DAY, dayAmount * 0.95 + 0.05);
    if (sunsetFactor > 0) targetHemiSky.current.lerp(HEMI_SKY_SUNSET, sunsetFactor);

    targetHemiGround.current.lerpColors(HEMI_GROUND_NIGHT, HEMI_GROUND_DAY, dayAmount * 0.95 + 0.05);
    if (sunsetFactor > 0) targetHemiGround.current.lerp(HEMI_GROUND_SUNSET, sunsetFactor);

    // Sun Color
    if (isSun) {
      targetSun.current.copy(SUN_COLOR);
      if (sunsetFactor > 0) targetSun.current.lerp(SUN_SUNSET, sunsetFactor);
    } else {
      targetSun.current.copy(MOON_COLOR);
    }


    // APPLY TO SCENE
    if (scene.background && scene.background instanceof THREE.Color) {
      scene.background.copy(targetBg.current);
    }
    if (scene.fog && scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(targetFog.current);
      // Optional: Increase fog density at sunset for "Haze"
      // scene.fog.density = ... (requires ref access to fog density if we want to animate it)
    }

    if (ambientRef.current) {
      ambientRef.current.color.copy(targetAmbient.current);
      ambientRef.current.intensity = (1.4 + dayAmount * 1.8 + nightAmount * 0.9) * (1 - sunsetFactor * 0.3); // Dim slightly at sunset
    }

    if (hemiRef.current) {
      hemiRef.current.color.copy(targetHemiSky.current);
      hemiRef.current.groundColor.copy(targetHemiGround.current);
      hemiRef.current.intensity = 0.5 + dayAmount * 1.6 + nightAmount * 0.7;
    }

    if (dirLightRef.current) {
      dirLightRef.current.position.copy(pos.current);
      dirLightRef.current.color.copy(targetSun.current);
      dirLightRef.current.intensity = isSun ? SUN_INTENSITY : MOON_INTENSITY;
    }

    if (discRef.current) {
      discRef.current.position.copy(pos.current);
      discRef.current.lookAt(0, 0, 0);
      discRef.current.visible = true;
      const mat = discRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.color.copy(targetSun.current);
        // Scale sun up at sunset
        const scale = isSun ? 1 + sunsetFactor * 3 : 1; // 4x size at peak sunset
        discRef.current.scale.set(scale, scale, 1);
      }
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
