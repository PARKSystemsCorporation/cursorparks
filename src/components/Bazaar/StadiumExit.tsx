"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * StadiumExit: walkable alley branch that descends into the coliseum.
 * Starts at the left wall opening (x=-2, z=-7), extends toward world -X,
 * then drops down a stepped run into the arena floor.
 */
export function StadiumExit() {
    const HALL_LENGTH = 12;
    const HALL_WIDTH = 2.8;
    const HALL_HEIGHT = 3.4;

    const STEP_COUNT = 9;
    const STEP_RUN = 0.7;
    const STEP_DROP = 0.34;
    const DESCENT_LENGTH = STEP_COUNT * STEP_RUN;
    const TOTAL_DROP = STEP_COUNT * STEP_DROP;
    const DESCENT_START_X = -HALL_LENGTH;
    const DESCENT_CENTER_X = DESCENT_START_X - DESCENT_LENGTH / 2;
    const LANDING_LENGTH = 6;

    const concreteMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: "#8d8174",
                roughness: 0.86,
                metalness: 0.08,
            }),
        []
    );

    const floorMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: "#7c6b58",
                roughness: 0.92,
                metalness: 0.03,
            }),
        []
    );

    const lightMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: "#fff2de",
                emissive: "#fff2de",
                emissiveIntensity: 1.6,
                toneMapped: false,
            }),
        []
    );

    return (
        <group position={[-2, 0, -7]}>
            {/* Upper hallway floor */}
            <mesh position={[-HALL_LENGTH / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[HALL_LENGTH, HALL_WIDTH]} />
                <primitive object={floorMat} attach="material" />
            </mesh>

            {/* Upper hallway ceiling */}
            <mesh position={[-HALL_LENGTH / 2, HALL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[HALL_LENGTH, HALL_WIDTH]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            {/* Ceiling light strips */}
            {Array.from({ length: 4 }).map((_, i) => (
                <mesh key={i} position={[-2 - i * 3, HALL_HEIGHT - 0.05, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                    <planeGeometry args={[1.4, 0.18]} />
                    <primitive object={lightMat} attach="material" />
                </mesh>
            ))}
            <pointLight position={[-4, HALL_HEIGHT - 0.45, 0]} intensity={1.4} distance={8} color="#ffe8c2" />
            <pointLight position={[-9, HALL_HEIGHT - 0.45, 0]} intensity={1.2} distance={7} color="#ffe8c2" />

            {/* Upper side walls */}
            <mesh position={[-HALL_LENGTH / 2, HALL_HEIGHT / 2, -HALL_WIDTH / 2]} receiveShadow>
                <boxGeometry args={[HALL_LENGTH, HALL_HEIGHT, 0.18]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>
            <mesh position={[-HALL_LENGTH / 2, HALL_HEIGHT / 2, HALL_WIDTH / 2]} receiveShadow>
                <boxGeometry args={[HALL_LENGTH, HALL_HEIGHT, 0.18]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            {/* Descent run (no end cap blockade) */}
            <mesh position={[DESCENT_CENTER_X, -TOTAL_DROP / 2 + 0.01, 0]} receiveShadow>
                <boxGeometry args={[DESCENT_LENGTH, TOTAL_DROP + 0.2, HALL_WIDTH]} />
                <primitive object={floorMat} attach="material" />
            </mesh>

            {Array.from({ length: STEP_COUNT }).map((_, i) => {
                const x = DESCENT_START_X - (i * STEP_RUN + STEP_RUN / 2);
                const y = -(i + 1) * STEP_DROP + 0.06;
                return (
                    <mesh key={`step-${i}`} position={[x, y, 0]} castShadow receiveShadow>
                        <boxGeometry args={[STEP_RUN, 0.12, HALL_WIDTH]} />
                        <primitive object={floorMat} attach="material" />
                    </mesh>
                );
            })}

            {/* Retaining walls and rails */}
            <mesh position={[DESCENT_CENTER_X, -TOTAL_DROP / 2 + 0.95, -HALL_WIDTH / 2 - 0.1]} receiveShadow>
                <boxGeometry args={[DESCENT_LENGTH + 0.4, 2.1, 0.2]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>
            <mesh position={[DESCENT_CENTER_X, -TOTAL_DROP / 2 + 0.95, HALL_WIDTH / 2 + 0.1]} receiveShadow>
                <boxGeometry args={[DESCENT_LENGTH + 0.4, 2.1, 0.2]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>
            <mesh position={[DESCENT_CENTER_X, -TOTAL_DROP / 2 + 1.65, -HALL_WIDTH / 2]} receiveShadow>
                <boxGeometry args={[DESCENT_LENGTH, 0.05, 0.04]} />
                <meshStandardMaterial color="#2d2925" roughness={0.7} metalness={0.4} />
            </mesh>
            <mesh position={[DESCENT_CENTER_X, -TOTAL_DROP / 2 + 1.65, HALL_WIDTH / 2]} receiveShadow>
                <boxGeometry args={[DESCENT_LENGTH, 0.05, 0.04]} />
                <meshStandardMaterial color="#2d2925" roughness={0.7} metalness={0.4} />
            </mesh>

            {/* Landing into the coliseum bowl */}
            <mesh
                position={[DESCENT_START_X - DESCENT_LENGTH - LANDING_LENGTH / 2, -TOTAL_DROP + 0.02, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[LANDING_LENGTH, HALL_WIDTH + 3.5]} />
                <primitive object={floorMat} attach="material" />
            </mesh>
        </group>
    );
}
