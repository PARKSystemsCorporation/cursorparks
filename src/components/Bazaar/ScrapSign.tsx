"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE } from "./lightingMode";

type TextRefWithOpacity = THREE.Object3D & { fillOpacity?: number };

export default function ScrapSign() {
    const textRef = useRef<TextRefWithOpacity | null>(null);

    const frameCount = useRef(0);

    useFrame((state) => {
        frameCount.current++;
        if (frameCount.current % 3 !== 0) return; // Throttle to every 3rd frame
        if (textRef.current) {
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
                    emissiveIntensity={3 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE}
                />
            </Text>
        </group>
    );
}
