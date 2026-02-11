"use client";

import { useBazaarMaterials } from "./BazaarMaterials";

const APPLE_COLORS = ["#cc3333", "#dd4422", "#994422", "#bb5522"];
const ORANGE_COLORS = ["#ff8844", "#ff6622", "#ee7722"];
const LEMON_COLOR = "#ffee44";

interface FruitStallProps {
    position: [number, number, number];
    rotation?: [number, number, number];
}

export default function FruitStall({ position, rotation = [0, 0, 0] }: FruitStallProps) {
    const { woodCrate } = useBazaarMaterials();

    return (
        <group position={position} rotation={rotation}>
            {/* Counter / display table */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[2.2, 1, 1.2]} />
            </mesh>
            {/* Wooden crates with produce */}
            <mesh position={[-0.6, 0.35, 0]} rotation={[0, 0.1, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.5, 0.4, 0.5]} />
            </mesh>
            <mesh position={[0.5, 0.35, -0.1]} rotation={[0, -0.15, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.45, 0.35, 0.45]} />
            </mesh>
            <mesh position={[-0.2, 0.7, 0.25]} castShadow material={woodCrate}>
                <boxGeometry args={[0.4, 0.2, 0.35]} />
            </mesh>
            {/* Apples - spheres in crates */}
            {[[-0.6, 0.6, 0], [-0.75, 0.58, 0.15], [-0.45, 0.62, -0.1], [-0.65, 0.55, -0.2]].map((pos, i) => (
                <mesh key={`a-${i}`} position={pos as [number, number, number]} castShadow>
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshStandardMaterial color={APPLE_COLORS[i % APPLE_COLORS.length]} roughness={0.6} metalness={0.05} />
                </mesh>
            ))}
            {/* Oranges */}
            {[[0.5, 0.55, -0.05], [0.45, 0.58, 0.15], [0.55, 0.52, -0.2]].map((pos, i) => (
                <mesh key={`o-${i}`} position={pos as [number, number, number]} castShadow>
                    <sphereGeometry args={[0.055, 12, 12]} />
                    <meshStandardMaterial color={ORANGE_COLORS[i % ORANGE_COLORS.length]} roughness={0.65} metalness={0.02} />
                </mesh>
            ))}
            {/* Lemons on top crate */}
            {[[-0.15, 0.85, 0.2], [-0.25, 0.82, 0.35], [-0.08, 0.83, 0.38]].map((pos, i) => (
                <mesh key={`l-${i}`} position={pos as [number, number, number]} castShadow>
                    <sphereGeometry args={[0.04, 10, 10]} />
                    <meshStandardMaterial color={LEMON_COLOR} roughness={0.5} metalness={0.08} />
                </mesh>
            ))}
            {/* Bunch of grapes (stylized) */}
            <group position={[0.3, 0.75, 0.2]}>
                {[0, 0.03, 0.06, 0.04, 0.02, 0.05].map((dy, i) => (
                    <mesh key={i} position={[i * 0.03 - 0.08, dy, 0]} castShadow>
                        <sphereGeometry args={[0.025, 8, 8]} />
                        <meshStandardMaterial color="#6b3a6b" roughness={0.7} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}
