"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";
import VendorProfileCard from "./VendorProfileCard";
import { CyberneticHead, CyberneticTorso, CyberneticArm, CyberneticLeg } from "./CyberneticParts";

// --- Vendor appearance config (one per vendor id) ---
export type HairStyle = "cap" | "slicked" | "bald" | "long" | "turban" | "hood";
export type OutfitAccessory = "apron" | "coat" | "vest" | "sleeveless" | "hood" | "robe" | "none";
export type PosturePreset = "standing" | "leaning" | "one-arm-counter" | "arms-wide" | "hands-pockets" | "presenting" | "hammer-arm";

export type VendorAppearanceConfig = {
    skinTone: string;
    hairColor: string;
    hairStyle: HairStyle;
    topColor: string;
    bottomColor: string;
    accessory: OutfitAccessory;
    posture: PosturePreset;
    build: "slim" | "medium" | "stocky" | "muscular" | "tall";
    eyeColor: string;
    beard: boolean | "thick";
    glasses: boolean;
    mask: boolean;
    goggles: boolean;
    gloves: boolean;
    jewelry: boolean;
    accentMesh?: boolean; // e.g. badge on apron
    roboticArm?: boolean;
    goldChains?: boolean;
};

const DEFAULT_EYE = "#1a1a1a";

export const VENDOR_APPEARANCE: Record<string, VendorAppearanceConfig> = {
    hawker: {
        skinTone: "#e8c4a0",
        hairColor: "#3d2914",
        hairStyle: "cap",
        topColor: "#2a2a2a",
        bottomColor: "#1a1a1a",
        accessory: "apron",
        posture: "one-arm-counter",
        build: "stocky",
        eyeColor: DEFAULT_EYE,
        beard: false,
        glasses: false,
        mask: false,
        goggles: false,
        gloves: false,
        jewelry: false,
        accentMesh: true,
    },
    broker: {
        skinTone: "#d4b896",
        hairColor: "#1a1a1a",
        hairStyle: "slicked",
        topColor: "#1a1a2a",
        bottomColor: "#151520",
        accessory: "coat",
        posture: "standing",
        build: "slim",
        eyeColor: DEFAULT_EYE,
        beard: false,
        glasses: true,
        mask: false,
        goggles: false,
        gloves: false,
        jewelry: false,
    },
    barker: {
        skinTone: "#8d5e38", // Darker skin as per reference
        hairColor: "#0a0a0a",
        hairStyle: "bald",
        topColor: "#800000", // Red leather vest
        bottomColor: "#1a1a1a",
        accessory: "vest",
        posture: "arms-wide", // Relaxed confident
        build: "muscular",
        eyeColor: DEFAULT_EYE,
        beard: "thick", // Full dense beard
        glasses: true, // Dark rectangular sunglasses
        mask: false,
        goggles: false,
        gloves: false,
        jewelry: false,
        roboticArm: true, // Gold cybernetic limb
        goldChains: true,
    },
    smith: {
        skinTone: "#b8956a",
        hairColor: "#2a2a2a",
        hairStyle: "cap",
        topColor: "#333",
        bottomColor: "#222",
        accessory: "sleeveless",
        posture: "hammer-arm",
        build: "muscular",
        eyeColor: DEFAULT_EYE,
        beard: false,
        glasses: false,
        mask: false,
        goggles: true,
        gloves: true,
        jewelry: false,
    },
    fixer: {
        skinTone: "#c4a574",
        hairColor: "#252525",
        hairStyle: "bald",
        topColor: "#1e1e2a",
        bottomColor: "#18181a",
        accessory: "hood",
        posture: "hands-pockets",
        build: "medium",
        eyeColor: DEFAULT_EYE,
        beard: false,
        glasses: false,
        mask: true,
        goggles: false,
        gloves: true,
        jewelry: false,
    },
    merchant: {
        skinTone: "#d4b896",
        hairColor: "#4a3728",
        hairStyle: "turban",
        topColor: "#3d2a1a",
        bottomColor: "#2a1a10",
        accessory: "robe",
        posture: "presenting",
        build: "tall",
        eyeColor: DEFAULT_EYE,
        beard: false,
        glasses: false,
        mask: false,
        goggles: false,
        gloves: false,
        jewelry: true,
    },
};

export type RealisticVendorBodyProps = {
    position: readonly [number, number, number];
    color: string;
    isTarget: boolean;
    name: string;
    lastShout: string | null;
    setTarget: (id: string) => void;
    id: string;
    shoutBubbleOffset?: [number, number, number];
    config: VendorAppearanceConfig;
};

const ROBOTO_FONT = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff";

