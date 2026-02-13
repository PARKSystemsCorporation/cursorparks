"use client";

import React, { forwardRef } from "react";
import * as THREE from "three";

// Stairs reference: 1:7 head-to-body, slender, exact outfit and proportions.
// Origin at feet; total height ~1.68.

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 16);
const SPHERE = new THREE.SphereGeometry(1, 16, 16);

const MAT_GLOSSY_BLACK = new THREE.MeshStandardMaterial({
    color: "#0a0a0a",
    metalness: 0.85,
    roughness: 0.2,
});

const MAT_SILVER = new THREE.MeshStandardMaterial({
    color: "#c0c4c8",
    metalness: 0.9,
    roughness: 0.25,
});

const MAT_SKIN = new THREE.MeshStandardMaterial({
    color: "#e0c0a8",
    roughness: 0.65,
    metalness: 0.02,
});

const MAT_HAIR = new THREE.MeshStandardMaterial({
    color: "#7c3aed",
    emissive: "#5b21b6",
    emissiveIntensity: 0.12,
    roughness: 0.5,
    metalness: 0.15,
});

const MAT_SMOKY_EYE = new THREE.MeshStandardMaterial({
    color: "#2a1030",
    emissive: "#3b0764",
    emissiveIntensity: 0.08,
    roughness: 0.9,
    metalness: 0,
});

const MAT_LIPS = new THREE.MeshStandardMaterial({
    color: "#c08080",
    roughness: 0.55,
    metalness: 0,
});

