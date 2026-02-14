"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isNight as getIsNight } from "@/src/modules/world/SunMoonCycle";

const CELL_BLOCK_WIDTH = 4;
const CELL_BLOCK_HEIGHT = 3;
const CELL_BLOCK_DEPTH = 3;
const COURT_WIDTH = 20;
const COURT_LENGTH = 30;

// Reusing geometry for performance
const CONCRETE_MAT = new THREE.MeshStandardMaterial({ color: "#999999", roughness: 0.9 });
const DIRTY_WALL_MAT = new THREE.MeshStandardMaterial({ color: "#8c8c8c", roughness: 1 });
const RUST_MAT = new THREE.MeshStandardMaterial({ color: "#5a4d41", roughness: 0.8, metalness: 0.4 });
const SAND_MAT = new THREE.MeshStandardMaterial({ color: "#d2b48c", roughness: 1 });
const COURT_MAT = new THREE.MeshStandardMaterial({ color: "#aaddcc", roughness: 0.9 }); // Faded green/blue concrete court
const COURT_LINE_MAT = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 });

/** 
 * A single prison cell unit with a barred window/door.
 */
function PrisonCell({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) {
    return (
        <group position={position} rotation={rotation}>
            {/* Main concrete block */}
            <mesh receiveShadow castShadow material={CONCRETE_MAT}>
                <boxGeometry args={[CELL_BLOCK_WIDTH, CELL_BLOCK_HEIGHT, CELL_BLOCK_DEPTH]} />
            </mesh>
            {/* Dark interior "door/window" recess */}
            <mesh position={[0, 0, CELL_BLOCK_DEPTH / 2 + 0.01]} receiveShadow>
                <planeGeometry args={[1.2, 2]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            {/* Bars */}
            <mesh position={[0, 0, CELL_BLOCK_DEPTH / 2 + 0.05]}>
                <boxGeometry args={[1.3, 2.1, 0.05]} />
                <meshStandardMaterial color="#333" roughness={0.7} metalness={0.6} wireframe />
            </mesh>
            {/* Balcony/Walkway in front */}
            <mesh position={[0, -1.3, CELL_BLOCK_DEPTH / 2 + 0.8]} receiveShadow castShadow material={DIRTY_WALL_MAT}>
                <boxGeometry args={[CELL_BLOCK_WIDTH, 0.2, 1.6]} />
            </mesh>
            {/* Railing */}
            <mesh position={[0, -0.8, CELL_BLOCK_DEPTH / 2 + 1.55]} receiveShadow material={RUST_MAT}>
                <boxGeometry args={[CELL_BLOCK_WIDTH, 0.8, 0.05]} />
            </mesh>
        </group>
    );
}

/**
 * A stack of cells forming a wall.
 */
function CellBlockRow({ count, startPos, gap, rotation }: { count: number, startPos: [number, number, number], gap: number, rotation?: [number, number, number] }) {
    const cells = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            const xOffset = i * (CELL_BLOCK_WIDTH + gap);
            return (
                <group key={i} position={[xOffset, 0, 0]}>
                    <PrisonCell position={[0, 0, 0]} />
                    <PrisonCell position={[0, CELL_BLOCK_HEIGHT, 0]} />
                    <PrisonCell position={[0, CELL_BLOCK_HEIGHT * 2, 0]} />
                </group>
            );
        });
    }, [count, gap]);

    return <group position={startPos} rotation={rotation}>{cells}</group>;
}

/**
 * Laundry hanging on lines
 */
