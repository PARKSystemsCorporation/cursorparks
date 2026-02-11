"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";
import VendorProfileCard from "./VendorProfileCard";

// --- Archetypes ---
const VENDORS = [
    {
        id: "hawker", name: "THE HAWKER", color: "#cc3300",
        position: [-4.2, 0, 2.5] as [number, number, number], // Inside HawkerStallShop, behind market counter
        shoutBubbleOffset: [-0.9, 2, 0.5] as [number, number, number], // Left of vendor so it doesn't block shop view
        shouts: ["HEY! YOU! Over here!", "Don't just walk by!", "BEST DEALS— right here!", "WAKE UP! Look alive!", "You look like you need what I got!"],
        shoutInterval: 3500
    },
    {
        id: "broker", name: "THE BROKER", color: "#3a506b",
        position: [-2.5, 0, -2.5],
        shouts: ["Autonomous little bots — built and hustled.", "Need a bot? I've got runners.", "Custom agents, micro to macro."],
        shoutInterval: 8000
    },
    {
        id: "barker", name: "THE BARKER", color: "#6b3a3a",
        position: [3.2, 0, -5],
        shouts: ["Step right up!", "Don't be shy!", "Fortune favors the bold."],
        shoutInterval: 6000
    }
] as const;

// --- Procedural Vendor Visuals ---
// --- Procedural Vendor Visuals ---