export function RealisticVendorBody({
    position,
    color,
    isTarget,
    name,
    lastShout,
    setTarget,
    id,
    shoutBubbleOffset = [0.8, 1.9, 0.5],
    config,
}: RealisticVendorBodyProps) {
    const group = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    type TextRefWithOpacity = THREE.Object3D & { fillOpacity?: number; outlineOpacity?: number };
    const textRef = useRef<TextRefWithOpacity | null>(null);
    const bgRef = useRef<THREE.Mesh>(null);
    const lineRef = useRef<THREE.Mesh>(null);
    const animState = useRef({ opacity: 0, lastShoutSeen: null as string | null });
    const idleRef = useRef(0);

    const { skinTone, topColor, bottomColor, accessory, posture, build, roboticArm, goldChains } = config;

    const buildScale = { slim: { torso: 0.9, limbs: 0.95 }, medium: { torso: 1, limbs: 1 }, stocky: { torso: 1.1, limbs: 1.05 }, muscular: { torso: 1.15, limbs: 1.1 }, tall: { torso: 1, limbs: 1.15 } }[build];

    useFrame(({ clock }) => {
        if (!group.current) return;
        const t = clock.getElapsedTime() + position[0];
        idleRef.current = t;

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

        if (headRef.current) {
            const ht = t + position[0] * 0.5;
            if (id === "broker") headRef.current.rotation.y = Math.sin(ht * 0.4) * 0.15;
            else if (id === "fixer") headRef.current.rotation.y = Math.sin(ht * 0.6) * 0.2;
            else if (id === "merchant") headRef.current.rotation.x = Math.sin(ht * 0.3) * 0.08;
        }

        if (rightArmRef.current && id === "smith") {
            rightArmRef.current.rotation.x = -0.5 - Math.max(0, Math.sin(t * 2.5) * 0.4);
        }
        if (leftArmRef.current && id === "barker") {
            leftArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.15;
            leftArmRef.current.rotation.z = 0.3 + Math.sin(t * 1.2) * 0.1;
        }
        if (rightArmRef.current && id === "barker") {
            rightArmRef.current.rotation.x = Math.sin(t * 1.2 + 0.5) * 0.15;
            rightArmRef.current.rotation.z = -0.3 - Math.sin(t * 1.2 + 0.5) * 0.1;
        }
    });



    return (
        <group ref={group} position={position} onClick={() => setTarget(id)}>
            {/* --- CYBERNETIC BODY --- */}

            {/* Hips / Pelvis */}
            <mesh position={[0, 0.9, 0]} scale={[0.3, 0.15, 0.2]} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.5} />
            </mesh>

            {/* Legs */}
            <group position={[-0.15 * buildScale.limbs, 0.9, 0]}>
                <CyberneticLeg color={bottomColor} />
            </group>
            <group position={[0.15 * buildScale.limbs, 0.9, 0]}>
                <CyberneticLeg color={bottomColor} />
            </group>

            {/* Torso */}
            <group position={[0, 1.25, 0]}>
                <CyberneticTorso topColor={topColor} buildScale={buildScale.torso} />
            </group>

            {/* Head */}
            <group ref={headRef} position={[0, 1.6, 0]}>
                <CyberneticHead
                    skinTone={skinTone}
                    isBarker={id === 'barker'}
                />
            </group>

            {/* Arms */}
            {posture !== "hands-pockets" && (
                <>
                    {/* Left Arm */}
                    <group ref={leftArmRef} position={[-0.22 * buildScale.torso, 1.45, 0]} rotation={[0, 0, posture === "arms-wide" ? -0.4 : 0.15]}>
                        <CyberneticArm isRight={false} robotic={false} skinTone={skinTone} />
                    </group>

                    {/* Right Arm */}
                    <group ref={rightArmRef} position={[0.22 * buildScale.torso, 1.45, 0]} rotation={[0, 0, posture === "arms-wide" ? 0.4 : posture === "one-arm-counter" || posture === "hammer-arm" ? -0.1 : 0]}>
                        <CyberneticArm
                            isRight={true}
                            robotic={roboticArm || false}
                            skinTone={skinTone}
                        />
                    </group>
                </>
            )}

            {goldChains && (
                <group position={[0, 1.5, 0.05]} rotation={[0.1, 0, 0]}>
                    <mesh position={[0, -0.05, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.12, 0.015, 8, 24]} />
                        <meshStandardMaterial color="#ffd700" metalness={1.0} roughness={0.1} />
                    </mesh>
                    <mesh position={[0, -0.08, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.14, 0.01, 8, 24]} />
                        <meshStandardMaterial color="#ffd700" metalness={1.0} roughness={0.1} />
                    </mesh>
                </group>
            )}


            {/* --- UI --- */}
            <Billboard position={[0, 2.3, 0]}>
                <Text fontSize={0.12} color={color} font={ROBOTO_FONT} anchorY="bottom" outlineWidth={0.01} outlineColor="#000" outlineBlur={0.05}>
                    {name.toUpperCase()}
                </Text>
                <mesh position={[0, -0.02, 0]}>
                    <planeGeometry args={[0.5, 0.005]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            </Billboard>
            {
                lastShout && (
                    <Billboard position={shoutBubbleOffset}>
                        <Text ref={textRef} fontSize={0.15} maxWidth={2.5} color="#ffffff" fillOpacity={0} outlineWidth={0.01} outlineColor="#000" outlineOpacity={0} font={ROBOTO_FONT}>
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
                )
            }
            {
                isTarget && (
                    <group position={[0, 0.1, 0]}>
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.5, 0.55, 32]} />
                            <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
                        </mesh>
                        {PRACTICAL_LIGHT_INTENSITY > 0 && (
                            <pointLight distance={3} intensity={2} color={color} position={[0, 1, 0]} decay={2} />
                        )}
                    </group>
                )
            }
            {
                id === "broker" && (
                    <VendorProfileCard vendorId="broker" color={color} position={[0.85, 2.2, 0.45]} visible={!!isTarget} />
                )
            }
        </group >
    );
}
