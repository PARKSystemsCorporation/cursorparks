"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MAT_BIRD = new THREE.MeshStandardMaterial({ color: "#333" });

export default function BirdFlyby() {
    const groupRef = useRef<THREE.Group>(null);
    const phaseRef = useRef(0);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        phaseRef.current += delta;
        const cycle = 12;
        const t = (phaseRef.current % cycle) / cycle;
        const x = -6 + t * 14;
        const y = 8 + Math.sin(t * Math.PI * 2) * 1.5;
        const z = 2 - t * 8;
        groupRef.current.position.set(x, y, z);
        groupRef.current.rotation.y = Math.atan2(12, -8);
        groupRef.current.rotation.z = Math.sin(phaseRef.current * 8) * 0.15;
    });

    return (
        <group ref={groupRef}>
            <mesh position={[0, 0, 0]} material={MAT_BIRD}>
                <sphereGeometry args={[0.08, 8, 8]} />
            </mesh>
            <mesh position={[0.12, 0, 0]} rotation={[0, 0, -0.3]} material={MAT_BIRD}>
                <boxGeometry args={[0.15, 0.02, 0.08]} />
            </mesh>
            <mesh position={[-0.12, 0, 0]} rotation={[0, 0, 0.3]} material={MAT_BIRD}>
                <boxGeometry args={[0.15, 0.02, 0.08]} />
            </mesh>
        </group>
    );
}