export interface CyberHumanProps {
    position: readonly [number, number, number];
    color: string;
    isTarget: boolean;
    name: string;
    lastShout: string | null;
    setTarget: (id: string) => void;
    id: string;
    /** Offset for shout bubble so it doesn't block vendor/shop view */
    shoutBubbleOffset?: [number, number, number];
}
export function CyberHuman({ position, color, isTarget, name, lastShout, setTarget, id, shoutBubbleOffset = [0.8, 1.9, 0.5] }: CyberHumanProps) {
    const group = useRef<THREE.Group>(null);
    const armRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    type TextRefWithOpacity = THREE.Object3D & { fillOpacity?: number; outlineOpacity?: number };
const textRef = useRef<TextRefWithOpacity | null>(null);
    const bgRef = useRef<THREE.Mesh>(null);
    const lineRef = useRef<THREE.Mesh>(null);

    // Animation state ref (mutable, no re-renders)
    const animState = useRef({ opacity: 0, lastShoutSeen: null as string | null });

    // Idle Animation & Shout Fade
    useFrame(({ clock }) => {
        if (!group.current) return;
        const t = clock.getElapsedTime() + position[0]; // Offset by pos
        group.current.position.y = position[1] + Math.sin(t * 1.5) * 0.02; // Breathe

        // Handle Shout Animation
        if (lastShout !== animState.current.lastShoutSeen) {
            animState.current.lastShoutSeen = lastShout;
            animState.current.opacity = 1; // Reset opacity on new shout
        }

        if (animState.current.opacity > 0) {
            animState.current.opacity -= 0.005; // Decay
            if (animState.current.opacity < 0) animState.current.opacity = 0;

            // Apply to visuals if they exist
            if (textRef.current) {
                textRef.current.fillOpacity = animState.current.opacity;
                textRef.current.outlineOpacity = animState.current.opacity;
            }
            if (bgRef.current) {
                // @ts-expect-error -- material exists on mesh
                if (bgRef.current.material) bgRef.current.material.opacity = animState.current.opacity * 0.7;
            }
            if (lineRef.current) {
                // @ts-expect-error -- material exists on mesh
                if (lineRef.current.material) lineRef.current.material.opacity = animState.current.opacity * 0.5;
            }
        }

        // Wave animation on hover
        if (armRef.current) {
            const t = clock.getElapsedTime();
            const wave = hovered ? Math.max(0, Math.sin(t * 6) * 0.4) : 0;
            armRef.current.rotation.x = THREE.MathUtils.lerp(armRef.current.rotation.x, -wave, 0.15);
        }
    });

    return (
        <group
            ref={group}
            position={position}
            onClick={() => setTarget(id)}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* --- GEOMETRY --- */}

            {/* Waving arm (visible when hovered) */}
            <group ref={armRef} position={[0.35, 1.4, 0.1]} rotation={[0, 0, -0.2]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.06, 0.08, 0.4, 6]} />
                    <meshStandardMaterial color="#111" roughness={0.9} />
                </mesh>
            </group>

            {/* Hood / Cloak Body (Procedural Cloth) */}
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.45, 1.8, 8]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>

            {/* Head / Hood */}
            <mesh position={[0, 1.7, 0]} castShadow>
                <dodecahedronGeometry args={[0.25, 0]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>

            {/* Tech Visor */}
            <mesh position={[0, 1.75, 0.18]}>
                <boxGeometry args={[0.25, 0.05, 0.02]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={EMISSIVE_SCALE} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight position={[0, 1.8, 0.3]} distance={1} intensity={1} color={color} decay={2} />
            )}

            {/* Tech Collar / Backpack */}
            <mesh position={[0, 1.45, -0.15]}>
                <boxGeometry args={[0.5, 0.4, 0.2]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* --- UI ELEMENTS --- */}

            {/* Nameplate */}
            <Billboard position={[0, 2.3, 0]}>
                <Text
                    fontSize={0.12}
                    color={color}
                    font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                    anchorY="bottom"
                    outlineWidth={0.01}
                    outlineColor="#000"
                    outlineBlur={0.05}
                >
                    {name.toUpperCase()}
                </Text>
                {/* Tech bar below name */}
                <mesh position={[0, -0.02, 0]}>
                    <planeGeometry args={[0.5, 0.005]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            </Billboard>

            {/* Shout Bubble */}
            {lastShout && (
                <Billboard position={shoutBubbleOffset}>
                    <Text
                        ref={textRef}
                        fontSize={0.15}
                        maxWidth={2.5}
                        color="#ffffff" // White text
                        fillOpacity={0} // Controlled by ref
                        outlineWidth={0.01}
                        outlineColor="#000"
                        outlineOpacity={0} // Controlled by ref
                        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                    >
                        {lastShout}
                    </Text>
                    {/* Text Background Box */}
                    <mesh ref={bgRef} position={[0, 0, -0.01]}>
                        <planeGeometry args={[2.6, 0.4]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0} />
                    </mesh>
                    {/* Connecting Line */}
                    <mesh ref={lineRef} position={[-0.8, -0.2, 0]} rotation={[0, 0, 0.5]}>
                        <planeGeometry args={[0.02, 0.5]} />
                        <meshBasicMaterial color={color} transparent opacity={0} />
                    </mesh>
                </Billboard>
            )}

            {/* Selection Ring */}
            {isTarget && (
                <group position={[0, 0.1, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.5, 0.55, 32]} />
                        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
                    </mesh>
                    {PRACTICAL_LIGHT_INTENSITY > 0 && (
                        <pointLight distance={3} intensity={2} color={color} position={[0, 1, 0]} decay={2} />
                    )}
                </group>
            )}

            {/* In-world profile card (broker / bot hustler) */}
            {id === "broker" && (
                <VendorProfileCard
                    vendorId="broker"
                    color={color}
                    position={[0.85, 2.2, 0.45]}
                    visible={!!isTarget}
                />
            )}
        </group>
    );
}

// --- Full 3D realistic body for the Hawker (market vendor behind counter) ---
const SKIN_TONE = "#e8c4a0";
const APRON_COLOR = "#4a3728";
const SHIRT_COLOR = "#2a2a2a";
const TROUSERS_COLOR = "#1a1a1a";
const HAIR_COLOR = "#3d2914";

