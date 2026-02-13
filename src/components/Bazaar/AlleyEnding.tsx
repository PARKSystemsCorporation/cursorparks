import { useMemo } from 'react';
import * as THREE from 'three';
import { createConcreteWallNormal, createConcreteWallTexture, createWetFloorRoughness, createWetFloorTexture } from './ProceduralTextures';

interface AlleyEndingPortalProps {
    positionX?: number;
    positionZ?: number;
    rotationY?: number;
    onEnterPortal?: () => void;
}

export function AlleyEndingPortal({ positionX = 0, positionZ = -30, rotationY = 0, onEnterPortal }: AlleyEndingPortalProps) {
    // Reuse textures (in a real app, use a centralized asset store)
    const textures = useMemo(() => {
        const wallDiff = createConcreteWallTexture();
        const wallNorm = createConcreteWallNormal();
        const floorDiff = createWetFloorTexture();
        const floorRough = createWetFloorRoughness();

        // Darker for the end
        wallDiff.colorSpace = THREE.SRGBColorSpace;
        floorDiff.colorSpace = THREE.SRGBColorSpace;

        return { wallDiff, wallNorm, floorDiff, floorRough };
    }, []);

    const ALLEY_WIDTH = 4;
    const EXT_DEPTH = 10; // How far the "turn" goes

    return (
        <group position={[positionX, 0, positionZ]} rotation={[0, rotationY, 0]}>
            {/* 1. The Occluding Wall (Blocks the right side, forcing eye left) */}
            <mesh position={[ALLEY_WIDTH / 4, 3.5, 0]} receiveShadow>
                <planeGeometry args={[ALLEY_WIDTH, 7]} />
                <meshStandardMaterial
                    map={textures.wallDiff}
                    normalMap={textures.wallNorm}
                    color="#888"
                    roughness={0.9}
                />
            </mesh>

            {/* 2. Floor Extension (Turning left) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0, -EXT_DEPTH / 2]} receiveShadow>
                <planeGeometry args={[ALLEY_WIDTH + 4, EXT_DEPTH]} />
                <meshStandardMaterial
                    map={textures.floorDiff}
                    roughnessMap={textures.floorRough}
                    color="#666"
                    roughness={0.7}
                />
            </mesh>

            {/* 3. Back Wall of the turn (Catches the light spill) */}
            <mesh position={[-2, 3.5, -EXT_DEPTH]} receiveShadow>
                <planeGeometry args={[ALLEY_WIDTH + 4, 7]} />
                <meshStandardMaterial
                    map={textures.wallDiff}
                    normalMap={textures.wallNorm}
                    color="#aaa"
                    roughness={0.8}
                />
            </mesh>

            {/* 4. Left Wall of the extension */}
            <mesh position={[-4, 3.5, -EXT_DEPTH / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[EXT_DEPTH, 7]} />
                <meshStandardMaterial
                    map={textures.wallDiff}
                    normalMap={textures.wallNorm}
                    color="#888"
                    roughness={0.9}
                />
            </mesh>

            {/* Visual Cue: A pipe or conduit running around the corner */}
            <mesh position={[-1, 5, -0.2]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
                <meshStandardMaterial color="#333" roughness={0.5} />
            </mesh>
            <mesh position={[-3.1, 5, -2]} rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
                <meshStandardMaterial color="#333" roughness={0.5} />
            </mesh>
            {/* Corner elbow */}
            <mesh position={[-3.1, 5, -0.2]}>
                <sphereGeometry args={[0.12]} />
                <meshStandardMaterial color="#444" roughness={0.5} />
            </mesh>

            {/* Clickable portal to back alley: walk through the turn */}
            {onEnterPortal && (
                <mesh
                    position={[-2, 1.8, -EXT_DEPTH / 2]}
                    rotation={[0, 0, 0]}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEnterPortal();
                    }}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                        document.body.style.cursor = "default";
                    }}
                >
                    <planeGeometry args={[ALLEY_WIDTH + 2, 3.5]} />
                    <meshBasicMaterial color="#3a2a1a" transparent opacity={0.4} />
                </mesh>
            )}
        </group>
    );
}
