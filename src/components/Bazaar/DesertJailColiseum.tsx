"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isNight as getIsNight } from "@/src/modules/world/SunMoonCycle";

const BAR_GEOMETRY = new THREE.BoxGeometry(0.08, 1.05, 0.08);
const WALL_BOX_GEOMETRY = new THREE.BoxGeometry(2.4, 2.4, 0.7);
const GATE_BAR_GEOMETRY = new THREE.BoxGeometry(0.14, 2.6, 0.12);
const WINDOW_BOX_GEOMETRY = new THREE.BoxGeometry(1.7, 1.1, 0.2);
const CIRCLE_SEGMENTS = 24;
const CYLINDER_SEGMENTS = 24;
const RING_SEGMENTS = 32;

/** Single pillar spotlight; target is set by parent in one shared useFrame. */
function PillarSpotlight({
    position,
    setLightRef,
}: {
    position: [number, number, number];
    setLightRef: (el: THREE.SpotLight | null) => void;
}) {
    return (
        <spotLight
            ref={setLightRef}
            position={position}
            intensity={2}
            distance={18}
            angle={Math.PI / 6}
            penumbra={0.35}
            decay={2}
            color="#ffbe72"
        />
    );
}

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
            Array.from({ length: 12 }).map((_, i) => {
                const t = (i / 12) * Math.PI * 2;
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
            Array.from({ length: 6 }).map((_, i) => {
                const t = (i / 6) * Math.PI * 2 + 0.16;
                return {
                    key: `bars-${i}`,
                    x: Math.cos(t) * (bowlOuterRadius - 1.25),
                    z: Math.sin(t) * (bowlOuterRadius - 1.25),
                    rotY: -t + Math.PI / 2,
                };
            }),
        [bowlOuterRadius]
    );

    const arenaFloorTargetRef = useRef<THREE.Group>(null);
    const spotlightRefsRef = useRef<Record<string, THREE.SpotLight | null>>({});
    const [isNight, setIsNight] = useState(false);
    const prevNightRef = useRef(false);

    useFrame(() => {
        const night = getIsNight();
        if (night !== prevNightRef.current) {
            prevNightRef.current = night;
            setIsNight(night);
        }
        const target = arenaFloorTargetRef.current;
        if (target) {
            Object.values(spotlightRefsRef.current).forEach((light) => {
                if (light) light.target = target;
            });
        }
    });

    return (
        <group position={center}>
            {/* Target for pillar spotlights (arena center) */}
            <group ref={arenaFloorTargetRef} position={[0, 0, 0]} />
            {/* Desert apron where stairs spill into the arena grounds */}
            <mesh position={[7.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[14, 7]} />
                <meshStandardMaterial color="#cbae82" roughness={1} metalness={0} />
            </mesh>

            {/* Central fight pit */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[arenaRadius, CIRCLE_SEGMENTS]} />
                <meshStandardMaterial color="#bda67a" roughness={1} metalness={0} />
            </mesh>
            {/* Red highlighted arena circle: stand here to fight AI exokin */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[arenaRadius - 0.5, arenaRadius, RING_SEGMENTS]} />
                <meshStandardMaterial
                    color="#8b0000"
                    emissive="#c0392b"
                    emissiveIntensity={0.8}
                    roughness={0.9}
                    metalness={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Bowl ring / steps — receiveShadow only to avoid cost */}
            <mesh position={[0, 0.5, 0]} receiveShadow>
                <cylinderGeometry args={[bowlOuterRadius, arenaRadius + 1.5, 1.1, CYLINDER_SEGMENTS, 1, true]} />
                <meshStandardMaterial color="#b09b7c" roughness={1} metalness={0} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={[0, 1.25, 0]} receiveShadow>
                <cylinderGeometry args={[bowlOuterRadius + 1.2, bowlOuterRadius - 0.9, 1.2, CYLINDER_SEGMENTS, 1, true]} />
                <meshStandardMaterial color="#a68e6f" roughness={1} metalness={0} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={[0, 2.15, 0]} receiveShadow>
                <cylinderGeometry args={[bowlOuterRadius + 1.8, bowlOuterRadius + 0.6, 0.9, CYLINDER_SEGMENTS, 1, true]} />
                <meshStandardMaterial color="#846a52" roughness={0.95} metalness={0.05} side={THREE.DoubleSide} />
            </mesh>

            {/* Jail perimeter wall segments — shared geometry */}
            {prisonSegments.map((seg) => (
                <mesh
                    key={seg.key}
                    position={[seg.x, 3.4, seg.z]}
                    rotation={[0, seg.rotY, 0]}
                    geometry={WALL_BOX_GEOMETRY}
                    receiveShadow
                >
                    <meshStandardMaterial color="#6e5a47" roughness={0.92} metalness={0.08} />
                </mesh>
            ))}

            {/* Barred guard windows for prison vibe — shared geometry */}
            {barSets.map((set) => (
                <group key={set.key} position={[set.x, 3.15, set.z]} rotation={[0, set.rotY, 0]}>
                    <mesh receiveShadow geometry={WINDOW_BOX_GEOMETRY}>
                        <meshStandardMaterial color="#2a2622" roughness={0.6} metalness={0.65} />
                    </mesh>
                    {[-0.55, -0.18, 0.18, 0.55].map((x) => (
                        <mesh key={`${set.key}-${x}`} position={[x, 0, 0.09]} geometry={BAR_GEOMETRY}>
                            <meshStandardMaterial color="#141210" roughness={0.45} metalness={0.8} />
                        </mesh>
                    ))}
                </group>
            ))}

            {/* Main gate opposite stair entry */}
            <group position={[-bowlOuterRadius + 0.2, 2.7, 0]} rotation={[0, Math.PI / 2, 0]}>
                <mesh receiveShadow>
                    <boxGeometry args={[4, 3.2, 0.5]} />
                    <meshStandardMaterial color="#43362b" roughness={0.85} metalness={0.1} />
                </mesh>
                {[-1.4, -0.8, -0.2, 0.4, 1].map((x) => (
                    <mesh key={`gate-bar-${x}`} position={[x, -0.2, 0.28]} geometry={GATE_BAR_GEOMETRY}>
                        <meshStandardMaterial color="#1a1613" roughness={0.45} metalness={0.78} />
                    </mesh>
                ))}
            </group>

            {/* Dunes and desert rock dressing — no castShadow to save cost */}
            <mesh position={[12, -0.2, 8]} rotation={[-Math.PI / 2, 0.5, 0]} receiveShadow>
                <circleGeometry args={[6.5, 16]} />
                <meshStandardMaterial color="#d2b48c" roughness={1} />
            </mesh>
            <mesh position={[8, -0.1, -10]} rotation={[-Math.PI / 2, -0.35, 0]} receiveShadow>
                <circleGeometry args={[5, 12]} />
                <meshStandardMaterial color="#c8a57a" roughness={1} />
            </mesh>
            {/* Added more dunes */}
            <mesh position={[-15, -0.15, -5]} rotation={[-Math.PI / 2, 0.2, 0]} receiveShadow>
                <circleGeometry args={[7, 12]} />
                <meshStandardMaterial color="#dcc19d" roughness={1} />
            </mesh>
            <mesh position={[0, -0.25, 18]} rotation={[-Math.PI / 2, -0.1, 0]} receiveShadow>
                <circleGeometry args={[10, 12]} />
                <meshStandardMaterial color="#cbae82" roughness={1} />
            </mesh>

            <mesh position={[-11.8, 0.4, 9.8]} receiveShadow>
                <dodecahedronGeometry args={[1.7, 0]} />
                <meshStandardMaterial color="#a08b73" roughness={1} />
            </mesh>
            <mesh position={[-13.2, 0.25, -10.3]} receiveShadow>
                <dodecahedronGeometry args={[1.25, 0]} />
                <meshStandardMaterial color="#8e7d6a" roughness={1} />
            </mesh>

            {/* Two perimeter point lights only */}
            <pointLight position={[bowlOuterRadius - 2, 4.2, 0]} intensity={isNight ? 0.4 : 1.0} distance={16} color="#ffbe72" />
            <pointLight position={[-bowlOuterRadius + 2, 4.2, 0]} intensity={isNight ? 0.4 : 1.0} distance={16} color="#ffbe72" />

            {/* Pillar spotlights: 6 only at night to avoid cost */}
            {isNight &&
                prisonSegments.slice(0, 6).map((seg) => (
                    <PillarSpotlight
                        key={`pillar-spot-${seg.key}`}
                        position={[seg.x, 4.2, seg.z]}
                        setLightRef={(el) => {
                            spotlightRefsRef.current[seg.key] = el;
                        }}
                    />
                ))}
        </group>
    );
}
