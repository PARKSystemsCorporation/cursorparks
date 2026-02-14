"use client";

import React from "react";

/**
 * BrokerBooth — Cyberpunk tech shop room behind the left wall opening.
 *
 * The booth opening in AlleyGeometry is at:
 *   x = -2 (left wall), z = -0.5 to -3.5 (3m gap), base height 2.5m
 *
 * This room extends 3.5m further into negative-X (from x = -2 to x = -5.5)
 * and sits within the z-range of the opening.
 */

const ROOM_X_START = -2;       // alley left wall
const ROOM_X_END = -5.5;       // back of the room
const ROOM_DEPTH = Math.abs(ROOM_X_END - ROOM_X_START); // 3.5m
const ROOM_Z_FRONT = -0.5;    // front edge of opening
const ROOM_Z_BACK = -3.5;     // rear edge of opening
const ROOM_WIDTH = Math.abs(ROOM_Z_BACK - ROOM_Z_FRONT); // 3m
const ROOM_HEIGHT = 2.8;
const ROOM_CENTER_X = (ROOM_X_START + ROOM_X_END) / 2; // -3.75
const ROOM_CENTER_Z = (ROOM_Z_FRONT + ROOM_Z_BACK) / 2; // -2

// Shared dark wall material
const WALL_COLOR = "#1a1a2a";
const FLOOR_COLOR = "#111118";
const CEILING_COLOR = "#151525";

// Neon colors
const NEON_BLUE = "#00aaff";
const NEON_CYAN = "#00e5ff";
const NEON_PURPLE = "#8855ff";

