"use client";

import { useMemo } from "react";
import * as THREE from "three";

const STONE_DARK = "#3d3028";
const STONE_MID = "#4a3728";
const STONE_LIGHT = "#5c4535";
const FLOOR_EARTH = "#2a2520";
const CONCRETE = "#5a5a58";
const CONCRETE_WEATHERED = "#4a4845";
const CHAIN_METAL = "#333";
const SAND = "#c9a86c";
const SAND_DARK = "#a68b52";

/** Stone/brick hallway (photo #2 style): narrow, arched, diagonal light, bright arch at end. */
function StoneHallway() {
    const H_W = 1.6;
    const H_L = 6;
    const H_HEIGHT = 3.2;
    const ARCH_R = 0.9;

    const wallMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: STONE_MID,
                roughness: 0.92,
                metalness: 0.05,
            }),
        []
    );
    const floorMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: FLOOR_EARTH,
                roughness: 0.95,
                metalness: 0,
            }),
        []
    );

    return (
        <group>
            {/* Floor */}
            <mesh position={[-H_L / 2, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[H_L, H_W]} />
                <primitive object={floorMat} attach="material" />
            </mesh>

            {/* Left wall */}
            <mesh position={[-H_L / 2, H_HEIGHT / 2, -H_W / 2]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                <planeGeometry args={[H_L, H_HEIGHT]} />
                <primitive object={wallMat} attach="material" />
            </mesh>
            {/* Right wall */}
            <mesh position={[-H_L / 2, H_HEIGHT / 2, H_W / 2]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
                <planeGeometry args={[H_L, H_HEIGHT]} />
                <primitive object={wallMat} attach="material" />
            </mesh>

            {/* Arched ceiling: two quads + half-cylinder arch */}
            <mesh position={[-H_L / 2, H_HEIGHT - 0.3, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                <planeGeometry args={[H_L, 0.6]} />
                <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
            </mesh>
            <group position={[-H_L / 2, H_HEIGHT - 0.3 + ARCH_R, 0]}>
                <mesh rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[ARCH_R, ARCH_R, H_L, 16, 1, true, 0, Math.PI]} />
                    <meshStandardMaterial color={STONE_DARK} roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
            </group>

            {/* Diagonal light beam (emissive plane from upper left) */}
            <group position={[-1.5, 2.2, -H_W / 2 + 0.1]} rotation={[0, Math.PI / 2, 0.35]}>
                <mesh>
                    <planeGeometry args={[5, 1.8]} />
                    <meshBasicMaterial
                        color="#fff8e0"
                        transparent
                        opacity={0.25}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>

            {/* Bright arch at end (light + frame) */}
            <group position={[-H_L, 0, 0]}>
                <mesh position={[0, H_HEIGHT / 2 - 0.2, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                    <planeGeometry args={[H_HEIGHT - 0.4, H_W + 0.2]} />
                    <meshStandardMaterial color={STONE_LIGHT} roughness={0.85} />
                </mesh>
                {/* Arch opening: subtract arch from wall visually with a dark frame */}
                <mesh position={[0.05, H_HEIGHT / 2 - 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <ringGeometry args={[0.5, 0.95, 32, 1, 0, Math.PI]} />
                    <meshStandardMaterial color={STONE_DARK} roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
                <pointLight position={[0.5, 0, 0]} color="#fff5dc" intensity={8} distance={12} decay={2} />
            </group>
        </group>
    );
}

/** Stairs down (tilted for illusion of length). */
function StairsDown() {
    const STEP_W = 1.8;
    const STEP_H = 0.22;
    const STEP_D = 0.5;
    const COUNT = 10;
    const mat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: STONE_MID,
                roughness: 0.9,
                metalness: 0,
            }),
        []
    );

    return (
        <group position={[-6, 0, 0]} rotation={[0.12, 0, 0]}>
            {Array.from({ length: COUNT }).map((_, i) => (
                <mesh
                    key={i}
                    position={[-i * STEP_D * 1.1, -i * STEP_H, 0]}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[STEP_D, STEP_H, STEP_W]} />
                    <primitive object={mat} attach="material" />
                </mesh>
            ))}
        </group>
    );
}

/** Brazilian prison jailyard: concrete, chain-link, harsh light; surrounded by desert. */
function PrisonYardAndDesert() {
    const YARD_W = 8;
    const YARD_D = 6;
    const FENCE_H = 3.5;
    const concreteMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: CONCRETE_WEATHERED,
                roughness: 0.88,
                metalness: 0.1,
            }),
        []
    );
    const sandMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: SAND,
                roughness: 0.95,
                metalness: 0,
            }),
        []
    );

    return (
        <group position={[-6, -2.4, 0]} rotation={[0.08, 0, 0]}>
            {/* Yard concrete floor */}
            <mesh position={[YARD_D / 2 + 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[YARD_D + 6, YARD_W + 4]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            {/* Chain-link fence left */}
            <group position={[YARD_D / 2 + 2, FENCE_H / 2, -YARD_W / 2 - 0.5]}>
                <mesh castShadow receiveShadow>
                    <planeGeometry args={[YARD_D + 8, FENCE_H]} />
                    <meshStandardMaterial
                        color={CHAIN_METAL}
                        roughness={0.6}
                        metalness={0.6}
                        transparent
                        opacity={0.75}
                    />
                </mesh>
            </group>
            {/* Chain-link fence right */}
            <group position={[YARD_D / 2 + 2, FENCE_H / 2, YARD_W / 2 + 0.5]}>
                <mesh castShadow receiveShadow>
                    <planeGeometry args={[YARD_D + 8, FENCE_H]} />
                    <meshStandardMaterial
                        color={CHAIN_METAL}
                        roughness={0.6}
                        metalness={0.6}
                        transparent
                        opacity={0.75}
                    />
                </mesh>
            </group>

            {/* Back wall: weathered Brazilian prison concrete */}
            <mesh
                position={[YARD_D + 5, FENCE_H / 2, 0]}
                rotation={[0, Math.PI / 2, 0]}
                castShadow
                receiveShadow
            >
                <planeGeometry args={[YARD_W + 4, FENCE_H]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            {/* Watchtower accent (simple box) */}
            <mesh position={[YARD_D + 4.5, FENCE_H + 1.2, YARD_W / 2]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 2, 1]} />
                <meshStandardMaterial color={CONCRETE} roughness={0.8} />
            </mesh>

            {/* Desert: sand extending back and sides */}
            <mesh position={[YARD_D + 12, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[40, 50]} />
                <primitive object={sandMat} attach="material" />
            </mesh>

            {/* Dune bumps (simple planes angled for dune feel) */}
            {[4, 8, 14, 20].map((dx, i) => (
                <mesh
                    key={i}
                    position={[YARD_D + dx, 0.3 + Math.sin(i) * 0.4, 6 + (i % 2) * 4]}
                    rotation={[-Math.PI / 2 + 0.05, 0, 0.02]}
                    receiveShadow
                >
                    <planeGeometry args={[12, 8]} />
                    <meshStandardMaterial color={SAND_DARK} roughness={0.95} />
                </mesh>
            ))}

            {/* Harsh sun / yard light */}
            <directionalLight
                position={[10, 15, 5]}
                intensity={3}
                color="#fff0e0"
                castShadow
                shadow-mapSize={[512, 512]}
            />
            <pointLight position={[YARD_D / 2, 4, 0]} color="#fff5e6" intensity={2} distance={15} decay={2} />
        </group>
    );
}

/**
 * PrisonHallwayAndYard: entrance on the left after the first vendor.
 * Stone hallway (photo #2) → stairs down → Brazilian prison jailyard surrounded by desert.
 * Tilted for illusion of depth.
 */
export function PrisonHallwayAndYard() {
    // Align with hallway gap: left wall at x=-2, gap center at z=-7. Hallway extends in world -X (into the left).
    return (
        <group position={[-2, 0, -7]}>
            <StoneHallway />
            <StairsDown />
            <PrisonYardAndDesert />
        </group>
    );
}
