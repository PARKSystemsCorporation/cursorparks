"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Open-air, prison-inspired desert coliseum connected to StadiumExit stairs.
 * Built as a walkable bowl with ring walls, bars, and warm desert dressing.
 */
export function DesertJailColiseum() {
    const center: [number, number, number] = [-31, -3.06, -7];
    const arenaRadius = 8.4;
    const bowlOuterRadius = 15.5;

    const prisonSegments = useMemo(
        () =>
            Array.from({ length: 22 }).map((_, i) => {
                const t = (i / 22) * Math.PI * 2;
                return {
                    key: `seg-${i}`,
                    x: Math.cos(t) * (bowlOuterRadius - 0.75),
                    z: Math.sin(t) * (bowlOuterRadius - 0.75),
                    rotY: -t + Math.PI / 2,
                };
            }),
        [bowlOuterRadius]
    );

    const barSets = useMemo(
        () =>
            Array.from({ length: 10 }).map((_, i) => {
                const t = (i / 10) * Math.PI * 2 + 0.16;
                return {
                    key: `bars-${i}`,
                    x: Math.cos(t) * (bowlOuterRadius - 1.25),
                    z: Math.sin(t) * (bowlOuterRadius - 1.25),
                    rotY: -t + Math.PI / 2,
                };
            }),
        [bowlOuterRadius]
    );

    return (
        <group position={center}>
            {/* Desert apron where stairs spill into the arena grounds */}
            <mesh position={[7.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[14, 7]} />
                <meshStandardMaterial color="#9c7f60" roughness={1} metalness={0} />
            </mesh>

            {/* Central fight pit */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[arenaRadius, 48]} />
                <meshStandardMaterial color="#7f5f3b" roughness={1} metalness={0} />
            </mesh>

            {/* Bowl ring / steps */}
            <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[bowlOuterRadius, arenaRadius + 1.5, 1.1, 48, 1, true]} />
                <meshStandardMaterial color="#967c62" roughness={0.95} metalness={0.05} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={[0, 1.25, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[bowlOuterRadius + 1.2, bowlOuterRadius - 0.9, 1.2, 48, 1, true]} />
                <meshStandardMaterial color="#8e7358" roughness={0.95} metalness={0.05} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={[0, 2.15, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[bowlOuterRadius + 1.8, bowlOuterRadius + 0.6, 0.9, 48, 1, true]} />
                <meshStandardMaterial color="#846a52" roughness={0.95} metalness={0.05} side={THREE.DoubleSide} />
            </mesh>

            {/* Jail perimeter wall segments */}
            {prisonSegments.map((seg) => (
                <mesh
                    key={seg.key}
                    position={[seg.x, 3.4, seg.z]}
                    rotation={[0, seg.rotY, 0]}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[2.4, 2.4, 0.7]} />
                    <meshStandardMaterial color="#6e5a47" roughness={0.92} metalness={0.08} />
                </mesh>
            ))}

            {/* Barred guard windows for prison vibe */}
            {barSets.map((set) => (
                <group key={set.key} position={[set.x, 3.15, set.z]} rotation={[0, set.rotY, 0]}>
                    <mesh receiveShadow>
                        <boxGeometry args={[1.7, 1.1, 0.2]} />
                        <meshStandardMaterial color="#2a2622" roughness={0.6} metalness={0.65} />
                    </mesh>
                    {[-0.55, -0.18, 0.18, 0.55].map((x) => (
                        <mesh key={`${set.key}-${x}`} position={[x, 0, 0.09]} receiveShadow>
                            <boxGeometry args={[0.08, 1.05, 0.08]} />
                            <meshStandardMaterial color="#141210" roughness={0.45} metalness={0.8} />
                        </mesh>
                    ))}
                </group>
            ))}

            {/* Main gate opposite stair entry */}
            <group position={[-bowlOuterRadius + 0.2, 2.7, 0]} rotation={[0, Math.PI / 2, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[4, 3.2, 0.5]} />
                    <meshStandardMaterial color="#43362b" roughness={0.85} metalness={0.1} />
                </mesh>
                {[-1.4, -0.8, -0.2, 0.4, 1].map((x) => (
                    <mesh key={`gate-bar-${x}`} position={[x, -0.2, 0.28]}>
                        <boxGeometry args={[0.14, 2.6, 0.12]} />
                        <meshStandardMaterial color="#1a1613" roughness={0.45} metalness={0.78} />
                    </mesh>
                ))}
            </group>

            {/* Dunes and desert rock dressing */}
            <mesh position={[12, -0.2, 8]} rotation={[-Math.PI / 2, 0.5, 0]} receiveShadow>
                <circleGeometry args={[6, 24]} />
                <meshStandardMaterial color="#b58f64" roughness={1} />
            </mesh>
            <mesh position={[8, -0.1, -10]} rotation={[-Math.PI / 2, -0.35, 0]} receiveShadow>
                <circleGeometry args={[4.4, 20]} />
                <meshStandardMaterial color="#ab825a" roughness={1} />
            </mesh>
            <mesh position={[-11.8, 0.4, 9.8]} castShadow receiveShadow>
                <dodecahedronGeometry args={[1.7, 0]} />
                <meshStandardMaterial color="#7a5f43" roughness={0.98} />
            </mesh>
            <mesh position={[-13.2, 0.25, -10.3]} castShadow receiveShadow>
                <dodecahedronGeometry args={[1.25, 0]} />
                <meshStandardMaterial color="#6e553d" roughness={0.98} />
            </mesh>

            {/* Warm practical lights around perimeter */}
            {[-8, 0, 8].map((z) => (
                <pointLight key={`warm-l-${z}`} position={[bowlOuterRadius - 2, 4.2, z]} intensity={1.1} distance={13} color="#ffbe72" />
            ))}
            {[-8, 0, 8].map((z) => (
                <pointLight key={`warm-r-${z}`} position={[-bowlOuterRadius + 2, 4.2, z]} intensity={1.1} distance={13} color="#ffbe72" />
            ))}
        </group>
    );
}
