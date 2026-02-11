import { useRef, useMemo, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBazaarMaterials } from "./BazaarMaterials";
import { BAZAAR_BRIGHTNESS } from "./brightness";
import { EMISSIVE_SCALE, PRACTICAL_LIGHT_INTENSITY } from "./lightingMode";
import LedBar from "./LedBar";
import NeonSign from "./NeonSign";

// Alley Two: narrower back alley (x ± 3), extends z 0 → -22
const ALLEY_TWO_WIDTH = 6;
const WALL_X = 3;
const Z_END = -22;

const MAT_DARK = new THREE.MeshStandardMaterial({ color: "#222" });
const MAT_DARKER = new THREE.MeshStandardMaterial({ color: "#333" });
const MAT_METAL = new THREE.MeshStandardMaterial({ color: "#444", roughness: 0.4, metalness: 0.7 });

const pseudoRandom = (seed: number) => ((seed * 0.61803) % 1);

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

function WallBlock({
    position,
    size,
    material,
}: {
    position: [number, number, number];
    size: [number, number, number];
    material?: THREE.MeshStandardMaterial;
}) {
    const { concreteWall } = useBazaarMaterials();
    const mat = material ?? concreteWall;
    return (
        <mesh position={position} rotation={[0, 0, 0]} receiveShadow castShadow material={mat}>
            <boxGeometry args={size} />
        </mesh>
    );
}

function WindowGrid() {
    const windows = useMemo(() => {
        const out: ReactNode[] = [];
        const leftY = [3, 6, 9, 12];
        const rightY = [2.5, 5.5, 8.5, 11.5];
        const zPositions = [2, 3, -4, -8, -12, -16, -19];

        for (const z of zPositions) {
            for (const y of leftY) {
                const seed = 1000 + y * 17 + z;
                out.push(
                    <mesh key={`l-${y}-${z}`} position={[-WALL_X - 0.1, y, z]} rotation={[0, Math.PI / 2, 0]}>
                        <planeGeometry args={[1.2, 1.6]} />
                        <meshStandardMaterial
                            color="#ffaa66"
                            emissive="#ffe4cc"
                            emissiveIntensity={(1.2 + pseudoRandom(seed)) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE + 0.4}
                            toneMapped={EMISSIVE_SCALE === 0}
                        />
                    </mesh>
                );
            }
            for (const y of rightY) {
                const seed = 2000 + y * 17 + z;
                out.push(
                    <mesh key={`r-${y}-${z}`} position={[WALL_X + 0.1, y, z]} rotation={[0, -Math.PI / 2, 0]}>
                        <planeGeometry args={[1.2, 1.6]} />
                        <meshStandardMaterial
                            color="#66aaff"
                            emissive="#aaddff"
                            emissiveIntensity={(1.2 + pseudoRandom(seed)) * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE + 0.5}
                            toneMapped={EMISSIVE_SCALE === 0}
                        />
                    </mesh>
                );
            }
        }
        return out;
    }, []);

    return <group>{windows}</group>;
}

function Cables() {
    const curve1 = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.5, 3.5, 3),
        new THREE.Vector3(0, 3, 0),
        new THREE.Vector3(2.5, 3.2, -3),
    ]), []);
    const curve2 = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.8, 5, 1),
        new THREE.Vector3(0, 4.5, -5),
        new THREE.Vector3(2.8, 5.2, -10),
    ]), []);
    return (
        <group>
            <mesh>
                <tubeGeometry args={[curve1, 20, 0.02, 8, false]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            <mesh>
                <tubeGeometry args={[curve2, 20, 0.025, 8, false]} />
                <meshStandardMaterial color="#000000" roughness={0.9} />
            </mesh>
        </group>
    );
}

