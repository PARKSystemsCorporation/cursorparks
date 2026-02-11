"use client";

import React, { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ScrapSign() {
    const textRef = useRef<any>(null);

    useFrame((state) => {
        if (textRef.current) {
            // Slow pulsing effect for blue neon
            textRef.current.fillOpacity = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    return (
        <group position={[-3.5, 2.5, -4]}>
            {/* The Text Object - Vertical Layout */}
            <Text
                ref={textRef}
                fontSize={0.6}
                color="#0088ff" // Neon Blue
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                anchorX="center"
                anchorY="bottom" // Rises upwards from the position
                outlineWidth={0.02}
                outlineColor="#000"
                lineHeight={1}
            >
                S{'\n'}C{'\n'}R{'\n'}A{'\n'}P
                <meshStandardMaterial
                    color="#0088ff"
                    emissive="#0088ff"
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </Text>

            {/* Radiant Blue Light */}
            <pointLight
                position={[0, 1.5, 0.5]} // Centered vertically relative to the text height approx
                intensity={8}
                distance={8}
                color="#0088ff"
                decay={2}
            />
        </group>
    );
}
