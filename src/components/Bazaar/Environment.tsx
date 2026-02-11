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

function POVLight() {
    const ref = useRef<THREE.Group>(null);
    useFrame(({ camera }) => {
        if (!ref.current) return;
        // Follow camera with slight offset
        ref.current.position.copy(camera.position);
        ref.current.position.y += 0.2; // Shoulder height
        ref.current.position.z += 0.1;
    });

    return (
        <group ref={ref}>
            <pointLight distance={10} decay={2} intensity={1} color="#ddeeff" />
        </group>
    );
}

function WindowGrid() {
    // 3 Stories of windows on left and right
    const windows = [];
    const stories = [5, 10, 15]; // Heights
    const zLocations = [-2, -8, -14];

    // Left Wall Windows
    for (let y of stories) {
        for (let z of zLocations) {
            windows.push(
                <mesh key={`l-${y}-${z}`} position={[-4.1, y, z]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[1.5, 2]} />
                    <meshStandardMaterial color="#ffaa55" emissive="#ffddaa" emissiveIntensity={1.5 + Math.random()} toneMapped={false} />
                </mesh>
            )
            windows.push(
                <mesh key={`r-${y}-${z}`} position={[4.1, y, z]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[1.5, 2]} />
                    <meshStandardMaterial color="#55aaff" emissive="#aaddee" emissiveIntensity={1.5 + Math.random()} toneMapped={false} />
                </mesh>
            )
        }
    }

    return <group>{windows}</group>;
}

function WallBlock({ position, size, rotation = [0, 0, 0] }: { position: [number, number, number], size: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <mesh position={position} rotation={new THREE.Euler(...rotation)} receiveShadow castShadow>
            <boxGeometry args={size} />
            <LayerMaterial lighting="standard" color="#1a1a1a" roughness={0.8} metalness={0.4}>
                <Depth colorA="#111" colorB="#333" alpha={1} mode="normal" near={0} far={15} origin={[0, -5, 0]} />
                <Noise mapping="local" type="cell" scale={0.5} mode="overlay" alpha={0.1} />
            </LayerMaterial>
        </mesh>
    );
}

function VendorStall({ position, rotationY = 0 }: { position: [number, number, number], rotationY?: number }) {
    // A stall is a "hole" so we build around it, OR we place the interior clutter props.
    // Ideally, the main wall logic handles the hole, this component handles the interior.

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Interior Back Wall */}
            <mesh position={[0, 1.5, -1.8]}>
                <planeGeometry args={[3.8, 3]} />
                <meshStandardMaterial color="#222" roughness={0.8} />
            </mesh>
            {/* Ceiling */}
            <mesh position={[0, 3, -1]}>
                <boxGeometry args={[3.8, 0.1, 2]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Counter */}
            <mesh position={[0, 0.5, 0.5]} castShadow receiveShadow>
                <boxGeometry args={[3.5, 1, 0.8]} />
                <meshStandardMaterial color="#442211" roughness={0.6} />
            </mesh>
            {/* Counter LED Strip */}
            <mesh position={[0, 0.9, 0.91]}>
                <planeGeometry args={[3.5, 0.05]} />
                <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </mesh>

            {/* Shelves */}
            <mesh position={[0, 1.5, -1.7]}>
                <boxGeometry args={[3.6, 0.1, 0.5]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 2.2, -1.7]}>
                <boxGeometry args={[3.6, 0.1, 0.5]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Shelf LED Strips */}
            <mesh position={[0, 1.45, -1.45]}>
                <planeGeometry args={[3.6, 0.02]} />
                <meshBasicMaterial color="#ff00ff" toneMapped={false} />
            </mesh>
            <mesh position={[0, 2.15, -1.45]}>
                <planeGeometry args={[3.6, 0.02]} />
                <meshBasicMaterial color="#ffaa00" toneMapped={false} />
            </mesh>

            {/* Interior Light - contained */}
            <pointLight position={[0, 2.5, -0.5]} distance={5} decay={2} intensity={2} color="#ccaaff" />

            {/* Clutter - Random boxes */}
            <mesh position={[-1, 1.7, -1.6]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[0.4, 0.3, 0.3]} />
                <meshStandardMaterial color="#555" />
            </mesh>
            <mesh position={[0.5, 1.7, -1.6]} rotation={[0, -0.1, 0]}>
                <boxGeometry args={[0.3, 0.5, 0.3]} />
                <meshStandardMaterial color="#777" />
            </mesh>
            <mesh position={[1.2, 0.6, -1.0]} rotation={[0, 0.5, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#332211" />
            </mesh>
        </group>
    );
}

