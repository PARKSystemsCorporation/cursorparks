"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useOptionalBazaarMaterials } from "./BazaarMaterials";
import NeonImageSign from "./NeonImageSign";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { useLightingCycle } from "./LightingCycleContext";
import { getEmissiveScale } from "./lightingMode";

const MAT_DARK = new THREE.MeshStandardMaterial({ color: "#222" });
const MAT_METAL = new THREE.MeshStandardMaterial({ color: "#444", roughness: 0.4, metalness: 0.7 });

export interface AlleyEndingPortalProps {
    positionX?: number;
    positionZ?: number;
    rotationY?: number;
    onEnterPortal?: () => void;
}

/** Lit gateway at the end of the alley: framed doorway, underpass ramp, portal marker, and dressing. */
export function AlleyEndingPortal({
    positionX = 0,
    positionZ = -18,
    rotationY = 0,
    onEnterPortal,
}: AlleyEndingPortalProps) {
    const portalRef = useRef<THREE.Mesh>(null);
    const materials = useOptionalBazaarMaterials();
    const wallMat = materials?.concreteWall ?? MAT_DARK;

    // Doorway: 3m wide, 4m high. Wall span 10m wide, 16m tall (y 0–16). Opening centered.
    const WALL_W = 10;
    const WALL_H = 16;
    const OPEN_W = 3;
    const OPEN_H = 4;
    const OPEN_LEFT = -OPEN_W / 2;
    const OPEN_RIGHT = OPEN_W / 2;
    const OPEN_BOTTOM = 2;
    const OPEN_TOP = OPEN_BOTTOM + OPEN_H;
    const WALL_THICK = 1;

    // Left wall piece (full height, from left edge to opening)
    const leftW = (WALL_W / 2) - OPEN_LEFT; // from x=-5 to -1.5 → width 3.5
    const leftX = -WALL_W / 2 + leftW / 2;  // -3.25
    // Right wall piece
    const rightW = (WALL_W / 2) - OPEN_RIGHT; // 3.5
    const rightX = WALL_W / 2 - rightW / 2;  // 3.25
    // Top piece (above opening)
    const topH = WALL_H - OPEN_TOP;  // 10
    const topY = OPEN_TOP + topH / 2; // 11

    // Underpass: ramp from y=0 to y=-1 over ~2.5m (local -z)
    const RAMP_LEN = 2.5;
    const RAMP_DROP = 1;
    const UNDER_W = 2.8;

    const { emissiveScale, practicalLightIntensity } = useLightingCycle();

    useFrame(({ clock }) => {
        const scale = getEmissiveScale();
        if (!portalRef.current || scale === 0) return;
        const t = clock.getElapsedTime();
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.2);
        const mat = portalRef.current.material as THREE.MeshStandardMaterial;
        if (mat.emissive) mat.emissiveIntensity = pulse * 1.2 * BAZAAR_BRIGHTNESS * scale;
    });

    return (
        <group position={[positionX, 0, positionZ]} rotation={[0, rotationY, 0]}>
            {/* --- Back wall frame (left / right / top) --- */}
            <mesh position={[leftX, WALL_H / 2, 0]} castShadow receiveShadow material={wallMat}>
                <boxGeometry args={[leftW, WALL_H, WALL_THICK]} />
            </mesh>
            <mesh position={[rightX, WALL_H / 2, 0]} castShadow receiveShadow material={wallMat}>
                <boxGeometry args={[rightW, WALL_H, WALL_THICK]} />
            </mesh>
            <mesh position={[0, topY, 0]} castShadow receiveShadow material={wallMat}>
                <boxGeometry args={[OPEN_W, topH, WALL_THICK]} />
            </mesh>

            {/* --- Underpass: ramp (y 0 → -1 over 2.5m), ceiling, side walls --- */}
            {/* Ramp surface: sloped plane */}
            <mesh
                position={[0, -RAMP_DROP / 2, -RAMP_LEN / 2]}
                rotation={[Math.atan2(RAMP_DROP, RAMP_LEN), 0, 0]}
                receiveShadow
                material={materials?.wetFloor ?? MAT_DARK}
            >
                <boxGeometry args={[UNDER_W, 0.08, RAMP_LEN]} />
            </mesh>
            {/* Ceiling slab above ramp */}
            <mesh position={[0, 2.2, -RAMP_LEN / 2]} castShadow receiveShadow material={wallMat}>
                <boxGeometry args={[UNDER_W + 0.4, 0.3, RAMP_LEN + 0.2]} />
            </mesh>
            {/* Side walls of underpass */}
            <mesh position={[-UNDER_W / 2 - 0.1, 0.5, -RAMP_LEN / 2]} castShadow receiveShadow material={wallMat}>
                <boxGeometry args={[0.2, 3, RAMP_LEN + 0.2]} />
            </mesh>
            <mesh position={[UNDER_W / 2 + 0.1, 0.5, -RAMP_LEN / 2]} castShadow receiveShadow material={wallMat}>
                <boxGeometry args={[0.2, 3, RAMP_LEN + 0.2]} />
            </mesh>

            {/* --- Portal marker: recessed emissive plane at bottom of ramp --- */}
            <mesh
                ref={portalRef}
                position={[0, -RAMP_DROP + 0.02, -RAMP_LEN]}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    onEnterPortal?.();
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = onEnterPortal ? "pointer" : "default";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <planeGeometry args={[1.8, 1.2]} />
                <meshStandardMaterial
                    color="#4466aa"
                    emissive="#2288ff"
                    emissiveIntensity={1.2 * BAZAAR_BRIGHTNESS * emissiveScale}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Recess ring around portal */}
            <mesh position={[0, -RAMP_DROP, -RAMP_LEN - 0.05]} material={MAT_DARK}>
                <ringGeometry args={[0.95, 1.1, 32]} />
                <meshStandardMaterial side={THREE.DoubleSide} color="#111" />
            </mesh>

            {/* --- Dressing: overhead truss, lantern, vent/AC, cables --- */}
            {/* Overhead truss/brace */}
            <mesh position={[0, OPEN_TOP + 0.5, 0.2]} castShadow material={MAT_METAL}>
                <boxGeometry args={[OPEN_W + 0.6, 0.15, 0.15]} />
            </mesh>
            <mesh position={[-1.2, OPEN_TOP + 0.3, 0.15]} rotation={[0, 0, Math.PI / 2]} material={MAT_METAL}>
                <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
            </mesh>
            <mesh position={[1.2, OPEN_TOP + 0.3, 0.15]} rotation={[0, 0, Math.PI / 2]} material={MAT_METAL}>
                <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
            </mesh>
            {/* Hanging lantern near entrance */}
            <group position={[0.6, OPEN_BOTTOM + 0.8, 0.3]}>
                <mesh material={MAT_METAL}>
                    <cylinderGeometry args={[0.12, 0.12, 0.25, 12]} />
                </mesh>
                <mesh position={[0, 0.18, 0]}>
                    <sphereGeometry args={[0.1, 8, 6]} />
                    <meshStandardMaterial
                        color="#ffaa55"
                        emissive="#ff8800"
                        emissiveIntensity={1.5 * BAZAAR_BRIGHTNESS * emissiveScale}
                    />
                </mesh>
                {practicalLightIntensity > 0 && (
                    <pointLight position={[0, 0.2, 0]} color="#ffaa55" intensity={1.2} distance={4} decay={2} />
                )}
            </group>
            {/* Vent/AC units and cables */}
            <mesh position={[-1.5, OPEN_TOP + 1.5, 0.55]} castShadow material={MAT_METAL}>
                <boxGeometry args={[0.5, 0.35, 0.4]} />
            </mesh>
            <mesh position={[1.4, OPEN_TOP + 1.2, 0.55]} castShadow material={MAT_METAL}>
                <boxGeometry args={[0.4, 0.3, 0.35]} />
            </mesh>
            <mesh position={[-1.5, OPEN_TOP + 1.2, 0.3]} rotation={[0, 0, Math.PI / 2]} material={MAT_DARK}>
                <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
            </mesh>

            {/* Hotel / underpass signage near gateway */}
            <NeonImageSign
                textureUrl="/textures/signs/alley-hotel.png"
                position={[-1.8, OPEN_BOTTOM + 1.2, 0.6]}
                rotation={[0, Math.PI / 2, 0]}
                width={1.2}
                height={0.6}
                emissiveIntensity={1.0}
            />
            <NeonImageSign
                textureUrl="/textures/signs/alley-poster.png"
                position={[1.6, OPEN_BOTTOM + 1.4, 0.6]}
                rotation={[0, -Math.PI / 2, 0]}
                width={1.0}
                height={0.8}
                emissiveIntensity={0.9}
            />
        </group>
    );
}

