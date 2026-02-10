"use client";

import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Plane, Text, Float, Billboard } from "@react-three/drei";
import * as THREE from "three";

// Vendor Config - Positioned tighter in the alley
const VENDORS = [
    {
        id: "broker",
        name: "THE BROKER",
        color: "#4a90e2",
        position: [-2.2, 1.4, -2.5],
        shouts: ["Local. Autonomous. Yours.", "No cloud. No leash.", "Data is currency."],
        shoutInterval: 8000,
        prop: "cube"
    },
    {
        id: "barker",
        name: "THE BARKER",
        color: "#e24a4a",
        position: [2.2, 1.3, -5],
        shouts: ["WATCH THEM THINK.", "RUNNING LIVE—RIGHT NOW.", "DIGITAL FLESH!"],
        shoutInterval: 5000,
        prop: "cone"
    },
    {
        id: "gamemaster",
        name: "GAMEMASTER",
        color: "#50e3c2",
        position: [-2.0, 1.5, -9],
        shouts: ["TRY IT. BREAK IT.", "WIN OR LEARN.", "LEVEL UP."],
        shoutInterval: 6000,
        prop: "torus"
    },
    {
        id: "gatekeeper",
        name: "THE GATEKEEPER",
        color: "#9013fe",
        position: [0, 1.6, -14],
        shouts: ["NOT FOR EVERYONE.", "YOU KNOW IF IT’S FOR YOU.", "ACCESS RESTRICTED."],
        shoutInterval: 12000,
        prop: "sphere"
    }
] as const;

function VendorVisuals({ type, color }: { type: string, color: string }) {
    // Procedural "Silhouette" generation using basic shapes
    return (
        <group>
            {/* Hood/Head */}
            <mesh position={[0, 0.6, 0]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            {/* Eyes */}
            <mesh position={[0.08, 0.6, 0.15]}>
                <sphereGeometry args={[0.03]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[-0.08, 0.6, 0.15]}>
                <sphereGeometry args={[0.03]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Body */}
            <mesh position={[0, 0, 0]}>
                <coneGeometry args={[0.4, 1.5, 8]} />
                <meshStandardMaterial color="#050505" roughness={0.9} />
            </mesh>

            {/* Floating Prop */}
            <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
                <mesh position={[0.6, 0.5, 0.3]}>
                    {type === 'cube' && <boxGeometry args={[0.3, 0.3, 0.3]} />}
                    {type === 'cone' && <coneGeometry args={[0.2, 0.4, 16]} />}
                    {type === 'torus' && <torusGeometry args={[0.15, 0.05, 16, 32]} />}
                    {type === 'sphere' && <octahedronGeometry args={[0.2]} />}
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} wireframe />
                </mesh>
            </Float>
        </group>
    );
}

function Vendor({ data, isTarget }: { data: typeof VENDORS[number], isTarget: boolean }) {
    const group = useRef<THREE.Group>(null);
    const [shoutText, setShoutText] = useState("");
    const lastShoutRef = useRef(0);

    // Random idle offset
    const offset = useMemo(() => Math.random() * 100, []);

    useFrame(({ clock }) => {
        if (!group.current) return;
        const t = clock.getElapsedTime();

        // Idle: Subtle sway
        group.current.position.y = data.position[1] + Math.sin(t * 1.5 + offset) * 0.03;
        group.current.rotation.y = Math.sin(t * 0.5 + offset) * 0.1; // Look around slightly

        // Target Focus
        if (isTarget) {
            group.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1); // Face forward
        } else {
            group.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }

        // Sim Shout
        // Real implementation would come from server for synced shouts, 
        // but adding local flavor for "aliveness"
        if (Date.now() - lastShoutRef.current > data.shoutInterval + Math.random() * 4000) {
            triggerShout();
        }
    });

    const triggerShout = () => {
        if (Math.random() > 0.7) return; // Not always
        const text = data.shouts[Math.floor(Math.random() * data.shouts.length)];
        setShoutText(text);
        lastShoutRef.current = Date.now();
        setTimeout(() => setShoutText(""), 4000);
    };

    return (
        <group ref={group} position={new THREE.Vector3(...data.position)}>
            {/* Visuals */}
            <VendorVisuals type={data.prop} color={data.color} />

            {/* Interaction Hitbox (Invisible) */}
            <mesh visible={false}>
                <boxGeometry args={[1, 2, 1]} />
            </mesh>

            {/* Shout Text - World Space, Billboarded */}
            {shoutText && (
                <Billboard position={[0, 1.8, 0]}>
                    <Text
                        fontSize={0.25}
                        color={data.color}
                        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" // Standard font
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.02}
                        outlineColor="#000"
                        maxWidth={3}
                        textAlign="center"
                    >
                        {shoutText}
                    </Text>
                </Billboard>
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
