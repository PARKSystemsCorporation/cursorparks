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
        position: [-3.3, 0, 2.5],
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
    },
    {
        id: "gamemaster", name: "GAMEMASTER", color: "#3a6b50",
        position: [-2.5, 0, -9],
        shouts: ["Roll the dice.", "All part of the game.", "Win or lose, you play."],
        shoutInterval: 10000
    }
] as const;

// --- Procedural Vendor Visuals ---
// --- Procedural Vendor Visuals ---

interface CyberHumanProps {
    position: readonly [number, number, number];
    color: string;
    isTarget: boolean;
    name: string;
    lastShout: string | null;
    setTarget: (id: string) => void;
    id: string;
}
function CyberHuman({ position, color, isTarget, name, lastShout, setTarget, id }: CyberHumanProps) {
    const group = useRef<THREE.Group>(null);
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
    });

    return (
        <group ref={group} position={position} onClick={() => setTarget(id)}>
            {/* --- GEOMETRY --- */}

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
                <Billboard position={[0.8, 1.9, 0.5]}>
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

    return (
        <CyberHuman
            {...props}
            lastShout={lastShout}
            isTarget={props.targetId === props.id}
            setTarget={props.setTarget}
        />
    );
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