function LaundryLine({ position, length }: { position: [number, number, number], length: number }) {
    const clothes = useMemo(() => {
        return new Array(Math.floor(length / 1.5)).fill(0).map((_, i) => {
            const x = (i * 1.5) - (length / 2) + Math.random();
            const color = new THREE.Color().setHSL(Math.random(), 0.6, 0.5);
            return (
                <mesh key={i} position={[x, -0.4, 0]} rotation={[0, Math.random() * 0.5, 0]}>
                    <boxGeometry args={[0.5, 0.8, 0.1]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )
        });
    }, [length]);

    return (
        <group position={position}>
            {/* The Line */}
            <mesh>
                <boxGeometry args={[length, 0.02, 0.02]} />
                <meshBasicMaterial color="#333" />
            </mesh>
            {clothes}
        </group>
    )
}


/**
 * Brazilian Outdoor Prison Design.
 * Replaces the circular "DesertJailColiseum".
 */
export function DesertJailColiseum() {
    const center: [number, number, number] = [-31, -3.06, -7];

    // StadiumExit connects at appx [-1.8, 1.6, -7.2] (based on bazaar coords). 
    // We adjust our center to align somewhat or provide a walkway.
    // The previous component had center at [-31, -3.06, -7].

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
        <group position={center}>
            {/* --- TERRAIN --- */}
            {/* Infinite-looking sand plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow material={SAND_MAT}>
                <planeGeometry args={[200, 200, 32, 32]} />
            </mesh>

            {/* Uneven sand dunes decoration */}
            <mesh position={[20, -1, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={SAND_MAT}>
                <circleGeometry args={[15, 16]} />
            </mesh>
            <mesh position={[-20, -0.5, -25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={SAND_MAT}>
                <circleGeometry args={[12, 16]} />
            </mesh>

            {/* --- ARCHITECTURE --- */}

            {/* Main Court Floor (Concrete/Pavement) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow material={COURT_MAT}>
                <planeGeometry args={[COURT_WIDTH, COURT_LENGTH]} />
            </mesh>

            {/* Court Markings (Faded White Lines) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow material={COURT_LINE_MAT}>
                <ringGeometry args={[3, 3.2, 32]} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
                <planeGeometry args={[COURT_WIDTH - 1, COURT_LENGTH - 1]} />
                <meshStandardMaterial color="#fff" transparent opacity={0.1} side={THREE.DoubleSide} />
            </mesh>


            {/* Cell Blocks surrounding the courtyard */}

            {/* North Wall (Back) */}
            <CellBlockRow count={6} startPos={[-10, 1.5, -16]} gap={0} />

            {/* South Wall (Front) */}
            <CellBlockRow count={6} startPos={[-10, 1.5, 16]} gap={0} rotation={[0, Math.PI, 0]} />

            {/* East Wall (Right) - Split for Entrance Tunnel */}
            <CellBlockRow count={3} startPos={[12, 1.5, -14]} gap={0} rotation={[0, -Math.PI / 2, 0]} />
            <CellBlockRow count={3} startPos={[12, 1.5, 6]} gap={0} rotation={[0, -Math.PI / 2, 0]} />

            {/* West Wall (Left) - Entry side */}
            {/* Leave a gap for the entrance from the bazaar/stadium stairs */}
            <CellBlockRow count={3} startPos={[-12, 1.5, 14]} gap={0} rotation={[0, Math.PI / 2, 0]} />
            <CellBlockRow count={3} startPos={[-12, 1.5, -6]} gap={0} rotation={[0, Math.PI / 2, 0]} />

            {/* Entry Platform / Watchtower Gate */}
            <group position={[-14, 4, 4]}>
                <mesh castShadow receiveShadow material={CONCRETE_MAT}>
                    <boxGeometry args={[4, 8, 4]} />
                </mesh>
                <mesh position={[0, 4.5, 0]} material={RUST_MAT}>
                    <coneGeometry args={[3, 1, 4]} />
                </mesh>
            </group>


            {/* --- PROPS --- */}

            {/* Soccer Goal Posts */}
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

            {/* Laundry Lines strung between buildings */}
            <LaundryLine position={[0, 5, -8]} length={18} />
            <LaundryLine position={[0, 8, 5]} length={18} />

            {/* Perimeter Fence (Visual separation from infinite sand) */}
            <mesh position={[0, 2, 20]} rotation={[0, 0, 0]} material={RUST_MAT}>
                <boxGeometry args={[40, 4, 0.1]} />
            </mesh>
            <mesh position={[0, 2, -20]} rotation={[0, 0, 0]} material={RUST_MAT}>
                <boxGeometry args={[40, 4, 0.1]} />
            </mesh>

            {/* Lighting */}
            <pointLight position={[0, 8, 0]} intensity={isNight ? 0.5 : 0} distance={25} color="#ddaa88" />

            {/* Floodlights for night */}
            {isNight && (
                <>
                    <spotLight position={[10, 12, 10]} target-position={[0, 0, 0]} intensity={4} angle={0.5} penumbra={0.5} castShadow />
                    <spotLight position={[-10, 12, -10]} target-position={[0, 0, 0]} intensity={4} angle={0.5} penumbra={0.5} castShadow />
                </>
            )}

        </group>
    );
}
