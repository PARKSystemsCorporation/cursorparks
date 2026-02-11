"use client";

import React from "react";
import { BAZAAR_BRIGHTNESS } from "./brightness";

interface LedBarProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    color: string;
    length?: number;
    thickness?: number;
}

export default function LedBar({ position, rotation = [0, 0, 0], color, length = 2, thickness = 0.05 }: LedBarProps) {
    return (
        <group position={position} rotation={rotation}>
            <mesh>
                <boxGeometry args={[length, thickness, thickness]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3 * BAZAAR_BRIGHTNESS}
                    toneMapped={false}
                />
            </mesh>
            {/* RectAreaLight is expensive, simulation with point lights is cheaper usually but let's try a simple point light array or just bloom from mesh for now. 
                For "200% better lighting", actual light sources are better.
            */}
            <pointLight
                color={color}
                intensity={1}
                distance={3}
                decay={2}
            />
        </group>
    );
}
