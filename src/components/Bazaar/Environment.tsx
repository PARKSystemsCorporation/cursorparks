import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Instance, Instances, Float, Text } from "@react-three/drei";
import { LayerMaterial, Depth, Noise } from "lamina";

// --- CYBER ASSETS ---

function Cables() {
    const curve1 = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3, 3, 2),
        new THREE.Vector3(0, 2.5, 0),
        new THREE.Vector3(3, 3.2, -2)
    ]), []);

    const curve2 = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4, 4, -5),
        new THREE.Vector3(1, 3, -8),
        new THREE.Vector3(4, 4.5, -10)
    ]), []);

    return (
        <group>
            <mesh>
                <tubeGeometry args={[curve1, 20, 0.02, 8, false]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            <mesh>
                <tubeGeometry args={[curve2, 20, 0.03, 8, false]} />
                <meshStandardMaterial color="#000000" roughness={0.9} />
            </mesh>
        </group>
    );
}

function NeonSign({ text, position, color, rotation = [0, 0, 0], size = 1, flicker = false }: any) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current || !flicker) return;
        // Cyber flicker: random drops
        const t = clock.getElapsedTime();
        if (Math.random() > 0.95) {
            ref.current.visible = !ref.current.visible;
        } else {
            ref.current.visible = true;
        }
    });

    return (
        <group position={position} rotation={rotation}>
            <Text
                ref={ref}
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                fontSize={0.5 * size}
                color={color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02 * size}
                outlineColor={color}
                outlineBlur={0.2} // Glow effect
            >
                {text}
                <meshBasicMaterial color={color} toneMapped={false} />
            </Text>
            {/* Backing plate */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[text.length * 0.3 * size, 0.8 * size]} />
                <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Fake Volumetric Glow */}
            <mesh position={[0, 0, 0.1]}>
                <planeGeometry args={[text.length * 0.4 * size, 1.0 * size]} />
                <meshBasicMaterial color={color} transparent opacity={0.02} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
}

function ACUnit({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.6, 0.4]} />
                <meshStandardMaterial color="#555" roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.21]}>
                <circleGeometry args={[0.25, 16]} />
                <meshStandardMaterial color="#222" />
            </mesh>
        </group>
    );
}

function UpperCityLayer() {
    // Dense verticality
    return (
        <group position={[0, 6, 0]}>
            {/* Left Balconies */}
            <mesh position={[-3.8, 0, -5]} receiveShadow>
                <boxGeometry args={[1, 0.2, 4]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[-3.8, 3, -8]} receiveShadow>
                <boxGeometry args={[1, 0.2, 4]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            {/* Right Pipes */}
            <mesh position={[3.8, 1, -6]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 10]} />
                <meshStandardMaterial color="#444" roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[3.6, 2, -6]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 10]} />
                <meshStandardMaterial color="#333" roughness={0.3} metalness={0.6} />
            </mesh>

            {/* AC Units Clutter */}
            <ACUnit position={[-3.6, 1, -4]} />
            <ACUnit position={[-3.6, 4, -7]} />
            <ACUnit position={[3.6, -1, -9]} />
        </group>
    );
}

