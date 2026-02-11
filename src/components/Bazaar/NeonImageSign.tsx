"use client";

import { useEffect } from "react";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BAZAAR_BRIGHTNESS } from "./brightness";

type NeonImageSignProps = {
    textureUrl: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    width?: number;
    height?: number;
    emissiveIntensity?: number;
    // Optional "helper" light so the alley gets a touch of spill.
    lightIntensity?: number;
};

export default function NeonImageSign({
    textureUrl,
    position,
    rotation = [0, 0, 0],
    width = 2.8,
    height = 1.4,
    emissiveIntensity = 1.0,
    lightIntensity = 0.0,
}: NeonImageSignProps) {
    const tex = useTexture(textureUrl);
    const { gl } = useThree();

    useEffect(() => {
        // Keep the sign crisp at glancing angles.
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.needsUpdate = true;
    }, [gl, tex]);

    return (
        <group position={position} rotation={rotation}>
            {/* Backplate for depth */}
            <mesh position={[0, 0, -0.02]} castShadow receiveShadow>
                <boxGeometry args={[width + 0.12, height + 0.12, 0.04]} />
                <meshStandardMaterial color="#08080d" roughness={0.7} metalness={0.2} />
            </mesh>

            {/* Neon face (transparent PNG, emissive for Bloom) */}
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    transparent
                    alphaTest={0.05}
                    map={tex}
                    emissiveMap={tex}
                    emissive={"#ffffff"}
                    emissiveIntensity={emissiveIntensity * BAZAAR_BRIGHTNESS}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {lightIntensity > 0 ? (
                <pointLight position={[0, 0, 0.25]} color="#ff4fd8" intensity={lightIntensity} distance={8} decay={2} />
            ) : null}
        </group>
    );
}

