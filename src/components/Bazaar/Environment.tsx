import { useRef, useMemo, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { LayerMaterial, Depth, Noise } from "lamina";
import { useBazaarMaterials } from "./BazaarMaterials";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";
import LedBar from "./LedBar";
import { AlleyEndingPortal } from "./AlleyEnding";

// Cutoff: hollow everything past this Z (just past Barker). Portal and back wall sit here.
const Z_CUTOFF = -6;

// --- SHARED MATERIALS (created once, reused across all components) ---
const MAT_DARK = new THREE.MeshStandardMaterial({ color: "#222" });
const MAT_DARKER = new THREE.MeshStandardMaterial({ color: "#333" });
const MAT_BLACK = new THREE.MeshStandardMaterial({ color: "#111" });
const MAT_METAL_GREY = new THREE.MeshStandardMaterial({ color: "#444", roughness: 0.3, metalness: 0.6 });
const MAT_METAL_DARK = new THREE.MeshStandardMaterial({ color: "#555", roughness: 0.6, metalness: 0.4 });

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

// Index-based pseudo-random for stable per-position values (avoids Math.random() in render)
const pseudoRandom = (seed: number) => ((seed * 0.61803) % 1);

function WindowGrid() {
    const windows = useMemo(() => {
        const out: ReactNode[] = [];
        const stories = [5, 10, 15];
        const zLocations = [-2, -5].filter((z) => z >= Z_CUTOFF);

        for (const y of stories) {
            for (const z of zLocations) {
                const seedL = y * 100 + z;
                const seedR = seedL + 1000;
                out.push(
                    <mesh key={`l-${y}-${z}`} position={[-4.1, y, z]} rotation={[0, Math.PI / 2, 0]}>
                        <planeGeometry args={[1.5, 2]} />
                        <meshStandardMaterial color="#ffcc77" emissive="#ffeecc" emissiveIntensity={(1.5 + pseudoRandom(seedL)) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE + 0.45} toneMapped={EMISSIVE_SCALE === 0} />
                    </mesh>
                );
                out.push(
                    <mesh key={`r-${y}-${z}`} position={[4.1, y, z]} rotation={[0, -Math.PI / 2, 0]}>
                        <planeGeometry args={[1.5, 2]} />
                        <meshStandardMaterial color="#88ccff" emissive="#cceeff" emissiveIntensity={(1.5 + pseudoRandom(seedR)) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE + 0.65} toneMapped={EMISSIVE_SCALE === 0} />
                    </mesh>
                );
            }
        }

        const rightImmediateStories = [2.5, 5.5, 8.5, 11.5];
        const rightImmediateZ = [-1, 1];

        for (const y of rightImmediateStories) {
            for (const z of rightImmediateZ) {
                const seed = 2000 + y * 100 + z;
                out.push(
                    <mesh key={`r-new-${y}-${z}`} position={[4.1, y, z]} rotation={[0, -Math.PI / 2, 0]}>
                        <planeGeometry args={[1.2, 1.8]} />
                        <meshStandardMaterial color="#55ffcc" emissive="#ccffdd" emissiveIntensity={(2 + pseudoRandom(seed)) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE + 0.7} toneMapped={EMISSIVE_SCALE === 0} />
                    </mesh>
                );
            }
        }

        // leftFarZ omitted: hollowed past Z_CUTOFF

        return out;
    }, []);

    return <group>{windows}</group>;
}

// Makeshift window ACs (only up to Z_CUTOFF)
const WINDOW_AC_POSITIONS: { x: number; y: number; z: number; tilt?: number }[] = [
    { x: -4.05, y: 5, z: -2 }, { x: 4.05, y: 2.5, z: -1 }, { x: -4.05, y: 8.5, z: 1 }, { x: 4.05, y: 3, z: -5 },
].filter((p) => p.z >= Z_CUTOFF);

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

const FABRIC_COLORS = ["#c47b5b", "#7a9e9f", "#b8956b", "#d4a574", "#8b7355", "#a67c52", "#6b8e9a", "#c9a86c"];
const BLANKET_LINES = [
    { y: 3.2, z: -4, w: 2.2, h: 1.4 },
    { y: 2.2, z: -6, w: 2.4, h: 1.2 },
].filter((line) => line.z >= Z_CUTOFF);

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
].filter((p) => p.z >= Z_CUTOFF);

