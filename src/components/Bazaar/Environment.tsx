"use client";

import React, { useRef, useMemo } from "react";
import { usePlane, useBox } from "@react-three/cannon";
import { Plane, Box, Cylinder, Instances, Instance, Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- Materials ---
const Mats = {
    floor: new THREE.MeshStandardMaterial({ color: "#15151a", roughness: 0.9, metalness: 0.1 }),
    wall: new THREE.MeshStandardMaterial({ color: "#080808", roughness: 0.8 }),
    wood: new THREE.MeshStandardMaterial({ color: "#2a1d15", roughness: 1.0 }),
    fabric1: new THREE.MeshStandardMaterial({ color: "#8b2e2e", roughness: 1, side: THREE.DoubleSide }),
    fabric2: new THREE.MeshStandardMaterial({ color: "#2e5a8b", roughness: 1, side: THREE.DoubleSide }),
    rope: new THREE.MeshStandardMaterial({ color: "#443322", roughness: 1 }),
};

// --- Dust System ---
function DustSystem() {
    const count = 100;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Initial random positions
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 10,
            y: Math.random() * 6,
            z: (Math.random() - 0.5) * 20,
            speed: 0.2 + Math.random() * 0.5,
            offset: Math.random() * 100
        }));
    }, []);

    useFrame(({ clock }) => {
        if (!mesh.current) return;
        const t = clock.getElapsedTime();

        particles.forEach((p, i) => {
            // Drift logic
            let y = p.y + Math.sin(t * 0.5 + p.offset) * 0.5;
            let x = p.x + Math.sin(t * 0.2 + p.offset) * 0.2;
            let z = p.z + Math.cos(t * 0.1 + p.offset) * 0.2;
            ref.current.rotation.z = (rotation?.[2] || 0) + Math.sin(t * 2 + position[0]) * 0.05;
        });

        return (
            <group position={position} rotation={rotation ? new THREE.Euler(...rotation) : new THREE.Euler()}>
                {/* Corrected: rotation on the mesh, not geometry */}
                <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.02, 0.02, 1.2]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh ref={ref} position={[0, 0, 0]}>
                    <planeGeometry args={[1, 1.5, 5, 5]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
                </mesh>
            </group>
        );
    }

function DustSystem() {
            // Subtle motes
            const count = 150;
            return (
                <Instances range={count}>
                    <sphereGeometry args={[0.02, 4, 4]} />
                    <meshBasicMaterial color="#aaa" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
                    {Array.from({ length: count }).map((_, i) => (
                        <Float key={i} speed={0.5} rotationIntensity={1} floatIntensity={2} floatingRange={[-1, 1]}>
                            <group position={[
                                (Math.random() - 0.5) * 8,
                                (Math.random()) * 3 + 0.5,
                                (Math.random() - 0.5) * 15 - 5
                            ]}>
                                <Instance />
                            </group>
                        </Float>
                    ))}
                </Instances>
            );
        }

export default function Environment() {
        return (
            <group>
                {/* Ground - Physical wet cobblestone feel */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[20, 40]} />
                    <meshStandardMaterial
                        color="#1a1816"
                        roughness={0.7}
                        metalness={0.1}
                    />
                </mesh>

                {/* Narrow Alley Walls */}
                <mesh position={[-3, 4, -5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                    <planeGeometry args={[30, 8]} />
                    <meshStandardMaterial color="#222020" roughness={0.9} />
                </mesh>
                <mesh position={[3, 4, -5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                    <planeGeometry args={[30, 8]} />
                    <meshStandardMaterial color="#222020" roughness={0.9} />
                </mesh>

                {/* Ceiling/Sky blocker (optional, but helps enclosure) */}

                {/* Props */}
                <Cables />
                <Beams />

                {/* Lanterns - Light Sources */}
                <Lantern position={[-2, 2.5, -2]} color="#ffaa00" delay={0} />
                <Lantern position={[2, 2.5, -5]} color="#ff9000" delay={2} />
                <Lantern position={[-2, 2.5, -9]} color="#ffbb00" delay={1} />
                <Lantern position={[0, 2.8, -12]} color="#ffaa00" delay={3} />

                {/* Banners */}
                <HangingBanner position={[-2.8, 2.5, -3]} rotation={[0, Math.PI / 2, 0]} color="#551111" />
                <HangingBanner position={[2.8, 2.5, -6]} rotation={[0, -Math.PI / 2, 0]} color="#112233" />

                {/* Clutter / Crates */}
                <mesh position={[-2.5, 0.5, -1]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 1, 0.8]} />
                    <meshStandardMaterial color="#3d2914" />
                </mesh>

                <DustSystem />
            </group>
        );
    }
    ```
