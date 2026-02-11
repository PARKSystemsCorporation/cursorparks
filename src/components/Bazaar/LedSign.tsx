"use client";

import React, { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function LedSign() {
    const textRef = useRef<any>(null);

    useFrame((state) => {
        if (textRef.current) {
            // Subtle flicker effect for realism
            textRef.current.fillOpacity = 0.9 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
        }
    });

    return (
        <group position={[0, 2.5, -4]}>
            {/* The Text Object */}
            <Text
                ref={textRef}
                fontSize={0.8}
                color="#39ff14" // Neon Green
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000"
            >
                ROBOTS
                <meshStandardMaterial
                    color="#39ff14"
                    emissive="#39ff14"
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </Text>

            {/* Radiant Light */}
            <pointLight
                position={[0, 0, 0.5]}
                intensity={10}
                distance={10}
                color="#39ff14"
                decay={2}
            />
        </group>
    );
}
