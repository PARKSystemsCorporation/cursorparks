"use client";

import React from "react";
import * as THREE from "three";

// --- REFINED MATERIALS (PASS 3: HYBRID AI) ---

const MAT_PRISTINE_WHITE = new THREE.MeshStandardMaterial({
    color: "#e0e0e0", // Off-white composite
    roughness: 0.3,
    metalness: 0.1,
});

const MAT_LIGHT_TITANIUM = new THREE.MeshStandardMaterial({
    color: "#a0a4a8", // Light silver
    metalness: 0.8,
    roughness: 0.25,
});

const MAT_SOFT_GRAPHITE = new THREE.MeshStandardMaterial({
    color: "#3a3a40", // Soft dark grey, not black
    metalness: 0.5,
    roughness: 0.7,
});

const MAT_INTERNAL_MECH = new THREE.MeshStandardMaterial({
    color: "#252525", // Darker inner parts
    metalness: 0.7,
    roughness: 0.4,
});

const MAT_SENSOR_GLOW = new THREE.MeshStandardMaterial({
    color: "#00eaff", // Cyan intelligent glow
    emissive: "#00eaff",
    emissiveIntensity: 1.5,
    toneMapped: false,
});

const MAT_GOLD_ACCENT = new THREE.MeshStandardMaterial({
    color: "#d4af37",
    metalness: 1.0,
    roughness: 0.15,
});

// --- GEOMETRY HELPERS ---

const BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const CYL_GEO = new THREE.CylinderGeometry(1, 1, 1, 16);
const SPHERE_GEO = new THREE.SphereGeometry(1, 16, 16);

// --- COMPONENTS ---

export function CyberneticHead({ skinTone, isBarker }: { skinTone: string; isBarker?: boolean }) {
    // Synthetic skin material (dynamic based on prop)
    const matSkin = new THREE.MeshStandardMaterial({
        color: skinTone,
        roughness: 0.5,
        metalness: 0.1,
    });

    return (
        <group>
            {/* Cranium - Integrated Structure */}
            <mesh position={[0, 0.06, -0.04]} scale={[0.15, 0.14, 0.18]} geometry={SPHERE_GEO} material={MAT_PRISTINE_WHITE} castShadow />

            {/* Face - Half Skin / Half Mech */}
            <group position={[0, 0, 0.08]}>
                {/* Right Side (Skin) */}
                <mesh position={[0.04, 0, 0]} scale={[0.07, 0.18, 0.04]} geometry={BOX_GEO} material={matSkin} castShadow />
                {/* Left Side (Exposed Sensor Plate) */}
                <mesh position={[-0.04, 0, 0]} scale={[0.07, 0.18, 0.035]} geometry={BOX_GEO} material={MAT_LIGHT_TITANIUM} castShadow />
            </group>

            {/* Jaw - Engineered */}
            <mesh position={[0, -0.11, 0.04]} scale={[0.13, 0.05, 0.12]} geometry={BOX_GEO} material={MAT_SOFT_GRAPHITE} castShadow />

            {/* Eyes - Deep Set Optical Sensors */}
            <group position={[0, 0.02, 0.1]}>
                {/* Left Eye (Glow) */}
                <mesh position={[-0.04, 0, 0]} scale={[0.025, 0.015, 0.01]} geometry={BOX_GEO} material={MAT_SENSOR_GLOW} />
                {/* Right Eye (Glow or Lens) */}
                <mesh position={[0.04, 0, 0]} scale={[0.025, 0.015, 0.01]} geometry={BOX_GEO} material={MAT_SENSOR_GLOW} />
            </group>

            {/* Neck Connection point */}
            <mesh position={[0, -0.16, -0.02]} scale={[0.08, 0.05, 0.08]} geometry={CYL_GEO} material={MAT_INTERNAL_MECH} />

            {/* Barker Specifics: Sunglasses & Beard */}
            {isBarker && (
                <>
                    {/* Sunglasses - Premium styling */}
                    <mesh position={[0, 0.025, 0.12]} scale={[0.15, 0.04, 0.02]} geometry={BOX_GEO} castShadow>
                        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} transparent opacity={0.95} />
                    </mesh>
                    <mesh position={[0.08, 0.025, 0.06]} scale={[0.01, 0.005, 0.12]} geometry={BOX_GEO} material={MAT_GOLD_ACCENT} />
                    <mesh position={[-0.08, 0.025, 0.06]} scale={[0.01, 0.005, 0.12]} geometry={BOX_GEO} material={MAT_GOLD_ACCENT} />

                    {/* Beard - Groomed, dense */}
                    <mesh position={[0, -0.1, 0.11]} scale={[0.16, 0.12, 0.06]} geometry={BOX_GEO} castShadow>
                        <meshStandardMaterial color="#0a0a0a" roughness={1} />
                    </mesh>
                </>
            )}
        </group>
    );
}

