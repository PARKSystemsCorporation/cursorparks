"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useOptionalBazaarMaterials } from "./BazaarMaterials";
import { useTexture } from "@react-three/drei";

// Load textures for diversity
const CONCRETE_TEXTURE_PATH = "/textures/prison_concrete_wall.png";
const PLASTER_DIFF = "/textures/damaged_plaster/damaged_plaster_diff_4k.jpg";

/**
 * A single abandoned apartment building unit.
 */
function ApartmentBuilding({
    position,
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    material,
    variant = "A"
}: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    material: THREE.Material;
    variant?: "A" | "B";
}) {
    // Building dimensions
    const width = 5 * scale[0];
    const height = (variant === "A" ? 12 : 15) * scale[1];
    const depth = 6 * scale[2];

    const floorHeight = 3;
    const floors = Math.floor(height / floorHeight);

    const rustMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: "#5a4d41",
        roughness: 0.9,
        metalness: 0.6
    }), []);

    const darkWindowMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: "#050505",
        roughness: 0.2,
        metalness: 0.8
    }), []);

    // Interactive/Emissive Neon Sign (Broken)
    const neonColor = useMemo(() => {
        const colors = ["#ff0055", "#00ffaa", "#aa00ff"];
        return new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
    }, []);

    return (
        <group position={position} rotation={rotation}>
            {/* Main Structure */}
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={material}>
                <boxGeometry args={[width, height, depth]} />
            </mesh>

            {/* Facade Details - Windows & Balconies */}
            {Array.from({ length: floors }).map((_, i) => {
                const y = (i * floorHeight) + 1.5;
                if (i === 0) return null; // Skip ground floor for entrance/mess

                return (
                    <group key={i} position={[0, y, depth / 2 + 0.1]}>
                        {/* Window / Balcony Row */}
                        <mesh position={[-1.5, 0, 0]} material={darkWindowMat}>
                            <planeGeometry args={[1.2, 1.8]} />
                        </mesh>
                        <mesh position={[1.5, 0, 0]} material={darkWindowMat}>
                            <planeGeometry args={[1.2, 1.8]} />
                        </mesh>

                        {/* Balcony Railing */}
                        <mesh position={[-1.5, -0.8, 0.5]} material={rustMat}>
                            <boxGeometry args={[1.4, 0.8, 0.1]} />
                        </mesh>
                        <mesh position={[1.5, -0.8, 0.5]} material={rustMat}>
                            <boxGeometry args={[1.4, 0.8, 0.1]} />
                        </mesh>
                        {/* Balcony Floor */}
                        <mesh position={[-1.5, -1.2, 0.25]} material={rustMat}>
                            <boxGeometry args={[1.4, 0.1, 0.6]} />
                        </mesh>
                        <mesh position={[1.5, -1.2, 0.25]} material={rustMat}>
                            <boxGeometry args={[1.4, 0.1, 0.6]} />
                        </mesh>
                    </group>
                );
            })}

            {/* Roof Junk */}
            <group position={[0, height, 0]}>
                <mesh position={[1, 0.5, 1]} material={rustMat}>
                    <boxGeometry args={[1, 1, 1]} />
                </mesh>
                <mesh position={[-1, 1, -1]} material={rustMat}>
                    <cylinderGeometry args={[0.3, 0.3, 2]} />
                </mesh>
            </group>

            {/* Neon Sign (Broken) */}
            <mesh position={[0, height - 3, depth / 2 + 0.2]}>
                <boxGeometry args={[0.8, 2, 0.1]} />
                <meshStandardMaterial
                    color="black"
                    emissive={neonColor}
                    emissiveIntensity={Math.random() > 0.5 ? 2 : 0}
                />
            </mesh>

            {/* AC Units */}
            {Array.from({ length: floors }).map((_, i) => {
                if (i === 0 || Math.random() > 0.6) return null;
                const y = (i * floorHeight) + 1.5;
                const side = Math.random() > 0.5 ? 1 : -1;
                return (
                    <mesh key={`ac-${i}`} position={[side * (width / 2 + 0.3), y, (Math.random() - 0.5) * depth * 0.8]} material={rustMat}>
                        <boxGeometry args={[0.5, 0.4, 0.4]} />
                    </mesh>
                )
            })}

        </group>
    );
}