function Clotheslines() {
    return (
        <group>
            {CLOTHESLINE_POSITIONS.map((p, i) => (
                <Clothesline key={i} y={p.y} z={p.z} />
            ))}
        </group>
    );
}

function WallBlock({ position, size, rotation = [0, 0, 0], material }: { position: [number, number, number], size: [number, number, number], rotation?: [number, number, number], material?: THREE.MeshStandardMaterial }) {
    const { concreteWall } = useBazaarMaterials();
    const mat = material ?? concreteWall;
    return (
        <mesh position={position} rotation={rotation} receiveShadow castShadow material={mat}>
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
            {/* No ceiling — open alley stall, sky visible */}
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

// Left wall hole: 12 units wide (z) by 7 units high (y), centered z=-12, y=2..9
const LEFT_WALL_HOLE_Z = { min: -18, max: -6 };
const LEFT_WALL_HOLE_Y = { min: 2, max: 9 };

// Hawker hole-in-the-wall shop: left wall near entrance, z 0.8–4, y 0.5–2.8
const HAWKER_HOLE_Z = { min: 0.8, max: 4 };
const HAWKER_HOLE_Y = { min: 0.5, max: 2.8 };

// Right wall hole-in-the-wall vendor (first thing on right): z 0.5–2.5, y 0.8–2.2
const RIGHT_WALL_HOLE_Z = { min: 0.5, max: 2.5 };
const RIGHT_WALL_HOLE_Y = { min: 0.8, max: 2.2 };

// Full shop stall for Hawker: counter, shelves, neon — vendor stands behind counter
function HawkerStallShop() {
    const { woodCrate, metalPanel } = useBazaarMaterials();
    const holeZ = (HAWKER_HOLE_Z.min + HAWKER_HOLE_Z.max) / 2;
    const holeY = (HAWKER_HOLE_Y.min + HAWKER_HOLE_Y.max) / 2;
    // Position at left wall: opening at x=-4, recess extends to x=-5
    const dimOrange = "#cc6633";
    const orangeIntensity = 0.6 * BAZAAR_BRIGHTNESS * (EMISSIVE_SCALE > 0 ? EMISSIVE_SCALE : 0.6);

    return (
        <group position={[-4.5, holeY, holeZ]}>
            {/* Back wall of alcove (local -X = into wall) */}
            <mesh position={[-0.8, 0, 0]} receiveShadow material={metalPanel}>
                <boxGeometry args={[0.1, HAWKER_HOLE_Y.max - HAWKER_HOLE_Y.min + 0.2, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min + 0.2]} />
            </mesh>
            {/* Side walls */}
            <mesh position={[-0.4, 0, -(HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min) / 2 - 0.05]} material={metalPanel}>
                <boxGeometry args={[0.8, HAWKER_HOLE_Y.max - HAWKER_HOLE_Y.min + 0.3, 0.1]} />
            </mesh>
            <mesh position={[-0.4, 0, (HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min) / 2 + 0.05]} material={metalPanel}>
                <boxGeometry args={[0.8, HAWKER_HOLE_Y.max - HAWKER_HOLE_Y.min + 0.3, 0.1]} />
            </mesh>
            {/* Market counter — prominent wooden counter vendor stands behind */}
            <mesh position={[-0.15, 0.15, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.5, 0.9, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min]} />
            </mesh>
            {/* Counter top with neon strip */}
            <mesh position={[-0.15, 0.55, 0]}>
                <boxGeometry args={[0.02, 0.04, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min + 0.1]} />
                <meshStandardMaterial color={dimOrange} emissive={dimOrange} emissiveIntensity={orangeIntensity} />
            </mesh>
            {/* Shelves behind counter */}
            <mesh position={[-0.5, 0.7, 0]} material={metalPanel}>
                <boxGeometry args={[0.08, 0.05, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min - 0.4]} />
            </mesh>
            <mesh position={[-0.55, 0.72, 0]}>
                <boxGeometry args={[0.02, 0.02, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min - 0.5]} />
                <meshStandardMaterial color={dimOrange} emissive={dimOrange} emissiveIntensity={orangeIntensity} />
            </mesh>
            <mesh position={[-0.55, 1.1, 0]} material={metalPanel}>
                <boxGeometry args={[0.08, 0.05, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min - 0.5]} />
            </mesh>
            {/* Neon frame around shop opening */}
            <mesh position={[0.02, 0, 0]}>
                <boxGeometry args={[0.04, HAWKER_HOLE_Y.max - HAWKER_HOLE_Y.min + 0.1, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min + 0.15]} />
                <meshStandardMaterial color={dimOrange} emissive={dimOrange} emissiveIntensity={orangeIntensity} />
            </mesh>
            {/* Clutter on counter */}
            <mesh position={[-0.15, 0.5, -0.8]} rotation={[0, 0.2, 0]} material={woodCrate}>
                <boxGeometry args={[0.25, 0.2, 0.2]} />
            </mesh>
            <mesh position={[-0.15, 0.52, 0.5]} rotation={[0, -0.1, 0]} material={metalPanel}>
                <boxGeometry args={[0.2, 0.15, 0.15]} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight color={dimOrange} intensity={1} distance={3} decay={2} position={[-0.3, 0.5, 0]} />
            )}
        </group>
    );
}

