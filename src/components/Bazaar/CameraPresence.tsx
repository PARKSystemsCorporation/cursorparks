"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

export default function CameraPresence() {
    const groupRef = useRef<THREE.Group>(null);

    // Perlin-ish noise seeds
    const seed = useRef(Math.random() * 100);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const t = clock.getElapsedTime();

        // 1. Breathing (Y-axis) - Slow, rhythmic
        const breathe = Math.sin(t * 0.5 + seed.current) * 0.03;

        // 2. Sway (X/Z) - Figure-8 drift
        const swayX = Math.cos(t * 0.23 + seed.current) * 0.05;
        const swayZ = Math.sin(t * 0.17 + seed.current) * 0.05;

        // 3. Micro-shake (High freq)
        const shake = Math.sin(t * 8) * 0.001;

        groupRef.current.position.set(swayX, breathe, swayZ);
        groupRef.current.rotation.z = swayX * 0.02 + shake; // Subtle roll
        groupRef.current.rotation.x = swayZ * 0.01 + shake; // Subtle pitch
    });

    return (
        <group ref={groupRef}>
            <PerspectiveCamera
                makeDefault
                position={[0, 1.7, 6]}
                fov={60}
                near={0.1}
                far={100}
            />
        </group>
    );
}
