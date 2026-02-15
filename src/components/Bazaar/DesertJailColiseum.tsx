"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { EXRLoader } from 'three-stdlib';
import { isNight as getIsNight } from "@/src/modules/world/SunMoonCycle";

// Standard Textures
const CONCRETE_TEXTURE_PATH = "/textures/prison_concrete_wall.png";
const CONCRETE_FLOOR_TEXTURE_PATH = "/textures/prison_floor_dirty.png";

// Aerial Rocks 2 (Steps)
const ROCKS_DIFF = "/textures/aerial_rocks_02/aerial_rocks_02_diff_4k.jpg";
const ROCKS_DISP = "/textures/aerial_rocks_02/aerial_rocks_02_disp_4k.png";
const ROCKS_NOR = "/textures/aerial_rocks_02/aerial_rocks_02_nor_gl_4k.exr";
const ROCKS_ROUGH = "/textures/aerial_rocks_02/aerial_rocks_02_rough_4k.jpg";

// Rocky Pitted Mossy (Temple)
const MOSSY_DIFF = "/textures/rock_pitted_mossy/rock_pitted_mossy_diff_4k.jpg";
const MOSSY_DISP = "/textures/rock_pitted_mossy/rock_pitted_mossy_disp_4k.png";
const MOSSY_NOR = "/textures/rock_pitted_mossy/rock_pitted_mossy_nor_gl_4k.exr";
const MOSSY_ROUGH = "/textures/rock_pitted_mossy/rock_pitted_mossy_rough_4k.exr";

// Damaged Plaster (Tunnel)
const PLASTER_DIFF = "/textures/damaged_plaster/damaged_plaster_diff_4k.jpg";
const PLASTER_DISP = "/textures/damaged_plaster/damaged_plaster_disp_4k.png";
const PLASTER_NOR = "/textures/damaged_plaster/damaged_plaster_nor_gl_4k.exr";
const PLASTER_ROUGH = "/textures/damaged_plaster/damaged_plaster_rough_4k.exr";

// --- MATERIALS ---
const CONCRETE_MAT = new THREE.MeshStandardMaterial({ color: "#999999", roughness: 0.9 });
const DIRTY_WALL_MAT = new THREE.MeshStandardMaterial({ color: "#555555", roughness: 1 });
const RUST_MAT = new THREE.MeshStandardMaterial({ color: "#5a4d41", roughness: 0.8, metalness: 0.4 });
const SAND_MAT = new THREE.MeshStandardMaterial({ color: "#d2b48c", roughness: 1 });
const COURT_MAT = new THREE.MeshStandardMaterial({ color: "#aaddcc", roughness: 0.9 });
const COURT_LINE_MAT = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 });
const NEON_PINK = new THREE.MeshStandardMaterial({ color: "#ff00ff", emissive: "#ff00ff", emissiveIntensity: 2, toneMapped: false });
const NEON_BLUE = new THREE.MeshStandardMaterial({ color: "#00ffff", emissive: "#00ffff", emissiveIntensity: 2, toneMapped: false });
const NEON_PURPLE = new THREE.MeshStandardMaterial({ color: "#ae00ff", emissive: "#ae00ff", emissiveIntensity: 2, toneMapped: false });

// --- CONSTANTS ---
const CELL_BLOCK_WIDTH = 4;
const CELL_BLOCK_HEIGHT = 3;
const CELL_BLOCK_DEPTH = 3;
const PYRAMID_BASE_SIZE = 70;
const PYRAMID_LEVEL_HEIGHT = 10;
const PRISON_LEVEL_Y = 20; // Top of the pyramid

/**
 * A single prison cell unit with a barred window/door.
 */
