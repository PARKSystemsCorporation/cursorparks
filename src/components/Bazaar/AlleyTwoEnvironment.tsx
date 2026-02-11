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
        const zPositions = [-4, -8, -12, -16, -19];

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

function ConstructedWalls() {
    const wallH = 16;
    const wallY = wallH / 2;
    const { concreteWall, concreteWallRight } = useBazaarMaterials();

    return (
        <group>
            {/* Left wall (x = -3) - solid, with smith hole z -2 to 0, fixer hole z -6 to -4 */}
            <WallBlock position={[-WALL_X, wallY, 1]} size={[2, wallH, 4]} material={concreteWall} />
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

// Portal to return to Alley One (at z=2, entrance of Alley Two)
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
        <group position={[0, 0, 2]}>
            <mesh position={[0, 1.5, 0]} material={MAT_DARK} castShadow receiveShadow>
                <boxGeometry args={[4, 3, 0.4]} />
            </mesh>
            <mesh
                ref={portalRef}
                position={[0, 1.5, 0.25]}
                onPointerDown={() => onReturn?.()}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = onReturn ? "pointer" : "default";
                }}
                onPointerOut={() => {
                    document.body.style.cursor = "default";
                }}
            >
                <planeGeometry args={[2.5, 2]} />
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
