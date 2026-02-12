"use client";

import React from "react";
import * as THREE from "three";

// --- MATERIALS ---

const MAT_TITANIUM = new THREE.MeshStandardMaterial({
    color: "#2a2a30",
    metalness: 0.9,
    roughness: 0.3,
});

const MAT_CARBON = new THREE.MeshStandardMaterial({
    color: "#111111",
    metalness: 0.4,
    roughness: 0.8,
});


const MAT_GLOW = new THREE.MeshStandardMaterial({
    color: "#00ffff",
    emissive: "#00ffff",
    emissiveIntensity: 2,
    toneMapped: false,
});

const MAT_ACTUATOR = new THREE.MeshStandardMaterial({
    color: "#555555",
    metalness: 0.8,
    roughness: 0.2,
});

const MAT_ACCENT = new THREE.MeshStandardMaterial({
    color: "#880000", // Red accent default
    metalness: 0.7,
    roughness: 0.4,
});


// --- GEOMETRY HELPERS ---

const BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const CYL_GEO = new THREE.CylinderGeometry(1, 1, 1, 16);
const SPHERE_GEO = new THREE.SphereGeometry(1, 16, 16);

// --- COMPONENTS ---

export function CyberneticHead({ skinTone, isBarker }: { skinTone: string; isBarker?: boolean }) {
    return (
        <group>
            {/* Cranium Plate (Top) */}
            <mesh position={[0, 0.08, -0.02]} scale={[0.16, 0.12, 0.18]} geometry={BOX_GEO} material={MAT_TITANIUM} castShadow />

            {/* Face Plate (Mask-like) */}
            <mesh position={[0, 0, 0.08]} scale={[0.14, 0.18, 0.04]} geometry={BOX_GEO} castShadow>
                <meshStandardMaterial color={skinTone} roughness={0.5} metalness={isBarker ? 0.3 : 0.1} />
            </mesh>

            {/* Jaw / Chin (Mechanical) */}
            <mesh position={[0, -0.12, 0.05]} scale={[0.12, 0.06, 0.1]} geometry={BOX_GEO} material={MAT_CARBON} castShadow />

            {/* Eyes (Glowing Sensors) */}
            <mesh position={[-0.04, 0.02, 0.105]} scale={[0.03, 0.01, 0.01]} geometry={BOX_GEO} material={MAT_GLOW} />
            <mesh position={[0.04, 0.02, 0.105]} scale={[0.03, 0.01, 0.01]} geometry={BOX_GEO} material={MAT_GLOW} />

            {/* Sides / Ears (Vents) */}
            <mesh position={[0.09, 0, 0]} scale={[0.02, 0.1, 0.1]} geometry={BOX_GEO} material={MAT_ACTUATOR} />
            <mesh position={[-0.09, 0, 0]} scale={[0.02, 0.1, 0.1]} geometry={BOX_GEO} material={MAT_ACTUATOR} />

            {/* Back of Head (Cabling) */}
            <mesh position={[0, -0.05, -0.1]} rotation={[Math.PI / 4, 0, 0]} scale={[0.08, 0.1, 0.08]} geometry={CYL_GEO} material={MAT_CARBON} />

            {/* Barker Specifics: Sunglasses & Beard */}
            {isBarker && (
                <>
                    {/* Sunglasses */}
                    <mesh position={[0, 0.02, 0.11]} scale={[0.14, 0.035, 0.02]} geometry={BOX_GEO} material={MAT_CARBON} />

                    {/* Beard (Textured Block) */}
                    <mesh position={[0, -0.08, 0.1]} scale={[0.16, 0.12, 0.05]} geometry={BOX_GEO} castShadow>
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
            {/* Spine Column */}
            <mesh position={[0, 0, -0.05]} scale={[0.1 * scale, 0.5, 0.1]} geometry={BOX_GEO} material={MAT_ACTUATOR} castShadow />

            {/* Chest Plate (Segmented) */}
            <mesh position={[0, 0.15, 0.08]} scale={[0.35 * scale, 0.25, 0.1]} geometry={BOX_GEO} material={MAT_ACCENT} castShadow>
                <meshStandardMaterial color={topColor} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Abdomen Plating (Layered) */}
            <mesh position={[0, -0.1, 0.06]} scale={[0.28 * scale, 0.2, 0.08]} geometry={BOX_GEO} material={MAT_CARBON} castShadow />

            {/* Rib Vents (Side) */}
            <mesh position={[0.18 * scale, 0.05, 0]} rotation={[0, 0, -0.2]} scale={[0.05, 0.3, 0.2]} geometry={BOX_GEO} material={MAT_TITANIUM} />
            <mesh position={[-0.18 * scale, 0.05, 0]} rotation={[0, 0, 0.2]} scale={[0.05, 0.3, 0.2]} geometry={BOX_GEO} material={MAT_TITANIUM} />

            {/* Neck Collar */}
            <mesh position={[0, 0.3, 0]} scale={[0.15, 0.05, 0.15]} geometry={CYL_GEO} material={MAT_TITANIUM} />

            {/* Central Core Light */}
            <mesh position={[0, 0.2, 0.14]} scale={[0.05, 0.05, 0.01]} geometry={SPHERE_GEO} material={MAT_GLOW} />
        </group>
    );
}

export function CyberneticArm({ isRight, robotic, color }: { isRight: boolean; robotic: boolean; color: string }) {
    // If robotic (Barker's special arm), use gold. Else use standard carbon/painted.
    const mainMat = robotic ?
        new THREE.MeshStandardMaterial({ color: "#cca300", metalness: 1.0, roughness: 0.2 }) :
        new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.5 });

    const sideMult = isRight ? 1 : -1;

    return (
        <group>
            {/* Shoulder Pauldron */}
            <mesh position={[0, 0, 0]} scale={[0.14, 0.14, 0.14]} geometry={SPHERE_GEO} material={mainMat} castShadow />

            {/* Upper Arm (Truss) */}
            <mesh position={[0.02 * sideMult, -0.15, 0]} scale={[0.08, 0.25, 0.08]} geometry={BOX_GEO} material={MAT_ACTUATOR} castShadow />

            {/* Upper Arm Armor Plate */}
            <mesh position={[0.06 * sideMult, -0.15, 0]} scale={[0.02, 0.2, 0.1]} geometry={BOX_GEO} material={mainMat} />

            {/* Elbow Joint */}
            <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.08, 0.1, 0.08]} geometry={CYL_GEO} material={MAT_TITANIUM} />

            {/* Forearm (Complex) */}
            <group position={[0, -0.45, 0.05]} rotation={[0.2, 0, 0]}>
                {/* Core */}
                <mesh position={[0, 0, 0]} scale={[0.07, 0.25, 0.07]} geometry={BOX_GEO} material={MAT_CARBON} castShadow />
                {/* Armor Shell */}
                <mesh position={[0, 0, 0.02]} scale={[0.09, 0.22, 0.04]} geometry={BOX_GEO} material={mainMat} />
                {/* Wrist Actuator */}
                <mesh position={[0, -0.14, 0]} scale={[0.06, 0.02, 0.06]} geometry={CYL_GEO} material={MAT_TITANIUM} />
            </group>

            {/* Hand */}
            <mesh position={[0, -0.65, 0.08]} scale={[0.08, 0.1, 0.02]} geometry={BOX_GEO} material={MAT_CARBON} />
            {/* Fingers (Simplified Block) */}
            <mesh position={[0, -0.72, 0.1]} scale={[0.07, 0.06, 0.02]} geometry={BOX_GEO} material={MAT_TITANIUM} />
        </group>
    );
}