function PrisonCell({ position, rotation = [0, 0, 0], material }: { position: [number, number, number], rotation?: [number, number, number], material: THREE.Material }) {
    return (
        <group position={position} rotation={rotation}>
            <mesh receiveShadow castShadow material={material}>
                <boxGeometry args={[CELL_BLOCK_WIDTH, CELL_BLOCK_HEIGHT, CELL_BLOCK_DEPTH]} />
            </mesh>
            <mesh position={[0, 0, CELL_BLOCK_DEPTH / 2 + 0.01]} receiveShadow>
                <planeGeometry args={[1.2, 2]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, CELL_BLOCK_DEPTH / 2 + 0.05]}>
                <boxGeometry args={[1.3, 2.1, 0.05]} />
                <meshStandardMaterial color="#333" roughness={0.7} metalness={0.6} wireframe />
            </mesh>
            <mesh position={[0, -1.3, CELL_BLOCK_DEPTH / 2 + 0.8]} receiveShadow castShadow material={material}>
                <boxGeometry args={[CELL_BLOCK_WIDTH, 0.2, 1.6]} />
            </mesh>
            <mesh position={[0, -0.8, CELL_BLOCK_DEPTH / 2 + 1.55]} receiveShadow material={RUST_MAT}>
                <boxGeometry args={[CELL_BLOCK_WIDTH, 0.8, 0.05]} />
            </mesh>
        </group>
    );
}

/**
 * A stack of cells forming a wall.
 */
function CellBlockRow({ count, startPos, gap, rotation, material }: { count: number, startPos: [number, number, number], gap: number, rotation?: [number, number, number], material: THREE.Material }) {
    const cells = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            const xOffset = i * (CELL_BLOCK_WIDTH + gap);
            return (
                <group key={i} position={[xOffset, 0, 0]}>
                    <PrisonCell position={[0, 0, 0]} material={material} />
                    <PrisonCell position={[0, CELL_BLOCK_HEIGHT, 0]} material={material} />
                </group>
            );
        });
    }, [count, gap, material]);

    return <group position={startPos} rotation={rotation}>{cells}</group>;
}

/** 
 * Cyberpunk Neon Sign 
 */
function NeonSign({ position, rotation, color, text }: { position: [number, number, number], rotation?: [number, number, number], color: THREE.Material, text?: string }) {
    // Simple geometric abstraction for now
    return (
        <group position={position} rotation={rotation}>
            <mesh material={color}>
                <boxGeometry args={[3, 1, 0.2]} />
            </mesh>
            <mesh position={[0, 0, 0.15]} material={color}>
                <ringGeometry args={[0.5, 0.6, 32]} />
            </mesh>
        </group>
    );
}

/** 
 * The Cyberpunk Bazaar Interior 
 * Located inside the pyramid base.
 */