export function CyberneticTorso({ topColor, buildScale }: { topColor: string; buildScale: number }) {
    const scale = buildScale;

    return (
        <group>
            {/* Main Spinal Column (Internal) */}
            <mesh position={[0, 0.1, -0.05]} scale={[0.12 * scale, 0.6, 0.1]} geometry={BOX_GEO} material={MAT_INTERNAL_MECH} castShadow />

            {/* Chest Armor (Composite) */}
            <mesh position={[0, 0.25, 0.08]} scale={[0.38 * scale, 0.25, 0.12]} geometry={BOX_GEO} castShadow>
                <meshStandardMaterial color={topColor} metalness={0.4} roughness={0.4} />
            </mesh>
            {/* Center Chest Light */}
            <mesh position={[0, 0.25, 0.141]} scale={[0.04, 0.12, 0.01]} geometry={BOX_GEO} material={MAT_SENSOR_GLOW} />

            {/* Abdomen - Layered Plating (Articulated look) */}
            <mesh position={[0, 0, 0.06]} scale={[0.26 * scale, 0.08, 0.1]} geometry={BOX_GEO} material={MAT_SOFT_GRAPHITE} castShadow />
            <mesh position={[0, -0.1, 0.06]} scale={[0.24 * scale, 0.08, 0.1]} geometry={BOX_GEO} material={MAT_SOFT_GRAPHITE} castShadow />

            {/* Side Vents / Lats */}
            <mesh position={[0.18 * scale, 0.1, 0]} rotation={[0, 0, -0.15]} scale={[0.08, 0.35, 0.15]} geometry={BOX_GEO} material={MAT_PRISTINE_WHITE} />
            <mesh position={[-0.18 * scale, 0.1, 0]} rotation={[0, 0, 0.14]} scale={[0.08, 0.35, 0.15]} geometry={BOX_GEO} material={MAT_PRISTINE_WHITE} />

            {/* Collarbone / Traps */}
            <mesh position={[0, 0.42, 0]} scale={[0.25 * scale, 0.08, 0.15]} geometry={BOX_GEO} material={MAT_LIGHT_TITANIUM} />
        </group>
    );
}

export function CyberneticArm({ isRight, robotic, color }: { isRight: boolean; robotic: boolean; color: string }) {
    const mainMat = robotic ? MAT_GOLD_ACCENT : new THREE.MeshStandardMaterial({ color: color, roughnes: 0.5 }); // Fallback

    // Synthetic skin for upper arm (if organic/hybrid)
    const upperArmMat = robotic ? MAT_GOLD_ACCENT : new THREE.MeshStandardMaterial({ color: "#a08060", roughness: 0.5, metalness: 0.1 });

    const sideMult = isRight ? 1 : -1;

    return (
        <group>
            {/* Shoulder Pauldron (Armor) */}
            <mesh position={[0, 0, 0]} scale={[0.15, 0.15, 0.15]} geometry={SPHERE_GEO} material={robotic ? MAT_GOLD_ACCENT : MAT_PRISTINE_WHITE} castShadow />

            {/* Upper Arm - Anatomical Shape (Cylinder/Capsule approx) */}
            <group position={[0.04 * sideMult, -0.2, 0]} rotation={[0, 0, isRight ? -0.1 : 0.1]}>
                <mesh scale={[0.11, 0.28, 0.11]} geometry={CYL_GEO} material={upperArmMat} castShadow />
            </group>

            {/* Elbow Complex */}
            <group position={[0.06 * sideMult, -0.38, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.09, 0.14, 0.09]} geometry={CYL_GEO} material={MAT_LIGHT_TITANIUM} />
            </group>

            {/* Forearm - Engineered Hybrid */}
            <group position={[0.08 * sideMult, -0.55, 0.05]} rotation={[0.2, 0, isRight ? -0.05 : 0.05]}>
                {/* Inner Frame */}
                <mesh scale={[0.07, 0.28, 0.07]} geometry={BOX_GEO} material={MAT_INTERNAL_MECH} />
                {/* Outer Armor Shell */}
                <mesh position={[0, 0, 0.02]} scale={[0.09, 0.24, 0.05]} geometry={BOX_GEO} material={robotic ? MAT_GOLD_ACCENT : MAT_PRISTINE_WHITE} castShadow />
                {/* Wrist */}
                <mesh position={[0, -0.15, 0]} scale={[0.065, 0.03, 0.065]} geometry={CYL_GEO} material={MAT_LIGHT_TITANIUM} />
            </group>

            {/* Hand - Articulated */}
            <group position={[0.09 * sideMult, -0.75, 0.08]} rotation={[0.1, 0, 0]}>
                <mesh scale={[0.09, 0.1, 0.03]} geometry={BOX_GEO} material={MAT_SOFT_GRAPHITE} />
                {/* Fingers representation */}
                <mesh position={[0, -0.06, 0.01]} scale={[0.08, 0.06, 0.02]} geometry={BOX_GEO} material={MAT_LIGHT_TITANIUM} />
            </group>
        </group>
    );
}

