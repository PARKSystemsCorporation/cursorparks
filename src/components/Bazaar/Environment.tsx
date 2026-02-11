import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Instance, Instances, Float, Text } from "@react-three/drei";
import { LayerMaterial, Depth, Noise } from "lamina";
import { useBazaarMaterials } from "./BazaarMaterials";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";
import NeonImageSign from "./NeonImageSign";
import LedBar from "./LedBar";
import { AlleyEndingPortal } from "./AlleyEnding";

// --- SHARED MATERIALS (created once, reused across all components) ---
const MAT_DARK = new THREE.MeshStandardMaterial({ color: "#222" });
const MAT_DARKER = new THREE.MeshStandardMaterial({ color: "#333" });
const MAT_BLACK = new THREE.MeshStandardMaterial({ color: "#111" });
const MAT_METAL_GREY = new THREE.MeshStandardMaterial({ color: "#444", roughness: 0.3, metalness: 0.6 });
const MAT_METAL_DARK = new THREE.MeshStandardMaterial({ color: "#555", roughness: 0.6, metalness: 0.4 });

// Fabric colors for blankets / clothes (middle-eastern bazaar)
const FABRIC_COLORS = ["#8B4513", "#654321", "#a0522d", "#cd853f", "#6b4423", "#4a3728", "#8b6914", "#5c4033"];

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
        ref.current.position.copy(camera.position);
        ref.current.position.y += 0.2;
        ref.current.position.z += 0.1;
    });
    if (PRACTICAL_LIGHT_INTENSITY === 0) return null;
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

    // Left Wall Windows (Original)
    for (const y of stories) {
        for (const z of zLocations) {
            windows.push(
                <mesh key={`l-${y}-${z}`} position={[-4.1, y, z]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[1.5, 2]} />
                    <meshStandardMaterial color="#ffaa55" emissive="#ffddaa" emissiveIntensity={(1.5 + Math.random()) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} toneMapped={EMISSIVE_SCALE === 0} />
                </mesh>
            )
            windows.push(
                <mesh key={`r-${y}-${z}`} position={[4.1, y, z]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[1.5, 2]} />
                    <meshStandardMaterial color="#55aaff" emissive="#aaddee" emissiveIntensity={(1.5 + Math.random()) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} toneMapped={EMISSIVE_SCALE === 0} />
                </mesh>
            )
        }
    }

    // --- NEW WINDOWS ---

    // 1. Right side - Immediate (Start 1 story high aka ~2.5, go higher)
    const rightImmediateStories = [2.5, 5.5, 8.5, 11.5];
    const rightImmediateZ = [-1, 1]; // Close to camera (z=6 is camera, 0 is start)

    for (const y of rightImmediateStories) {
        for (const z of rightImmediateZ) {
            windows.push(
                <mesh key={`r-new-${y}-${z}`} position={[4.1, y, z]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[1.2, 1.8]} />
                    <meshStandardMaterial color="#00ffaa" emissive="#aaffcc" emissiveIntensity={(2 + Math.random()) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} toneMapped={EMISSIVE_SCALE === 0} />
                </mesh>
            )
        }
    }

    // 2. Left side - Further down (z < -14)
    const leftFarStories = [2.5, 5.5, 8.5, 11.5];
    // Row 1: Further down (~ -17)
    // Row 2: After that (~ -21)
    const leftFarZ = [-17, -21];

    for (const y of leftFarStories) {
        for (const z of leftFarZ) {
            windows.push(
                <mesh key={`l-new-${y}-${z}`} position={[-4.1, y, z]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[1.2, 1.8]} />
                    <meshStandardMaterial color="#ff5555" emissive="#ffaaaa" emissiveIntensity={(2 + Math.random()) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} toneMapped={EMISSIVE_SCALE === 0} />
                </mesh>
            )
        }
    }

    return <group>{windows}</group>;
}