function Lantern({ position, color, delay = 0 }: { position: [number, number, number], color: string, delay?: number }) {
    const group = useRef<THREE.Group>(null);
    const light = useRef<THREE.PointLight>(null);

    useFrame(({ clock }) => {
        if (!group.current || !light.current) return;
        const t = clock.getElapsedTime() + delay;
        // Breeze
        group.current.rotation.z = Math.sin(t * 1.0) * 0.05;
        group.current.rotation.x = Math.cos(t * 0.8) * 0.02;

        // Flicker
        light.current.intensity = 2 + Math.sin(t * 10) * 0.1 + Math.cos(t * 23) * 0.1;
    });

    return (
        <group ref={group} position={position}>
            {/* Rope */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 1]} />
                <meshBasicMaterial color="#000" />
            </mesh>
            {/* Lantern Body */}
            <mesh position={[0, -0.2, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.1, 0.4, 6]} />
                <meshStandardMaterial color="#884400" emissive="#ff4400" emissiveIntensity={0.2} roughness={0.6} />
            </mesh>
            {/* Light Source */}
            <pointLight ref={light} color={color} distance={18} decay={2} castShadow shadow-bias={-0.001} />

            {/* Fake Volumetric Glow / God Ray Cone */}
            <mesh position={[0, -1.0, 0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.8, 2.5, 32, 1, true]} />
                <meshBasicMaterial color={color} transparent opacity={0.01} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
            {/* Central Hotspot */}
            <mesh position={[0, -0.3, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
}

function DustSystem() {
    // Subtle motes
    const count = 200; // Increased density
    return (
        <Instances range={count}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshBasicMaterial color="#88aaff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
            {Array.from({ length: count }).map((_, i) => (
                <Float key={i} speed={0.5} rotationIntensity={1} floatIntensity={2} floatingRange={[-1, 1]}>
                    <group position={[
                        (Math.random() - 0.5) * 10,
                        (Math.random()) * 5 + 0.5, // Higher fog
                        (Math.random() - 0.5) * 20 - 5
                    ]}>
                        <Instance />
                    </group>
                </Float>
            ))}
        </Instances>
    );
}

function Beams() {
    return (
        <group>
            {[0, -4, -8, -12].map((z, i) => (
                <mesh key={i} position={[0, 4, z]} rotation={[0, 0, 0]} receiveShadow castShadow>
                    <boxGeometry args={[10, 0.2, 0.2]} />
                    <meshStandardMaterial color="#3d2914" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

function HangingBanner({ position, rotation, color }: { position: [number, number, number], rotation?: [number, number, number], color: string }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime();
        ref.current.rotation.z = (rotation?.[2] || 0) + Math.sin(t * 2 + position[0]) * 0.05;
    });

    return (
        <group position={position} rotation={rotation ? new THREE.Euler(...rotation) : new THREE.Euler()}>
            <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 1.2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh ref={ref} position={[0, 0, 0]}>
                <planeGeometry args={[1, 1.5, 5, 5]} />
                <LayerMaterial lighting="physical" transmission={0} side={THREE.DoubleSide}>
                    <Depth colorA={color} colorB="#000000" alpha={1} mode="normal" near={0} far={2} origin={[0, 0, 0]} />
                    <Noise mapping="local" type="cell" scale={0.5} mode="softlight" alpha={0.5} colorA="#ffffff" colorB="#000000" />
                </LayerMaterial>
            </mesh>
        </group>
    );
}

function HangingBulb({ position, color = "#ffaa00", intensity = 1 }: { position: [number, number, number], color?: string, intensity?: number }) {
    const group = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!group.current) return;
        // Sway
        group.current.rotation.z = Math.sin(clock.getElapsedTime() * 2 + position[0]) * 0.05;
    });

    return (
        <group ref={group} position={position}>
            {/* Wire */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 1]} />
                <meshBasicMaterial color="#111" />
            </mesh>
            {/* Socket */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.1]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            {/* Bulb */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
            </mesh>
            <pointLight distance={15} decay={2} color={color} intensity={intensity} castShadow />
            {/* Glow Sprite */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshBasicMaterial color={color} transparent opacity={0.03} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function StallLamp({ position, rotation = [0, 0, 0], color = "#ddffaa" }: { position: [number, number, number], rotation?: [number, number, number], color?: string }) {
    return (
        <group position={position} rotation={new THREE.Euler(...rotation)}>
            {/* Base */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.1, 0.15, 0.1]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            {/* Stem */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.6]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Shade */}
            <mesh position={[0, 0.6, 0.1]} rotation={[0.5, 0, 0]}>
                <coneGeometry args={[0.15, 0.3, 16, 1, true]} />
                <meshStandardMaterial color="#444" side={THREE.DoubleSide} />
            </mesh>
            {/* Bulb */}
            <mesh position={[0, 0.55, 0.1]} rotation={[0.5, 0, 0]}>
                <sphereGeometry args={[0.05]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>
            <spotLight position={[0, 0.6, 0.1]} target-position={[0, 0, 1]} angle={0.6} penumbra={0.5} intensity={4} distance={15} color={color} castShadow />
        </group>
    );
}

function FloorGlow({ position, color = "#0055ff", length = 2 }: { position: [number, number, number], color?: string, length?: number }) {
    return (
        <group position={position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[0.1, length]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 0.2, 0]} distance={8} decay={1.5} color={color} intensity={0.5} />
        </group>
    );
}

export default function Environment() {
    return (
        <group>
            {/* Wet Ground - High Metalness/Roughness adjustments */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 60]} />
                <LayerMaterial lighting="physical" color="#050505" roughness={0.2} metalness={0.6}>
                    <Depth colorA="#000000" colorB="#111116" alpha={1} mode="normal" near={0} far={10} origin={[0, 0, 0]} />
                    <Noise mapping="local" type="cell" scale={0.6} mode="overlay" alpha={0.2} />
                    <Noise mapping="local" type="perlin" scale={0.3} mode="add" alpha={0.1} />
                </LayerMaterial>
            </mesh>

            {/* Towering Alley Walls */}
            <mesh position={[-4, 8, -10]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[40, 20]} />
                <LayerMaterial lighting="standard" color="#1a1a1a" roughness={0.7} metalness={0.3}>
                    <Depth colorA="#0a0a0a" colorB="#202020" alpha={1} mode="normal" near={0} far={15} origin={[0, -5, 0]} />
                </LayerMaterial>
            </mesh>
            <mesh position={[4, 8, -10]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[40, 20]} />
                <LayerMaterial lighting="standard" color="#1a1a1a" roughness={0.7} metalness={0.3}>
                    <Depth colorA="#0a0a0a" colorB="#202020" alpha={1} mode="normal" near={0} far={15} origin={[0, -5, 0]} />
                </LayerMaterial>
            </mesh>

            <UpperCityLayer />

            {/* Neon Signage Cluster */}
            <NeonSign text="MARKET" position={[-3.5, 4, -5]} rotation={[0, Math.PI / 2, 0]} color="#ff0055" size={2} />
            <NeonSign text="OPEN" position={[-3.5, 3, -5]} rotation={[0, Math.PI / 2, 0]} color="#00ff55" size={1} flicker />
            <NeonSign text="CYBER" position={[3.5, 5, -8]} rotation={[0, -Math.PI / 2, 0]} color="#0088ff" size={1.5} />
            <NeonSign text="NO DATA" position={[3.5, 3.5, -3]} rotation={[0, -Math.PI / 2, 0]} color="#ffaa00" size={0.8} />

            {/* Overhead Cables (Dense) */}
            <Cables />

            {/* --- MOTIVATED LIGHTING --- */}

            {/* Rhythm: Hanging Bulbs down the center */}
            {[-2, -5, -8, -11, -14].map((z, i) => (
                <HangingBulb key={`bulb-${z}`} position={[Math.sin(z) * 0.5, 3.5, z]} color="#ffaa55" intensity={2} />
            ))}

            {/* Lanterns - Warmth details - Spaced out */}
            <Lantern position={[-2.5, 2.5, -3]} color="#ff6600" />
            <Lantern position={[2.5, 2.8, -7]} color="#ff4400" delay={2} />
            <Lantern position={[-2.5, 2.2, -10]} color="#ff5500" delay={1} />

            {/* Stall Lamps - practical task lighting on crates/stalls */}
            <StallLamp position={[-2.5, 1.0, -1]} rotation={[0, -0.5, 0]} color="#aaffaa" />
            <StallLamp position={[2.5, 1.0, -9]} rotation={[0, 2.5, 0]} color="#ffaaaa" />

            {/* Floor Glows - Guiding lines */}
            <FloorGlow position={[-3.8, 0, -5]} color="#00ffff" length={10} />
            <FloorGlow position={[3.8, 0, -8]} color="#ff00ff" length={8} />

            {/* Banners */}
            <HangingBanner position={[-2.8, 2.5, -3]} rotation={[0, Math.PI / 2, 0]} color="#551111" />
            <HangingBanner position={[2.8, 2.5, -6]} rotation={[0, -Math.PI / 2, 0]} color="#112233" />

            {/* Clutter / Crates */}
            <mesh position={[-2.5, 0.5, -1]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 1, 0.8]} />
                <meshStandardMaterial color="#3d2914" />
            </mesh>

            <Beams />
            <DustSystem />
        </group>
    );
}
