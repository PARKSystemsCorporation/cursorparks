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

            {/* Right Wall - Segmented with Windows for Light Shafts & Shop Entrance */}
            <group position={[ALLEY_WIDTH / 2, 0, -ALLEY_LENGTH / 2]}> {/* Group Center at World Z = -15 */}

                {/* SHOP GAP CALCULATIONS:
                    Shop World Z: -6
                    Group Z: -15
                    Shop Local Z: +9
                    Gap Width: 5m
                    Gap Local Range: +6.5 to +11.5
                    
                    Wall Total Local Range: -15 to +15 (Length 30)
                 */}

                {/* 1. Base Wall Front Segment (Local +11.5 to +15) -> Length 3.5, Center +13.25 */}
                <mesh position={[0, 1.25, 13.25]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
                    <planeGeometry args={[3.5, 2.5]} />
                    <meshStandardMaterial
                        map={textures.wallDiff}
                        normalMap={textures.wallNorm}
                        roughness={0.9}
                        color="#aaa"
                    />
                </mesh>

                {/* 1. Base Wall Back Segment (Local -15 to +6.5) -> Length 21.5, Center -4.25 */}
                <mesh position={[0, 1.25, -4.25]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
                    <planeGeometry args={[21.5, 2.5]} />
                    <meshStandardMaterial
                        map={textures.wallDiff}
                        normalMap={textures.wallNorm}
                        roughness={0.9}
                        color="#aaa"
                    />
                </mesh>

                {/* 2. Top Lintel (Solid from 5.5m to 7m) */}
                <mesh position={[0, 6.25, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
                    <planeGeometry args={[ALLEY_LENGTH, 1.5]} />
                    <meshStandardMaterial
                        map={textures.wallDiff}
                        normalMap={textures.wallNorm}
                        roughness={0.9}
                        color="#aaa"
                    />
                </mesh>

                {/* 3. Pillars (Creating Window Gaps) 
                    Skipping pillar at Local +9 (Index 4) to leave shop open
                */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const zStep = ALLEY_LENGTH / 5;
                    const zPos = (i * zStep) - (ALLEY_LENGTH / 2); // -15, -9, -3, 3, 9, 15

                    // Skip pillar at zPos 9 (approx shop center)
                    if (Math.abs(zPos - 9) < 1) return null;

                    return (
                        <mesh key={i} position={[0, 4, zPos]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
                            <planeGeometry args={[1, 3]} /> {/* Pillar width 1m, height 3m covering the gap */}
                            <meshStandardMaterial
                                map={textures.wallDiff}
                                normalMap={textures.wallNorm}
                                roughness={0.9}
                                color="#888"
                            />
                        </mesh>
                    );
                })}
            </group>

            {/* Back Wall (Behind POV) */}
            {/* Back Wall Group (Behind POV) */}
            <group position={[0, 0, 2]} rotation={[0, Math.PI, 0]}>
                {/* The Wall Itself */}
                <mesh position={[0, WALL_HEIGHT / 2, 0]} receiveShadow>
                    <planeGeometry args={[ALLEY_WIDTH, WALL_HEIGHT, 32, 16]} />
                    <meshStandardMaterial
                        map={textures.wallDiff}
                        normalMap={textures.wallNorm}
                        roughness={0.9}
                        color="#aaa"
                    />
                </mesh>

                {/* "Bus Stop" Yellow LED Strip (3 units wide, near top) */}
                <group position={[0, 5.5, 0.15]}>
                    <mesh>
                        <boxGeometry args={[3, 0.15, 0.1]} />
                        <meshStandardMaterial
                            color="#ffcc00"
                            emissive="#ffcc00"
                            emissiveIntensity={8}
                            toneMapped={false}
                        />
                    </mesh>
                    {/* Light Cast */}
                    <pointLight
                        intensity={2}
                        distance={10}
                        decay={2}
                        color="#ffcc00"
                        position={[0, 0, 0.5]}
                    />
                </group>
            </group>

            {/* Far End Wall (closes the alley at Z = -ALLEY_LENGTH) */}
            <mesh position={[0, WALL_HEIGHT / 2, -ALLEY_LENGTH]} receiveShadow>
                <planeGeometry args={[ALLEY_WIDTH, WALL_HEIGHT, 32, 16]} />
                <meshStandardMaterial
                    map={textures.wallDiff}
                    normalMap={textures.wallNorm}
                    roughness={0.9}
                    color="#777"
                />
            </mesh>
        </group>
    );
}