function RealisticHawkerBody({ position, color, isTarget, name, lastShout, setTarget, id, shoutBubbleOffset = [-0.9, 2, 0.5] }: CyberHumanProps) {
    const group = useRef<THREE.Group>(null);
    type TextRefWithOpacity = THREE.Object3D & { fillOpacity?: number; outlineOpacity?: number };
    const textRef = useRef<TextRefWithOpacity | null>(null);
    const bgRef = useRef<THREE.Mesh>(null);
    const lineRef = useRef<THREE.Mesh>(null);
    const animState = useRef({ opacity: 0, lastShoutSeen: null as string | null });

    useFrame(({ clock }) => {
        if (!group.current) return;
        const t = clock.getElapsedTime() + position[0];
        group.current.position.y = position[1] + Math.sin(t * 1.5) * 0.02;
        if (lastShout !== animState.current.lastShoutSeen) {
            animState.current.lastShoutSeen = lastShout;
            animState.current.opacity = 1;
        }
        if (animState.current.opacity > 0) {
            animState.current.opacity -= 0.005;
            if (animState.current.opacity < 0) animState.current.opacity = 0;
            if (textRef.current) {
                textRef.current.fillOpacity = animState.current.opacity;
                textRef.current.outlineOpacity = animState.current.opacity;
            }
            if (bgRef.current && (bgRef.current as THREE.Mesh).material) {
                ((bgRef.current as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = animState.current.opacity * 0.7;
            }
            if (lineRef.current && (lineRef.current as THREE.Mesh).material) {
                ((lineRef.current as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = animState.current.opacity * 0.5;
            }
        }
    });

    return (
        <group ref={group} position={position} onClick={() => setTarget(id)}>
            {/* --- REALISTIC BODY (approx 1.7m proportions) --- */}
            {/* Feet */}
            <mesh position={[-0.06, 0.04, 0.02]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.06, 0.22]} />
                <meshStandardMaterial color={TROUSERS_COLOR} roughness={0.9} />
            </mesh>
            <mesh position={[0.06, 0.04, -0.02]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.06, 0.22]} />
                <meshStandardMaterial color={TROUSERS_COLOR} roughness={0.9} />
            </mesh>
            {/* Lower legs */}
            <mesh position={[-0.06, 0.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.06, 0.07, 0.4, 8]} />
                <meshStandardMaterial color={TROUSERS_COLOR} roughness={0.9} />
            </mesh>
            <mesh position={[0.06, 0.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.06, 0.07, 0.4, 8]} />
                <meshStandardMaterial color={TROUSERS_COLOR} roughness={0.9} />
            </mesh>
            {/* Upper legs / hips */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.12, 0.14, 0.32, 8]} />
                <meshStandardMaterial color={TROUSERS_COLOR} roughness={0.9} />
            </mesh>
            {/* Torso (chest + belly) */}
            <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.18, 0.2, 0.5, 10]} />
                <meshStandardMaterial color={SHIRT_COLOR} roughness={0.85} />
            </mesh>
            {/* Apron (front) */}
            <mesh position={[0, 0.95, 0.12]} castShadow receiveShadow>
                <boxGeometry args={[0.32, 0.5, 0.04]} />
                <meshStandardMaterial color={APRON_COLOR} roughness={0.9} />
            </mesh>
            {/* Neck */}
            <mesh position={[0, 1.35, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.08, 0.12, 8]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.95} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.58, 0]} castShadow>
                <sphereGeometry args={[0.14, 16, 12]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.9} />
            </mesh>
            {/* Hair (cap of hair on top/back) */}
            <mesh position={[0, 1.62, -0.06]} castShadow>
                <sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial color={HAIR_COLOR} roughness={0.95} />
            </mesh>
            {/* Eyes (simple dark dots) */}
            <mesh position={[-0.04, 1.6, 0.12]}>
                <sphereGeometry args={[0.02, 8, 6]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.04, 1.6, 0.12]}>
                <sphereGeometry args={[0.02, 8, 6]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Upper arms: one relaxed, one hand on counter */}
            <mesh position={[-0.22, 1.08, 0]} rotation={[0, 0, 0.15]} castShadow>
                <cylinderGeometry args={[0.05, 0.055, 0.28, 8]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.9} />
            </mesh>
            <mesh position={[0.2, 1.05, 0.08]} rotation={[0, 0, -0.1]} castShadow>
                <cylinderGeometry args={[0.05, 0.055, 0.26, 8]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.9} />
            </mesh>
            {/* Forearms: left hanging, right bent toward counter */}
            <mesh position={[-0.3, 0.88, 0]} rotation={[0, 0, 0.2]} castShadow>
                <cylinderGeometry args={[0.04, 0.045, 0.26, 8]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.9} />
            </mesh>
            <mesh position={[0.28, 0.92, 0.18]} rotation={[0.6, 0, -0.08]} castShadow>
                <cylinderGeometry args={[0.04, 0.045, 0.24, 8]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.9} />
            </mesh>
            {/* Hands */}
            <mesh position={[-0.35, 0.78, 0]} castShadow>
                <sphereGeometry args={[0.035, 8, 6]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.9} />
            </mesh>
            <mesh position={[0.34, 0.82, 0.28]} castShadow>
                <sphereGeometry args={[0.035, 8, 6]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.9} />
            </mesh>
            {/* Stall accent (apron strap / vendor badge in accent color) */}
            <mesh position={[0, 1.08, 0.15]}>
                <boxGeometry args={[0.06, 0.08, 0.02]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={EMISSIVE_SCALE * 0.5} />
            </mesh>

            {/* --- UI (same as CyberHuman) --- */}
            <Billboard position={[0, 2.3, 0]}>
                <Text fontSize={0.12} color={color} font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" anchorY="bottom" outlineWidth={0.01} outlineColor="#000" outlineBlur={0.05}>
                    {name.toUpperCase()}
                </Text>
                <mesh position={[0, -0.02, 0]}>
                    <planeGeometry args={[0.5, 0.005]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            </Billboard>
            {lastShout && (
                <Billboard position={shoutBubbleOffset}>
                    <Text ref={textRef} fontSize={0.15} maxWidth={2.5} color="#ffffff" fillOpacity={0} outlineWidth={0.01} outlineColor="#000" outlineOpacity={0} font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff">
                        {lastShout}
                    </Text>
                    <mesh ref={bgRef} position={[0, 0, -0.01]}>
                        <planeGeometry args={[2.6, 0.4]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0} />
                    </mesh>
                    <mesh ref={lineRef} position={[-0.8, -0.2, 0]} rotation={[0, 0, 0.5]}>
                        <planeGeometry args={[0.02, 0.5]} />
                        <meshBasicMaterial color={color} transparent opacity={0} />
                    </mesh>
                </Billboard>
            )}
            {isTarget && (
                <group position={[0, 0.1, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.5, 0.55, 32]} />
                        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
                    </mesh>
                    {PRACTICAL_LIGHT_INTENSITY > 0 && (
                        <pointLight distance={3} intensity={2} color={color} position={[0, 1, 0]} decay={2} />
                    )}
                </group>
            )}
        </group>
    );
}

