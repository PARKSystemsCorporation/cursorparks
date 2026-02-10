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

            dummy.position.set(x, y, z);
            // Constant rotation
            dummy.rotation.set(t * 0.1, t * 0.2, t * 0.3);
            dummy.scale.setScalar(0.02);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </instancedMesh>
    );
}

// --- Props ---
function Lantern({ position, color, delay = 0 }: { position: [number, number, number], color: string, delay?: number }) {
    const group = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (!group.current) return;
        const t = clock.getElapsedTime() + delay;
        // Sway
        group.current.rotation.z = Math.sin(t * 1.5) * 0.1;
        group.current.rotation.x = Math.cos(t * 1.2) * 0.05;
    });

    return (
        <group ref={group} position={new THREE.Vector3(...position)}>
            {/* Light Source */}
            <pointLight
                color={color}
                intensity={1.5}
                distance={6}
                decay={2}
                castShadow
                shadow-bias={-0.0001}
            />

            {/* Lantern Body */}
            <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.15, 0.1, 0.4, 6]} />
                <meshStandardMaterial emissive={color} emissiveIntensity={2} color="#000" />
            </mesh>
            <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1, 6]} />
                <meshStandardMaterial color="#111" />
            </mesh>

            {/* Rope */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 1.8]} />
                <primitive object={Mats.rope} />
            </mesh>
        </group>
    );
}

function HangingBanner({ position, rotation, texture }: { position: [number, number, number], rotation?: [number, number, number], texture?: string }) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        // Wind flutter effect
        ref.current.rotation.x = Math.sin(t * 2 + position[0]) * 0.1;
    });

    return (
        <group position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...(rotation || [0, 0, 0]))}>
            {/* Pole */}
            <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.03, 0.03, 1.2]} />
                <primitive object={Mats.wood} />
            </mesh>
            {/* Cloth */}
            <mesh ref={ref} position={[0, -0.2, 0]}>
                <planeGeometry args={[1, 1.4, 4, 4]} />
                <primitive object={texture === 'blue' ? Mats.fabric2 : Mats.fabric1} />
            </mesh>
        </group>
    );
}

export default function BazaarEnvironment() {
    return (
        <group>
            {/* Ground */}
            <Plane args={[15, 60]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -10]} receiveShadow>
                <primitive object={Mats.floor} />
            </Plane>

            {/* Alley Walls (Left/Right) */}
            {/* Left */}
            <Box args={[1, 12, 60]} position={[-3.5, 6, -10]} receiveShadow castShadow>
                <primitive object={Mats.wall} />
            </Box>
            {/* Right */}
            <Box args={[1, 12, 60]} position={[3.5, 6, -10]} receiveShadow castShadow>
                <primitive object={Mats.wall} />
            </Box>

            {/* Ceiling Beams / Cables */}
            {Array.from({ length: 10 }).map((_, i) => (
                <group key={i} position={[0, 4.5, -3 - i * 3]}>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.05, 0.05, 7]} />
                        <primitive object={Mats.rope} />
                    </mesh>
                    {/* Random Lantern per beam */}
                    <Lantern
                        position={[(Math.random() - 0.5) * 4, -0.5, 0]}
                        color={Math.random() > 0.5 ? "#ffaa33" : "#ff5522"}
                        delay={i}
                    />
                </group>
            ))}

            {/* Side Props / Stalls Silhouettes (Low Poly) */}
            <group position={[-2.8, 0, -2]}>
                <Box args={[1.5, 2.5, 1.5]} position={[0, 1.25, 0]} castShadow receiveShadow>
                    <primitive object={Mats.wood} />
                </Box>
                <HangingBanner position={[0.8, 2.5, 0]} rotation={[0, -0.2, 0]} />
            </group>

            <group position={[2.8, 0, -5]}>
                <Box args={[1.5, 2, 1.5]} position={[0, 1, 0]} castShadow receiveShadow>
                    <primitive object={Mats.wood} />
                </Box>
                <HangingBanner position={[-0.8, 2.2, 0]} rotation={[0, 0.2, 0]} texture="blue" />
            </group>

            <group position={[-2.8, 0, -9]}>
                <Box args={[1.2, 3, 1.2]} position={[0, 1.5, 0]} castShadow receiveShadow>
                    <primitive object={Mats.wood} />
                </Box>
            </group>

            {/* Floating Dust */}
            <DustSystem />
        </group>
    );
}