// Makeshift window ACs (subset of window positions for variety)
const WINDOW_AC_POSITIONS: { x: number; y: number; z: number; tilt?: number }[] = [
    { x: -4.05, y: 5, z: -2 }, { x: 4.05, y: 10, z: -8 }, { x: -4.05, y: 15, z: -14 },
    { x: 4.05, y: 2.5, z: -1 }, { x: -4.05, y: 8.5, z: 1 }, { x: 4.05, y: 11.5, z: -14 },
    { x: -4.05, y: 5.5, z: -17 }, { x: 4.05, y: 3, z: -5 },
];

function WindowAC({ x, y, z, tilt = 0 }: { x: number; y: number; z: number; tilt?: number }) {
    const isLeft = x < 0;
    const rotY = isLeft ? Math.PI / 2 : -Math.PI / 2;
    return (
        <group position={[x, y, z]} rotation={[tilt, rotY, 0]}>
            <mesh castShadow material={MAT_METAL_DARK}>
                <boxGeometry args={[0.5, 0.35, 0.28]} />
            </mesh>
            <mesh position={[0, 0, 0.15]} material={MAT_DARK}>
                <circleGeometry args={[0.12, 12]} />
            </mesh>
        </group>
    );
}

function WindowACs() {
    return (
        <group>
            {WINDOW_AC_POSITIONS.map((p, i) => (
                <WindowAC key={i} x={p.x} y={p.y} z={p.z} tilt={p.tilt ?? (i % 3 === 0 ? 0.04 : 0)} />
            ))}
        </group>
    );
}

function HangingBlanket({ y, z, width, height, color }: { y: number; z: number; width: number; height: number; color: string }) {
    return (
        <group position={[0, y, z]}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.015, 0.015, 7.6, 8]} />
                <meshStandardMaterial color="#2a2520" roughness={0.9} />
            </mesh>
            <mesh position={[0, -height / 2, 0]} rotation={[0, 0, Math.PI / 2]} receiveShadow castShadow>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

const BLANKET_LINES = [
    { y: 3.2, z: -4, w: 2.2, h: 1.4 },
    { y: 2.6, z: -9, w: 2.6, h: 1.1 },
    { y: 3.8, z: -12, w: 1.8, h: 1.5 },
    { y: 2.2, z: -6, w: 2.4, h: 1.2 },
];

function HangingBlankets() {
    return (
        <group>
            {BLANKET_LINES.map((line, i) => (
                <HangingBlanket
                    key={i}
                    y={line.y}
                    z={line.z}
                    width={line.w}
                    height={line.h}
                    color={FABRIC_COLORS[i % FABRIC_COLORS.length]}
                />
            ))}
        </group>
    );
}