export function CyberneticLeg({ color }: { color: string }) {
    return (
        <group>
            {/* Thigh */}
            <mesh position={[0, -0.25, 0]} scale={[0.14, 0.5, 0.14]} geometry={CYL_GEO} material={MAT_CARBON} castShadow />
            {/* Thigh Armor */}
            <mesh position={[0, -0.25, 0.08]} scale={[0.12, 0.4, 0.02]} geometry={BOX_GEO} castShadow>
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.6} />
            </mesh>

            {/* Knee */}
            <mesh position={[0, -0.55, 0.02]} rotation={[0, Math.PI / 2, 0]} scale={[0.08, 0.12, 0.12]} geometry={CYL_GEO} material={MAT_TITANIUM} />

            {/* Shin */}
            <mesh position={[0, -0.85, 0]} scale={[0.1, 0.5, 0.1]} geometry={BOX_GEO} material={MAT_ACTUATOR} castShadow />
            {/* Shin Armor */}
            <mesh position={[0, -0.85, 0.06]} scale={[0.1, 0.45, 0.02]} geometry={BOX_GEO} castShadow>
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.6} />
            </mesh>

            {/* Foot */}
            <mesh position={[0, -1.12, 0.1]} scale={[0.12, 0.08, 0.25]} geometry={BOX_GEO} material={MAT_CARBON} castShadow />
        </group>
    );
}
