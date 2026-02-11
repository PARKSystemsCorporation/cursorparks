"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";

const MAT_DARK = new THREE.MeshStandardMaterial({ color: "#222" });
const MAT_DARKER = new THREE.MeshStandardMaterial({ color: "#333" });
const MAT_METAL = new THREE.MeshStandardMaterial({ color: "#444", roughness: 0.4, metalness: 0.7 });

type AlleyEndingPortalProps = {
    positionX?: number;
    positionZ?: number;
    rotationY?: number;
    onEnterPortal?: () => void;
};

export function AlleyEndingPortal({ positionX = 0, positionZ = -28, rotationY = 0, onEnterPortal }: AlleyEndingPortalProps) {
    const group = useRef<THREE.Group>(null);
    const portalRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!portalRef.current || EMISSIVE_SCALE === 0) return;
        const t = clock.getElapsedTime();
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.2);
        const mat = portalRef.current.material as THREE.MeshStandardMaterial;
        if (mat.emissive) mat.emissiveIntensity = pulse * 1.5 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE;
    });

    // Back wall frame: opening 5 wide, 4 tall; total wall 12 wide, 12 tall.
    const openingWidth = 5;
    const openingHeight = 4;
    const wallThick = 1.5;
    const totalWidth = 12;
    const totalHeight = 12;
    const leftPillarWidth = (totalWidth - openingWidth) / 2; // 3.5
    const leftPillarCenterX = -totalWidth / 2 + leftPillarWidth / 2; // -4.25
    const topLintelHeight = totalHeight - openingHeight; // 8

    return (
        <group ref={group} position={[positionX, 0, positionZ]} rotation={[0, rotationY, 0]}>
            {/* --- BACK WALL FRAME (left, right, top) --- */}
            <mesh position={[leftPillarCenterX, totalHeight / 2, 0]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[leftPillarWidth, totalHeight, wallThick]} />
            </mesh>
            <mesh position={[-leftPillarCenterX, totalHeight / 2, 0]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[leftPillarWidth, totalHeight, wallThick]} />
            </mesh>
            <mesh position={[0, openingHeight + topLintelHeight / 2, 0]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[openingWidth, topLintelHeight, wallThick]} />
            </mesh>

            {/* --- UNDERPASS: ramp, ceiling, side walls --- */}
            {/* Ramp: slopes from alley floor (y=0) down to underpass floor (y=-1) over ~2m (local z 1 -> -1) */}
            <mesh position={[0, -0.5, -0.5]} rotation={[Math.atan2(-1, 2) * 0.85, 0, 0]} material={MAT_DARKER} castShadow receiveShadow>
                <boxGeometry args={[openingWidth - 0.5, 0.15, 2.8]} />
            </mesh>
            {/* Underpass floor (flat at bottom) */}
            <mesh position={[0, -1.05, -1.2]} material={MAT_DARKER} receiveShadow>
                <boxGeometry args={[openingWidth - 0.5, 0.1, 1.5]} />
            </mesh>
            {/* Ceiling slab (going under the building) */}
            <mesh position={[0, openingHeight / 2 - 0.3, -0.8]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[openingWidth + 0.5, 0.4, 2.5]} />
            </mesh>
            {/* Side walls of underpass */}
            <mesh position={[-(openingWidth / 2) + 0.2, 0.5, -0.8]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[0.3, openingHeight, 2.5]} />
            </mesh>
            <mesh position={[(openingWidth / 2) - 0.2, 0.5, -0.8]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[0.3, openingHeight, 2.5]} />
            </mesh>

            {/* --- PORTAL MARKER (recessed at end of underpass) --- */}
            <mesh
                ref={portalRef}
                position={[0, -0.5, -1.5]}
                rotation={[0, 0, 0]}
                onPointerDown={() => onEnterPortal?.()}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = onEnterPortal ? "pointer" : "default"; }}
                onPointerOut={() => { document.body.style.cursor = "default"; }}
            >
                <planeGeometry args={[2.5, 1.8]} />
                <meshStandardMaterial
                    color="#4466aa"
                    emissive="#2288ff"
                    emissiveIntensity={1.2 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Portal ring / outline */}
            <mesh position={[0, -0.5, -1.48]} material={MAT_METAL}>
                <ringGeometry args={[1.3, 1.5, 32]} />
            </mesh>

            {/* --- OVERHEAD TRUSS --- */}
            <mesh position={[0, openingHeight + 0.8, 0.2]} rotation={[0, 0, Math.PI / 2]} material={MAT_METAL} castShadow>
                <boxGeometry args={[totalWidth + 1, 0.25, 0.25]} />
            </mesh>
            <mesh position={[-1.5, openingHeight + 0.5, 0]} rotation={[0, 0, 0]} material={MAT_DARKER} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            </mesh>
            <mesh position={[1.5, openingHeight + 0.5, 0]} rotation={[0, 0, 0]} material={MAT_DARKER} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            </mesh>

            {/* --- HANGING LANTERN near entrance --- */}
            <group position={[0, openingHeight - 0.8, 0.6]}>
                <mesh position={[0, 0.4, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.8]} />
                    <meshBasicMaterial color="#1a1a1a" />
                </mesh>
                <mesh position={[0, -0.2, 0]}>
                    <cylinderGeometry args={[0.18, 0.12, 0.35, 8]} />
                    <meshStandardMaterial color="#661100" emissive="#ff4400" emissiveIntensity={0.8 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} roughness={0.6} />
                </mesh>
            </group>

            {/* --- AC / VENT UNITS (silhouette) --- */}
            <mesh position={[-2.2, 2.5, 0.6]} material={MAT_DARKER}>
                <boxGeometry args={[0.7, 0.5, 0.35]} />
            </mesh>
            <mesh position={[2.2, 3, 0.6]} material={MAT_DARKER}>
                <boxGeometry args={[0.6, 0.45, 0.3]} />
            </mesh>

            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <>
                    <pointLight position={[0, 0, 0.5]} color="#bb99ff" intensity={4} distance={12} decay={2} />
                    <pointLight position={[0, -0.5, -1.5]} color="#4488ff" intensity={2} distance={6} decay={2} />
                </>
            )}
        </group>
    );
}
