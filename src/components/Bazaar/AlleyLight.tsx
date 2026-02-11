"use client";

import React, { useRef } from "react";
import { useHelper } from "@react-three/drei";
import * as THREE from "three";

interface AlleyLightProps {
    position: [number, number, number];
    color?: string;
    intensity?: number;
    rotation?: [number, number, number];
}

export default function AlleyLight({ position, color = "#ffaa00", intensity = 5, rotation = [-Math.PI / 4, 0, 0] }: AlleyLightProps) {
    const lightRef = useRef<THREE.SpotLight>(null);
    // useHelper(lightRef, THREE.SpotLightHelper, 'white'); // Debug helper

    return (
        <group position={position} rotation={rotation}>
            {/* Fixture Mesh */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
                <coneGeometry args={[0.2, 0.4, 32, 1, true]} />
                <meshStandardMaterial color="#333" roughness={0.7} metalness={0.8} side={THREE.DoubleSide} />
            </mesh>

            {/* Bulb Mesh (Emissive) */}
            <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            <spotLight
                ref={lightRef}
                color={color}
                intensity={intensity}
                distance={15}
                angle={0.6}
                penumbra={0.5}
                castShadow
                shadow-bias={-0.0001}
            />
        </group>
    );
}
