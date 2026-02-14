"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { useLightingCycle } from "./LightingCycleContext";

const MAT_DARK = new THREE.MeshStandardMaterial({ color: "#222" });

interface StringLightsProps {
    positions: [number, number, number][];
    color?: string;
    bulbRadius?: number;
}

export default function StringLights({ positions, color = "#ffaa55", bulbRadius = 0.04 }: StringLightsProps) {
    const cableRef = useRef<THREE.Group>(null);
    const frameCount = useRef(0);
    const { emissiveScale } = useLightingCycle();

    const curve = useMemo(() => {
        if (positions.length < 2) return null;
        const points = positions.map((p) => new THREE.Vector3(...p));
        return new THREE.CatmullRomCurve3(points);
    }, [positions]);

    const bulbs = useMemo(() => {
        if (!curve) return [];
        const bulbCount = Math.floor(curve.getLength() / 0.6);
        const arr: { t: number; pos: THREE.Vector3 }[] = [];
        for (let i = 0; i < bulbCount; i++) {
            const t = i / (bulbCount - 1 || 1);
            arr.push({ t, pos: curve.getPoint(t) });
        }
        return arr;
    }, [curve]);

    useFrame(({ clock }) => {
        if (!cableRef.current) return;
        frameCount.current++;
        if (frameCount.current % 2 !== 0) return;
        const t = clock.getElapsedTime();
        cableRef.current.rotation.z = Math.sin(t * 1.2) * 0.06;
        cableRef.current.rotation.x = Math.cos(t * 0.9) * 0.04;
    });

    if (!curve || bulbs.length === 0) return null;

    return (
        <group ref={cableRef}>
            {/* Cable wire */}
            <mesh>
                <tubeGeometry args={[curve, 32, 0.008, 6, false]} />
                <meshStandardMaterial color="#1a1a1a" roughness={1} />
            </mesh>
            {/* Bulbs */}
            {bulbs.map((b, i) => (
                <group key={i} position={b.pos}>
                    <mesh position={[0, 0, 0]} material={MAT_DARK}>
                        <sphereGeometry args={[bulbRadius * 0.6, 8, 8]} />
                    </mesh>
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[bulbRadius, 8, 8]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={2.5 * BAZAAR_BRIGHTNESS * emissiveScale}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}
