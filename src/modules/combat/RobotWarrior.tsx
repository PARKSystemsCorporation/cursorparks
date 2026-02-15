"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RobotState } from "./CombatTypes";

/**
 * Procedural Robot Warrior Component
 * 
 * Structure:
 * - Root (Movement/Position)
 *   - Torso (Main Body)
 *     - Head (Sensor Unit)
 *     - Arms (L/R) -> Forearms -> Hands
 *     - Legs (L/R) -> Thighs -> Shins -> Feet
 * 
 * Animations:
 * - Idle: Breathing motion, subtle adjustments
 * - Moving: Walk cycle
 * - Attacking: Punch/Strike motion
 * - Hit: Recoil
 * - KO: Collapse
 */

const DARK_METAL = new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.7, metalness: 0.8 });
const BRUSHED_STEEL = new THREE.MeshStandardMaterial({ color: "#555", roughness: 0.5, metalness: 0.9 });
const JOINT_MAT = new THREE.MeshStandardMaterial({ color: "#111", roughness: 0.9 });
const GLOW_BLUE = new THREE.MeshStandardMaterial({ color: "#00ffff", emissive: "#00ffff", emissiveIntensity: 2, toneMapped: false });
const GLOW_RED = new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 3, toneMapped: false });

interface RobotWarriorProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    state?: RobotState;
    colorHex?: string; // Team color
    scale?: number;
}