function WindowAC({ x, y, z, tilt = 0 }: { x: number; y: number; z: number; tilt?: number }) {
    const isLeft = x < 0;
    const rotY = isLeft ? Math.PI / 2 : -Math.PI / 2;
    return (
        <group position={[x, y, z]} rotation={[tilt, rotY, 0]}>
            <mesh castShadow material={MAT_METAL}>
                <boxGeometry args={[0.45, 0.3, 0.25]} />
            </mesh>
            <mesh position={[0, 0, 0.14]} material={MAT_DARK}>
                <circleGeometry args={[0.1, 12]} />
            </mesh>
        </group>
    );
}

const WINDOW_AC_POSITIONS: { x: number; y: number; z: number; tilt?: number }[] = [
    { x: -WALL_X - 0.05, y: 4, z: 2 }, { x: WALL_X + 0.05, y: 3.5, z: 2 },
    { x: -WALL_X - 0.05, y: 7, z: -4 }, { x: WALL_X + 0.05, y: 6, z: -8 },
    { x: -WALL_X - 0.05, y: 10, z: -12 },
];

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
                <cylinderGeometry args={[0.012, 0.012, ALLEY_TWO_WIDTH + 0.4, 8]} />
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
    { y: 2.8, z: 2.5, w: 1.8, h: 1.2 },
    { y: 2.4, z: -2, w: 2, h: 1 },
    { y: 3.2, z: -8, w: 1.6, h: 1.3 },
    { y: 2.6, z: -14, w: 1.9, h: 1.1 },
];

function HangingBlankets() {
    return (
        <group>
            {BLANKET_LINES.map((line, i) => (
                <HangingBlanket key={i} y={line.y} z={line.z} width={line.w} height={line.h} color={FABRIC_COLORS[i % FABRIC_COLORS.length]} />
            ))}
        </group>
    );
}

