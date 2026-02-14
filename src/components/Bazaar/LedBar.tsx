"use client";

import React from "react";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { useLightingCycle } from "./LightingCycleContext";

interface LedBarProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    color: string;
    length?: number;
    thickness?: number;
}

export default function LedBar({ position, rotation = [0, 0, 0], color, length = 2, thickness = 0.05 }: LedBarProps) {
    const { emissiveScale, practicalLightIntensity } = useLightingCycle();
    return (
        <group position={position} rotation={rotation}>
            <mesh>
                <boxGeometry args={[length, thickness, thickness]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3 * BAZAAR_BRIGHTNESS * emissiveScale}
                />
            </mesh>
            {practicalLightIntensity > 0 && (
                <pointLight color={color} intensity={1} distance={3} decay={2} />
            )}
        </group>
    );
}