function Clothesline({ y, z }: { y: number; z: number }) {
    const clothes = useMemo(() => [
        { x: -2.2, type: "shirt" as const, rot: 0.1 },
        { x: 0, type: "pants" as const, rot: -0.05 },
        { x: 2.1, type: "towel" as const, rot: 0.08 },
        { x: -0.8, type: "shirt" as const, rot: -0.12 },
        { x: 1.4, type: "towel" as const, rot: 0.06 },
    ], []);
    return (
        <group position={[0, y, z]}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.01, 0.01, 7.6, 6]} />
                <meshStandardMaterial color="#1a1a1a" roughness={1} />
            </mesh>
            {clothes.map((c, i) => (
                <group key={i} position={[c.x, -0.15, 0]} rotation={[0, 0, c.rot]}>
                    {c.type === "shirt" && (
                        <>
                            <mesh castShadow material={MAT_DARKER}>
                                <boxGeometry args={[0.35, 0.45, 0.04]} />
                            </mesh>
                            <mesh position={[-0.18, -0.2, 0]} material={MAT_DARK}>
                                <boxGeometry args={[0.12, 0.25, 0.03]} />
                            </mesh>
                            <mesh position={[0.18, -0.2, 0]} material={MAT_DARK}>
                                <boxGeometry args={[0.12, 0.25, 0.03]} />
                            </mesh>
                        </>
                    )}
                    {c.type === "pants" && (
                        <>
                            <mesh position={[-0.1, -0.35, 0]} castShadow material={MAT_DARKER}>
                                <boxGeometry args={[0.15, 0.5, 0.04]} />
                            </mesh>
                            <mesh position={[0.1, -0.35, 0]} castShadow material={MAT_DARKER}>
                                <boxGeometry args={[0.15, 0.5, 0.04]} />
                            </mesh>
                        </>
                    )}
                    {c.type === "towel" && (
                        <mesh castShadow receiveShadow>
                            <planeGeometry args={[0.5, 0.35]} />
                            <meshStandardMaterial color={FABRIC_COLORS[(i + 2) % FABRIC_COLORS.length]} roughness={0.9} side={THREE.DoubleSide} />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
}

const CLOTHESLINE_POSITIONS = [
    { y: 2.8, z: -3 },
    { y: 3.4, z: -7 },
    { y: 2.4, z: -11 },
    { y: 3.0, z: -15 },
];

function Clotheslines() {
    return (
        <group>
            {CLOTHESLINE_POSITIONS.map((p, i) => (
                <Clothesline key={i} y={p.y} z={p.z} />
            ))}
        </group>
    );
}

function WallBlock({ position, size, rotation = [0, 0, 0] }: { position: [number, number, number], size: [number, number, number], rotation?: [number, number, number] }) {
    const { concreteWall } = useBazaarMaterials();
    return (
        <mesh position={position} rotation={new THREE.Euler(...rotation)} receiveShadow castShadow material={concreteWall}>
            <boxGeometry args={size} />
        </mesh>
    );
}

function InternalVendorWall({ position, rotationY = 0 }: { position: [number, number, number], rotationY?: number }) {
    const { metalPanel, concreteWall } = useBazaarMaterials();
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* --- SHELL (Recessed Box) --- */}
            {/* Back Wall */}
            <mesh position={[0, 1.5, -1.8]} receiveShadow material={metalPanel}>
                <boxGeometry args={[3.8, 3, 0.2]} />
            </mesh>
            {/* Ceiling */}
            <mesh position={[0, 3, -0.5]} material={metalPanel}>
                <boxGeometry args={[3.8, 0.2, 3]} />
            </mesh>
            {/* Floor */}
            <mesh position={[0, 0.1, -0.5]} material={concreteWall}>
                <boxGeometry args={[3.8, 0.2, 3]} />
            </mesh>
            {/* Side Walls */}
            <mesh position={[-1.9, 1.5, -0.5]} material={metalPanel}>
                <boxGeometry args={[0.2, 3, 3]} />
            </mesh>
            <mesh position={[1.9, 1.5, -0.5]} material={metalPanel}>
                <boxGeometry args={[0.2, 3, 3]} />
            </mesh>

            {/* --- INTERIOR --- */}
            {/* Main Counter - Angled/Tech */}
            <mesh position={[0, 0.6, 0.6]} castShadow receiveShadow>
                <boxGeometry args={[3.6, 1.2, 0.8]} />
                <meshStandardMaterial color="#2d1b2e" roughness={0.5} metalness={0.6} />
            </mesh>
            {/* Counter strip (paint/plastic in day, glow at night) */}
            <mesh position={[0, 1.1, 1.01]}>
                <planeGeometry args={[3.6, 0.05]} />
                <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={EMISSIVE_SCALE} />
            </mesh>

            {/* Back Shelves/Tech */}
            <mesh position={[-1, 1.8, -1.6]} material={metalPanel}>
                <boxGeometry args={[1.5, 0.1, 0.4]} />
            </mesh>
            <mesh position={[1, 2.2, -1.6]} material={metalPanel}>
                <boxGeometry args={[1.5, 0.1, 0.4]} />
            </mesh>

            {/* Overhead strip */}
            <mesh position={[0, 2.9, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.5, 0.2]} />
                <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={EMISSIVE_SCALE} transparent opacity={0.8 + 0.2 * (1 - EMISSIVE_SCALE)} />
            </mesh>
            {EMISSIVE_SCALE > 0 && (
                <mesh position={[0, 1.5, 0.5]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[3.5, 2.5, 0.1]} />
                    <meshBasicMaterial color="#ff0055" transparent opacity={0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
                </mesh>
            )}

            {/* Clutter */}
            <mesh position={[1.2, 1.25, 0.6]} rotation={[0, -0.2, 0]}>
                <boxGeometry args={[0.4, 0.1, 0.4]} />
                <meshStandardMaterial color="#111" />
            </mesh>
        </group>
    );
}

function VendorStall({ position, rotationY = 0 }: { position: [number, number, number], rotationY?: number }) {
    // A stall is a "hole" so we build around it, OR we place the interior clutter props.
    // Ideally, the main wall logic handles the hole, this component handles the interior.
    const { woodCrate, metalPanel, concreteWall } = useBazaarMaterials();

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Interior Back Wall */}
            <mesh position={[0, 1.5, -1.8]} material={concreteWall}>
                <planeGeometry args={[3.8, 3]} />
            </mesh>
            {/* Ceiling */}
            <mesh position={[0, 3, -1]} material={concreteWall}>
                <boxGeometry args={[3.8, 0.1, 2]} />
            </mesh>

            {/* Counter */}
            <mesh position={[0, 0.5, 0.5]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[3.5, 1, 0.8]} />
            </mesh>
            {/* Counter LED strip */}
            <mesh position={[0, 0.9, 0.91]}>
                <planeGeometry args={[3.5, 0.05]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={EMISSIVE_SCALE} />
            </mesh>

            {/* Shelves */}
            <mesh position={[0, 1.5, -1.7]} material={metalPanel}>
                <boxGeometry args={[3.6, 0.1, 0.5]} />
            </mesh>
            <mesh position={[0, 2.2, -1.7]} material={metalPanel}>
                <boxGeometry args={[3.6, 0.1, 0.5]} />
            </mesh>
            {/* Shelf LED strips */}
            <mesh position={[0, 1.45, -1.45]}>
                <planeGeometry args={[3.6, 0.02]} />
                <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={EMISSIVE_SCALE} />
            </mesh>
            <mesh position={[0, 2.15, -1.45]}>
                <planeGeometry args={[3.6, 0.02]} />
                <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={EMISSIVE_SCALE} />
            </mesh>

            {/* Interior Light - REMOVED -> Baked into emissive strips */}

            {/* Clutter - Random boxes */}
            <mesh position={[-1, 1.7, -1.6]} rotation={[0, 0.2, 0]} material={woodCrate}>
                <boxGeometry args={[0.4, 0.3, 0.3]} />
            </mesh>
            <mesh position={[0.5, 1.7, -1.6]} rotation={[0, -0.1, 0]} material={metalPanel}>
                <boxGeometry args={[0.3, 0.5, 0.3]} />
            </mesh>
            <mesh position={[1.2, 0.6, -1.0]} rotation={[0, 0.5, 0]} material={woodCrate}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
            </mesh>
        </group>
    );
}

function ConstructedWalls() {
    // Tall canyon walls (height 20) so sun comes in from above but is obstructed; holes for vendors
    const wallH = 20;
    const wallY = wallH / 2; // center at 10 so floor at 0

    return (
        <group>
            {/* --- LEFT WALL (x = -4) — very high --- */}
            <WallBlock position={[-4, wallY, 1.5]} size={[2, wallH, 8]} />
            <WallBlock position={[-4, wallY, -6]} size={[2, wallH, 4]} />
            <WallBlock position={[-4, wallY, -10.5]} size={[2, wallH, 5]} />
            <WallBlock position={[-4, wallY, -15]} size={[2, wallH, 4]} />
            <WallBlock position={[-4, 13, -2.5]} size={[2, 12, 4]} /> {/* Above Broker */}

            {/* --- RIGHT WALL (x = 4) — very high --- */}
            <WallBlock position={[4, wallY, 0]} size={[2, wallH, 10]} />
            <WallBlock position={[4, wallY, -13]} size={[2, wallH, 16]} />
            <WallBlock position={[4, 13, -5]} size={[2, 12, 4]} /> {/* Above Barker */}

            <AlleyEndingPortal positionZ={-18} />
        </group>
    );
}

const backingPlateMat = new THREE.MeshStandardMaterial({ color: "#050505", roughness: 0.2, metalness: 0.8 });

function NeonSign({ text, position, color, rotation = [0, 0, 0], size = 1, flicker = false }: any) {
    const ref = useRef<THREE.Mesh>(null);
    const frameCount = useRef(0);
    useFrame(({ clock }) => {
        if (!ref.current || !flicker) return;
        frameCount.current++;
        if (frameCount.current % 2 !== 0) return; // Throttle to every 2nd frame
        const t = clock.getElapsedTime();
        const noise = Math.sin(t * 20) * Math.sin(t * 7);
        ref.current.visible = noise > -0.8;
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
                outlineBlur={0.2}
            >
                {text}
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={EMISSIVE_SCALE} />
            </Text>
            {/* Backing plate */}
            <mesh position={[0, 0, -0.05]} material={backingPlateMat}>
                <planeGeometry args={[text.length * 0.3 * size, 0.8 * size]} />
            </mesh>
        </group>
    );
}

function ACUnit({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh material={MAT_METAL_DARK}>
                <boxGeometry args={[0.8, 0.6, 0.4]} />
            </mesh>
            <mesh position={[0, 0, 0.21]} material={MAT_DARK}>
                <circleGeometry args={[0.25, 16]} />
            </mesh>
        </group>
    );
}

function UpperCityLayer() {
    return (
        <group position={[0, 6, 0]}>
            {/* Left Balconies */}
            <mesh position={[-3.8, 0, -5]} material={MAT_DARK}>
                <boxGeometry args={[1, 0.2, 4]} />
            </mesh>
            <mesh position={[-3.8, 3, -8]} material={MAT_DARK}>
                <boxGeometry args={[1, 0.2, 4]} />
            </mesh>
            {/* Right Pipes */}
            <mesh position={[3.8, 1, -6]} rotation={[0, 0, Math.PI / 2]} material={MAT_METAL_GREY}>
                <cylinderGeometry args={[0.1, 0.1, 10]} />
            </mesh>
            <mesh position={[3.6, 2, -6]} rotation={[0, 0, Math.PI / 2]} material={MAT_DARKER}>
                <cylinderGeometry args={[0.2, 0.2, 10]} />
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
    const frameCount = useRef(0);

    useFrame(({ clock }) => {
        if (!group.current) return;
        frameCount.current++;
        if (frameCount.current % 2 !== 0) return; // Throttle to every 2nd frame
        const t = clock.getElapsedTime() + delay;
        group.current.rotation.z = Math.sin(t * 1.0) * 0.05;
        group.current.rotation.x = Math.cos(t * 0.8) * 0.02;
    });

    return (
        <group ref={group} position={position}>
            {/* Rope */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 1]} />
                <meshBasicMaterial color="#000" />
            </mesh>
            {/* Lantern Body */}
            <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.15, 0.1, 0.4, 6]} />
                <meshStandardMaterial color="#884400" emissive={color} emissiveIntensity={0.5 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} roughness={0.6} />
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
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={EMISSIVE_SCALE} />
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
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={EMISSIVE_SCALE} />
            </Text>
        </group>
    );
}

function MarketCart({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <group position={position} rotation={new THREE.Euler(...rotation)}>
            {/* Cart Base */}
            <mesh position={[0, 0.4, 0]} receiveShadow>
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

            {/* Integrated Light - Opt: Removed PointLight */}
        </group>
    );
}

const beamMat = new THREE.MeshStandardMaterial({ color: "#3d2914", roughness: 1 });

function Beams() {
    return (
        <group>
            {[0, -4, -8, -12].map((z, i) => (
                <mesh key={i} position={[0, 4, z]} material={beamMat}>
                    <boxGeometry args={[10, 0.2, 0.2]} />
                </mesh>
            ))}
        </group>
    );
}

function HangingBanner({ position, rotation, color }: { position: [number, number, number], rotation?: [number, number, number], color: string }) {
    const ref = useRef<THREE.Mesh>(null);
    const frameCount = useRef(0);
    useFrame(({ clock }) => {
        if (!ref.current) return;
        frameCount.current++;
        if (frameCount.current % 2 !== 0) return; // Throttle to every 2nd frame
        const t = clock.getElapsedTime();
        ref.current.rotation.z = (rotation?.[2] || 0) + Math.sin(t * 2 + position[0]) * 0.05;
    });

    return (
        <group position={position} rotation={rotation ? new THREE.Euler(...rotation) : new THREE.Euler()}>
            <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT_DARKER}>
                <cylinderGeometry args={[0.02, 0.02, 1.2]} />
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

function HangingBulb({ position, color = "#ffaa00" }: { position: [number, number, number], color?: string }) {
    const group = useRef<THREE.Group>(null);
    const frameCount = useRef(0);
    useFrame(({ clock }) => {
        if (!group.current) return;
        frameCount.current++;
        if (frameCount.current % 2 !== 0) return; // Throttle to every 2nd frame
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
            <mesh position={[0, 0.1, 0]} material={MAT_DARK}>
                <cylinderGeometry args={[0.03, 0.03, 0.1]} />
            </mesh>
            {/* Bulb */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} />
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
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2 * EMISSIVE_SCALE} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <spotLight position={[0, 0.6, 0.1]} target-position={[0, 0, 1]} angle={0.6} penumbra={0.5} intensity={4} distance={15} color={color} />
            )}
        </group>
    );
}

