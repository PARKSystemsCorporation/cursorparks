import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ALLEY_LENGTH, ALLEY_WIDTH } from '@/src/modules/world/firstPersonBounds';
import { createConcreteWallNormal, createConcreteWallRoughness, createWetFloorRoughness } from './ProceduralTextures';

const FLOOR_STONE_URL = '/textures/floor-stone.png';
const WALL_STONE_URL = '/textures/wall-stone.png';
const WALL_HEIGHT = 7;

export function AlleyGeometry() {
    const [floorDiffTex, wallDiffTex] = useTexture([FLOOR_STONE_URL, WALL_STONE_URL]);

    // Generate wall normal/roughness + floor roughness; configure loaded diffuse textures
    const textures = useMemo(() => {
        const wallNorm = createConcreteWallNormal();
        const wallRough = createConcreteWallRoughness();
        const floorRough = createWetFloorRoughness();

        wallDiffTex.colorSpace = THREE.SRGBColorSpace;
        floorDiffTex.colorSpace = THREE.SRGBColorSpace;

        [wallDiffTex, wallNorm, wallRough, floorDiffTex, floorRough].forEach(t => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
        });

        wallDiffTex.repeat.set(2, 1);
        wallNorm.repeat.set(2, 1);
        wallRough.repeat.set(2, 1);
        floorDiffTex.repeat.set(4, 8);
        floorRough.repeat.set(4, 8);

        return { wallDiff: wallDiffTex, wallNorm, wallRough, floorDiff: floorDiffTex, floorRough };
    }, [floorDiffTex, wallDiffTex]);

    const wallMatMain = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                map: textures.wallDiff,
                normalMap: textures.wallNorm,
                roughness: 0.9,
                color: '#d4ccc4',
            }),
        [textures]
    );
    const wallMatPillar = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                map: textures.wallDiff,
                normalMap: textures.wallNorm,
                roughness: 0.9,
                color: '#c4bcb4',
            }),
        [textures]
    );
    const wallMatBack = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                map: textures.wallDiff,
                normalMap: textures.wallNorm,
                roughnessMap: textures.wallRough,
                roughness: 0.92,
                metalness: 0,
                color: '#8a827a',
                emissive: '#000000',
                emissiveIntensity: 0,
            }),
        [textures]
    );
    const wallMatFrontFar = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                map: textures.wallDiff,
                normalMap: textures.wallNorm,
                roughness: 0.9,
                color: '#a89e96',
            }),
        [textures]
    );

    return (
        <group>
            {/* Ground — minimal segments for flat plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -ALLEY_LENGTH / 2]} receiveShadow>
                <planeGeometry args={[ALLEY_WIDTH, ALLEY_LENGTH, 1, 1]} />
                <meshStandardMaterial
                    map={textures.floorDiff}
                    roughnessMap={textures.floorRough}
                    roughness={0.85}
                    color="#e8e0d8"
                />
            </mesh>

            {/* Left Wall - Segmented with Vendor Booth + Hallway Opening */}
            <group position={[-ALLEY_WIDTH / 2, 0, -ALLEY_LENGTH / 2]}>
                {/*
                    BOOTH GAP at world Z = -2, local Z = +13 (gap +11.5 to +14.5)
                    HALLWAY GAP at world Z = -7, local Z = +8 (gap +7 to +9)
                    Wall local range: -15 to +15 (30m total)
                */}

                {/* Base Front Segment (local +14.5 to +15) → length 0.5, center +14.75 */}
                <mesh position={[0, 1.25, 14.75]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow material={wallMatMain}>
                    <planeGeometry args={[0.5, 2.5]} />
                </mesh>

                {/* Base segment (local -15 to +7) → length 22, center -4 */}
                <mesh position={[0, 1.25, -4]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow material={wallMatMain}>
                    <planeGeometry args={[22, 2.5]} />
                </mesh>

                {/* Base segment (local +9 to +11.5) → length 2.5, center +10.25 — between hallway and booth */}
                <mesh position={[0, 1.25, 10.25]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow material={wallMatMain}>
                    <planeGeometry args={[2.5, 2.5]} />
                </mesh>

                {/* Upper Wall (solid across full length, above booth opening) */}
                <mesh position={[0, 4.75, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow material={wallMatMain}>
                    <planeGeometry args={[ALLEY_LENGTH, 4.5]} />
                </mesh>
            </group>

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
                <mesh position={[0, 1.25, 13.25]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow material={wallMatMain}>
                    <planeGeometry args={[3.5, 2.5]} />
                </mesh>

                {/* 1. Base Wall Back Segment (Local -15 to +6.5) -> Length 21.5, Center -4.25 */}
                <mesh position={[0, 1.25, -4.25]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow material={wallMatMain}>
                    <planeGeometry args={[21.5, 2.5]} />
                </mesh>

                {/* 2. Top Lintel (Solid from 5.5m to 7m) */}
                <mesh position={[0, 6.25, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow material={wallMatMain}>
                    <planeGeometry args={[ALLEY_LENGTH, 1.5]} />
                </mesh>

                {/* 3. Pillars (Creating Window Gaps) — skip pillar at Local +9 to leave shop open */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const zStep = ALLEY_LENGTH / 5;
                    const zPos = (i * zStep) - (ALLEY_LENGTH / 2);
                    if (Math.abs(zPos - 9) < 1) return null;
                    return (
                        <mesh key={i} position={[0, 4, zPos]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow material={wallMatPillar}>
                            <planeGeometry args={[1, 3]} />
                        </mesh>
                    );
                })}
            </group>

            {/* Back Wall (Behind POV) — matte physical surface, no emissive bleed */}
            <group position={[0, 0, 2]} rotation={[0, Math.PI, 0]}>
                <mesh position={[0, WALL_HEIGHT / 2, 0]} receiveShadow material={wallMatBack}>
                    <planeGeometry args={[ALLEY_WIDTH, WALL_HEIGHT, 1, 1]} />
                </mesh>

                {/* Yellow LED Strip — reduced intensity to avoid blowout */}
                <group position={[0, 5.5, 0.15]}>
                    <mesh>
                        <boxGeometry args={[3, 0.15, 0.1]} />
                        <meshStandardMaterial
                            color="#e6b800"
                            emissive="#e6b800"
                            emissiveIntensity={1.2}
                            toneMapped={true}
                        />
                    </mesh>
                    <pointLight
                        intensity={0.8}
                        distance={6}
                        decay={2}
                        color="#fff0c0"
                        position={[0, 0, 0.5]}
                    />
                </group>
            </group>

            {/* New Front Wall at Z=0 (Blocks the view to the back) */}
            <mesh position={[0, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow material={wallMatFrontFar}>
                <planeGeometry args={[ALLEY_WIDTH, WALL_HEIGHT]} />
            </mesh>

            {/* Far End Wall (closes the alley at Z = -ALLEY_LENGTH) */}
            <mesh position={[0, WALL_HEIGHT / 2, -ALLEY_LENGTH]} receiveShadow material={wallMatFrontFar}>
                <planeGeometry args={[ALLEY_WIDTH, WALL_HEIGHT, 1, 1]} />
            </mesh>
        </group >
    );
}