export function RobotWarrior({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    state = "IDLE",
    colorHex = "#00ffff",
    scale = 1,
}: RobotWarriorProps) {
    const groupRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const torsoRef = useRef<THREE.Group>(null);

    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);

    // Time-based animation state
    const timeRef = useRef(0);

    // Custom materials based on props
    const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.6
    }), [colorHex]);

    useFrame((stateThree, delta) => {
        if (!groupRef.current) return;

        timeRef.current += delta;
        const t = timeRef.current;

        // Reset poses
        if (torsoRef.current) torsoRef.current.rotation.set(0, 0, 0);
        if (headRef.current) headRef.current.rotation.set(0, 0, 0);
        if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0);
        if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0);
        if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
        if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);

        // --- ANIMATIONS ---

        if (state === "IDLE") {
            // Breathing / bobbing
            groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.05;
            if (torsoRef.current) torsoRef.current.rotation.x = Math.sin(t * 1.5) * 0.05;
            if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(t * 1 + 1) * 0.1 + 0.2;
            if (rightArmRef.current) rightArmRef.current.rotation.z = Math.sin(t * 1) * 0.1 - 0.2;
        }
        else if (state === "MOVING" || state === "APPROACHING" as any) {
            // Walk cycle
            const speed = 8;
            const legAmp = 0.5;
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * speed) * legAmp;
            if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * speed + Math.PI) * legAmp;

            // Arm swing opposite to legs
            if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * speed + Math.PI) * 0.4;
            if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * speed) * 0.4;

            // Bob
            groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * speed)) * 0.1;
        }
        else if (state === "ATTACKING") {
            // Since we don't pass the specific MoveType here easily without a prop update, 
            // we can use a random or time-based variation, OR we update the component to accept `moveType`.
            // For this step, we'll just make the attack look more dynamic.
            // Ideally: props.moveType

            const attackPhase = (t * 5) % (Math.PI * 2);

            if (rightArmRef.current && leftArmRef.current && rightLegRef.current) {
                // Reset
                rightArmRef.current.rotation.set(0, 0, 0);
                leftArmRef.current.rotation.set(0, 0, 0);
                rightLegRef.current.rotation.set(0, 0, 0);

                if (attackPhase < 1.5) {
                    // 50% chance right punch, 30% left punch, 20% kick
                    // Deterministic based on time for now to look varied
                    const vars = Math.floor(t) % 3;

                    if (vars === 0) {
                        // Right Cross
                        rightArmRef.current.rotation.x = -1.5;
                        rightArmRef.current.position.z = 0.5;
                    } else if (vars === 1) {
                        // Left Hook
                        leftArmRef.current.rotation.x = -1.2;
                        leftArmRef.current.rotation.y = -0.5;
                        leftArmRef.current.position.z = 0.4;
                    } else {
                        // Kick
                        rightLegRef.current.rotation.x = -1.2;
                    }
                }
            }
        }
        else if (state === "HIT") {
            // Recoil
            if (torsoRef.current) {
                torsoRef.current.rotation.x = -0.4;
                torsoRef.current.position.z = -0.2;
            }
        }
        else if (state === "KO") {
            // Collapsed
            groupRef.current.position.y = position[1] - 0.5;
            groupRef.current.rotation.x = -1.5; // Face down or back
        }

    });

    return (
        <group ref={groupRef} position={position} rotation={rotation} scale={scale}>

            {/* --- TORSO --- */}
            <group ref={torsoRef} position={[0, 1.1, 0]}>
                <mesh material={DARK_METAL} castShadow receiveShadow>
                    <boxGeometry args={[0.6, 0.7, 0.4]} />
                </mesh>

                {/* Chest Plate */}
                <mesh position={[0, 0.1, 0.22]} material={BRUSHED_STEEL} castShadow>
                    <boxGeometry args={[0.5, 0.4, 0.1]} />
                </mesh>

                {/* Core (Glow) */}
                <mesh position={[0, 0.1, 0.26]} material={accentMat}>
                    <circleGeometry args={[0.1, 16]} />
                </mesh>

                {/* --- HEAD --- */}
                <group ref={headRef} position={[0, 0.5, 0]}>
                    <mesh material={DARK_METAL} castShadow>
                        <boxGeometry args={[0.3, 0.35, 0.35]} />
                    </mesh>
                    {/* Visor */}
                    <mesh position={[0, 0.05, 0.18]} material={state === "KO" ? DARK_METAL : GLOW_BLUE}>
                        <boxGeometry args={[0.25, 0.08, 0.05]} />
                    </mesh>
                </group>

                {/* --- ARMS --- */}
                <group ref={leftArmRef} position={[-0.4, 0.25, 0]}>
                    {/* Shoulder */}
                    <mesh material={JOINT_MAT}><sphereGeometry args={[0.15]} /></mesh>
                    {/* Upper Arm */}
                    <mesh position={[0, -0.3, 0]} material={BRUSHED_STEEL}><boxGeometry args={[0.15, 0.5, 0.15]} /></mesh>
                    {/* Forearm (Striker) */}
                    <mesh position={[0, -0.7, 0]} material={DARK_METAL}><boxGeometry args={[0.18, 0.5, 0.18]} /></mesh>
                </group>

                <group ref={rightArmRef} position={[0.4, 0.25, 0]}>
                    {/* Shoulder */}
                    <mesh material={JOINT_MAT}><sphereGeometry args={[0.15]} /></mesh>
                    {/* Upper Arm */}
                    <mesh position={[0, -0.3, 0]} material={BRUSHED_STEEL}><boxGeometry args={[0.15, 0.5, 0.15]} /></mesh>
                    {/* Forearm (Striker) */}
                    <mesh position={[0, -0.7, 0]} material={DARK_METAL}><boxGeometry args={[0.18, 0.5, 0.18]} /></mesh>
                </group>
            </group>

            {/* --- LEGS --- */}
            <group position={[0, 1.1, 0]}> {/* Hips origin */}
                <group ref={leftLegRef} position={[-0.2, -0.35, 0]}>
                    <mesh position={[0, -0.4, 0]} material={BRUSHED_STEEL}><boxGeometry args={[0.2, 0.8, 0.2]} /></mesh>
                    {/* Foot */}
                    <mesh position={[0, -0.85, 0.1]} material={DARK_METAL}><boxGeometry args={[0.22, 0.15, 0.4]} /></mesh>
                </group>

                <group ref={rightLegRef} position={[0.2, -0.35, 0]}>
                    <mesh position={[0, -0.4, 0]} material={BRUSHED_STEEL}><boxGeometry args={[0.2, 0.8, 0.2]} /></mesh>
                    {/* Foot */}
                    <mesh position={[0, -0.85, 0.1]} material={DARK_METAL}><boxGeometry args={[0.22, 0.15, 0.4]} /></mesh>
                </group>
            </group>
        </group>
    );
}
