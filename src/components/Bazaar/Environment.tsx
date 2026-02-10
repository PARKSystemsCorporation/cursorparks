import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Instance, Instances, Float } from "@react-three/drei";

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
            {/* Light */}
            <pointLight ref={light} color={color} distance={6} decay={2} castShadow shadow-bias={-0.001} />
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
                <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
            </mesh>
        </group>
    );
}

function DustSystem() {
    // Subtle motes
    const count = 150;
    return (
        <Instances range={count}>
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshBasicMaterial color="#aaa" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
            {Array.from({ length: count }).map((_, i) => (
                <Float key={i} speed={0.5} rotationIntensity={1} floatIntensity={2} floatingRange={[-1, 1]}>
                    <group position={[
                        (Math.random() - 0.5) * 8,
                        (Math.random()) * 3 + 0.5,
                        (Math.random() - 0.5) * 15 - 5
                    ]}>
                        <Instance />
                    </group>
                </Float>
            ))}
        </Instances>
    );
}

export default function Environment() {
    return (
        <group>
            {/* Ground - Physical wet cobblestone feel */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 60]} />
                <meshStandardMaterial
                    color="#1a1816"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* Narrow Alley Walls */}
            <mesh position={[-3.5, 4, -10]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[40, 8]} />
                <meshStandardMaterial color="#222020" roughness={0.9} />
            </mesh>
            <mesh position={[3.5, 4, -10]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[40, 8]} />
                <meshStandardMaterial color="#222020" roughness={0.9} />
            </mesh>

            {/* Props */}
            <Cables />
            <Beams />

            {/* Lanterns - Light Sources */}
            <Lantern position={[-2, 2.5, -2]} color="#ffaa00" delay={0} />
            <Lantern position={[2, 2.5, -5]} color="#ff9000" delay={2} />
            <Lantern position={[-2, 2.5, -9]} color="#ffbb00" delay={1} />
            <Lantern position={[0, 2.8, -12]} color="#ffaa00" delay={3} />

            {/* Banners */}
            <HangingBanner position={[-2.8, 2.5, -3]} rotation={[0, Math.PI / 2, 0]} color="#551111" />
            <HangingBanner position={[2.8, 2.5, -6]} rotation={[0, -Math.PI / 2, 0]} color="#112233" />

            {/* Clutter / Crates */}
            <mesh position={[-2.5, 0.5, -1]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 1, 0.8]} />
                <meshStandardMaterial color="#3d2914" />
            </mesh>

            <DustSystem />
        </group>
    );
}
