"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";

// --- Archetypes ---
const VENDORS = [
    {
        id: "broker", name: "THE BROKER", color: "#3a506b",
        position: [-2.5, 0, -2.5],
        shouts: ["Information has a price.", "I see the strings.", "Do you need a key?"],
        shoutInterval: 8000
    },
    {
        id: "barker", name: "THE BARKER", color: "#6b3a3a",
        position: [2.5, 0, -5],
        shouts: ["Step right up!", "Don't be shy!", "Fortune favors the bold."],
        shoutInterval: 6000
    },
    {
        id: "gamemaster", name: "GAMEMASTER", color: "#3a6b50",
        position: [-2.5, 0, -9],
        shouts: ["Roll the dice.", "All part of the game.", "Win or lose, you play."],
        shoutInterval: 10000
    },
    {
        id: "gatekeeper", name: "GATEKEEPER", color: "#555555",
        position: [0, 0, -14],
        shouts: ["None shall pass... unpaid.", "The void watches.", "Halt."],
        shoutInterval: 12000
    }
] as const;

// --- Procedural Vendor Visuals ---
// --- Procedural Vendor Visuals ---

// Cyberpunk Character Component
function CyberHuman({ position, color, isTarget, name, lastShout, shoutOpacity, setTarget, id }: any) {
    const group = useRef<THREE.Group>(null);

    // Idle Animation
    useFrame(({ clock }) => {
        if (!group.current) return;
        const t = clock.getElapsedTime() + position[0]; // Offset by pos
        group.current.position.y = position[1] + Math.sin(t * 1.5) * 0.02; // Breathe
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

            {/* Glowing Tech Visor */}
            <mesh position={[0, 1.75, 0.18]}>
                <boxGeometry args={[0.25, 0.05, 0.02]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 1.8, 0.3]} distance={1} intensity={1} color={color} decay={2} />

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
            {lastShout && shoutOpacity > 0 && (
                <Billboard position={[0.8, 1.9, 0.5]}>
                    <Text
                        fontSize={0.15}
                        maxWidth={2.5}
                        color="#ffffff" // White text
                        fillOpacity={shoutOpacity}
                        outlineWidth={0.01}
                        outlineColor="#000"
                        outlineOpacity={shoutOpacity}
                        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                        backgroundColor="#000000aa" // Dark tint box
                        padding={0.1}
                    >
                        {lastShout}
                    </Text>
                    {/* Connecting Line */}
                    <mesh position={[-0.8, -0.2, 0]} rotation={[0, 0, 0.5]}>
                        <planeGeometry args={[0.02, 0.5]} />
                        <meshBasicMaterial color={color} transparent opacity={shoutOpacity * 0.5} />
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
                    <pointLight distance={3} intensity={2} color={color} position={[0, 1, 0]} decay={2} />
                </group>
            )}
        </group>
    );
}

// Wrapper to handle state logic (shouts)
function VendorWrapper(props: any) {
    const [lastShout, setLastShout] = useState<string | null>(null);
    const [shoutOpacity, setShoutOpacity] = useState(0);

    // Shout logic
    useFrame((state) => {
        if (state.clock.elapsedTime * 1000 % props.shoutInterval < 50) {
            if (Math.random() > 0.7) {
                setLastShout(props.shouts[Math.floor(Math.random() * props.shouts.length)]);
                setShoutOpacity(1);
            }
        }
        if (shoutOpacity > 0) setShoutOpacity(prev => prev - 0.01);
    });

    return (
        <CyberHuman
            {...props}
            lastShout={lastShout}
            shoutOpacity={shoutOpacity}
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
