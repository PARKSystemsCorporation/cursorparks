"use client";

import React, { useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE } from "./lightingMode";

export default function LedSign() {
    const textRef = useRef<any>(null);

    const frameCount = useRef(0);

    useFrame((state) => {
        frameCount.current++;
        if (frameCount.current % 3 !== 0) return; // Throttle to every 3rd frame
        if (textRef.current) {
            textRef.current.fillOpacity = 0.9 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
        }
    });

    return (
        <group position={[3.8, 3.1, -4]} rotation={[0, -Math.PI / 2, 0]}>
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
                    emissiveIntensity={4 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE}
                />
            </Text>
        </group>
    );
}
