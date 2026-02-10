"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane, useTexture, Text } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

// Vendor Config
const VENDORS = [
    {
        id: "broker",
        name: "THE BROKER",
        // Using placeholder colors/textures if real assets are missing, 
        // but normally we'd load sprites. Use colors for now to distinguish.
        color: "#4a90e2",
        position: [-3, 1.5, -2],
        shouts: ["Local. Autonomous. Yours.", "No cloud. No leash."],
        shoutInterval: 8000
    },
    {
        id: "barker",
        name: "THE BARKER",
        color: "#e24a4a",
        position: [3, 1.5, -4],
        shouts: ["WATCH THEM THINK.", "RUNNING LIVE—RIGHT NOW."],
        shoutInterval: 5000
    },
    {
        id: "gamemaster",
        name: "GAMEMASTER",
        color: "#50e3c2",
        position: [-2.5, 1.5, -8],
        shouts: ["TRY IT. BREAK IT.", "WIN OR LEARN."],
        shoutInterval: 6000
    },
    {
        id: "gatekeeper",
        name: "THE GATEKEEPER",
        color: "#9013fe",
        position: [0, 1.5, -12],
        shouts: ["NOT FOR EVERYONE.", "YOU KNOW IF IT’S FOR YOU."],
        shoutInterval: 12000
    }
] as const;

function Vendor({ data, isTarget }: { data: typeof VENDORS[number], isTarget: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const textRef = useRef<any>(null); // For shout text
    const [lastShout, setLastShout] = React.useState(0);
    const [shoutText, setShoutText] = React.useState("");

    // Random Sway
    const swayOffset = useMemo(() => Math.random() * 100, []);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const t = clock.getElapsedTime();

        // Idle Animation: Breathing/Sway
        meshRef.current.position.y = data.position[1] + Math.sin(t * 2 + swayOffset) * 0.05;

        // Target Reaction
        if (isTarget) {
            // Lerp scale up
            meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1), 0.1);
        } else {
            meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }

        // Auto-Shout logic (client-side simulation for now)
        if (Date.now() - lastShout > data.shoutInterval + Math.random() * 2000) {
            triggerShout();
        }
    });

    const triggerShout = () => {
        const text = data.shouts[Math.floor(Math.random() * data.shouts.length)];
        setShoutText(text);
        setLastShout(Date.now());

        // Clear shout after 3s
        setTimeout(() => setShoutText(""), 3000);
    };

    // Billboard effect: Always face camera
    useFrame(({ camera }) => {
        if (meshRef.current) {
            meshRef.current.lookAt(camera.position);
        }
    });

    return (
        <group position={new THREE.Vector3(...data.position)}>
            {/* Vendor Sprite (Placeholder Plane) */}
            <Plane ref={meshRef} args={[1.5, 2.5]}>
                <meshStandardMaterial color={data.color} transparent />
            </Plane>

            {/* Shout Text Bubble */}
            {shoutText && (
                <Text
                    position={[0, 2, 0]}
                    fontSize={0.3}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="black"
                >
                    {shoutText}
                </Text>
            )}
        </group>
    );
}

export default function Vendors({ target }: { target: string | null }) {
    return (
        <>
            {VENDORS.map((v) => (
                <Vendor key={v.id} data={v} isTarget={target === v.id} />
            ))}
        </>
    );
}