function HoleInWallVendor() {
    const { metalPanel, concreteWall } = useBazaarMaterials();
    // Dim blue neon for daytime — visible but washed out
    const dimBlueIntensity = 0.45 * BAZAAR_BRIGHTNESS * (EMISSIVE_SCALE > 0 ? EMISSIVE_SCALE : 0.6);
    const dimBlue = "#4488dd";

    return (
        <group position={[3.95, RIGHT_WALL_HOLE_Y.min + (RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min) / 2, RIGHT_WALL_HOLE_Z.min + (RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min) / 2]}>
            {/* Recessed alcove: back wall + sides, facing -X (into alley) */}
            {/* Back wall of alcove */}
            <mesh position={[0.5, 0, 0]} receiveShadow material={metalPanel}>
                <boxGeometry args={[0.1, RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min + 0.2, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min + 0.2]} />
            </mesh>
            {/* Side walls */}
            <mesh position={[0.25, 0, -(RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min) / 2 - 0.05]} material={metalPanel}>
                <boxGeometry args={[0.5, RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min + 0.3, 0.1]} />
            </mesh>
            <mesh position={[0.25, 0, (RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min) / 2 + 0.05]} material={metalPanel}>
                <boxGeometry args={[0.5, RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min + 0.3, 0.1]} />
            </mesh>
            {/* Counter sill */}
            <mesh position={[0.2, -0.35, 0]} castShadow receiveShadow material={concreteWall}>
                <boxGeometry args={[0.4, 0.15, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min]} />
            </mesh>
            {/* Neon outline — frame the hole (blue, dim for day) */}
            {/* Top bar */}
            <mesh position={[0.02, (RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min) / 2 + 0.05, 0]}>
                <boxGeometry args={[0.04, 0.06, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min + 0.15]} />
                <meshStandardMaterial color={dimBlue} emissive={dimBlue} emissiveIntensity={dimBlueIntensity} />
            </mesh>
            {/* Left vertical */}
            <mesh position={[0.02, 0, -(RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min) / 2 - 0.04]}>
                <boxGeometry args={[0.04, RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min, 0.06]} />
                <meshStandardMaterial color={dimBlue} emissive={dimBlue} emissiveIntensity={dimBlueIntensity} />
            </mesh>
            {/* Right vertical */}
            <mesh position={[0.02, 0, (RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min) / 2 + 0.04]}>
                <boxGeometry args={[0.04, RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min, 0.06]} />
                <meshStandardMaterial color={dimBlue} emissive={dimBlue} emissiveIntensity={dimBlueIntensity} />
            </mesh>
            {/* Bottom bar */}
            <mesh position={[0.02, -(RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min) / 2 - 0.05, 0]}>
                <boxGeometry args={[0.04, 0.06, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min + 0.15]} />
                <meshStandardMaterial color={dimBlue} emissive={dimBlue} emissiveIntensity={dimBlueIntensity} />
            </mesh>
            {/* Shelf with blue strip inside */}
            <mesh position={[0.3, 0.2, 0]} material={metalPanel}>
                <boxGeometry args={[0.08, 0.05, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min - 0.2]} />
            </mesh>
            <mesh position={[0.35, 0.22, 0]}>
                <boxGeometry args={[0.02, 0.02, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min - 0.3]} />
                <meshStandardMaterial color={dimBlue} emissive={dimBlue} emissiveIntensity={dimBlueIntensity} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight color={dimBlue} intensity={0.8} distance={2} decay={2} position={[0, 0, 0]} />
            )}
        </group>
    );
}