export function CyberneticLeg({ color }: { color: string }) {
    // New Anatomical Leg Design
    return (
        <group>
            {/* Thigh - Tapered Muscular Form */}
            <group position={[0, -0.25, 0]}>
                {/* Upper Thigh */}
                <mesh position={[0, 0.1, 0]} scale={[0.16, 0.25, 0.16]} geometry={CYL_GEO} material={MAT_SOFT_GRAPHITE} castShadow />
                {/* Lower Thigh (Tapering down) */}
                <mesh position={[0, -0.15, 0]} scale={[0.14, 0.25, 0.14]} geometry={CYL_GEO} material={MAT_SOFT_GRAPHITE} castShadow />
                {/* Thigh Armor Plate (Front) */}
                <mesh position={[0, 0, 0.09]} scale={[0.12, 0.4, 0.04]} geometry={BOX_GEO} material={MAT_PRISTINE_WHITE} castShadow />
            </group>

            {/* Knee Joint - Mechanical Hinge */}
            <group position={[0, -0.55, 0.02]}>
                <mesh rotation={[0, Math.PI / 2, 0]} scale={[0.1, 0.14, 0.14]} geometry={CYL_GEO} material={MAT_LIGHT_TITANIUM} />
                {/* Knee Guard */}
                <mesh position={[0, 0, 0.08]} scale={[0.1, 0.1, 0.02]} geometry={BOX_GEO} material={MAT_LIGHT_TITANIUM} />
            </group>

            {/* Calf - Anatomical Curve */}
            <group position={[0, -0.85, 0]}>
                {/* Main Calf Structure */}
                <mesh position={[0, 0, -0.02]} scale={[0.12, 0.45, 0.12]} geometry={BOX_GEO} material={MAT_INTERNAL_MECH} castShadow />
                {/* Calf Muscle Armor (Back) */}
                <mesh position={[0, 0.1, -0.08]} scale={[0.12, 0.25, 0.06]} geometry={BOX_GEO} material={MAT_SOFT_GRAPHITE} />
                {/* Shin Armor (Front) */}
                <mesh position={[0, 0, 0.06]} scale={[0.1, 0.4, 0.03]} geometry={BOX_GEO} material={MAT_PRISTINE_WHITE} castShadow />
            </group>

            {/* Foot - Grounded, functional */}
            <group position={[0, -1.12, 0.05]}>
                {/* Heel */}
                <mesh position={[0, 0.03, -0.05]} scale={[0.1, 0.06, 0.08]} geometry={BOX_GEO} material={MAT_SOFT_GRAPHITE} />
                {/* Main Foot */}
                <mesh position={[0, 0, 0.05]} scale={[0.11, 0.05, 0.15]} geometry={BOX_GEO} material={MAT_LIGHT_TITANIUM} castShadow />
                {/* Toe / Sole */}
                <mesh position={[0, -0.03, 0]} scale={[0.12, 0.02, 0.22]} geometry={BOX_GEO} material={MAT_INTERNAL_MECH} />
            </group>
        </group>
    );
}
