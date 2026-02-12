"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";

// --- Types ---
type NavigationNode = {
    id: string;
    position: [number, number, number]; // [x, y, z]
    label?: string;
    neighbors: string[]; // IDs of reachable nodes
};

// --- Config ---
// Sensitivity for look controls
const MOUSE_SENSITIVITY = 0.002;
const TOUCH_SENSITIVITY = 0.005;
const KEY_SENSITIVITY = 0.03;

// Navigation Map (The Graph)
const NAV_NODES: Record<string, NavigationNode> = {
    "start": {
        id: "start",
        position: [0, 1.65, 0],
        label: "Market Entrance",
        neighbors: ["shop_front"]
    },
    "shop_front": {
        id: "shop_front",
        position: [2, 1.65, -6], // Right side, near shop
        label: "Robot Repair",
        neighbors: ["start", "alley_deep"]
    },
    "alley_deep": {
        id: "alley_deep",
        position: [0, 1.65, -15],
        label: "Deep Alley",
        neighbors: ["shop_front", "end_portal"]
    },
    "end_portal": {
        id: "end_portal",
        position: [0, 1.65, -28],
        label: "The Turn",
        neighbors: ["alley_deep"]
    }
};

// --- Components ---

function HotspotMarker({
    position,
    label,
    onClick
}: {
    position: [number, number, number];
    label?: string;
    onClick: () => void
}) {
    const ref = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (!ref.current) return;
        // Bobbing animation
        ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        // Face camera
        ref.current.lookAt(state.camera.position);
    });

    return (
        <group
            ref={ref}
            position={position}
            onPointerOver={() => { setHover(true); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {/* Visual Orb */}
            <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial
                    color={hovered ? "#ffffff" : "#00ffff"}
                    transparent
                    opacity={0.6}
                    depthTest={false} // Always visible through walls? maybe
                />
            </mesh>

            {/* Pulsing Ring */}
            <mesh scale={hovered ? 1.2 : 1}>
                <ringGeometry args={[0.2, 0.25, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>

            {/* Label */}
            {hovered && label && (
                <group position={[0, 0.4, 0]}>
                    <mesh>
                        <planeGeometry args={[1, 0.2]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0.7} />
                    </mesh>
                    {/* Text would go here, simplified for now */}
                </group>
            )}
        </group>
    );
}

export function HotspotNavigation() {
    const { camera } = useThree();
    const [currentNodeId, setCurrentNodeId] = useState<string>("start");
    const [isTransitioning, setTransitioning] = useState(false);

    // Camera State
    const rotation = useRef({ yaw: 0, pitch: 0 }); // Euler angles
    const targetPosition = useRef(new THREE.Vector3(...NAV_NODES["start"].position));

    // Input State
    const keys = useRef<{ w: boolean; a: boolean; s: boolean; d: boolean }>({ w: false, a: false, s: false, d: false });
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    // --- Input Handlers ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": keys.current.w = true; break;
                case "a": keys.current.a = true; break;
                case "s": keys.current.s = true; break;
                case "d": keys.current.d = true; break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": keys.current.w = false; break;
                case "a": keys.current.a = false; break;
                case "s": keys.current.s = false; break;
                case "d": keys.current.d = false; break;
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStart.current || e.touches.length !== 1) return;

            const dx = e.touches[0].clientX - touchStart.current.x;
            const dy = e.touches[0].clientY - touchStart.current.y;

            rotation.current.yaw -= dx * TOUCH_SENSITIVITY;
            rotation.current.pitch -= dy * TOUCH_SENSITIVITY;

            // Clamp pitch
            rotation.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.current.pitch));

            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };

        const handleTouchEnd = () => {
            touchStart.current = null;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    // --- Transitions ---
    const handleNodeClick = (nodeId: string) => {
        if (isTransitioning) return;
        setCurrentNodeId(nodeId);
        targetPosition.current.set(...NAV_NODES[nodeId].position);
    };

    // --- Game Loop ---
    useFrame((state, delta) => {
        // 1. Handle Key Input (WASD Look)
        if (keys.current.a) rotation.current.yaw += KEY_SENSITIVITY;
        if (keys.current.d) rotation.current.yaw -= KEY_SENSITIVITY;
        if (keys.current.w) rotation.current.pitch += KEY_SENSITIVITY;
        if (keys.current.s) rotation.current.pitch -= KEY_SENSITIVITY;

        // Clamp pitch
        rotation.current.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotation.current.pitch));

        // 2. Smoothly interpolate position (Movement)
        easing.damp3(camera.position, targetPosition.current, 1.5, delta); // 1.5s smooth damp

        // 3. Apply Rotation
        // Create quaternion from yaw/pitch
        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation.current.yaw);
        const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotation.current.pitch);
        const qFinal = qYaw.multiply(qPitch);

        camera.quaternion.slerp(qFinal, 0.1); // Smooth look
    });

    const currentNode = NAV_NODES[currentNodeId];

    return (
        <group>
            {/* Render Hotspots for Neighbors */}
            {currentNode.neighbors.map(neighborId => {
                const node = NAV_NODES[neighborId];
                return (
                    <HotspotMarker
                        key={neighborId}
                        position={[node.position[0], 1.2, node.position[2]]} // Floating slightly lower
                        label={node.label}
                        onClick={() => handleNodeClick(neighborId)}
                    />
                );
            })}
        </group>
    );
}