function ConstructedWalls({ onEnterPortal }: { onEnterPortal?: () => void }) {
    // Tall canyon walls (height 20); hollowed at Z_CUTOFF — back wall and portal at -7 / -6.5
    const wallH = 20;
    const wallY = wallH / 2; // center at 10 so floor at 0
    const { concreteWallRight } = useBazaarMaterials();
    const backWallZ = -7;

    return (
        <group>
            {/* --- LEFT WALL (x = -4) — Hawker hole + Broker; ends at cutoff (no deep hole) --- */}
            <WallBlock position={[-4, wallY, -0.85]} size={[2, wallH, 3.3]} /> {/* left of Hawker hole */}
            <WallBlock position={[-4, wallY, 4.75]} size={[2, wallH, 1.5]} /> {/* right of Hawker hole */}
            <WallBlock position={[-4, HAWKER_HOLE_Y.min / 2, (HAWKER_HOLE_Z.min + HAWKER_HOLE_Z.max) / 2]} size={[2, HAWKER_HOLE_Y.min, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min]} /> {/* below Hawker hole */}
            <WallBlock position={[-4, (HAWKER_HOLE_Y.max + wallH) / 2, (HAWKER_HOLE_Z.min + HAWKER_HOLE_Z.max) / 2]} size={[2, wallH - HAWKER_HOLE_Y.max, HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min]} /> {/* above Hawker hole */}
            <WallBlock position={[-4, wallY, (Z_CUTOFF - 1 + backWallZ) / 2]} size={[2, wallH, backWallZ - Z_CUTOFF + 2]} /> {/* from cutoff to back wall */}
            <WallBlock position={[-4, 13, -2.5]} size={[2, 12, 4]} /> {/* Above Broker */}

            {/* --- RIGHT WALL (x = 4) — hole-in-the-wall vendor; ends at cutoff --- */}
            <WallBlock position={[4, wallY, -2.25]} size={[2, wallH, 5.5]} material={concreteWallRight} /> {/* left of hole */}
            <WallBlock position={[4, wallY, 3.75]} size={[2, wallH, 2.5]} material={concreteWallRight} /> {/* right of hole */}
            <WallBlock position={[4, RIGHT_WALL_HOLE_Y.min / 2, 1.5]} size={[2, RIGHT_WALL_HOLE_Y.min, 2]} material={concreteWallRight} /> {/* below hole */}
            <WallBlock position={[4, (RIGHT_WALL_HOLE_Y.max + wallH) / 2, 1.5]} size={[2, wallH - RIGHT_WALL_HOLE_Y.max, 2]} material={concreteWallRight} /> {/* above hole */}
            <WallBlock position={[4, wallY, (Z_CUTOFF - 1 + backWallZ) / 2]} size={[2, wallH, backWallZ - Z_CUTOFF + 2]} material={concreteWallRight} />
            <WallBlock position={[4, 13, -5]} size={[2, 12, 4]} material={concreteWallRight} /> {/* Above Barker */}
            <HoleInWallVendor />

            {/* --- HAWKER SHOP (left wall hole) --- */}
            <HawkerStallShop />

            {/* --- BACK WALL + PORTAL at cutoff --- */}
            <WallBlock position={[0, wallY, backWallZ]} size={[10, wallH, 2]} />
            <AlleyEndingPortal positionZ={-6.5} onEnterPortal={onEnterPortal} />
        </group>
    );
}

