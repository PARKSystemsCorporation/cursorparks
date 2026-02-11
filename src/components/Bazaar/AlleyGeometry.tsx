import { useMemo } from 'react';
import * as THREE from 'three';
import { createConcreteWallNormal, createConcreteWallTexture, createWetFloorRoughness, createWetFloorTexture } from './ProceduralTextures';

export function AlleyGeometry() {
    // Generate textures once
    const textures = useMemo(() => {
        const wallDiff = createConcreteWallTexture();
        const wallNorm = createConcreteWallNormal();
        const floorDiff = createWetFloorTexture();
        const floorRough = createWetFloorRoughness();

        // Adjust settings for realism
        wallDiff.colorSpace = THREE.SRGBColorSpace;
        floorDiff.colorSpace = THREE.SRGBColorSpace;

        // Wrap settings
        [wallDiff, wallNorm, floorDiff, floorRough].forEach(t => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
        });

        // Tiling
        wallDiff.repeat.set(2, 1);
        wallNorm.repeat.set(2, 1);
        floorDiff.repeat.set(4, 8);
        floorRough.repeat.set(4, 8);

        return { wallDiff, wallNorm, floorDiff, floorRough };
    }, []);

    const ALLEY_WIDTH = 4;
    const ALLEY_LENGTH = 30; // Visible depth 30m
    const WALL_HEIGHT = 7;

    return (
        <group>
            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -ALLEY_LENGTH / 2]} receiveShadow>
                <planeGeometry args={[ALLEY_WIDTH, ALLEY_LENGTH, 32, 128]} />
                <meshStandardMaterial
                    map={textures.floorDiff}
                    roughnessMap={textures.floorRough}
                    roughness={0.8}
                    color="#888"
                />
            </mesh>

            {/* Left Wall */}
            <mesh position={[-ALLEY_WIDTH / 2, WALL_HEIGHT / 2, -ALLEY_LENGTH / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[ALLEY_LENGTH, WALL_HEIGHT, 64, 16]} />
                <meshStandardMaterial
                    map={textures.wallDiff}
                    normalMap={textures.wallNorm}
                    roughness={0.9}
                    color="#aaa"
                />
            </mesh>

            {/* Right Wall */}
            <mesh position={[ALLEY_WIDTH / 2, WALL_HEIGHT / 2, -ALLEY_LENGTH / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[ALLEY_LENGTH, WALL_HEIGHT, 64, 16]} />
                <meshStandardMaterial
                    map={textures.wallDiff}
                    normalMap={textures.wallNorm}
                    roughness={0.9}
                    color="#aaa"
                />
            </mesh>
        </group>
    );
}
