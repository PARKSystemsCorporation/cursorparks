"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SteamParticlesProps {
    position: [number, number, number];
    count?: number;
    spread?: number;
    riseSpeed?: number;
}

export default function SteamParticles({ position, count = 12, spread = 0.3, riseSpeed = 0.4 }: SteamParticlesProps) {
    const groupRef = useRef<THREE.Group>(null);
    const particles = useMemo(() => {
        const arr: { x: number; y: number; z: number; scale: number; offset: number }[] = [];
        for (let i = 0; i < count; i++) {
            arr.push({
                x: (Math.random() - 0.5) * spread,
                y: Math.random() * 0.2,
                z: (Math.random() - 0.5) * spread,
                scale: 0.08 + Math.random() * 0.12,
                offset: Math.random() * 10,
            });
        }
        return arr;
    }, [count, spread]);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const t = clock.getElapsedTime();
        groupRef.current.children.forEach((mesh, i) => {
            const p = particles[i];
            const phase = (t + p.offset) * 0.5;
            mesh.position.y = p.y + (phase % 3) * riseSpeed;
            mesh.position.x = p.x + Math.sin(phase * 0.5) * 0.05;
            const alpha = 1 - (phase % 3) / 3;
            const mat = (mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
            if (mat) mat.opacity = alpha * 0.4;
        });
    });

    return (
        <group ref={groupRef} position={position}>
            {particles.map((p, i) => (
                <mesh key={i} position={[p.x, p.y, p.z]}>
                    <sphereGeometry args={[p.scale, 8, 8]} />
                    <meshBasicMaterial color="#e8e8e8" transparent opacity={0.35} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}
