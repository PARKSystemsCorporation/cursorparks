import { useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EXRLoader } from 'three-stdlib';
import { ALLEY_LENGTH, ALLEY_WIDTH } from '@/src/modules/world/firstPersonBounds';
import { createConcreteWallNormal, createConcreteWallRoughness } from './ProceduralTextures';

const ROCKY_DIFF_URL = '/textures/rocky_terrain/rocky_terrain_diff_4k.jpg';
const ROCKY_DISP_URL = '/textures/rocky_terrain/rocky_terrain_disp_4k.png';
const ROCKY_NOR_URL = '/textures/rocky_terrain/rocky_terrain_nor_gl_4k.exr';
const ROCKY_ROUGH_URL = '/textures/rocky_terrain/rocky_terrain_rough_4k.exr';

const PLASTER_DIFF_URL = '/textures/damaged_plaster/damaged_plaster_diff_4k.jpg';
const PLASTER_DISP_URL = '/textures/damaged_plaster/damaged_plaster_disp_4k.png';
const PLASTER_NOR_URL = '/textures/damaged_plaster/damaged_plaster_nor_gl_4k.exr';
const PLASTER_ROUGH_URL = '/textures/damaged_plaster/damaged_plaster_rough_4k.exr';

const WALL_HEIGHT = 7;

export function AlleyGeometry() {
    const { gl } = useThree();

    // Load textures
    const [rockyDiff, rockyDisp, plasterDiff, plasterDisp] = useTexture([
        ROCKY_DIFF_URL, ROCKY_DISP_URL,
        PLASTER_DIFF_URL, PLASTER_DISP_URL
    ]);

    // Load EXR textures - Temporarily disabled due to loading error
    // const [rockyNor, rockyRough, plasterNor, plasterRough] = useLoader(EXRLoader, [
    //     ROCKY_NOR_URL, ROCKY_ROUGH_URL,
    //     PLASTER_NOR_URL, PLASTER_ROUGH_URL
    // ]);
    const rockyNor = null, rockyRough = null, plasterNor = null, plasterRough = null;

    // Configure textures
    const textures = useMemo(() => {
        rockyDiff.colorSpace = THREE.SRGBColorSpace;
        plasterDiff.colorSpace = THREE.SRGBColorSpace;

        [rockyDiff, rockyDisp, plasterDiff, plasterDisp].forEach(t => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
        });

        // Floor repeat
        const floorRepeatX = ALLEY_WIDTH / 2;
        const floorRepeatY = ALLEY_LENGTH / 2;
        rockyDiff.repeat.set(floorRepeatX, floorRepeatY);
        rockyDisp.repeat.set(floorRepeatX, floorRepeatY);
        // rockyNor.repeat.set(floorRepeatX, floorRepeatY);
        // rockyRough.repeat.set(floorRepeatX, floorRepeatY);

        // Wall repeat
        const wallRepeatX = 3;
        const wallRepeatY = 1;
        plasterDiff.repeat.set(wallRepeatX, wallRepeatY);
        plasterDisp.repeat.set(wallRepeatX, wallRepeatY);
        // plasterNor.repeat.set(wallRepeatX, wallRepeatY);
        // plasterRough.repeat.set(wallRepeatX, wallRepeatY);

        return {
            floorDiff: rockyDiff,
            floorDisp: rockyDisp,
            floorNor: rockyNor,
            floorRough: rockyRough,
            wallDiff: plasterDiff,
            wallDisp: plasterDisp,
            wallNor: plasterNor,
            wallRough: plasterRough
        };
    }, [rockyDiff, rockyDisp, rockyNor, rockyRough, plasterDiff, plasterDisp, plasterNor, plasterRough]);

    const wallMatMain = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                map: textures.wallDiff,
                normalMap: textures.wallNor,
                roughnessMap: textures.wallRough,
                displacementMap: textures.wallDisp,
                displacementScale: 0.1,
                roughness: 1,
                color: '#d4ccc4',
            }),
        [textures]
    );
    // Reuse main material for pillar/back/front for consistency with new texture style, 
    // or create variations if needed. For now, sticking to the plaster look.
    const wallMatPillar = wallMatMain;
    const wallMatBack = wallMatMain;
    const wallMatFrontFar = wallMatMain;


    return (
        <group>
            {/* Ground — Increased segments for displacement */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -ALLEY_LENGTH / 2]} receiveShadow>
                <planeGeometry args={[ALLEY_WIDTH, ALLEY_LENGTH, 128, 128]} />
                <meshStandardMaterial
                    map={textures.floorDiff}
                    displacementMap={textures.floorDisp}
                    displacementScale={0.3} // Adjust scale as needed
                    displacementBias={-0.1}
                    normalMap={textures.floorNor}
                    roughnessMap={textures.floorRough}
                    roughness={1}
                    color="#a0a0a0"
                />
            </mesh>

            {/* Left Wall - Segmented with Vendor Booth + Hallway Opening */}
            <group position={[-ALLEY_WIDTH / 2, 0, -ALLEY_LENGTH / 2]}>
                {/* ... (Existing wall setup remains unchanged) ... */}
                {/* Since we didn't change the wall logic, we keep the original structure but need to maximize reuse if we were refactoring. 
                   For now, strictly replacing content so including full previous logic for walls. */}

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
            <group position={[ALLEY_WIDTH / 2, 0, -ALLEY_LENGTH / 2]}>
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


        </group >
    );
}
