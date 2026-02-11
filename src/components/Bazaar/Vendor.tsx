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
// Cloaked figure: Cone body, Sphere head/Hood
function VendorFigure({ color, isTarget }: { color: string, isTarget: boolean }) {
    const group = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (!group.current) return;
        const t = clock.getElapsedTime();
        // Breathing
        group.current.scale.y = 1 + Math.sin(t * 2) * 0.01;
        // Idle sway
        group.current.rotation.z = Math.sin(t * 1) * 0.02;
    });

    return (
        <group ref={group}>
            {/* Body / Cloak */}
            <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                <coneGeometry args={[0.6, 1.8, 7]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {/* Hood / Head */}
            <mesh position={[0, 1.6, 0.1]} castShadow>
                <dodecahedronGeometry args={[0.35, 0]} />
                <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.5)} roughness={1} />
            </mesh>
            {/* Shoulders */}
            <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.5, 0.4]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
        </group>
    );
}

function VendorItem({ id, ...props }: any) {
    const group = useRef<THREE.Group>(null);
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

    const isTarget = props.targetId === id;

    return (
        <group
            ref={group}
            position={props.position}
            onClick={() => props.setTarget(id)}
        >
            <VendorFigure color={props.color} isTarget={isTarget} />

            {/* Nameplate */}
            <Billboard position={[0, 2.2, 0]}>
                <Text
                    fontSize={isTarget ? 0.3 : 0.2}
                    color="#ffffff"
                    anchorY="bottom"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {props.name}
                </Text>
            </Billboard>

            {/* Shout Bubble */}
            {lastShout && shoutOpacity > 0 && (
                <Billboard position={[0.8, 1.8, 0.5]}>
                    <Text
                        fontSize={0.2}
                        maxWidth={3}
                        color="#ffeebb"
                        fillOpacity={shoutOpacity}
                        outlineWidth={0.01}
                        outlineColor="#332200"
                        outlineOpacity={shoutOpacity}
                        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                    >
                        {lastShout}
                    </Text>
                </Billboard>
            )}

            {/* Selection Highlight */}
            {isTarget && (
                <pointLight distance={3} intensity={2} color={props.color} position={[0, 1, 1]} decay={2} />
            )}
        </group>
    );
}

export default function Vendors({ setTarget, targetId }: { setTarget: (id: string) => void, targetId: string | null }) {
    return (
        <group>
            {VENDORS.map((v) => (
                <VendorItem key={v.id} {...v} setTarget={setTarget} targetId={targetId} />
            ))}
        </group>
    );
}