function ConstructedWalls() {
    // Manually place wall blocks to leave holes for vendors
    // Vendors are at: 
    // Broker: [-2.5, 0, -2.5] -> Hole on LEFT at Z ~ -2.5
    // Barker: [2.5, 0, -5] -> Hole on RIGHT at Z ~ -5
    // Gamemaster: [-2.5, 0, -9] -> Hole on LEFT at Z ~ -9
    // Gatekeeper: [0, 0, -14] -> End of hall (handled separately)

    return (
        <group>
            {/* --- LEFT WALL (x = -4) --- */}
            {/* Pre-Broker Segment */}
            <WallBlock position={[-4, 4, 1.5]} size={[2, 8, 8]} />
            {/* Broker Hole is roughly z=-1 to -4 */}
            {/* Post-Broker / Pre-Gamemaster Segment */}
            <WallBlock position={[-4, 4, -6]} size={[2, 8, 4]} />

            {/* Gamemaster Hole CLOSED for Market Cart */}
            <WallBlock position={[-4, 4, -10.5]} size={[2, 8, 5]} />

            {/* Post-Gamemaster Segment */}
            <WallBlock position={[-4, 4, -15]} size={[2, 8, 4]} /> {/* Adjusted size to fit */}

            {/* Upper fill above stalls */}
            <WallBlock position={[-4, 7, -2.5]} size={[2, 4, 4]} /> {/* Above Broker */}
            {/* Gamemaster upper fill merged into wall block since hole is closed */}


            {/* --- RIGHT WALL (x = 4) --- */}
            {/* Pre-Barker Segment */}
            <WallBlock position={[4, 4, 0]} size={[2, 8, 10]} />
            {/* Barker Hole is roughly z=-3 to -7 */}
            {/* Post-Barker Segment */}
            <WallBlock position={[4, 4, -13]} size={[2, 8, 16]} />
            {/* Upper fill above stalls */}
            <WallBlock position={[4, 7, -5]} size={[2, 4, 4]} /> {/* Above Barker */}

            {/* --- BACK WALL --- */}
            <WallBlock position={[0, 6, -18]} size={[12, 12, 2]} />
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
            {/* Light Source - No Shadow for GPU Perf */}
            <pointLight ref={light} color={color} distance={18} decay={2} />

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

function ProtrudingSign({ position, text, color = "#ff00ff" }: any) {
    return (
        <group position={position}>
            {/* Mounting Arm */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.8, 0.1, 0.1]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            {/* Sign Box */}
            <mesh position={[0.6, -0.2, 0]}>
                <boxGeometry args={[0.8, 0.4, 0.15]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            {/* LED Text Front */}
            <Text
                position={[0.6, -0.2, 0.08]}
                fontSize={0.25}
                color={color}
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                anchorX="center"
                anchorY="middle"
            >
                {text}
                <meshBasicMaterial color={color} toneMapped={false} />
            </Text>
            {/* LED Text Back */}
            <Text
                position={[0.6, -0.2, -0.08]}
                rotation={[0, Math.PI, 0]}
                fontSize={0.25}
                color={color}
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                anchorX="center"
                anchorY="middle"
            >
                {text}
                <meshBasicMaterial color={color} toneMapped={false} />
            </Text>
            {/* Glow */}
            <pointLight position={[0.6, -0.2, 0]} distance={3} intensity={2} color={color} />
        </group>
    );
}

function MarketCart({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <group position={position} rotation={new THREE.Euler(...rotation)}>
            {/* Cart Base */}
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.8, 1]} />
                <meshStandardMaterial color="#5d4037" roughness={0.8} />
            </mesh>
            {/* Wheels */}
            <mesh position={[-0.6, 0.2, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.6, 0.2, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Posts */}
            <mesh position={[-0.7, 1.5, 0.4]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            <mesh position={[0.7, 1.5, 0.4]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            <mesh position={[-0.7, 1.5, -0.4]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            <mesh position={[0.7, 1.5, -0.4]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>

            {/* Canvas Roof (Pyramid/Tilted) */}
            <mesh position={[0, 2.4, 0]}>
                <coneGeometry args={[1.3, 0.8, 4]} />
                <meshStandardMaterial color="#2e3c50" roughness={1} side={THREE.DoubleSide} />
            </mesh>

            {/* Steam Emitter (Simple Particles) */}
            <Instances range={10}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="#fff" transparent opacity={0.3} />
                {Array.from({ length: 10 }).map((_, i) => (
                    <Float key={i} speed={2} rotationIntensity={0} floatIntensity={5} floatingRange={[1, 3]}>
                        <group position={[(Math.random() - 0.5) * 0.5, 1, 0]}>
                            <Instance />
                        </group>
                    </Float>
                ))}
            </Instances>

            {/* Food Props */}
            <mesh position={[0.2, 0.85, 0.2]}>
                <boxGeometry args={[0.3, 0.1, 0.3]} />
                <meshStandardMaterial color="#ff5722" />
            </mesh>
            <mesh position={[-0.2, 0.85, -0.1]}>
                <cylinderGeometry args={[0.1, 0.15, 0.2]} />
                <meshStandardMaterial color="#795548" />
            </mesh>

            {/* Integrated Light */}
            <pointLight position={[0, 1.8, 0]} intensity={2} color="#ffab91" distance={5} />
        </group>
    );
}

function MetalBeam() {
    return (
        <group position={[0, 3, -5]}>
            {/* The Beam - Spanning Right to Left */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.15, 0.15, 20]} />
                <meshStandardMaterial color="#222" roughness={0.4} metalness={0.8} />
            </mesh>

            {/* The LED Strip Housing */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.16, 0]}>
                <boxGeometry args={[0.3, 18, 0.05]} />
                <meshStandardMaterial color="#111" />
            </mesh>

            {/* The Light Source (Pink/Blue hue) */}
            {/* We use a series of point lights to simulate a linear LED strip since RectAreaLight can be heavy/complex */}

            {/* Main Downward Spot for "Extend to ground" effect - Pink/Blue mix (Purple-ish) */}
            <spotLight
                position={[0, -0.2, 0]}
                color="#bb88ff"
                intensity={10}
                distance={20}
                angle={1.0}
                penumbra={0.5}
                castShadow
            />

            {/* Volumetric Beam Simulation */}
            <mesh position={[0, -5, 0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[2, 10, 32, 1, true]} />
                <meshBasicMaterial
                    color="#bb88ff"
                    transparent
                    opacity={0.03}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Subtle linear glow along the beam */}
            <pointLight position={[-5, -0.5, 0]} color="#0088ff" intensity={2} distance={8} decay={2} />
            <pointLight position={[5, -0.5, 0]} color="#ff44aa" intensity={2} distance={8} decay={2} />
        </group>
    );
}

export default function Environment() {
    return (
        <group>
            {/* Wet Ground - High Metalness/Roughness adjustments */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 60]} />
                <LayerMaterial lighting="physical" color="#050505" roughness={0.7} metalness={0.2}>
                    <Depth colorA="#000000" colorB="#111116" alpha={1} mode="normal" near={0} far={10} origin={[0, 0, 0]} />
                    <Noise mapping="local" type="cell" scale={0.6} mode="overlay" alpha={0.2} />
                    <Noise mapping="local" type="perlin" scale={0.3} mode="add" alpha={0.1} />
                </LayerMaterial>
            </mesh>

            {/* Replaced procedural walls with Constructed Stalls */}
            <ConstructedWalls />
            <WindowGrid />
            <POVLight />

            {/* Vendor Stalls Interiors - Matched to Vendor Positions */}
            <VendorStall position={[-3.8, 0, -2.5]} rotationY={Math.PI / 2} /> {/* Broker */}
            <VendorStall position={[3.8, 0, -5]} rotationY={-Math.PI / 2} /> {/* Barker */}

            {/* Back Left - Converted to Market Cart */}
            <MarketCart position={[-2.5, 0, -9]} rotation={[0, 0.5, 0]} />

            <UpperCityLayer />

            {/* Neon Signage Cluster */}
            <NeonSign text="MARKET" position={[-3.5, 4, -5]} rotation={[0, Math.PI / 2, 0]} color="#ff0055" size={2} />
            <ProtrudingSign text="NOODLES" position={[-3.8, 3.5, -8]} color="#00ffaa" />
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

            {/* New Industrial Beam with LED */}
            <MetalBeam />

            {/* Removed DustSystem for optimization */}
        </group>
    );
}
