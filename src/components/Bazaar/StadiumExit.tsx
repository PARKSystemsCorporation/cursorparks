"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * StadiumExit: Replaces the Prison Hallway.
 * A clean, enclosed concrete walkway leading straight out to the Stadium.
 * Positioned at the left wall gap (x=-2, z=-7).
 * Extends into -X.
 */
export function StadiumExit() {
    const TUNNEL_LENGTH = 15;
    const TUNNEL_WIDTH = 2.5;
    const TUNNEL_HEIGHT = 3.5;

    const concreteMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: "#888899",
                roughness: 0.4,
                metalness: 0.2,
            }),
        []
    );

    const floorMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: "#333344",
                roughness: 0.6,
                metalness: 0.1,
            }),
        []
    );

    const lightMat = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: "#ffffff",
                emissive: "#ffffff",
                emissiveIntensity: 2,
                toneMapped: false,
            }),
        []
    );

    return (
        <group position={[-2, 0, -7]} rotation={[0, 0, 0]}>
            {/* The tunnel goes Left (World -X). So distinct from Alley Z axis. 
                Local -X is direction of extension.
            */}

            {/* Floor */}
            <mesh position={[-TUNNEL_LENGTH / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[TUNNEL_LENGTH, TUNNEL_WIDTH]} />
                <primitive object={floorMat} attach="material" />
            </mesh>

            {/* Ceiling */}
            <mesh position={[-TUNNEL_LENGTH / 2, TUNNEL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[TUNNEL_LENGTH, TUNNEL_WIDTH]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            {/* Light strips on ceiling */}
            {Array.from({ length: 5 }).map((_, i) => (
                <mesh key={i} position={[-2.5 - i * 3, TUNNEL_HEIGHT - 0.05, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                    <planeGeometry args={[1.5, 0.2]} />
                    <primitive object={lightMat} attach="material" />
                </mesh>
            ))}
            <pointLight position={[-5, TUNNEL_HEIGHT - 0.5, 0]} intensity={2} distance={8} color="#ccddff" />
            <pointLight position={[-12, TUNNEL_HEIGHT - 0.5, 0]} intensity={2} distance={8} color="#ccddff" />


            {/* Side Walls */}
            {/* Back Wall (Local +Z relative to tunnel axis? No, tunnel axis is X. Width is Z.) 
                Side wall 1 at z = -Width/2
                Side wall 2 at z = Width/2
            */}
            <mesh position={[-TUNNEL_LENGTH / 2, TUNNEL_HEIGHT / 2, -TUNNEL_WIDTH / 2]} rotation={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[TUNNEL_LENGTH, TUNNEL_HEIGHT, 0.2]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            <mesh position={[-TUNNEL_LENGTH / 2, TUNNEL_HEIGHT / 2, TUNNEL_WIDTH / 2]} rotation={[0, 0, 0]} receiveShadow>
                <boxGeometry args={[TUNNEL_LENGTH, TUNNEL_HEIGHT, 0.2]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            {/* End Cap / Stadium Entrance Visual */}
            <group position={[-TUNNEL_LENGTH, TUNNEL_HEIGHT / 2, 0]}>
                {/* Bright white void for now */}
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[TUNNEL_WIDTH, TUNNEL_HEIGHT]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
                <spotLight
                    position={[2, 5, 0]}
                    target-position={[-5, 0, 0]}
                    intensity={10}
                    color="#ffffff"
                    distance={20}
                    angle={1}
                />
            </group>

        </group>
    );
}
