"use client";

import { useBazaarMaterials } from "./BazaarMaterials";
import SteamParticles from "./SteamParticles";

interface CoffeeCartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
}

export default function CoffeeCart({ position, rotation = [0, 0, 0] }: CoffeeCartProps) {
    const { woodCrate } = useBazaarMaterials();

    return (
        <group position={position} rotation={rotation}>
            {/* Cart Base */}
            <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
                <boxGeometry args={[1.4, 0.7, 0.9]} />
                <meshStandardMaterial color="#5d4037" roughness={0.8} />
            </mesh>
            {/* Wheels */}
            <mesh position={[-0.55, 0.15, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.08]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.55, 0.15, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.08]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Counter top */}
            <mesh position={[0, 0.85, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[1.3, 0.08, 0.85]} />
            </mesh>
            {/* Espresso machine / brewer */}
            <mesh position={[-0.3, 1.1, 0]} castShadow>
                <boxGeometry args={[0.35, 0.35, 0.25]} />
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Steam wand */}
            <mesh position={[-0.3, 1.25, 0.15]} rotation={[0.3, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Steam rising from machine */}
            <SteamParticles position={[-0.3, 1.15, 0]} count={8} spread={0.15} riseSpeed={0.35} />
            {/* Cups */}
            <mesh position={[0.2, 0.92, 0.2]} castShadow>
                <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
                <meshStandardMaterial color="#f5f5dc" roughness={0.4} />
            </mesh>
            {/* Steam from cup */}
            <SteamParticles position={[0.2, 0.98, 0.2]} count={6} spread={0.08} riseSpeed={0.25} />
            <mesh position={[0.45, 0.92, -0.15]} castShadow>
                <cylinderGeometry args={[0.055, 0.045, 0.09, 12]} />
                <meshStandardMaterial color="#fff8dc" roughness={0.45} />
            </mesh>
            {/* Awning / canopy */}
            <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[1.5, 0.05, 1.1]} />
                <meshStandardMaterial color="#8b4513" roughness={0.9} />
            </mesh>
        </group>
    );
}