export const BrokerAvatar = forwardRef<THREE.Group, object>(function BrokerAvatar(_, ref) {
    // Proportions: total height 1.68, head ~0.21 (1:7). Y-up, feet at 0.
    const h = 1.68;
    const headH = 0.21;
    const waistY = 1.0;
    const bustY = 1.15;
    const shoulderY = 1.35;
    const neckY = 1.48;
    const headCenterY = 1.58;

    return (
        <group>
            {/* --- Platform boots (chunky metallic silver, thick segmented sole) --- */}
            <group position={[-0.06, 0.04, 0.02]}>
                <mesh scale={[0.08, 0.06, 0.2]} geometry={BOX} castShadow>
                    <meshStandardMaterial color="#a0a4a8" metalness={0.9} roughness={0.25} />
                </mesh>
                <mesh position={[0, -0.055, 0]} scale={[0.1, 0.04, 0.22]} geometry={BOX}>
                    <meshStandardMaterial color="#808488" metalness={0.85} roughness={0.3} />
                </mesh>
            </group>
            <group position={[0.06, 0.04, 0.02]}>
                <mesh scale={[0.08, 0.06, 0.2]} geometry={BOX} castShadow>
                    <meshStandardMaterial color="#a0a4a8" metalness={0.9} roughness={0.25} />
                </mesh>
                <mesh position={[0, -0.055, 0]} scale={[0.1, 0.04, 0.22]} geometry={BOX}>
                    <meshStandardMaterial color="#808488" metalness={0.85} roughness={0.3} />
                </mesh>
            </group>

            {/* --- Legs (high-waisted glossy black pants) --- */}
            <mesh position={[-0.06, 0.5, 0]} scale={[0.07, 0.45, 0.08]} geometry={BOX} material={MAT_GLOSSY_BLACK} castShadow />
            <mesh position={[0.06, 0.5, 0]} scale={[0.07, 0.45, 0.08]} geometry={BOX} material={MAT_GLOSSY_BLACK} castShadow />
            <mesh position={[-0.06, 0.92, 0]} scale={[0.065, 0.2, 0.075]} geometry={BOX} material={MAT_GLOSSY_BLACK} castShadow />
            <mesh position={[0.06, 0.92, 0]} scale={[0.065, 0.2, 0.075]} geometry={BOX} material={MAT_GLOSSY_BLACK} castShadow />

            {/* --- Belt (black, ~1.5–2" wide, large rectangular silver buckle, eyelets) --- */}
            <mesh position={[0, waistY + 0.02, 0.04]} scale={[0.28, 0.025, 0.06]} geometry={BOX} material={MAT_GLOSSY_BLACK} />
            <mesh position={[0, waistY + 0.02, 0.07]} scale={[0.06, 0.035, 0.02]} geometry={BOX} material={MAT_SILVER} />
            {/* Buckle M emblem hint */}
            <mesh position={[0, waistY + 0.02, 0.082]} scale={[0.04, 0.02, 0.008]} geometry={BOX} material={MAT_SILVER} />

            {/* --- Midriff (exposed skin) --- */}
            <mesh position={[0, (waistY + bustY) / 2, 0.02]} scale={[0.12, 0.12, 0.04]} geometry={BOX} material={MAT_SKIN} castShadow />

            {/* --- Crop top (black glossy, harness + cups, ends below bust) --- */}
            <mesh position={[0, bustY + 0.02, 0.06]} scale={[0.2, 0.08, 0.08]} geometry={BOX} material={MAT_GLOSSY_BLACK} castShadow />
            <mesh position={[-0.04, bustY + 0.04, 0.08]} scale={[0.04, 0.025, 0.04]} geometry={SPHERE} material={MAT_GLOSSY_BLACK} />
            <mesh position={[0.04, bustY + 0.04, 0.08]} scale={[0.04, 0.025, 0.04]} geometry={SPHERE} material={MAT_GLOSSY_BLACK} />
            {/* Harness: center strap from choker to between cups */}
            <mesh position={[0, neckY - 0.08, 0.06]} scale={[0.02, 0.12, 0.02]} geometry={BOX} material={MAT_GLOSSY_BLACK} />
            <mesh position={[-0.03, shoulderY - 0.02, 0.04]} scale={[0.015, 0.08, 0.015]} geometry={BOX} material={MAT_GLOSSY_BLACK} />
            <mesh position={[0.03, shoulderY - 0.02, 0.04]} scale={[0.015, 0.08, 0.015]} geometry={BOX} material={MAT_GLOSSY_BLACK} />

            {/* --- Arms: left bracer (silver bands), right fingerless glove --- */}
            <group position={[-0.2, shoulderY - 0.15, 0.02]} rotation={[0, 0, 0.15]}>
                <mesh scale={[0.04, 0.2, 0.04]} geometry={CYL} material={MAT_SKIN} castShadow />
                <group position={[0, -0.12, 0.02]}>
                    <mesh scale={[0.045, 0.08, 0.05]} geometry={BOX} material={MAT_GLOSSY_BLACK} />
                    <mesh position={[0, -0.02, 0.026]} scale={[0.048, 0.015, 0.01]} geometry={BOX} material={MAT_SILVER} />
                    <mesh position={[0, -0.04, 0.026]} scale={[0.048, 0.015, 0.01]} geometry={BOX} material={MAT_SILVER} />
                </group>
            </group>
            <group position={[0.2, shoulderY - 0.15, 0.02]} rotation={[0, 0, -0.15]}>
                <mesh scale={[0.04, 0.2, 0.04]} geometry={CYL} material={MAT_SKIN} castShadow />
                <mesh position={[0, -0.12, 0.02]} scale={[0.05, 0.06, 0.04]} geometry={BOX} material={MAT_GLOSSY_BLACK} />
            </group>

            {/* --- Head (ref for animation), 1:7 ratio --- */}
            <group ref={ref} position={[0, headCenterY, 0]}>
                {/* Skull / face */}
                <mesh position={[0, 0.02, -0.02]} scale={[0.1, 0.1, 0.1]} geometry={SPHERE} material={MAT_SKIN} castShadow />
                <mesh position={[0, -0.02, 0.06]} scale={[0.08, 0.09, 0.03]} geometry={BOX} material={MAT_SKIN} castShadow />
                <mesh position={[0, -0.02, 0.09]} scale={[0.015, 0.03, 0.015]} geometry={BOX} material={MAT_SKIN} />
                <mesh position={[0, -0.05, 0.08]} scale={[0.02, 0.012, 0.012]} geometry={SPHERE} material={MAT_SKIN} />
                <group position={[0, -0.06, 0.08]}>
                    <mesh position={[0, 0.003, 0]} scale={[0.032, 0.006, 0.012]} geometry={BOX} material={MAT_LIPS} />
                    <mesh position={[0, -0.006, 0.002]} scale={[0.028, 0.008, 0.012]} geometry={BOX} material={MAT_LIPS} />
                </group>
                <mesh position={[0, -0.08, 0.05]} scale={[0.04, 0.022, 0.03]} geometry={SPHERE} material={MAT_SKIN} castShadow />

                {/* Hair — long straight purple, parted left, over LEFT shoulder to mid-chest */}
                <mesh position={[-0.05, -0.04, -0.06]} scale={[0.09, 0.18, 0.1]} rotation={[0, 0, 0.2]} geometry={SPHERE} material={MAT_HAIR} castShadow />
                <mesh position={[-0.02, 0.06, -0.04]} scale={[0.07, 0.05, 0.09]} geometry={SPHERE} material={MAT_HAIR} castShadow />
                <mesh position={[-0.06, -0.12, 0]} scale={[0.06, 0.15, 0.05]} rotation={[0, 0, 0.15]} geometry={BOX} material={MAT_HAIR} castShadow />

                {/* Eyes + smoky makeup */}
                <group position={[0, 0.01, 0.09]}>
                    <mesh position={[-0.025, 0, 0.003]} scale={[0.02, 0.015, 0.004]} geometry={SPHERE} material={MAT_SKIN} />
                    <mesh position={[0.025, 0, 0.003]} scale={[0.02, 0.015, 0.004]} geometry={SPHERE} material={MAT_SKIN} />
                    <mesh position={[-0.025, 0, 0.005]} scale={[0.022, 0.018, 0.005]} geometry={BOX} material={MAT_SMOKY_EYE} />
                    <mesh position={[0.025, 0, 0.005]} scale={[0.022, 0.018, 0.005]} geometry={BOX} material={MAT_SMOKY_EYE} />
                </group>

                {/* Choker: high black band, central circular silver ring, conical studs */}
                <group position={[0, -0.1, 0.02]}>
                    <mesh scale={[0.08, 0.025, 0.08]} geometry={CYL} material={MAT_GLOSSY_BLACK} rotation={[Math.PI / 2, 0, 0]} />
                    <mesh position={[0, 0, 0.022]} scale={[0.022, 0.022, 0.008]} geometry={CYL} material={MAT_SILVER} rotation={[Math.PI / 2, 0, 0]} />
                    <mesh position={[-0.03, 0, 0.02]} scale={[0.008, 0.012, 0.008]} geometry={CYL} material={MAT_SILVER} rotation={[Math.PI / 2, 0, 0]} />
                    <mesh position={[0.03, 0, 0.02]} scale={[0.008, 0.012, 0.008]} geometry={CYL} material={MAT_SILVER} rotation={[Math.PI / 2, 0, 0]} />
                    <mesh position={[0.022, 0.022, 0.02]} scale={[0.008, 0.012, 0.008]} geometry={CYL} material={MAT_SILVER} rotation={[Math.PI / 2, 0, 0]} />
                    <mesh position={[-0.022, 0.022, 0.02]} scale={[0.008, 0.012, 0.008]} geometry={CYL} material={MAT_SILVER} rotation={[Math.PI / 2, 0, 0]} />
                </group>

                {/* Neck (skin below choker) */}
                <mesh position={[0, -0.14, 0]} scale={[0.04, 0.05, 0.04]} geometry={CYL} material={MAT_SKIN} />
            </group>
        </group>
    );
});
