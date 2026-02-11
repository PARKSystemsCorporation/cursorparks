import { useRef, useMemo, type ReactNode, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { LayerMaterial, Depth, Noise } from "lamina";
import { useBazaarMaterials } from "./BazaarMaterials";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";
import LedBar from "./LedBar";
import { AlleyEndingPortal } from "./AlleyEnding";
import StringLights from "./StringLights";
import FruitStall from "./FruitStall";
import CoffeeCart from "./CoffeeCart";
import JewelryStand from "./JewelryStand";
import BirdFlyby from "./BirdFlyby";

// Cutoff: hollow everything past this Z (just past Dead End).
const Z_CUTOFF = -4.5;

const STRING_LIGHT_POSITIONS: [number, number, number][] = [
    [-2, 2.8, 1],
    [0, 2.6, -1],
    [2, 2.7, -3],
    [-1, 2.5, -3.5]
];

// --- SHARED MATERIALS REMOVED ---
// All components now use useBazaarMaterials() for textured, realistic materials.

// --- CYBER ASSETS ---

function Cables() {
    const { darkMetal, rustPipe } = useBazaarMaterials();
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
            <mesh material={darkMetal}>
                <tubeGeometry args={[curve1, 12, 0.02, 3, false]} />
            </mesh>
            <mesh material={rustPipe}>
                <tubeGeometry args={[curve2, 12, 0.03, 3, false]} />
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

function WindowACs() {
    const { metalPanel, darkMetal } = useBazaarMaterials();
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const fanRef = useRef<THREE.InstancedMesh>(null);
    const count = WINDOW_AC_POSITIONS.length;

    useLayoutEffect(() => {
        if (!meshRef.current || !fanRef.current) return;
        const tempObj = new THREE.Object3D();

        WINDOW_AC_POSITIONS.forEach((p, i) => {
            const isLeft = p.x < 0;
            const rotY = isLeft ? Math.PI / 2 : -Math.PI / 2;
            const tilt = p.tilt ?? (i % 3 === 0 ? 0.04 : 0);

            // Box body
            tempObj.position.set(p.x, p.y, p.z);
            tempObj.rotation.set(tilt, rotY, 0);
            tempObj.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObj.matrix);

            // Fan circle (local offset)
            tempObj.translateZ(0.15);
            tempObj.updateMatrix();
            fanRef.current!.setMatrixAt(i, tempObj.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        fanRef.current.instanceMatrix.needsUpdate = true;
    }, []);

    return (
        <group>
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
                <boxGeometry args={[0.5, 0.35, 0.28]} />
                <primitive object={metalPanel} />
            </instancedMesh>
            <instancedMesh ref={fanRef} args={[undefined, undefined, count]}>
                <circleGeometry args={[0.12, 8]} />
                <primitive object={darkMetal} />
            </instancedMesh>
        </group>
    );
}

function HangingBlanket({ y, z, width, height, color }: { y: number; z: number; width: number; height: number; color: string }) {
    const { cloth, darkMetal } = useBazaarMaterials();
    const meshRef = useRef<THREE.Mesh>(null);
    const frameCount = useRef(0);

    // Create a unique material instance for color
    const mat = useMemo(() => {
        const m = cloth.clone();
        m.color.set(color);
        return m;
    }, [cloth, color]);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        frameCount.current++;
        if (frameCount.current % 2 !== 0) return;
        const t = clock.getElapsedTime() + z * 0.2;
        meshRef.current.rotation.z = Math.sin(t * 1.5) * 0.04 + Math.cos(t * 0.8) * 0.02;
    });
    return (
        <group position={[0, y, z]}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={darkMetal}>
                <cylinderGeometry args={[0.015, 0.015, 7.6, 4]} />
            </mesh>
            <mesh ref={meshRef} position={[0, -height / 2, 0]} rotation={[0, 0, Math.PI / 2]} receiveShadow castShadow material={mat}>
                <planeGeometry args={[width, height]} />
            </mesh>
        </group>
    );
}

const FABRIC_COLORS = ["#c47b5b", "#7a9e9f", "#b8956b", "#d4a574", "#8b7355", "#a67c52", "#6b8e9a", "#c9a86c"];
const BLANKET_LINES = [
    { y: 3.2, z: -1.5, w: 2.2, h: 1.4 },
    { y: 2.8, z: -3.5, w: 2.4, h: 1.2 },
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
    const { cloth, darkMetal } = useBazaarMaterials();
    const clothes = useMemo(() => [
        { x: -2.2, type: "shirt" as const, rot: 0.1 },
        { x: 0, type: "pants" as const, rot: -0.05 },
        { x: 2.1, type: "towel" as const, rot: 0.08 },
        { x: -0.8, type: "shirt" as const, rot: -0.12 },
        { x: 1.4, type: "towel" as const, rot: 0.06 },
    ], []);

    // Create colored cloth instances
    const getClothMat = (color: string) => {
        const m = cloth.clone();
        m.color.set(color);
        return m;
    };

    // Memoize the dark cloth
    const darkCloth = useMemo(() => {
        const m = cloth.clone();
        m.color.set("#333");
        return m;
    }, [cloth]);

    return (
        <group position={[0, y, z]}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={darkMetal}>
                <cylinderGeometry args={[0.01, 0.01, 7.6, 4]} />
            </mesh>
            {clothes.map((c, i) => (
                <group key={i} position={[c.x, -0.15, 0]} rotation={[0, 0, c.rot]}>
                    {c.type === "shirt" && (
                        <>
                            <mesh castShadow material={darkCloth}>
                                <boxGeometry args={[0.35, 0.45, 0.04]} />
                            </mesh>
                        </>
                    )}
                    {c.type === "pants" && (
                        <>
                            <mesh position={[0, -0.35, 0]} castShadow material={darkCloth}>
                                <boxGeometry args={[0.25, 0.5, 0.04]} />
                            </mesh>
                        </>
                    )}
                    {c.type === "towel" && (
                        <mesh castShadow receiveShadow material={getClothMat(FABRIC_COLORS[(i + 2) % FABRIC_COLORS.length])}>
                            <planeGeometry args={[0.5, 0.35]} />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
}

const CLOTHESLINE_POSITIONS = [
    { y: 2.8, z: -2.5 },
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
    // Optimization: Hollow out / thin walls
    // If a dimension is exactly 2 (standard wall thickness here), reduce it to 0.1
    const optimizedSize: [number, number, number] = [
        Math.abs(size[0] - 2) < 0.1 ? 0.1 : size[0],
        size[1],
        Math.abs(size[2] - 2) < 0.1 ? 0.1 : size[2]
    ];

    return (
        <mesh position={position} rotation={rotation} receiveShadow castShadow material={mat}>
            <boxGeometry args={optimizedSize} />
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

// Left wall hole for Hawker: z 1.5–4.5, y 0.5–2.8.
// The turn is at z < 1.0.
const HAWKER_HOLE_Z = { min: 1.5, max: 4.5 };
const HAWKER_HOLE_Y = { min: 0.5, max: 2.8 };

// Right wall hole-in-the-wall vendor: z 0.5–2.5
const RIGHT_WALL_HOLE_Z = { min: 0.5, max: 2.5 };
const RIGHT_WALL_HOLE_Y = { min: 0.8, max: 2.2 };

// Full shop stall for Hawker
function HawkerStallShop() {
    const { woodCrate, metalPanel, concreteWall } = useBazaarMaterials();
    const holeZ = (HAWKER_HOLE_Z.min + HAWKER_HOLE_Z.max) / 2;
    const holeHeight = HAWKER_HOLE_Y.max - HAWKER_HOLE_Y.min;
    const holeWidth = HAWKER_HOLE_Z.max - HAWKER_HOLE_Z.min;
    const groupY = holeHeight / 2;
    const dimOrange = "#cc6633";
    const orangeIntensity = 0.6 * BAZAAR_BRIGHTNESS * (EMISSIVE_SCALE > 0 ? EMISSIVE_SCALE : 0.6);

    return (
        <group position={[-4.5, groupY, holeZ]}>
            {/* Floor of alcove */}
            <mesh position={[-0.5, -groupY, 0]} receiveShadow material={concreteWall}>
                <boxGeometry args={[0.8, 0.08, holeWidth + 0.2]} />
            </mesh>
            {/* Back wall of alcove */}
            <mesh position={[-0.8, 0, 0]} receiveShadow material={metalPanel}>
                <boxGeometry args={[0.1, holeHeight + 0.2, holeWidth + 0.2]} />
            </mesh>
            {/* Side walls */}
            <mesh position={[-0.4, 0, -holeWidth / 2 - 0.05]} material={metalPanel}>
                <boxGeometry args={[0.8, holeHeight + 0.3, 0.1]} />
            </mesh>
            <mesh position={[-0.4, 0, holeWidth / 2 + 0.05]} material={metalPanel}>
                <boxGeometry args={[0.8, holeHeight + 0.3, 0.1]} />
            </mesh>
            {/* Market counter */}
            <mesh position={[-0.15, 0.15 + 0.04, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.5, 0.9, holeWidth]} />
            </mesh>
            {/* Counter top strip */}
            <mesh position={[-0.15, 0.55 + 0.04, 0]}>
                <boxGeometry args={[0.02, 0.04, holeWidth + 0.1]} />
                <meshStandardMaterial color={dimOrange} emissive={dimOrange} emissiveIntensity={orangeIntensity} />
            </mesh>
            {/* Shelves */}
            <mesh position={[-0.5, 0.7 + 0.04, 0]} material={metalPanel}>
                <boxGeometry args={[0.08, 0.05, holeWidth - 0.4]} />
            </mesh>
            {/* Neon frame */}
            <mesh position={[0.02, 0, 0]}>
                <boxGeometry args={[0.04, holeHeight + 0.1, holeWidth + 0.15]} />
                <meshStandardMaterial color={dimOrange} emissive={dimOrange} emissiveIntensity={orangeIntensity} />
            </mesh>
            {/* Clutter */}
            <mesh position={[-0.15, 0.5 + 0.04, -0.8]} rotation={[0, 0.2, 0]} material={woodCrate}>
                <boxGeometry args={[0.25, 0.2, 0.2]} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight color={dimOrange} intensity={1} distance={3} decay={2} position={[-0.3, 0.5, 0]} />
            )}
        </group>
    );
}

function HoleInWallVendor() {
    const { metalPanel, concreteWall } = useBazaarMaterials();
    const dimBlueIntensity = 0.45 * BAZAAR_BRIGHTNESS * (EMISSIVE_SCALE > 0 ? EMISSIVE_SCALE : 0.6);
    const dimBlue = "#4488dd";

    return (
        <group position={[3.95, RIGHT_WALL_HOLE_Y.min + (RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min) / 2, RIGHT_WALL_HOLE_Z.min + (RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min) / 2]}>
            <mesh position={[0.5, 0, 0]} receiveShadow material={metalPanel}>
                <boxGeometry args={[0.1, RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min + 0.2, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min + 0.2]} />
            </mesh>
            <mesh position={[0.2, -0.35, 0]} castShadow receiveShadow material={concreteWall}>
                <boxGeometry args={[0.4, 0.15, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min]} />
            </mesh>
            <mesh position={[0.02, (RIGHT_WALL_HOLE_Y.max - RIGHT_WALL_HOLE_Y.min) / 2 + 0.05, 0]}>
                <boxGeometry args={[0.04, 0.06, RIGHT_WALL_HOLE_Z.max - RIGHT_WALL_HOLE_Z.min + 0.15]} />
                <meshStandardMaterial color={dimBlue} emissive={dimBlue} emissiveIntensity={dimBlueIntensity} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight color={dimBlue} intensity={0.8} distance={2} decay={2} position={[0, 0, 0]} />
            )}
        </group>
    );
}

function ConstructedWalls({ onEnterPortal }: { onEnterPortal?: () => void }) {
    const wallH = 20;
    const wallY = wallH / 2;
    const { concreteWallRight, concreteWall } = useBazaarMaterials();

    // DEAD END WALL at z = -4.5 (Close enough to feel like a stop)
    const deadEndZ = -4.5;

    // LEFT TURN CORRIDOR:
    // Starts at x = -4, extends to x = -15
    // Width (z) = 4 units approximately (z = -2 to z = 2)
    const corridorCenterZ = 0;
    const corridorWidth = 4;

    // CORNER WALL (The wall that forces you to turn left inside the corridor logic)
    // Actually, the main left wall is broken.
    // Segment 1 (Entry): From Camera (z=10) to z=1.5 (Start of Hawker)
    // There is a wall BEHIND Hawker? No, Hawker IS the wall.
    // The Hawker stall is at z=[1.5, 4.5].
    // So the "Left Turn" must be AFTER Hawker (smaller z) OR Before?
    // "Walk forward... then curve LEFT behind the stall".
    // "Behind" relative to camera usually means "past" it.
    // So we walk past Hawker (on our left), then TURN LEFT.
    // Hawker z = [1.5, 4.5].
    // Turn is at z < 1.5. Let's say z = [-2, 1].

    return (
        <group>
            {/* --- RIGHT WALL (x = 4) — Straight solid wall --- */}
            {/* From back (z=-20) to front (z=10) */}
            <WallBlock position={[4, wallY, 0]} size={[2, wallH, 30]} material={concreteWallRight} />
            <HoleInWallVendor />

            {/* --- DEAD END WALL (Front) --- */}
            {/* Blocks the path at z = deadEndZ. Spans from x=-4 to x=4 */}
            <WallBlock position={[0, wallY, deadEndZ]} size={[10, wallH, 2]} material={concreteWall} />

            {/* --- LEFT WALL SEGMENTS --- */}

            {/* 1. Entry Segment (Camera side) */}
            {/* From z=10 down to maybe z=4.5 (Start of Hawker) */}
            {/* Hawker is at z=[1.5, 4.5] approx. centered at 3. */}
            {/* Let's make wall from z=4.5 to z=15 */}
            <WallBlock position={[-4, wallY, 9.75]} size={[2, wallH, 10.5]} material={concreteWall} />

            {/* 2. Hawker Section */}
            {/* Wall above and below Hawker hole */}
            {/* Hole z = [1.5, 4.5] */}
            <WallBlock position={[-4, HAWKER_HOLE_Y.min / 2, 3]} size={[2, HAWKER_HOLE_Y.min, 3]} material={concreteWall} />
            <WallBlock position={[-4, (HAWKER_HOLE_Y.max + wallH) / 2, 3]} size={[2, wallH - HAWKER_HOLE_Y.max, 3]} material={concreteWall} />

            {/* 3. The CORNER POST (Occlusion) */}
            {/* Between Hawker (z=1.5) and the Turn (starts at z=1?). */}
            {/* Actually, let's just create the corner at z=1.5. */}

            {/* --- LEFT CORRIDOR (The Turn) --- */}
            {/* Floor for left corridor */}
            <mesh position={[-10, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[12, 6]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>

            {/* Side Walls of Left Corridor */}
            {/* Back side of corridor (towards camera Z) -> z=2 approx */}
            <WallBlock position={[-10, wallY, 2.5]} size={[14, wallH, 2]} material={concreteWall} />

            {/* Front side of corridor (towards dead end Z) -> z=-2 approx */}
            <WallBlock position={[-10, wallY, -2.5]} size={[14, wallH, 2]} material={concreteWall} />

            {/* Far end of left corridor */}
            <AlleyEndingPortal positionZ={0} positionX={-16} rotationY={Math.PI / 2} onEnterPortal={onEnterPortal} />

            {/* --- HAWKER SHOP --- */}
            <HawkerStallShop />

            {/* Corner geometry cleanup */}
            {/* Small pillar to softern the corner transition at x=-4, z=1.5 */}
            <WallBlock position={[-4, wallY, 1.25]} size={[2.2, wallH, 0.5]} material={concreteWall} />

        </group>
    );
}


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
    const { darkMetal } = useBazaarMaterials();
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
            <mesh position={[0, 0, -0.05]} material={darkMetal}>
                <planeGeometry args={[text.length * 0.3 * size, 0.8 * size]} />
            </mesh>
        </group>
    );
}

function ACUnit({ position }: { position: [number, number, number] }) {
    const { metalPanel, darkMetal } = useBazaarMaterials();
    return (
        <group position={position}>
            <mesh material={metalPanel}>
                <boxGeometry args={[0.8, 0.6, 0.4]} />
            </mesh>
            <mesh position={[0, 0, 0.21]} material={darkMetal}>
                <circleGeometry args={[0.25, 16]} />
            </mesh>
        </group>
    );
}

function UpperCityLayer() {
    const { darkMetal, metalPanel } = useBazaarMaterials();
    return (
        <group position={[0, 6, 0]}>
            {/* Left Balconies (only up to cutoff) */}
            <mesh position={[-3.8, 0, -5]} material={darkMetal}>
                <boxGeometry args={[1, 0.2, 4]} />
            </mesh>
            {/* Right Pipes */}
            <mesh position={[3.8, 1, -6]} rotation={[0, 0, Math.PI / 2]} material={metalPanel}>
                <cylinderGeometry args={[0.1, 0.1, 10]} />
            </mesh>
            <mesh position={[3.6, 2, -6]} rotation={[0, 0, Math.PI / 2]} material={darkMetal}>
                <cylinderGeometry args={[0.2, 0.2, 10]} />
            </mesh>

            {/* AC Units Clutter (only up to cutoff) */}
            <ACUnit position={[-3.6, 1, -4]} />
        </group>
    );
}

function Lantern({ position, color, delay = 0 }: { position: [number, number, number], color: string, delay?: number }) {
    const { darkMetal } = useBazaarMaterials();
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
    const { darkMetal } = useBazaarMaterials();
    return (
        <group position={position}>
            {/* Mounting Arm */}
            <mesh position={[0, 0, 0]} material={darkMetal}>
                <boxGeometry args={[0.8, 0.1, 0.1]} />
            </mesh>
            {/* Sign Box */}
            <mesh position={[0.6, -0.2, 0]} material={darkMetal}>
                <boxGeometry args={[0.8, 0.4, 0.15]} />
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
    const { woodCrate, darkMetal } = useBazaarMaterials();
    return (
        <group position={position} rotation={rotation}>
            {/* Cart Base */}
            <mesh position={[0, 0.4, 0]} receiveShadow material={woodCrate}>
                <boxGeometry args={[1.5, 0.8, 1]} />
            </mesh>
            {/* Wheels */}
            <mesh position={[-0.6, 0.2, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={darkMetal}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
            </mesh>
            <mesh position={[0.6, 0.2, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={darkMetal}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
            </mesh>

            {/* Posts */}
            <mesh position={[-0.7, 1.5, 0.4]} material={woodCrate}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
            </mesh>
            <mesh position={[0.7, 1.5, 0.4]} material={woodCrate}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
            </mesh>
            <mesh position={[-0.7, 1.5, -0.4]} material={woodCrate}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
            </mesh>
            <mesh position={[0.7, 1.5, -0.4]} material={woodCrate}>
                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
            </mesh>

            {/* Overhang */}
            <mesh position={[0, 2.8, 0]} rotation={[0, 0, 0.1]} receiveShadow material={woodCrate}>
                <boxGeometry args={[2, 0.1, 1.5]} />
            </mesh>
        </group>
    );
}

function RandomCrates() {
    const { woodCrate } = useBazaarMaterials();
    // Scaffold geometric noise
    const crates = useMemo(() => {
        const out = [];
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 6;
            const z = -4 + (Math.random() * 8); // Spread along alley
            // Avoid mid path
            if (x > -1.5 && x < 1.5) continue;
            // Avoid clipping walls
            if (x < -3.5 || x > 3.5) continue;

            const s = 0.3 + Math.random() * 0.4;
            const rot = Math.random() * Math.PI;
            out.push(
                <mesh key={i} position={[x, s / 2, z]} rotation={[0, rot, 0]} castShadow receiveShadow material={woodCrate}>
                    <boxGeometry args={[s, s, s]} />
                </mesh>
            )
        }
        return out;
    }, [woodCrate]);
    return <group>{crates}</group>;
}

function PaperScraps() {
    const { cloth } = useBazaarMaterials();
    // Scattered white quads on ground
    const scraps = useMemo(() => {
        const out = [];
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = -6 + Math.random() * 8;
            if (Math.abs(x) < 2) continue; // Keep center clear

            const r = Math.random() * Math.PI;
            const scale = 0.05 + Math.random() * 0.1;

            out.push(
                <mesh key={i} position={[x, 0.01 + i * 0.0001, z]} rotation={[-Math.PI / 2, 0, r]} receiveShadow material={cloth}>
                    <planeGeometry args={[scale, scale * 1.4]} />
                </mesh>
            );
        }
        return out;
    }, [cloth]);
    return <group>{scraps}</group>;
}

function SteamVents() {
    // Rotating semi-transparent planes to simulate steam rising from vents
    const vents = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!vents.current) return;
        const t = clock.getElapsedTime();
        vents.current.children.forEach((child, i) => {
            const mesh = child as THREE.Mesh;
            const offset = i * 2;
            mesh.position.y = 0.5 + Math.sin(t * 1.5 + offset) * 0.2;
            mesh.rotation.z += 0.005;
            (mesh.material as THREE.MeshStandardMaterial).opacity = 0.3 + Math.sin(t * 2 + offset) * 0.15;
        });
    });

    return (
        <group ref={vents}>
            <mesh position={[-3.5, 0.5, -2]} rotation={[0, 0, 0]}>
                <planeGeometry args={[0.5, 1.5]} />
                <meshStandardMaterial color="#88aaff" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[3.5, 0.5, -4]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.6, 2.0]} />
                <meshStandardMaterial color="#88aaff" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}



function Beams() {
    const { woodCrate } = useBazaarMaterials();
    // Beams only over left half, only up to Z_CUTOFF
    return (
        <group>
            {[0, -4].filter((z) => z >= Z_CUTOFF).map((z, i) => (
                <mesh key={i} position={[-2.5, 4, z]} material={woodCrate}>
                    <boxGeometry args={[5, 0.2, 0.2]} />
                </mesh>
            ))}
        </group>
    );
}

function HangingBanner({ position, rotation, color }: { position: [number, number, number], rotation?: [number, number, number], color: string }) {
    const { rustPipe } = useBazaarMaterials();
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
            <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} material={rustPipe}>
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
    const { darkMetal, metalPanel } = useBazaarMaterials();
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
            <mesh position={[0, 0.1, 0]} material={darkMetal}>
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
    const { darkMetal, metalPanel } = useBazaarMaterials();
    return (
        <group position={position} rotation={rotation}>
            {/* Base */}
            <mesh position={[0, 0.05, 0]} material={darkMetal}>
                <cylinderGeometry args={[0.1, 0.15, 0.1]} />
            </mesh>
            {/* Stem */}
            <mesh position={[0, 0.3, 0]} material={darkMetal}>
                <cylinderGeometry args={[0.02, 0.02, 0.6]} />
            </mesh>
            {/* Shade */}
            <mesh position={[0, 0.6, 0.1]} rotation={[0.5, 0, 0]} material={metalPanel}>
                <coneGeometry args={[0.15, 0.3, 16, 1, true]} />
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
    const { darkMetal } = useBazaarMaterials();
    return (
        <group position={position}>
            {/* The LED Strip Housing */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.16, 0]} material={darkMetal}>
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

            {/* Vibrant market stalls */}
            <FruitStall position={[2.5, 0, -1]} rotation={[0, -0.4, 0]} />
            <CoffeeCart position={[-1.5, 0, -4]} rotation={[0, 0.3, 0]} />
            <JewelryStand position={[2, 0, -3.5]} rotation={[0, 0.2, 0]} />
            <MarketCart position={[-2.5, 0, -5]} rotation={[0, 0.5, 0]} />

            <UpperCityLayer />

            {/* String lights - winding overhead */}
            <StringLights positions={STRING_LIGHT_POSITIONS} color="#ffcc88" />

            <BirdFlyby />

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
            <RandomCrates />

            <Beams />

            {/* Industrial beams with LED — left side only */}
            <MetalBeam position={[-1.5, 4.5, -5]} />
            <MetalBeam position={[-1.5, 5.0, 1]} />

            {/* Right alley dressing — one crate only (within cutoff) */}
            <mesh position={[3.2, 0.45, -4]} rotation={[0, 0.3, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.6, 0.5, 0.5]} />
            </mesh>

            <PaperScraps />
            <SteamVents />

            {/* Angled Signs */}
            <ProtrudingSign text="REPAIR" position={[-3.9, 3.5, 1]} color="#ff00cc" />
            <ProtrudingSign text="NOODLES" position={[-3.9, 3.2, -1.5]} color="#ffaa00" />
            <ProtrudingSign text="PARTS" position={[3.9, 3.0, -3.5]} color="#00ccff" />

            <CityBackground />

            {/* Removed DustSystem for optimization */}
        </group>
    );
}

function CityBackground() {
    // Distant dark shapes to suggest depth beyond the walls
    const buildings = useMemo(() => {
        const out = [];
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = -20 - Math.random() * 30; // Far back
            const h = 10 + Math.random() * 30;
            const w = 4 + Math.random() * 8;

            out.push(
                <mesh key={i} position={[x, h / 2 - 5, z]}>
                    <boxGeometry args={[w, h, w]} />
                    <meshBasicMaterial color="#020408" fog={true} />
                </mesh>
            );

            // Random window lights
            if (Math.random() > 0.5) {
                const wx = (Math.random() - 0.5) * (w - 1);
                const wy = (Math.random() - 0.5) * (h - 2);
                out.push(
                    <mesh key={`win-${i}`} position={[x + wx, h / 2 - 5 + wy, z + w / 2 + 0.1]}>
                        <planeGeometry args={[0.2, 0.4]} />
                        <meshBasicMaterial color="#ffffcc" />
                    </mesh>
                );
            }
        }
        return out;
    }, []);
    return <group>{buildings}</group>;
}
