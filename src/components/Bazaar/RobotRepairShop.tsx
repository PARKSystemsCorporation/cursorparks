import React from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

const LEG_BOX = new THREE.BoxGeometry(0.1, 0.8, 0.1);

function ShopInterior() {
    return (
        <group>
            {/* Workbench */}
            <mesh position={[1.5, 0.8, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 0.1, 2.5]} />
                <meshStandardMaterial color="#333" roughness={0.7} />
            </mesh>
            {/* Legs — shared geometry */}
            <mesh position={[1.2, 0.4, -1]} castShadow geometry={LEG_BOX}>
                <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[1.8, 0.4, -1]} castShadow geometry={LEG_BOX}>
                <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[1.2, 0.4, 1]} castShadow geometry={LEG_BOX}>
                <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[1.8, 0.4, 1]} castShadow geometry={LEG_BOX}>
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* Back Shelves */}
            <mesh position={[2.8, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 3, 4]} />
                <meshStandardMaterial color="#444" roughness={0.8} />
            </mesh>

            {/* Random Boxes (Emissive Tech) */}
            <mesh position={[2.6, 1.0, -1]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[0.4, 0.3, 0.4]} />
                <meshStandardMaterial color="#222" emissive="#00ffff" emissiveIntensity={2} />
            </mesh>
            <mesh position={[2.6, 2.0, 1.5]} rotation={[0, -0.4, 0]}>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#222" emissive="#ff00ff" emissiveIntensity={1} />
            </mesh>

            {/* Cylinder "Tank" */}
            <mesh position={[0.5, 1.2, -1.8]} castShadow>
                <cylinderGeometry args={[0.3, 0.3, 2.4, 16]} />
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
            </mesh>
        </group>
    );
}

export function RobotRepairShop() {
    // Position: Right wall is x=2. We place this in the gap at z=-6.
    // The shop interior extends to the right (+x).

    // Internal light color
    const interiorColor = new THREE.Color('#ff00ff'); // Magenta
    const signColor = new THREE.Color('#ffaa00'); // Orange/Yellow

    return (
        <group position={[2, 0, -6]}>
            {/* --- SHELL --- */}
            <group position={[2.5, 1.75, 0]}> {/* Center at x=4.5 (2+2.5), y=1.75 */}
                {/* Floor */}
                <mesh position={[0, -1.75, 0]} receiveShadow>
                    <boxGeometry args={[5, 0.2, 5]} />
                    <meshStandardMaterial color="#222" roughness={0.5} />
                </mesh>
                {/* Ceiling */}
                <mesh position={[0, 1.75, 0]} castShadow>
                    <boxGeometry args={[5, 0.2, 5]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Back Wall */}
                <mesh position={[2.5, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.2, 3.5, 5]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
                {/* Side Wall Near */}
                <mesh position={[0, 0, 2.5]} castShadow receiveShadow>
                    <boxGeometry args={[5, 3.5, 0.2]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Side Wall Far */}
                <mesh position={[0, 0, -2.5]} castShadow receiveShadow>
                    <boxGeometry args={[5, 3.5, 0.2]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>

            {/* --- FACADE FRAME --- */}
            {/* Detailed entrance frame */}
            <group position={[0, 1.75, 0]}>
                {/* Top Beam */}
                <mesh position={[0, 1.5, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.5, 4.8]} />
                    <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Side Pillars */}
                <mesh position={[0, -0.25, 2.2]} castShadow>
                    <boxGeometry args={[0.4, 3.5, 0.4]} />
                    <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
                </mesh>
                <mesh position={[0, -0.25, -2.2]} castShadow>
                    <boxGeometry args={[0.4, 3.5, 0.4]} />
                    <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
                </mesh>
            </group>

            {/* --- SIGNAGE --- */}
            <group position={[0.5, 3.6, 0]} rotation={[0, 0, -Math.PI / 12]}> {/* Tilted down 15 deg (PI/12) */}
                {/* Backing */}
                <mesh castShadow>
                    <boxGeometry args={[0.2, 0.8, 3.5]} />
                    <meshStandardMaterial color="#000" roughness={0.2} metalness={0.8} />
                </mesh>
                {/* Neon Text */}
                <group position={[0.15, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <Text
                        fontSize={0.5}
                        color={signColor}
                        anchorX="center"
                        anchorY="middle"
                    >
                        ROBOT REPAIR
                        <meshBasicMaterial color={signColor} toneMapped={false} />
                    </Text>
                    {/* Bloom mesh for extra glow */}
                    <Text
                        position={[0, 0, -0.02]}
                        fontSize={0.5}
                        color={signColor}
                        anchorX="center"
                        anchorY="middle"
                        fillOpacity={0}
                        strokeWidth={0.02}
                        strokeColor={signColor}
                    >
                        ROBOT REPAIR
                        <meshBasicMaterial color={signColor} toneMapped={false} />
                    </Text>
                </group>
            </group>

            {/* --- LIGHTING --- */}
            {/* The "Fight" - Pink vs Sun */}
            {/* RectArea for soft spill */}
            <rectAreaLight
                width={3}
                height={3}
                color={interiorColor}
                intensity={50} // High intensity to fight day
                position={[1, 2, 0]}
                rotation={[0, -Math.PI / 2, 0]}
            />
            {/* Point light for interior fill (no shadow to avoid 6x shadow maps per frame) */}
            <pointLight
                position={[3, 3, 0]}
                color={interiorColor}
                intensity={80}
                distance={10}
                decay={2}
            />
            {/* Cyan Accent */}
            <pointLight
                position={[1.5, 1.5, 1]}
                color="#00ffff"
                intensity={20}
                distance={3}
                decay={2}
            />

            {/* --- INTERIOR --- */}
            <ShopInterior />

        </group>
    );
}