export interface RoadClosedBarrierProps {
    position?: [number, number, number];
}

/** Low barrier with 2–3 "ROAD CLOSED" panels (emissive plates + Text). */
export function RoadClosedBarrier({ position = [0, 0.25, 4.5] }: RoadClosedBarrierProps) {
    const { emissiveScale } = useLightingCycle();
    const segments = useMemo(() => [
        { offset: -1.2 },
        { offset: 0 },
        { offset: 1.2 },
    ], []);

    return (
        <group position={position}>
            {/* Base bar */}
            <mesh position={[0, -0.08, 0]} castShadow receiveShadow>
                <boxGeometry args={[4, 0.08, 0.06]} />
                <meshStandardMaterial color="#333" roughness={0.6} metalness={0.3} />
            </mesh>
            {segments.map(({ offset }, i) => (
                <group key={i} position={[offset, 0, 0]}>
                    {/* Emissive plate */}
                    <mesh position={[0, 0.15, 0]}>
                        <boxGeometry args={[0.9, 0.22, 0.04]} />
                        <meshStandardMaterial
                            color="#331100"
                            emissive="#aa4400"
                            emissiveIntensity={0.4 * BAZAAR_BRIGHTNESS * emissiveScale}
                        />
                    </mesh>
                    <Text
                        position={[0, 0.15, 0.026]}
                        fontSize={0.12}
                        color="#ffdd99"
                        anchorX="center"
                        anchorY="middle"
                        maxWidth={0.85}
                    >
                        ROAD CLOSED
                        <meshStandardMaterial
                            color="#ffdd99"
                            emissive="#ffaa44"
                            emissiveIntensity={0.6 * BAZAAR_BRIGHTNESS * emissiveScale}
                        />
                    </Text>
                </group>
            ))}
        </group>
    );
}