function BazaarInterior() {
    return (
        <group position={[0, 0, 0]}>
            {/* Ground Floor */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#222" roughness={0.6} metalness={0.5} />
            </mesh>

            {/* Ceiling (Bottom of next level) */}
            <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 9.9, 0]}>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>

            {/* Stalls / Shops */}
            <group position={[-12, 0, -10]}>
                <mesh position={[0, 2, 0]} material={DIRTY_WALL_MAT}><boxGeometry args={[6, 4, 6]} /></mesh>
                <NeonSign position={[0, 3.5, 3.1]} color={NEON_PINK} />
            </group>
            <group position={[12, 0, -10]}>
                <mesh position={[0, 2, 0]} material={DIRTY_WALL_MAT}><boxGeometry args={[6, 4, 6]} /></mesh>
                <NeonSign position={[0, 3.5, 3.1]} color={NEON_BLUE} />
            </group>
            <group position={[-12, 0, 10]}>
                <mesh position={[0, 2, 0]} material={DIRTY_WALL_MAT}><boxGeometry args={[6, 4, 6]} /></mesh>
                <NeonSign position={[0, 3.5, 3.1]} color={NEON_PURPLE} />
            </group>
            <group position={[12, 0, 10]}>
                <mesh position={[0, 2, 0]} material={DIRTY_WALL_MAT}><boxGeometry args={[6, 4, 6]} /></mesh>
                <NeonSign position={[0, 3.5, 3.1]} color={NEON_PINK} />
            </group>

            {/* 2nd Story Mezzanine */}
            <mesh position={[0, 5, -15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={RUST_MAT}>
                <planeGeometry args={[40, 10]} />
            </mesh>
            <mesh position={[0, 5, 15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={RUST_MAT}>
                <planeGeometry args={[40, 10]} />
            </mesh>

            {/* Stairs */}
            <group position={[-15, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                {new Array(20).fill(0).map((_, i) => (
                    <mesh key={i} position={[0, i * 0.25, i * 0.4]} receiveShadow castShadow material={RUST_MAT}>
                        <boxGeometry args={[4, 0.25, 0.4]} />
                    </mesh>
                ))}
                {/* Railing */}
                <mesh position={[-1.9, 2.5, 4]} rotation={[Math.PI / 5.5, 0, 0]} material={RUST_MAT}>
                    <cylinderGeometry args={[0.05, 0.05, 10]} />
                </mesh>
                <mesh position={[1.9, 2.5, 4]} rotation={[Math.PI / 5.5, 0, 0]} material={RUST_MAT}>
                    <cylinderGeometry args={[0.05, 0.05, 10]} />
                </mesh>
            </group>

            {/* Cables / Wires */}
            {/* Random cables hanging from ceiling */}
            {new Array(10).fill(0).map((_, i) => {
                const x = (Math.random() - 0.5) * 30;
                const z = (Math.random() - 0.5) * 30;
                const length = 2 + Math.random() * 4;
                return (
                    <mesh key={i} position={[x, 9.9, z]} rotation={[0, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#111" })}>
                        <cylinderGeometry args={[0.05, 0.05, length]} />
                    </mesh>
                )
            })}

            {/* Horizontal cables across the void */}
            <mesh position={[0, 8, 0]} rotation={[0, 0, Math.PI / 2]} material={new THREE.MeshStandardMaterial({ color: "#222" })}>
                <cylinderGeometry args={[0.02, 0.02, 38]} />
            </mesh>
            <mesh position={[5, 7.5, 0]} rotation={[0, 0, Math.PI / 2]} material={new THREE.MeshStandardMaterial({ color: "#222" })}>
                <cylinderGeometry args={[0.02, 0.02, 38]} />
            </mesh>

            {/* Interior Ambient Light */}
            <pointLight position={[0, 8, 0]} intensity={2} color="#aa00ff" distance={30} decay={2} />
            <pointLight position={[-10, 4, -10]} intensity={2} color="#00ffff" distance={15} decay={2} />
            <pointLight position={[10, 4, 10]} intensity={2} color="#ff0044" distance={15} decay={2} />

        </group>
    );
}

/**
 * The Relocated Prison Yard
 * Sits on top of the pyramid.
 */
function PrisonYardTop({ material }: { material: THREE.Material }) {
    return (
        <group position={[0, PRISON_LEVEL_Y, 0]}>
            {/* Main Court Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={COURT_MAT}>
                <planeGeometry args={[20, 30]} />
            </mesh>

            {/* Court Markings */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow material={COURT_LINE_MAT}>
                <ringGeometry args={[3, 3.2, 32]} />
            </mesh>

            {/* Walls / Cells */}
            <CellBlockRow count={5} startPos={[-8, 1.5, -16]} gap={0} material={material} />
            <CellBlockRow count={5} startPos={[-8, 1.5, 16]} gap={0} rotation={[0, Math.PI, 0]} material={material} />
            <CellBlockRow count={3} startPos={[12, 1.5, -6]} gap={0} rotation={[0, -Math.PI / 2, 0]} material={material} />
            <CellBlockRow count={3} startPos={[-12, 1.5, 6]} gap={0} rotation={[0, Math.PI / 2, 0]} material={material} />

            {/* Cage / Roof */}
            <mesh position={[0, 8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[26, 36]} />
                <meshStandardMaterial color="#333" wireframe transparent opacity={0.3} />
            </mesh>

            {/* Props */}
            <group position={[0, 0, -13]}>
                <mesh position={[-2, 1, 0]} material={RUST_MAT}><cylinderGeometry args={[0.05, 0.05, 2]} /></mesh>
                <mesh position={[2, 1, 0]} material={RUST_MAT}><cylinderGeometry args={[0.05, 0.05, 2]} /></mesh>
                <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]} material={RUST_MAT}><cylinderGeometry args={[0.05, 0.05, 4]} /></mesh>
            </group>
            <group position={[0, 0, 13]} rotation={[0, Math.PI, 0]}>
                <mesh position={[-2, 1, 0]} material={RUST_MAT}><cylinderGeometry args={[0.05, 0.05, 2]} /></mesh>
                <mesh position={[2, 1, 0]} material={RUST_MAT}><cylinderGeometry args={[0.05, 0.05, 2]} /></mesh>
                <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]} material={RUST_MAT}><cylinderGeometry args={[0.05, 0.05, 4]} /></mesh>
            </group>
        </group>
    );
}

/**
 * Framing geometry for the tunnel exit view
 */
function TunnelExitFrame({ material }: { material: THREE.Material }) {
    return (
        <group position={[0, 0, -15]} rotation={[0, 0, 0]}>
            {/* Left Wall */}
            <mesh position={[-4, 2.5, 0]} receiveShadow material={material}>
                <boxGeometry args={[4, 8, 8]} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[4, 2.5, 0]} receiveShadow material={material}>
                <boxGeometry args={[4, 8, 8]} />
            </mesh>
            {/* Ceiling / Arch */}
            <mesh position={[0, 5.5, 0]} receiveShadow material={material}>
                <boxGeometry args={[12, 2, 8]} />
            </mesh>
            {/* Floor (Tunnel extension) */}
            <mesh position={[0, -0.1, 0]} receiveShadow material={material}>
                <boxGeometry args={[12, 0.2, 8]} />
            </mesh>
        </group>
    );
}
function SteppedPyramid({ templeMat, stepsMat, tunnelMat }: { templeMat: THREE.Material, stepsMat: THREE.Material, tunnelMat: THREE.Material }) {
    return (
        <group>
            {/* Base Level - Hollow for Bazaar */}
            {/* Front Wall (with Tunnel) */}
            <mesh position={[0, 5, 32.5]} material={tunnelMat}>
                <boxGeometry args={[PYRAMID_BASE_SIZE, 10, 5, 64, 16, 16]} />
            </mesh>

            {/* Back Wall */}
            <mesh position={[0, 5, -32.5]} material={templeMat}>
                <boxGeometry args={[PYRAMID_BASE_SIZE, 10, 5, 64, 16, 16]} />
            </mesh>
            {/* Left Wall */}
            <mesh position={[-32.5, 5, 0]} rotation={[0, Math.PI / 2, 0]} material={templeMat}>
                <boxGeometry args={[60, 10, 5, 64, 16, 16]} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[32.5, 5, 0]} rotation={[0, Math.PI / 2, 0]} material={templeMat}>
                <boxGeometry args={[60, 10, 5, 64, 16, 16]} />
            </mesh>

            {/* Tunnel Entrance Geometry Replacements for Front Wall */}
            <mesh position={[-20, 5, 32.5]} material={tunnelMat}>
                <boxGeometry args={[30, 10, 5, 64, 16, 16]} />
            </mesh>
            <mesh position={[20, 5, 32.5]} material={tunnelMat}>
                <boxGeometry args={[30, 10, 5, 64, 16, 16]} />
            </mesh>
            {/* Tunnel Roof */}
            <mesh position={[0, 8, 32.5]} material={tunnelMat}>
                <boxGeometry args={[10, 4, 5, 16, 8, 8]} />
            </mesh>


            {/* Level 2 (Mid) */}
            <mesh position={[0, 15, 0]} material={templeMat}>
                <boxGeometry args={[50, 10, 50, 64, 16, 64]} />
            </mesh>

            {/* Level 3 (Top Base) */}
            <mesh position={[0, 20, 0]} material={templeMat}>
                <boxGeometry args={[40, 10, 40, 64, 16, 64]} />
            </mesh>

            {/* Stairs on the outside (Mayan style) */}
            <mesh position={[0, 10, 26]} rotation={[-0.8, 0, 0]} material={stepsMat}>
                <boxGeometry args={[8, 20, 2, 32, 64, 8]} />
            </mesh>
        </group>
    );
}


/**
 * Main Component: Desert Jail Coliseum Redesign
 */
export function DesertJailColiseum() {
    // Center the pyramid in front of the camera (Camera is at z=-12 looking -Z)
    const center: [number, number, number] = [0, 0, -60];

    const [pebbles, brownRock, concrete] = useTexture([
        "/textures/prison_floor_dirty.png",
        "/textures/floor-stone.png",
        "/textures/prison_concrete_wall.png",
    ]);

    // --- LOAD NEW TEXTURES ---
    const [rocksDiff, rocksDisp, rocksRough] = useTexture([ROCKS_DIFF, ROCKS_DISP, ROCKS_ROUGH]);
    const [mossyDiff, mossyDisp] = useTexture([MOSSY_DIFF, MOSSY_DISP]);
    const [plasterDiff, plasterDisp] = useTexture([PLASTER_DIFF, PLASTER_DISP]);

    // Load EXR textures - Temporarily disabled due to crashes
    // const [rocksNor, mossyNor, mossyRough, plasterNor, plasterRough] = useLoader(EXRLoader, [
    //     ROCKS_NOR, MOSSY_NOR, MOSSY_ROUGH, PLASTER_NOR, PLASTER_ROUGH
    // ]);
    const rocksNor = null, mossyNor = null, mossyRough = null, plasterNor = null, plasterRough = null;

    // Handle texture encoding / repeating
    useMemo(() => {
        rocksDiff.colorSpace = THREE.SRGBColorSpace;
        mossyDiff.colorSpace = THREE.SRGBColorSpace;
        plasterDiff.colorSpace = THREE.SRGBColorSpace;

        [rocksDiff, rocksDisp, mossyDiff, mossyDisp, plasterDiff, plasterDisp].forEach(t => {
            if (t) t.wrapS = t.wrapT = THREE.RepeatWrapping;
        });

        // Steps
        rocksDiff.repeat.set(2, 4); rocksDisp.repeat.set(2, 4);
        // if(rocksNor) rocksNor.repeat.set(2, 4); if(rocksRough) rocksRough.repeat.set(2, 4);

        // Temple
        mossyDiff.repeat.set(8, 2); mossyDisp.repeat.set(8, 2);
        // if(mossyNor) mossyNor.repeat.set(8, 2); if(mossyRough) mossyRough.repeat.set(8, 2);

        // Tunnel
        plasterDiff.repeat.set(4, 2); plasterDisp.repeat.set(4, 2);
        // if(plasterNor) plasterNor.repeat.set(4, 2); if(plasterRough) plasterRough.repeat.set(4, 2);

    }, [rocksDiff, rocksDisp, rocksNor, rocksRough, mossyDiff, mossyDisp, mossyNor, mossyRough, plasterDiff, plasterDisp, plasterNor, plasterRough]);


    // --- MATERIALS ---
    const stepsMat = useMemo(() => new THREE.MeshStandardMaterial({
        map: rocksDiff, displacementMap: rocksDisp, displacementScale: 0.2, normalMap: rocksNor, roughnessMap: rocksRough, roughness: 1
    }), [rocksDiff, rocksDisp, rocksNor, rocksRough]);

    const templeMat = useMemo(() => new THREE.MeshStandardMaterial({
        map: mossyDiff, displacementMap: mossyDisp, displacementScale: 0.3, normalMap: mossyNor, roughnessMap: mossyRough, roughness: 1
    }), [mossyDiff, mossyDisp, mossyNor, mossyRough]);

    const tunnelMat = useMemo(() => new THREE.MeshStandardMaterial({
        map: plasterDiff, displacementMap: plasterDisp, displacementScale: 0.1, normalMap: plasterNor, roughnessMap: plasterRough, roughness: 1
    }), [plasterDiff, plasterDisp, plasterNor, plasterRough]);

    const concreteMat = useMemo(() => new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.9 }), [concrete]);


    const [isNight, setIsNight] = useState(false);
    const prevNightRef = useRef(false);

    useFrame(() => {
        const night = getIsNight();
        if (night !== prevNightRef.current) {
            prevNightRef.current = night;
            setIsNight(night);
        }
    });

    return (
        <group>
            {/* --- TUNNEL EXIT FRAME (At Camera Start) --- */}
            <TunnelExitFrame material={tunnelMat} />

            <group position={center}>
                {/* --- TERRAIN & ENVIRONMENT --- */}
                {/* Infinite Sand */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow material={SAND_MAT}>
                    <planeGeometry args={[200, 200, 32, 32]} />
                </mesh>

                {/* --- STRUCTURE --- */}
                <SteppedPyramid templeMat={templeMat} stepsMat={stepsMat} tunnelMat={tunnelMat} />

                {/* --- INTERIOR --- */}
                <BazaarInterior />

                {/* --- ROOFTOP PRISON --- */}
                <PrisonYardTop material={concreteMat} />

                {/* --- LIGHTING --- */}
                {isNight && (
                    <>
                        <spotLight position={[10, 40, 10]} target-position={[0, 20, 0]} intensity={4} angle={0.5} penumbra={0.5} castShadow />
                        <spotLight position={[-10, 40, -10]} target-position={[0, 20, 0]} intensity={4} angle={0.5} penumbra={0.5} castShadow />
                    </>
                )}
            </group>
        </group>
    );
} 
