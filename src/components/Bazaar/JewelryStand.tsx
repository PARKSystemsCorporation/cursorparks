"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE } from "./lightingMode";

interface JewelryStandProps {
    position: [number, number, number];
    rotation?: [number, number, number];
}

const MAT_DARK = new THREE.MeshStandardMaterial({ color: "#222" });
const MAT_VELVET = new THREE.MeshStandardMaterial({ color: "#2a1a3a", roughness: 0.9 });

export default function JewelryStand({ position, rotation = [0, 0, 0] }: JewelryStandProps) {
    const ringRef = useRef<THREE.Mesh>(null);
    const frameCount = useRef(0);

    useFrame(({ clock }) => {
        if (!ringRef.current || EMISSIVE_SCALE === 0) return;
        frameCount.current++;
        if (frameCount.current % 3 !== 0) return;
        const t = clock.getElapsedTime();
        const mat = ringRef.current.material as THREE.MeshStandardMaterial;
        if (mat.emissive) mat.emissiveIntensity = (1.2 + Math.sin(t * 2) * 0.2) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE;
    });

    return (
        <group position={position} rotation={rotation}>
            {/* Display stand */}
            <mesh position={[0, 0.5, 0]} castShadow material={MAT_DARK}>
                <boxGeometry args={[0.8, 1, 0.5]} />
            </mesh>
            {/* Velvet display pad */}
            <mesh position={[0, 1.05, 0]} castShadow>
                <boxGeometry args={[0.75, 0.08, 0.45]} />
                <primitive object={MAT_VELVET.clone()} attach="material" />
            </mesh>
            {/* Ring 1 - gold with gem */}
            <mesh ref={ringRef} position={[-0.2, 1.12, 0]} castShadow>
                <torusGeometry args={[0.04, 0.01, 8, 16]} />
                <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#332200" emissiveIntensity={0.3 * EMISSIVE_SCALE} />
            </mesh>
            <mesh position={[-0.2, 1.14, 0]} castShadow>
                <sphereGeometry args={[0.02, 12, 12]} />
                <meshStandardMaterial color="#ff4466" emissive="#ff2266" emissiveIntensity={0.8 * EMISSIVE_SCALE} metalness={0.3} roughness={0.2} />
            </mesh>
            {/* Ring 2 - silver */}
            <mesh position={[0.1, 1.11, 0.05]} castShadow>
                <torusGeometry args={[0.035, 0.008, 8, 16]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.15} envMapIntensity={1.5} />
            </mesh>
            {/* Necklace chain */}
            <mesh position={[0.25, 1.15, -0.05]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.06, 0.006, 6, 24]} />
                <meshStandardMaterial color="#ffdd88" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0.25, 1.08, -0.05]} castShadow>
                <sphereGeometry args={[0.015, 10, 10]} />
                <meshStandardMaterial color="#aaddff" emissive="#4488ff" emissiveIntensity={0.5 * EMISSIVE_SCALE} metalness={0.4} roughness={0.3} />
            </mesh>
            {/* Bracelet */}
            <mesh position={[-0.35, 1.05, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.05, 0.008, 8, 20]} />
                <meshStandardMaterial color="#e8b4a0" metalness={0.7} roughness={0.25} />
            </mesh>
        </group>
    );
}