function NeonStrip({
    position,
    rotation = [0, 0, 0],
    width = 0.08,
    length = 3,
    color = NEON_BLUE,
    intensity = 4,
}: {
    position: [number, number, number];
    rotation?: [number, number, number];
    width?: number;
    length?: number;
    color?: string;
    intensity?: number;
}) {
    return (
        <group position={position} rotation={rotation}>
            <mesh>
                <boxGeometry args={[length, width, 0.02]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={intensity}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

function DisplayCase({
    position,
    rotation = [0, 0, 0],
    width = 1.4,
    height = 0.9,
    depth = 0.5,
}: {
    position: [number, number, number];
    rotation?: [number, number, number];
    width?: number;
    height?: number;
    depth?: number;
}) {
    return (
        <group position={position} rotation={rotation}>
            {/* Base frame */}
            <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color="#2a2535"
                    roughness={0.6}
                    metalness={0.4}
                />
            </mesh>

            {/* Glass top */}
            <mesh position={[0, height + 0.02, 0]}>
                <boxGeometry args={[width - 0.04, 0.04, depth - 0.04]} />
                <meshPhysicalMaterial
                    color="#aaddff"
                    transparent
                    opacity={0.2}
                    roughness={0.05}
                    metalness={0.1}
                    transmission={0.8}
                />
            </mesh>

            {/* Interior glow strip */}
            <mesh position={[0, height * 0.6, 0]}>
                <boxGeometry args={[width - 0.15, 0.03, depth - 0.15]} />
                <meshStandardMaterial
                    color={NEON_CYAN}
                    emissive={NEON_CYAN}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            {/* Sample items on top */}
            {[-0.35, 0, 0.12].map((xOff, i) => (
                <mesh key={i} position={[xOff, height + 0.12, (i - 1) * 0.08]}>
                    <boxGeometry args={[0.15, 0.08, 0.1]} />
                    <meshStandardMaterial
                        color={i === 1 ? "#334455" : "#222233"}
                        roughness={0.3}
                        metalness={0.7}
                    />
                </mesh>
            ))}
        </group>
    );
}

function WallScreen({
    position,
    rotation = [0, 0, 0],
    width = 0.8,
    height = 0.5,
    color = NEON_BLUE,
}: {
    position: [number, number, number];
    rotation?: [number, number, number];
    width?: number;
    height?: number;
    color?: string;
}) {
    return (
        <group position={position} rotation={rotation}>
            {/* Screen bezel */}
            <mesh>
                <boxGeometry args={[width + 0.06, height + 0.06, 0.04]} />
                <meshStandardMaterial color="#111115" roughness={0.8} metalness={0.3} />
            </mesh>

            {/* Screen surface */}
            <mesh position={[0, 0, 0.025]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.5}
                    toneMapped={false}
                />
            </mesh>

            {/* Scanline overlay (subtle) */}
            <mesh position={[0, 0, 0.027]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    color="#000000"
                    transparent
                    opacity={0.15}
                />
            </mesh>
        </group>
    );
}

function HangingCables({
    position,
    count = 3,
}: {
    position: [number, number, number];
    count?: number;
}) {
    return (
        <group position={position}>
            {Array.from({ length: count }).map((_, i) => {
                const xOff = (i - (count - 1) / 2) * 0.15;
                const hangLength = 0.3 + Math.random() * 0.4;
                return (
                    <mesh key={i} position={[xOff, -hangLength / 2, 0]}>
                        <cylinderGeometry args={[0.012, 0.012, hangLength, 6]} />
                        <meshStandardMaterial color="#222" roughness={0.9} />
                    </mesh>
                );
            })}
        </group>
    );
}

export function BrokerBooth() {
    return (
        <group>
            {/* ── ROOM SHELL ── */}

            {/* Floor */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[ROOM_CENTER_X, 0.01, ROOM_CENTER_Z]}
            >
                <planeGeometry args={[ROOM_DEPTH, ROOM_WIDTH]} />
                <meshStandardMaterial color={FLOOR_COLOR} roughness={0.85} />
            </mesh>

            {/* Ceiling */}
            <mesh
                rotation={[Math.PI / 2, 0, 0]}
                position={[ROOM_CENTER_X, ROOM_HEIGHT, ROOM_CENTER_Z]}
            >
                <planeGeometry args={[ROOM_DEPTH, ROOM_WIDTH]} />
                <meshStandardMaterial color={CEILING_COLOR} roughness={0.9} />
            </mesh>

            {/* Back wall (far left, at x = -5.5) */}
            <mesh
                position={[ROOM_X_END, ROOM_HEIGHT / 2, ROOM_CENTER_Z]}
                rotation={[0, Math.PI / 2, 0]}
            >
                <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
                <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
            </mesh>

            {/* Side wall FRONT (z = -0.5, facing into room) */}
            <mesh
                position={[ROOM_CENTER_X, ROOM_HEIGHT / 2, ROOM_Z_FRONT]}
                rotation={[0, Math.PI, 0]}
            >
                <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
                <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
            </mesh>

            {/* Side wall BACK (z = -3.5, facing into room) */}
            <mesh
                position={[ROOM_CENTER_X, ROOM_HEIGHT / 2, ROOM_Z_BACK]}
            >
                <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
                <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
            </mesh>

            {/* ── NEON EDGE LIGHTING ── */}

            {/* Ceiling edge strips — front & back */}
            <NeonStrip
                position={[ROOM_CENTER_X, ROOM_HEIGHT - 0.02, ROOM_Z_FRONT + 0.05]}
                length={ROOM_DEPTH}
                color={NEON_BLUE}
                intensity={5}
            />
            <NeonStrip
                position={[ROOM_CENTER_X, ROOM_HEIGHT - 0.02, ROOM_Z_BACK - 0.05]}
                length={ROOM_DEPTH}
                color={NEON_BLUE}
                intensity={5}
            />

            {/* Ceiling edge strips — left & right (depth-wise) */}
            <NeonStrip
                position={[ROOM_X_END + 0.05, ROOM_HEIGHT - 0.02, ROOM_CENTER_Z]}
                rotation={[0, Math.PI / 2, 0]}
                length={ROOM_WIDTH}
                color={NEON_PURPLE}
                intensity={4}
            />
            <NeonStrip
                position={[ROOM_X_START - 0.05, ROOM_HEIGHT - 0.02, ROOM_CENTER_Z]}
                rotation={[0, Math.PI / 2, 0]}
                length={ROOM_WIDTH}
                color={NEON_BLUE}
                intensity={3}
            />

            {/* Floor edge strips — front & back */}
            <NeonStrip
                position={[ROOM_CENTER_X, 0.04, ROOM_Z_FRONT + 0.05]}
                length={ROOM_DEPTH}
                color={NEON_CYAN}
                intensity={2}
                width={0.04}
            />
            <NeonStrip
                position={[ROOM_CENTER_X, 0.04, ROOM_Z_BACK - 0.05]}
                length={ROOM_DEPTH}
                color={NEON_CYAN}
                intensity={2}
                width={0.04}
            />

            {/* Vertical corner strips */}
            {[
                [ROOM_X_END + 0.04, ROOM_HEIGHT / 2, ROOM_Z_FRONT + 0.04],
                [ROOM_X_END + 0.04, ROOM_HEIGHT / 2, ROOM_Z_BACK - 0.04],
            ].map((pos, i) => (
                <NeonStrip
                    key={`vcorner-${i}`}
                    position={pos as [number, number, number]}
                    rotation={[0, 0, Math.PI / 2]}
                    length={ROOM_HEIGHT}
                    color={NEON_BLUE}
                    intensity={3}
                    width={0.05}
                />
            ))}

            {/* ── POINT LIGHTS ── */}
            <pointLight
                position={[ROOM_CENTER_X, ROOM_HEIGHT - 0.3, ROOM_CENTER_Z]}
                intensity={1.5}
                distance={6}
                decay={2}
                color={NEON_BLUE}
            />
            <pointLight
                position={[ROOM_CENTER_X + 1, 0.5, ROOM_CENTER_Z]}
                intensity={0.8}
                distance={4}
                decay={2}
                color={NEON_CYAN}
            />
            {/* Spill light into the alley through the opening */}
            <pointLight
                position={[ROOM_X_START + 0.5, ROOM_HEIGHT / 2, ROOM_CENTER_Z]}
                intensity={1.2}
                distance={5}
                decay={2}
                color={NEON_BLUE}
            />

            {/* ── DISPLAY COUNTER ── */}
            <DisplayCase
                position={[ROOM_CENTER_X + 0.3, 0, ROOM_CENTER_Z]}
                rotation={[0, Math.PI / 2, 0]}
                width={1.8}
                height={0.85}
                depth={0.55}
            />

            {/* ── WALL SCREENS ── */}

            {/* Back wall — main large screen */}
            <WallScreen
                position={[ROOM_X_END + 0.03, ROOM_HEIGHT * 0.6, ROOM_CENTER_Z]}
                rotation={[0, Math.PI / 2, 0]}
                width={1.6}
                height={0.9}
                color={NEON_BLUE}
            />

            {/* Back wall — small screen top-left */}
            <WallScreen
                position={[ROOM_X_END + 0.03, ROOM_HEIGHT * 0.85, ROOM_Z_FRONT + 0.5]}
                rotation={[0, Math.PI / 2, 0]}
                width={0.5}
                height={0.35}
                color={NEON_PURPLE}
            />

            {/* Side wall (front) — screen */}
            <WallScreen
                position={[ROOM_CENTER_X - 0.5, ROOM_HEIGHT * 0.65, ROOM_Z_FRONT + 0.03]}
                rotation={[0, Math.PI, 0]}
                width={0.7}
                height={0.5}
                color="#0066cc"
            />

            {/* Side wall (back) — screen */}
            <WallScreen
                position={[ROOM_CENTER_X - 0.5, ROOM_HEIGHT * 0.65, ROOM_Z_BACK - 0.03]}
                width={0.9}
                height={0.55}
                color={NEON_CYAN}
            />

            {/* ── HANGING CABLES ── */}
            <HangingCables position={[ROOM_X_END + 0.3, ROOM_HEIGHT, ROOM_Z_FRONT + 0.4]} count={4} />
            <HangingCables position={[ROOM_X_END + 0.3, ROOM_HEIGHT, ROOM_Z_BACK - 0.4]} count={3} />

            {/* ── SHELF on back wall ── */}
            <mesh position={[ROOM_X_END + 0.15, ROOM_HEIGHT * 0.35, ROOM_CENTER_Z + 0.8]}>
                <boxGeometry args={[0.25, 0.04, 0.8]} />
                <meshStandardMaterial color="#2a2535" roughness={0.6} metalness={0.4} />
            </mesh>
            {/* Items on shelf */}
            {[0, 0.25, -0.25].map((zOff, i) => (
                <mesh key={`shelf-item-${i}`} position={[ROOM_X_END + 0.15, ROOM_HEIGHT * 0.35 + 0.08, ROOM_CENTER_Z + 0.8 + zOff]}>
                    <boxGeometry args={[0.12, 0.12, 0.12]} />
                    <meshStandardMaterial
                        color={["#334455", "#2a2a3a", "#3a3045"][i]}
                        roughness={0.3}
                        metalness={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}
