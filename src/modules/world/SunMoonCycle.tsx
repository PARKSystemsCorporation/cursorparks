"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const CYCLE_SECONDS = 6 * 3600; // 6 hours

const RADIUS = 80;
const SUN_COLOR = new THREE.Color("#fffaf0");
const SUN_INTENSITY = 6;
const MOON_COLOR = new THREE.Color("#e8eeff");
const MOON_INTENSITY = 0.9;

const AMBIENT_DAY = new THREE.Color("#fff8e6");
const AMBIENT_NIGHT = new THREE.Color("#1a1a2a");
const HEMI_SKY_DAY = new THREE.Color("#e8d5b7");
const HEMI_GROUND_DAY = new THREE.Color("#504030");
const HEMI_SKY_NIGHT = new THREE.Color("#0a0a18");
const HEMI_GROUND_NIGHT = new THREE.Color("#050508");
const BG_DAY = new THREE.Color("#eacca7");
const BG_NIGHT = new THREE.Color("#0c0c14");
const FOG_DAY = new THREE.Color("#fff0dd");
const FOG_NIGHT = new THREE.Color("#0a0a12");

/** Phase 0–1 over 6h from page load. Sun peak at 0.25, moon peak at 0.75. */
function getPhase(): number {
  return ((typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000 % CYCLE_SECONDS) / CYCLE_SECONDS;
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
      const mat = discRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.color.copy(isSun ? new THREE.Color("#fff5d4") : new THREE.Color("#c8d0e8"));
      }
    }

    const dayAmount = isSun ? Math.sin(Math.PI * t) : 0;
    if (ambientRef.current) {
      ambientRef.current.color.lerpColors(AMBIENT_NIGHT, AMBIENT_DAY, dayAmount * 0.95 + 0.05);
      ambientRef.current.intensity = 1.2 + dayAmount * 1.3;
    }
    if (hemiRef.current) {
      hemiRef.current.color.lerpColors(HEMI_SKY_NIGHT, HEMI_SKY_DAY, dayAmount * 0.95 + 0.05);
      hemiRef.current.groundColor.lerpColors(HEMI_GROUND_NIGHT, HEMI_GROUND_DAY, dayAmount * 0.95 + 0.05);
      hemiRef.current.intensity = 0.3 + dayAmount * 1.2;
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
      <ambientLight ref={ambientRef} intensity={2.5} color={AMBIENT_DAY} />
      <hemisphereLight
        ref={hemiRef}
        args={[HEMI_SKY_DAY, HEMI_GROUND_DAY, 1.5]}
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
        <circleGeometry args={[4, 16]} />
        <meshBasicMaterial
          color="#fff5d4"
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