/**
 * Procedural cables hanging between buildings
 */
function HangingCables({ start, end }: { start: [number, number, number], end: [number, number, number] }) {
    const curve = useMemo(() => {
        const mid = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 - (1 + Math.random() * 2), // Droop
            (start[2] + end[2]) / 2
        ];
        const curvePath = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...start),
            new THREE.Vector3(...mid),
            new THREE.Vector3(...end)
        );
        return curvePath;
    }, [start, end]);

    const points = useMemo(() => curve.getPoints(20), [curve]);
    const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
    const material = useMemo(() => new THREE.LineBasicMaterial({ color: "black" }), []);
    const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

    return <primitive object={line} />;
}


export function AbandonedApartments() {
    const materials = useOptionalBazaarMaterials();

    // Fallback material if not provided
    const defaultMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#777", roughness: 1 }), []);
    const wallMat = materials?.concreteWall ?? defaultMat;
    const dirtMat = materials?.dirtRoad ?? defaultMat;

    // Texture loading
    const plasterTx = useTexture(PLASTER_DIFF);
    const plasterMat = useMemo(() => {
        const m = new THREE.MeshStandardMaterial({ map: plasterTx, color: "#888", roughness: 0.9 });
        return m;
    }, [plasterTx]);

    // Position setup
    // Alley ends around Z = -18 (Portal). Monument moved to Z = -80 (Front at -47.5).
    // We want to fill Z = -20 to -50 roughly.
    // Street width approx 8-10 meters (X +/- 6.5)

    const buildingsLeft = [
        { z: -20, width: 6, heightScale: 1.2, variant: "A" as const },
        { z: -26, width: 7, heightScale: 1.0, variant: "B" as const },
        { z: -32, width: 6, heightScale: 1.4, variant: "A" as const },
        { z: -38, width: 7, heightScale: 1.1, variant: "B" as const },
        { z: -44, width: 6, heightScale: 1.3, variant: "A" as const },
        { z: -50, width: 7, heightScale: 1.0, variant: "B" as const },
    ];

    const buildingsRight = [
        { z: -21, width: 6, heightScale: 1.1, variant: "B" as const },
        { z: -27, width: 6, heightScale: 1.3, variant: "A" as const },
        { z: -33, width: 7, heightScale: 0.9, variant: "B" as const },
        { z: -39, width: 6, heightScale: 1.2, variant: "A" as const },
        { z: -45, width: 7, heightScale: 1.0, variant: "B" as const },
        { z: -51, width: 6, heightScale: 1.4, variant: "A" as const },
    ];

    const streetX = 6.5; // Offset from center

    return (
        <group>
            {/* Street Ground Extension */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -35]} receiveShadow material={dirtMat}>
                <planeGeometry args={[12, 40]} />
            </mesh>

            {/* Left Side */}
            {buildingsLeft.map((b, i) => (
                <ApartmentBuilding
                    key={`l-${i}`}
                    position={[-streetX, 0, b.z]}
                    rotation={[0, Math.PI / 2, 0]} // Face the street
                    scale={[1, b.heightScale, 1]}
                    material={i % 2 === 0 ? wallMat : plasterMat}
                    variant={b.variant}
                />
            ))}

            {/* Right Side */}
            {buildingsRight.map((b, i) => (
                <ApartmentBuilding
                    key={`r-${i}`}
                    position={[streetX, 0, b.z]}
                    rotation={[0, -Math.PI / 2, 0]} // Face the street
                    scale={[1, b.heightScale, 1]}
                    material={i % 2 !== 0 ? wallMat : plasterMat}
                    variant={b.variant}
                />
            ))}

            {/* Connecting Cables across street */}
            <HangingCables start={[-streetX, 10, -20]} end={[streetX, 9, -21]} />
            <HangingCables start={[-streetX, 8, -26]} end={[streetX, 11, -27]} />
            <HangingCables start={[-streetX, 12, -22]} end={[streetX, 10, -25]} />
            <HangingCables start={[-streetX, 9, -30]} end={[streetX, 12, -32]} />
            <HangingCables start={[-streetX, 11, -38]} end={[streetX, 9, -40]} />
            <HangingCables start={[-streetX, 10, -45]} end={[streetX, 11, -48]} />
        </group>
    );
}