type VendorWithShout = (typeof VENDORS)[number] & { setTarget: (id: string) => void; targetId: string | null };
function VendorWrapper(props: VendorWithShout) {
    const [lastShout, setLastShout] = useState<string | null>(null);
    // Removed shoutOpacity state to prevent re-renders on every frame

    // Shout logic
    useFrame((state) => {
        if (state.clock.elapsedTime * 1000 % props.shoutInterval < 50) {
            // Only trigger state update if we actually change the shout
            // This runs at 60fps but the condition is rare (once per interval)
            if (Math.random() > 0.7) {
                const newShout = props.shouts[Math.floor(Math.random() * props.shouts.length)];
                if (newShout !== lastShout) {
                    setLastShout(newShout);
                }
            }
        }
    });

    const isHawker = props.id === "hawker";
    const shared = { ...props, lastShout, isTarget: props.targetId === props.id, setTarget: props.setTarget };
    return isHawker ? <RealisticHawkerBody {...shared} /> : <CyberHuman {...shared} />;
}

export default function Vendors({ setTarget, targetId }: { setTarget: (id: string) => void, targetId: string | null }) {
    return (
        <group>
            {VENDORS.map((v) => (
                <VendorWrapper key={v.id} {...v} setTarget={setTarget} targetId={targetId} />
            ))}
        </group>
    );
}