function FloorGlow({ position, color = "#0055ff", length = 2 }: { position: [number, number, number], color?: string, length?: number }) {
    return (
        <group position={position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[0.1, length]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={EMISSIVE_SCALE} />
            </mesh>
        </group>
    );
}

function MetalBeam({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* The LED Strip Housing */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.16, 0]} material={MAT_BLACK}>
                <boxGeometry args={[0.3, 22, 0.05]} />
            </mesh>

            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <>
                    <spotLight
                        position={[0, -0.2, 0]}
                        color="#bb88ff"
                        intensity={8}
                        distance={25}
                        angle={1.2}
                        penumbra={1}
                    />
                    <pointLight position={[0, -0.5, 0]} color="#9966dd" intensity={2} distance={15} decay={2} />
                </>
            )}
        </group>
    );
}

export default function Environment() {
    const { dirtRoad, woodCrate } = useBazaarMaterials();

    const tiledDirt = useMemo(() => {
        const m = dirtRoad.clone();
        if (m.map) { m.map = m.map.clone(); m.map.repeat.set(10, 30); }
        if (m.roughnessMap) { m.roughnessMap = m.roughnessMap.clone(); m.roughnessMap.repeat.set(10, 30); }
        if (m.normalMap) { m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(10, 30); }
        return m;
    }, [dirtRoad]);

    return (
        <group>
            {/* Dirt road ground — dusty, clear visibility, daylight */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={tiledDirt}>
                <planeGeometry args={[20, 60]} />
            </mesh>

            {/* Replaced procedural walls with Constructed Stalls */}
            <ConstructedWalls />
            <WindowGrid />
            <WindowACs />
            <POVLight />

            {/* Vendor Stalls Interiors - Matched to Vendor Positions */}
            <VendorStall position={[-3.8, 0, -2.5]} rotationY={Math.PI / 2} /> {/* Broker */}

            {/* Barker - Custom Internal Wall */}
            <InternalVendorWall position={[4, 0, -5]} rotationY={-Math.PI / 2} />

            {/* Back Left - Converted to Market Cart */}
            <MarketCart position={[-2.5, 0, -9]} rotation={[0, 0.5, 0]} />

            <UpperCityLayer />

            {/* Neon Signage Cluster */}
            <NeonSign text="MARKET" position={[-3.5, 4, -5]} rotation={[0, Math.PI / 2, 0]} color="#ff0055" size={2} />
            <ProtrudingSign text="NOODLES" position={[-3.8, 3.5, -8]} color="#00ffaa" />
            <NeonSign text="OPEN" position={[-3.5, 3, -5]} rotation={[0, Math.PI / 2, 0]} color="#00ff55" size={1} flicker />
            <NeonSign text="CYBER" position={[3.5, 5, -8]} rotation={[0, -Math.PI / 2, 0]} color="#0088ff" size={1.5} />
            <NeonSign text="NO DATA" position={[3.5, 3.5, -3]} rotation={[0, -Math.PI / 2, 0]} color="#ffaa00" size={0.8} />

            {/* Ultra-HD neon sign (back-left alley wall) */}
            <NeonImageSign
                textureUrl="/textures/signs/neon-sign-ultrahd.png"
                position={[-4.05, 3.2, -18.5]}
                rotation={[0, Math.PI / 2, 0]}
                width={3.2}
                height={1.6}
                emissiveIntensity={1.15}
                lightIntensity={0.35}
            />

            {/* Alley ending gateway signage (hotel-style left, poster right) */}
            <NeonImageSign
                textureUrl="/textures/signs/alley-hotel.png"
                position={[-2.8, 4.2, -18.2]}
                rotation={[0, Math.PI / 2, 0]}
                width={2}
                height={1}
                emissiveIntensity={1.1}
                lightIntensity={0.25}
            />
            <NeonImageSign
                textureUrl="/textures/signs/alley-poster.png"
                position={[2.8, 3.8, -18.2]}
                rotation={[0, -Math.PI / 2, 0]}
                width={1.8}
                height={1.2}
                emissiveIntensity={1}
                lightIntensity={0.2}
            />

            {/* Overhead Cables (Dense) */}
            <Cables />

            {/* Middle-eastern bazaar: blankets and clotheslines across alley */}
            <HangingBlankets />
            <Clotheslines />

            {/* --- MOTIVATED LIGHTING --- */}

            {/* Rhythm: Hanging Bulbs down the center */}
            {[-2, -5, -8, -11, -14].map((z) => (
                <HangingBulb key={`bulb-${z}`} position={[Math.sin(z) * 0.5, 3.5, z]} color="#ffaa55" />
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

            {/* Neon strip along bottom-left wall */}
            <LedBar
                color="#ff0055"
                position={[-4.02, 0.18, -10.0]}
                rotation={[0, Math.PI / 2, 0]}
                length={22}
                thickness={0.08}
            />

            {/* Banners */}
            <HangingBanner position={[-2.8, 2.5, -3]} rotation={[0, Math.PI / 2, 0]} color="#551111" />
            <HangingBanner position={[2.8, 2.5, -6]} rotation={[0, -Math.PI / 2, 0]} color="#112233" />

            {/* Clutter / Crates */}
            <mesh position={[-2.5, 0.5, -1]} rotation={[0, 0.2, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.8, 1, 0.8]} />
            </mesh>

            <Beams />

            {/* New Industrial Beams with LED */}
            {/* Raised by ~2ft (approx 0.6m units) -> y=3.6 or 4.0. Using 4.5 for clearance. */}
            <MetalBeam position={[0, 4.5, -5]} />
            <MetalBeam position={[0, 5.0, 1]} /> {/* Closer to POV (Camera is at z=6) */}

            {/* Removed DustSystem for optimization */}
        </group>
    );
}
