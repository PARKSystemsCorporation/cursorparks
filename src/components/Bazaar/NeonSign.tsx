"use client";

import React, { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";

interface NeonSignProps {
    text: string;
    color: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    flicker?: boolean;
}

export default function NeonSign({ text, color, position, rotation = [0, 0, 0], scale = 1, flicker = false }: NeonSignProps) {
    const textRef = useRef<THREE.Mesh | null>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        if (EMISSIVE_SCALE === 0) return;
        if (flicker && textRef.current && lightRef.current) {
            const intensity = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.1 + (Math.random() > 0.9 ? -0.5 : 0);
            const mat = textRef.current.material as THREE.MeshStandardMaterial;
            if (mat) mat.emissiveIntensity = Math.max(0.2, intensity * 2 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE);
            lightRef.current.intensity = Math.max(0.5, intensity * 1.5 * PRACTICAL_LIGHT_INTENSITY);
        }
    });

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <Text
                ref={textRef}
                fontSize={1}
                color={color}
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000"
            >
                {text}
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE}
                />
            </Text>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight
                    ref={lightRef}
                    color={color}
                    intensity={1.5}
                    distance={5}
                    decay={2}
                    position={[0, 0, 0.5]}
                />
            )}
        </group>
    );
}