function Clothesline({ y, z }: { y: number; z: number }) {
    const clothes = useMemo(() => [
        { x: -1.5, type: "shirt" as const, rot: 0.1 },
        { x: 0, type: "towel" as const, rot: -0.05 },
        { x: 1.4, type: "pants" as const, rot: 0.08 },
        { x: -0.6, type: "towel" as const, rot: -0.12 },
    ], []);
    return (
        <group position={[0, y, z]}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.01, 0.01, ALLEY_TWO_WIDTH + 0.2, 6]} />
                <meshStandardMaterial color="#1a1a1a" roughness={1} />
            </mesh>
            {clothes.map((c, i) => (
                <group key={i} position={[c.x, -0.12, 0]} rotation={[0, 0, c.rot]}>
                    {c.type === "shirt" && (
                        <>
                            <mesh castShadow material={MAT_DARKER}>
                                <boxGeometry args={[0.3, 0.4, 0.035]} />
                            </mesh>
                            <mesh position={[-0.15, -0.18, 0]} material={MAT_DARK}>
                                <boxGeometry args={[0.1, 0.22, 0.025]} />
                            </mesh>
                            <mesh position={[0.15, -0.18, 0]} material={MAT_DARK}>
                                <boxGeometry args={[0.1, 0.22, 0.025]} />
                            </mesh>
                        </>
                    )}
                    {c.type === "pants" && (
                        <>
                            <mesh position={[-0.08, -0.3, 0]} castShadow material={MAT_DARKER}>
                                <boxGeometry args={[0.12, 0.45, 0.035]} />
                            </mesh>
                            <mesh position={[0.08, -0.3, 0]} castShadow material={MAT_DARKER}>
                                <boxGeometry args={[0.12, 0.45, 0.035]} />
                            </mesh>
                        </>
                    )}
                    {c.type === "towel" && (
                        <mesh castShadow receiveShadow>
                            <planeGeometry args={[0.4, 0.28]} />
                            <meshStandardMaterial color={FABRIC_COLORS[(i + 2) % FABRIC_COLORS.length]} roughness={0.9} side={THREE.DoubleSide} />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
}

const CLOTHESLINE_POSITIONS = [
    { y: 2.6, z: 3 },
    { y: 2.9, z: -5 },
    { y: 2.4, z: -11 },
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

function Ductwork() {
    return (
        <group>
            <mesh position={[-WALL_X - 0.15, 2.5, 1]} rotation={[0, 0, Math.PI / 2]} material={MAT_METAL}>
                <cylinderGeometry args={[0.12, 0.12, 8, 8]} />
            </mesh>
            <mesh position={[WALL_X + 0.15, 3, -4]} rotation={[0, 0, Math.PI / 2]} material={MAT_DARKER}>
                <cylinderGeometry args={[0.1, 0.1, 12, 8]} />
            </mesh>
            <mesh position={[-WALL_X - 0.18, 5, -10]} rotation={[0, 0, Math.PI / 2]} material={MAT_METAL}>
                <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
            </mesh>
        </group>
    );
}

function ConstructedWalls() {
    const wallH = 16;
    const wallY = wallH / 2;
    const { concreteWall, concreteWallRight } = useBazaarMaterials();

    return (
        <group>
            {/* Entrance walls (z 0–5) - cyber alley canyon with windows, AC, ductwork */}
            <WallBlock position={[-WALL_X, wallY, 2.5]} size={[2, wallH, 5]} material={concreteWall} />
            <WallBlock position={[WALL_X, wallY, 2.5]} size={[2, wallH, 5]} material={concreteWallRight} />

            {/* Left wall (x = -3) - alley continues, with smith hole z -2 to 0, fixer hole z -6 to -4 */}
            <WallBlock position={[-WALL_X, wallY, -2]} size={[2, wallH, 6]} material={concreteWall} />
            <WallBlock position={[-WALL_X, wallY, -5]} size={[2, wallH, 2]} material={concreteWall} />
            <WallBlock position={[-WALL_X, wallY, -11]} size={[2, wallH, 6]} material={concreteWall} />
            <WallBlock position={[-WALL_X, wallY, -19]} size={[2, wallH, 6]} material={concreteWall} />

            {/* Right wall (x = 3) - solid */}
            <WallBlock position={[WALL_X, wallY, -5]} size={[2, wallH, 10]} material={concreteWallRight} />
            <WallBlock position={[WALL_X, wallY, -16]} size={[2, wallH, 12]} material={concreteWallRight} />

            {/* Back wall */}
            <WallBlock position={[0, wallY, Z_END - 1]} size={[ALLEY_TWO_WIDTH + 4, wallH, 2]} material={concreteWall} />
        </group>
    );
}

function SmithStall() {
    const { woodCrate, metalPanel } = useBazaarMaterials();
    const dimGreen = "#338855";
    const greenIntensity = 0.55 * BAZAAR_BRIGHTNESS * (EMISSIVE_SCALE > 0 ? EMISSIVE_SCALE : 0.6);

    return (
        <group position={[-WALL_X - 0.5, 0.8, -1]}>
            <mesh position={[-0.5, 0, 0]} receiveShadow material={metalPanel}>
                <boxGeometry args={[0.15, 2, 2.2]} />
            </mesh>
            <mesh position={[-0.2, 0.15, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.4, 0.7, 2]} />
            </mesh>
            <mesh position={[-0.25, 0.55, 0]}>
                <boxGeometry args={[0.03, 0.04, 2.1]} />
                <meshStandardMaterial color={dimGreen} emissive={dimGreen} emissiveIntensity={greenIntensity} />
            </mesh>
            <mesh position={[-0.5, 1.2, 0]} material={metalPanel}>
                <boxGeometry args={[0.08, 0.06, 1.6]} />
            </mesh>
            <mesh position={[-0.55, 1.22, 0]}>
                <boxGeometry args={[0.02, 0.02, 1.5]} />
                <meshStandardMaterial color={dimGreen} emissive={dimGreen} emissiveIntensity={greenIntensity} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight color={dimGreen} intensity={0.9} distance={2.5} decay={2} position={[-0.3, 0.5, 0]} />
            )}
        </group>
    );
}

function FixerStall() {
    const { metalPanel } = useBazaarMaterials();
    const dimPurple = "#6644aa";
    const purpleIntensity = 0.5 * BAZAAR_BRIGHTNESS * (EMISSIVE_SCALE > 0 ? EMISSIVE_SCALE : 0.6);

    return (
        <group position={[-WALL_X - 0.5, 0.75, -5]}>
            <mesh position={[-0.5, 0, 0]} receiveShadow material={metalPanel}>
                <boxGeometry args={[0.15, 1.9, 2.2]} />
            </mesh>
            <mesh position={[-0.2, -0.1, 0]} castShadow receiveShadow material={metalPanel}>
                <boxGeometry args={[0.35, 0.15, 2]} />
            </mesh>
            <mesh position={[-0.2, 0.5, 0]}>
                <boxGeometry args={[0.02, 0.03, 2.05]} />
                <meshStandardMaterial color={dimPurple} emissive={dimPurple} emissiveIntensity={purpleIntensity} />
            </mesh>
            <mesh position={[-0.5, 0.9, 0]} material={metalPanel}>
                <boxGeometry args={[0.08, 0.05, 1.4]} />
            </mesh>
            <mesh position={[-0.55, 0.92, 0]}>
                <boxGeometry args={[0.02, 0.02, 1.3]} />
                <meshStandardMaterial color={dimPurple} emissive={dimPurple} emissiveIntensity={purpleIntensity} />
            </mesh>
            {PRACTICAL_LIGHT_INTENSITY > 0 && (
                <pointLight color={dimPurple} intensity={0.8} distance={2} decay={2} position={[-0.3, 0.4, 0]} />
            )}
        </group>
    );
}

function MerchantStall() {
    const { woodCrate, metalPanel } = useBazaarMaterials();

    return (
        <group position={[WALL_X + 0.3, 0, -10]}>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[2.5, 1, 1.2]} />
            </mesh>
            <mesh position={[0, 1.1, 0.61]}>
                <planeGeometry args={[2.5, 0.05]} />
                <meshStandardMaterial color="#ff8800" emissive="#ff8800" emissiveIntensity={EMISSIVE_SCALE} />
            </mesh>
            <mesh position={[0, 1.6, -0.3]} material={metalPanel}>
                <boxGeometry args={[2.4, 0.08, 0.6]} />
            </mesh>
            <mesh position={[-0.8, 0.3, 0.2]} rotation={[0, 0.2, 0]} material={woodCrate}>
                <boxGeometry args={[0.4, 0.3, 0.3]} />
            </mesh>
            <mesh position={[0.6, 0.35, -0.2]} rotation={[0, -0.1, 0]} material={metalPanel}>
                <boxGeometry args={[0.35, 0.4, 0.35]} />
            </mesh>
        </group>
    );
}

function HangingBulb({ position, color = "#ffaa55" }: { position: [number, number, number]; color?: string }) {
    const group = useRef<THREE.Group>(null);
    const frameCount = useRef(0);
    useFrame(({ clock }) => {
        if (!group.current) return;
        frameCount.current++;
        if (frameCount.current % 2 !== 0) return;
        group.current.rotation.z = Math.sin(clock.getElapsedTime() * 2 + position[0]) * 0.05;
    });

    return (
        <group ref={group} position={position}>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 1]} />
                <meshBasicMaterial color="#111" />
            </mesh>
            <mesh position={[0, 0.1, 0]} material={MAT_DARK}>
                <cylinderGeometry args={[0.03, 0.03, 0.1]} />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE} />
            </mesh>
        </group>
    );
}