const backingPlateMat = new THREE.MeshStandardMaterial({ color: "#050505", roughness: 0.2, metalness: 0.8 });

function LargeWallLedStrip({ position, rotation, width, height, color }: { position: [number, number, number]; rotation: [number, number, number]; width: number; height: number; color: string }) {
    const intensity = 2.5 * BAZAAR_BRIGHTNESS * (EMISSIVE_SCALE > 0 ? EMISSIVE_SCALE : 0.5);
    return (
        <group position={position} rotation={rotation}>
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={intensity}
                />
            </mesh>
            <pointLight color={color} intensity={8} distance={25} decay={2} position={[0, 0, 0]} />
        </group>
    );
}

interface NeonSignProps {
    text: string;
    position: [number, number, number];
    color: string;
    rotation?: [number, number, number];
    size?: number;
    flicker?: boolean;
}
function NeonSign({ text, position, color, rotation = [0, 0, 0], size = 1, flicker = false }: NeonSignProps) {
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
            {/* Left Balconies (only up to cutoff) */}
            <mesh position={[-3.8, 0, -5]} material={MAT_DARK}>
                <boxGeometry args={[1, 0.2, 4]} />
            </mesh>
            {/* Right Pipes */}
            <mesh position={[3.8, 1, -6]} rotation={[0, 0, Math.PI / 2]} material={MAT_METAL_GREY}>
                <cylinderGeometry args={[0.1, 0.1, 10]} />
            </mesh>
            <mesh position={[3.6, 2, -6]} rotation={[0, 0, Math.PI / 2]} material={MAT_DARKER}>
                <cylinderGeometry args={[0.2, 0.2, 10]} />
            </mesh>

            {/* AC Units Clutter (only up to cutoff) */}
            <ACUnit position={[-3.6, 1, -4]} />
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

interface ProtrudingSignProps {
    position: [number, number, number];
    text: string;
    color?: string;
}
function ProtrudingSign({ position, text, color = "#ff00ff" }: ProtrudingSignProps) {
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
        <group position={position} rotation={rotation}>
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
    // Beams only over left half, only up to Z_CUTOFF
    return (
        <group>
            {[0, -4].filter((z) => z >= Z_CUTOFF).map((z, i) => (
                <mesh key={i} position={[-2.5, 4, z]} material={beamMat}>
                    <boxGeometry args={[5, 0.2, 0.2]} />
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
        <group position={position} rotation={rotation ?? [0, 0, 0]}>
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
        <group position={position} rotation={rotation}>
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

export default function Environment({ onEnterPortal }: { onEnterPortal?: () => void } = {}) {
    const { dirtRoad, woodCrate } = useBazaarMaterials();

    const tiledDirt = useMemo(() => {
        const m = dirtRoad.clone();
        if (m.map) { m.map = m.map.clone(); m.map.repeat.set(10, 12); }
        if (m.roughnessMap) { m.roughnessMap = m.roughnessMap.clone(); m.roughnessMap.repeat.set(10, 12); }
        if (m.normalMap) { m.normalMap = m.normalMap.clone(); m.normalMap.repeat.set(10, 12); }
        return m;
    }, [dirtRoad]);

    return (
        <group>
            {/* Rough dirt ground (shortened to cutoff) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={tiledDirt}>
                <planeGeometry args={[20, 20]} />
            </mesh>

            {/* Replaced procedural walls with Constructed Stalls */}
            <ConstructedWalls onEnterPortal={onEnterPortal} />
            <WindowGrid />
            <WindowACs />
            <POVLight />
            <HangingBlankets />
            <Clotheslines />

            {/* Vendor Stalls Interiors - Matched to Vendor Positions */}
            <VendorStall position={[-3.8, 0, -2.5]} rotationY={Math.PI / 2} /> {/* Broker */}

            {/* Barker - Custom Internal Wall */}
            <InternalVendorWall position={[4, 0, -5]} rotationY={-Math.PI / 2} />

            <UpperCityLayer />

            {/* Neon Signage Cluster (only up to cutoff) */}
            <NeonSign text="MARKET" position={[-3.5, 4, -5]} rotation={[0, Math.PI / 2, 0]} color="#ff0055" size={2} />
            <NeonSign text="OPEN" position={[-3.5, 3, -5]} rotation={[0, Math.PI / 2, 0]} color="#00ff55" size={1} flicker />
            <NeonSign text="NO DATA" position={[3.5, 3.5, -3]} rotation={[0, -Math.PI / 2, 0]} color="#ffaa00" size={0.8} />

            {/* Overhead Cables (Dense) */}
            <Cables />

            {/* --- MOTIVATED LIGHTING (only up to cutoff) --- */}

            {/* Rhythm: Hanging Bulbs down the center */}
            {[-2, -5].filter((z) => z >= Z_CUTOFF).map((z) => (
                <HangingBulb key={`bulb-${z}`} position={[Math.sin(z) * 0.5, 3.5, z]} color="#ffaa55" />
            ))}

            {/* Lanterns - Warmth details */}
            <Lantern position={[-2.5, 2.5, -3]} color="#ff6600" />

            {/* Stall Lamps - practical task lighting on crates/stalls */}
            <StallLamp position={[-2.5, 1.0, -1]} rotation={[0, -0.5, 0]} color="#aaffaa" />

            {/* Neon strip along bottom-left wall (short, to cutoff) */}
            <LedBar
                color="#ff0055"
                position={[-4.02, 0.18, (Z_CUTOFF - 1) / 2]}
                rotation={[0, Math.PI / 2, 0]}
                length={6}
                thickness={0.08}
            />

            {/* Large LED strip at back wall */}
            <LargeWallLedStrip
                position={[0, 18.5, -7]}
                rotation={[0, 0, 0]}
                width={9}
                height={0.6}
                color="#aaddff"
            />

            {/* Banners */}
            <HangingBanner position={[-2.8, 2.5, -3]} rotation={[0, Math.PI / 2, 0]} color="#551111" />
            <HangingBanner position={[2.8, 2.5, -6]} rotation={[0, -Math.PI / 2, 0]} color="#112233" />

            {/* Clutter / Crates */}
            <mesh position={[-2.5, 0.5, -1]} rotation={[0, 0.2, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.8, 1, 0.8]} />
            </mesh>

            <Beams />

            {/* Industrial beams with LED — left side only */}
            <MetalBeam position={[-1.5, 4.5, -5]} />
            <MetalBeam position={[-1.5, 5.0, 1]} />

            {/* Right alley dressing — one crate only (within cutoff) */}
            <mesh position={[3.2, 0.45, -4]} rotation={[0, 0.3, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.6, 0.5, 0.5]} />
            </mesh>

            {/* Removed DustSystem for optimization */}
        </group>
    );
}
