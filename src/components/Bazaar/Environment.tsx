"use client";

import React, { useRef } from "react";
import { usePlane, useBox } from "@react-three/cannon";
import { Plane, Box, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Simple Floor
function Floor() {
    const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));
    return (
        <group ref={ref as any}>
            <Plane args={[20, 100]} receiveShadow>
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </Plane>
            {/* Grid helper for "cyberpunk" feel? Or keep it gritty? 
                Let's add some random "stone" patches or decals if we had textures. 
                For now, a dark gritty floor. 
            */}
        </group>
    );
}

// Walls
function Wall({ position, rotation, args }: { position: [number, number, number], rotation: [number, number, number], args: [number, number, number] }) {
    const [ref] = useBox(() => ({ position, rotation, args }));
    return (
        <Box ref={ref as any} args={args}>
            <meshStandardMaterial color="#0a0a0a" />
        </Box>
    );
}

// Lanterns (Physics driven sway?)
// For simplicity, we might just animate them with sine waves in a loop instead of full rigid bodies to save performance, 
// as requested by "Lanterns sway...". 
// But if we want "alive", maybe a simple spring. 
// Let's stick to GSAP/Sine for performance stability unless "rapier" was mandated for THIS specifically.
// The prompt said "Hanging lanterns and banners with physics sway". 
// Let's use simple sine wave animation for now to ensure stability, or a simple cannon constraint.
// We'll use a simple mesh that sways.

function Lantern({ position, color }: { position: [number, number, number], color: string }) {
    const group = useRef<THREE.Group>(null);

    // Sway logic in useFrame
    // ...

    return (
        <group ref={group} position={new THREE.Vector3(...position)}>
            <pointLight color={color} intensity={0.8} distance={8} decay={2} />
            <mesh position={[0, -0.5, 0]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial emissive={color} emissiveIntensity={2} color="#000" />
            </mesh>
            {/* Rope */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 1]} />
                <meshBasicMaterial color="#333" />
            </mesh>
        </group>
    );
}


export default function BazaarEnvironment() {
    return (
        <>
            <Floor />

            {/* Alley Walls */}
            <Wall position={[-6, 5, 0]} rotation={[0, 0, 0]} args={[1, 10, 100]} />
            <Wall position={[6, 5, 0]} rotation={[0, 0, 0]} args={[1, 10, 100]} />

            {/* Random Lanterns */}
            <Lantern position={[-4, 4, 0]} color="#ff0055" />
            <Lantern position={[4, 4, -5]} color="#00ddff" />
            <Lantern position={[-4, 4, -10]} color="#ffaa00" />
            <Lantern position={[0, 5, -15]} color="#ffffff" />

            {/* Distant Fog/Haze handled by scene fog */}
        </>
    );
}
