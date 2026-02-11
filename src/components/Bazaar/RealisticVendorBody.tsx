"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";
import VendorProfileCard from "./VendorProfileCard";

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
        skinTone: "#c9a882",
        hairColor: "#0a0a0a",
        hairStyle: "bald",
        topColor: "#2a2a2a",
        bottomColor: "#1a1a1a",
        accessory: "vest",
        posture: "arms-wide",
        build: "stocky",
        eyeColor: DEFAULT_EYE,
        beard: "thick",
        glasses: false,
        mask: false,
        goggles: false,
        gloves: false,
        jewelry: false,
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

    const { skinTone, hairColor, hairStyle, topColor, bottomColor, accessory, posture, build, eyeColor, beard, glasses, mask, goggles, gloves, jewelry, accentMesh } = config;

    const buildScale = { slim: { torso: 0.9, limbs: 0.95 }, medium: { torso: 1, limbs: 1 }, stocky: { torso: 1.1, limbs: 1.05 }, muscular: { torso: 1.15, limbs: 1.1 }, tall: { torso: 1, limbs: 1.15 } }[build];
    const seg = { head: [16, 12], torso: 8, limb: 6, joint: 6 };

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

    const handMat = gloves ? "#2a2a2a" : skinTone;
    const armMat = accessory === "sleeveless" ? skinTone : topColor;

    return (
        <group ref={group} position={position} onClick={() => setTarget(id)}>
            {/* --- FEET --- */}
            <mesh position={[-0.06 * buildScale.limbs, 0.04, 0.02]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.06, 0.22]} />
                <meshStandardMaterial color={bottomColor} roughness={0.9} />
            </mesh>
            <mesh position={[0.06 * buildScale.limbs, 0.04, -0.02]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.06, 0.22]} />
                <meshStandardMaterial color={bottomColor} roughness={0.9} />
            </mesh>
            {/* Lower legs */}
            <mesh position={[-0.06, 0.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.06, 0.07, 0.4 * (build === "tall" ? 1.1 : 1), seg.limb]} />
                <meshStandardMaterial color={bottomColor} roughness={0.9} />
            </mesh>
            <mesh position={[0.06, 0.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.06, 0.07, 0.4 * (build === "tall" ? 1.1 : 1), seg.limb]} />
                <meshStandardMaterial color={bottomColor} roughness={0.9} />
            </mesh>
            {/* Knees (joint between upper/lower leg) */}
            <mesh position={[-0.06, 0.42, 0]} castShadow>
                <sphereGeometry args={[0.065, seg.joint, seg.joint]} />
                <meshStandardMaterial color={bottomColor} roughness={0.9} />
            </mesh>
            <mesh position={[0.06, 0.42, 0]} castShadow>
                <sphereGeometry args={[0.065, seg.joint, seg.joint]} />
                <meshStandardMaterial color={bottomColor} roughness={0.9} />
            </mesh>
            {/* Upper legs / hips */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.12 * buildScale.torso, 0.14 * buildScale.torso, 0.32, seg.torso]} />
                <meshStandardMaterial color={bottomColor} roughness={0.9} />
            </mesh>
            {/* Torso */}
            <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.18 * buildScale.torso, 0.2 * buildScale.torso, 0.5, seg.torso]} />
                <meshStandardMaterial color={topColor} roughness={0.85} />
            </mesh>
            {/* Shoulders */}
            <mesh position={[-0.2 * buildScale.limbs, 1.22, 0]} castShadow>
                <sphereGeometry args={[0.08, seg.joint, seg.joint]} />
                <meshStandardMaterial color={armMat} roughness={0.9} />
            </mesh>
            <mesh position={[0.2 * buildScale.limbs, 1.22, 0]} castShadow>
                <sphereGeometry args={[0.08, seg.joint, seg.joint]} />
                <meshStandardMaterial color={armMat} roughness={0.9} />
            </mesh>
            {/* Accessories: apron, vest, coat, robe */}
            {accessory === "apron" && (
                <mesh position={[0, 0.95, 0.12]} castShadow receiveShadow>
                    <boxGeometry args={[0.32, 0.5, 0.04]} />
                    <meshStandardMaterial color="#4a3728" roughness={0.9} />
                </mesh>
            )}
            {accessory === "vest" && (
                <mesh position={[0, 1.02, 0.08]} castShadow>
                    <boxGeometry args={[0.38, 0.4, 0.12]} />
                    <meshStandardMaterial color="#6b3a3a" roughness={0.85} />
                </mesh>
            )}
            {accessory === "coat" && (
                <mesh position={[0, 1.0, 0]} castShadow>
                    <cylinderGeometry args={[0.2, 0.22, 0.55, seg.torso]} />
                    <meshStandardMaterial color={topColor} roughness={0.8} />
                </mesh>
            )}
            {accessory === "robe" && (
                <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.22, 0.24, 0.6, seg.torso]} />
                    <meshStandardMaterial color={topColor} roughness={0.9} />
                </mesh>
            )}
            {accessory === "hood" && (
                <mesh position={[0, 1.5, -0.08]} castShadow>
                    <sphereGeometry args={[0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial color={topColor} roughness={0.9} />
                </mesh>
            )}
            {/* Neck */}
            <mesh position={[0, 1.35, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.08, 0.12, seg.limb]} />
                <meshStandardMaterial color={skinTone} roughness={0.95} />
            </mesh>
            {/* Head group for idle rotation */}
            <group ref={headRef} position={[0, 1.58, 0]}>
                <mesh position={[0, 0, 0]} castShadow>
                    <sphereGeometry args={[0.14, seg.head[0], seg.head[1]]} />
                    <meshStandardMaterial color={mask ? "#2a2a2a" : skinTone} roughness={0.9} />
                </mesh>
                {hairStyle === "cap" && (
                    <mesh position={[0, 0.04, -0.06]} castShadow>
                        <sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                        <meshStandardMaterial color={hairColor} roughness={0.95} />
                    </mesh>
                )}
                {hairStyle === "slicked" && (
                    <mesh position={[0, 0.02, -0.08]} castShadow>
                        <sphereGeometry args={[0.11, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                        <meshStandardMaterial color={hairColor} roughness={0.8} metalness={0.1} />
                    </mesh>
                )}
                {hairStyle === "hood" && (
                    <mesh position={[0, 0.1, -0.06]} castShadow>
                        <sphereGeometry args={[0.13, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                        <meshStandardMaterial color={topColor} roughness={0.9} />
                    </mesh>
                )}
                {hairStyle === "turban" && (
                    <mesh position={[0, 0.18, 0]} castShadow>
                        <cylinderGeometry args={[0.16, 0.14, 0.2, 12]} />
                        <meshStandardMaterial color="#4a3728" roughness={0.9} />
                    </mesh>
                )}
                {beard === "thick" && (
                    <mesh position={[0, -0.08, 0.1]} castShadow>
                        <boxGeometry args={[0.2, 0.12, 0.06]} />
                        <meshStandardMaterial color={hairColor} roughness={0.95} />
                    </mesh>
                )}
                {!mask && (
                    <>
                        <mesh position={[-0.04, 0.02, 0.12]}>
                            <sphereGeometry args={[0.02, 10, 8]} />
                            <meshStandardMaterial color={eyeColor} />
                        </mesh>
                        <mesh position={[0.04, 0.02, 0.12]}>
                            <sphereGeometry args={[0.02, 10, 8]} />
                            <meshStandardMaterial color={eyeColor} />
                        </mesh>
                    </>
                )}
                {glasses && (
                    <mesh position={[0, 0.02, 0.14]}>
                        <boxGeometry args={[0.12, 0.04, 0.01]} />
                        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
                    </mesh>
                )}
                {goggles && (
                    <mesh position={[0, 0.06, 0.12]}>
                        <boxGeometry args={[0.14, 0.06, 0.03]} />
                        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
                    </mesh>
                )}
                {mask && (
                    <mesh position={[0, -0.02, 0.11]}>
                        <boxGeometry args={[0.18, 0.1, 0.02]} />
                        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
                    </mesh>
                )}
            </group>
            {/* Arms: posture-driven layout */}
            {posture !== "hands-pockets" && (
                <>
                    <group ref={leftArmRef} position={[-0.22, 1.08, 0]} rotation={[0, 0, posture === "arms-wide" ? -0.4 : 0.15]}>
                        <mesh position={[0, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.05, 0.055, 0.28 * buildScale.limbs, seg.limb]} />
                            <meshStandardMaterial color={armMat} roughness={0.9} />
                        </mesh>
                        <mesh position={[-0.08, -0.14, 0]} rotation={[0, 0, 0.2]} castShadow>
                            <cylinderGeometry args={[0.04, 0.045, 0.26 * buildScale.limbs, seg.limb]} />
                            <meshStandardMaterial color={armMat} roughness={0.9} />
                        </mesh>
                        <mesh position={[-0.14, -0.28, 0]} castShadow>
                            <sphereGeometry args={[0.035, seg.joint, seg.joint]} />
                            <meshStandardMaterial color={handMat} roughness={0.9} />
                        </mesh>
                    </group>
                    <group ref={rightArmRef} position={[0.2, 1.05, 0.08]} rotation={[0, 0, posture === "arms-wide" ? 0.4 : posture === "one-arm-counter" || posture === "hammer-arm" ? -0.1 : 0]}>
                        <mesh position={[0, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.05, 0.055, 0.26 * buildScale.limbs, seg.limb]} />
                            <meshStandardMaterial color={armMat} roughness={0.9} />
                        </mesh>
                        <mesh position={[0.06, -0.13, posture === "one-arm-counter" || posture === "hammer-arm" ? 0.1 : 0]} rotation={[posture === "one-arm-counter" || posture === "hammer-arm" ? 0.6 : 0, 0, -0.08]} castShadow>
                            <cylinderGeometry args={[0.04, 0.045, 0.24 * buildScale.limbs, seg.limb]} />
                            <meshStandardMaterial color={armMat} roughness={0.9} />
                        </mesh>
                        <mesh position={[0.12, posture === "one-arm-counter" || posture === "hammer-arm" ? -0.1 : -0.26, posture === "one-arm-counter" || posture === "hammer-arm" ? 0.2 : 0.05]} castShadow>
                            <sphereGeometry args={[0.035, seg.joint, seg.joint]} />
                            <meshStandardMaterial color={handMat} roughness={0.9} />
                        </mesh>
                    </group>
                </>
            )}
            {posture === "hands-pockets" && (
                <group position={[0, 0.9, 0.06]}>
                    <mesh position={[-0.2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.04, 0.045, 0.22, seg.limb]} />
                        <meshStandardMaterial color={armMat} roughness={0.9} />
                    </mesh>
                    <mesh position={[0.2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.04, 0.045, 0.22, seg.limb]} />
                        <meshStandardMaterial color={armMat} roughness={0.9} />
                    </mesh>
                </group>
            )}
            {jewelry && (
                <mesh position={[0.28, 0.88, 0.08]} rotation={[0, 0, Math.PI / 2]}>
                    <torusGeometry args={[0.04, 0.008, 6, 8]} />
                    <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
                </mesh>
            )}
            {accentMesh && (
                <mesh position={[0, 1.08, 0.15]}>
                    <boxGeometry args={[0.06, 0.08, 0.02]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={EMISSIVE_SCALE * 0.5} />
                </mesh>
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
            {lastShout && (
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
            {id === "broker" && (
                <VendorProfileCard vendorId="broker" color={color} position={[0.85, 2.2, 0.45]} visible={!!isTarget} />
            )}
        </group>
    );
}