// Small return door embedded in left wall (discrete, not a giant block)
export type AlleyTwoReturnPortalProps = {
    onReturn?: () => void;
};

export function AlleyTwoReturnPortal({ onReturn }: AlleyTwoReturnPortalProps) {
    const portalRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!portalRef.current || EMISSIVE_SCALE === 0) return;
        const t = clock.getElapsedTime();
        const pulse = 0.7 + 0.3 * Math.sin(t * 1.2);
        const mat = portalRef.current.material as THREE.MeshStandardMaterial;
        if (mat.emissive) mat.emissiveIntensity = pulse * 1.2 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE;
    });

    return (
        <group position={[-WALL_X - 0.12, 1.2, 3]}>
            {/* Recessed door frame in wall */}
            <mesh position={[0, 0, 0]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[0.15, 1.4, 0.8]} />
            </mesh>
            {/* Small glowing exit panel - clickable */}
            <mesh
                ref={portalRef}
                position={[0.08, 0, 0]}
                onPointerDown={() => onReturn?.()}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = onReturn ? "pointer" : "default";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <planeGeometry args={[0.6, 0.5]} />
                <meshStandardMaterial
                    color="#4466aa"
                    emissive="#2288ff"
                    emissiveIntensity={1.2 * BAZAAR_BRIGHTNESS * EMISSIVE_SCALE}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

export type AlleyTwoEnvironmentProps = {
    onReturn?: () => void;
};

export default function AlleyTwoEnvironment({ onReturn }: AlleyTwoEnvironmentProps = {}) {
    const { dirtRoad, woodCrate } = useBazaarMaterials();

    const tiledDirt = useMemo(() => {
        const m = dirtRoad.clone();
        if (m.map) {
            m.map = m.map.clone();
            m.map.repeat.set(6, 25);
        }
        if (m.roughnessMap) {
            m.roughnessMap = m.roughnessMap.clone();
            m.roughnessMap.repeat.set(6, 25);
        }
        if (m.normalMap) {
            m.normalMap = m.normalMap.clone();
            m.normalMap.repeat.set(6, 25);
        }
        return m;
    }, [dirtRoad]);

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -11]} receiveShadow material={tiledDirt}>
                <planeGeometry args={[ALLEY_TWO_WIDTH + 2, 26]} />
            </mesh>

            <ConstructedWalls />
            <WindowGrid />
            <WindowACs />
            <HangingBlankets />
            <Clotheslines />
            <Cables />
            <Ductwork />
            <POVLight />

            <SmithStall />
            <FixerStall />
            <MerchantStall />

            <NeonSign text="SMITH" position={[-3.4, 3.2, -1]} rotation={[0, Math.PI / 2, 0]} color="#338855" scale={0.9} />
            <NeonSign text="FIX" position={[-3.4, 2.8, -5]} rotation={[0, Math.PI / 2, 0]} color="#6644aa" scale={0.8} />
            <NeonSign text="CURIOS" position={[3.4, 3.5, -10]} rotation={[0, -Math.PI / 2, 0]} color="#ff8800" scale={0.85} />

            <LedBar
                color="#338855"
                position={[-3.02, 0.18, -3]}
                rotation={[0, Math.PI / 2, 0]}
                length={6}
                thickness={0.08}
            />
            <LedBar
                color="#6644aa"
                position={[-3.02, 0.18, -8]}
                rotation={[0, Math.PI / 2, 0]}
                length={4}
                thickness={0.08}
            />
            <LedBar
                color="#ff8800"
                position={[3.02, 0.18, -12]}
                rotation={[0, -Math.PI / 2, 0]}
                length={5}
                thickness={0.08}
            />

            {[-2, -6, -10, -14, -18, -21].map((z) => (
                <HangingBulb key={`bulb-${z}`} position={[Math.sin(z * 0.3) * 0.4, 3.2, z]} color="#ffaa55" />
            ))}

            <mesh position={[-2, 0.5, -4]} rotation={[0, 0.2, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.6, 0.5, 0.5]} />
            </mesh>
            <mesh position={[2, 0.4, -7]} rotation={[0, -0.2, 0]} castShadow receiveShadow material={woodCrate}>
                <boxGeometry args={[0.5, 0.4, 0.6]} />
            </mesh>

            <AlleyTwoReturnPortal onReturn={onReturn} />
        </group>
    );
}
