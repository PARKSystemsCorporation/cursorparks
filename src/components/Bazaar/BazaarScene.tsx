"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { EffectComposer, ToneMapping, SMAA, Vignette, Noise } from "@react-three/postprocessing";
import { AlleyGeometry } from "./AlleyGeometry";
import { AlleyEnding } from "./AlleyEnding";
import { AlleySurfaceBreakupLayer } from "./AlleySurfaceBreakupLayer";
import { ContactShadowSystem } from "./ContactShadowSystem";
import { EnvironmentalMicroMotion } from "./EnvironmentalMicroMotion";
import { SpatialAudioZones } from "./SpatialAudioZones";

// --- Human Camera Rig ---
function HumanCameraRig({ onEnterAlleyTwo }: { onEnterAlleyTwo?: () => void }) {
    const { camera } = useThree();
    const targetPos = useRef(new THREE.Vector3(0, 1.65, 0));
    const lookAtPos = useRef(new THREE.Vector3(0, 1.5, -10));
    const sway = useRef(new THREE.Vector2(0, 0));

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const t = time * 0.5;

        // 1. Idle Body Sway (breathing/balance)
        sway.current.x = Math.sin(t) * 0.05;
        sway.current.y = Math.cos(t * 1.4) * 0.03;

        // 2. Head Bob (micro)
        const bob = Math.sin(t * 4) * 0.005;

        // 3. Forward Drift (very slow auto-walk)
        // We stop at -25 (portal)
        if (targetPos.current.z > -25) {
            targetPos.current.z -= 0.008; // Very slow drift
        } else {
            if (onEnterAlleyTwo) onEnterAlleyTwo();
        }

        // Apply
        camera.position.x += (targetPos.current.x + sway.current.x - camera.position.x) * 0.05;
        camera.position.y += (targetPos.current.y + sway.current.y + bob - camera.position.y) * 0.05;
        camera.position.z += (targetPos.current.z - camera.position.z) * 0.05;

        // Look Behavior (Focus shifting)
        // Look ahead but wander slightly
        const wanderX = Math.sin(time * 0.3) * 2;
        const wanderY = Math.cos(time * 0.2) * 1.0;

        const idealLookAt = new THREE.Vector3(
            wanderX,
            1.5 + wanderY,
            camera.position.z - 10
        );

        // Smooth look
        lookAtPos.current.lerp(idealLookAt, 0.02);
        camera.lookAt(lookAtPos.current);
    });

    return <></>;
}

// --- Depth Grading / Fog ---
function DepthGrading() {
    return (
        <fogExp2 attach="fog" args={['#050810', 0.035]} /> // Dark blue-black fog, dense enough to hide end
    );
}

// --- Props (Instanced Placeholder) ---
function AlleyProps() {
    // Placeholder instanced mesh for crates
    return (
        <instancedMesh args={[undefined, undefined, 10]} position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#5c4033" roughness={0.9} />
            {/* We would layout positions here in a real implementation using a layout array */}
            {/* For now manually placing a few for the "Grounding Test" */}
            <group>
                <mesh position={[-1.2, 0.4, -4]} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    <meshStandardMaterial color="#5c4033" roughness={0.9} />
                </mesh>
                <mesh position={[1.2, 0.6, -8]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.0, 1.2, 1.0]} />
                    <meshStandardMaterial color="#4a4a55" roughness={0.6} metalness={0.4} />
                </mesh>
            </group>
        </instancedMesh>
    );
}

// --- Lighting Rig ---
function AlleyLighting() {
    // Layered Lighting
    // 1. Ambient (Base fill, very low)
    // 2. Hemisphere (Sky/Ground contrast)
    // 3. Practicals (Warm localized)
    // 4. Portal Glow (End urge)

    return (
        <>
            <ambientLight intensity={0.2} color="#102040" />
            <hemisphereLight args={['#102040', '#050a10', 0.4]} />

            {/* Practical 1: Start */}
            <pointLight position={[0, 4, -2]} intensity={2} color="#ffaa55" distance={8} decay={2} castShadow stroke-shadow-bias={-0.001} />

            {/* Practical 2: Mid */}
            <pointLight position={[1, 4, -12]} intensity={1.5} color="#ffcc88" distance={10} decay={2} castShadow />

            {/* Practical 3: Deep */}
            <pointLight position={[-1, 4, -22]} intensity={1.5} color="#ffaa55" distance={10} decay={2} />

            {/* Portal Curiosity: Blue/Purple cool spill from around the corner at the end */}
            <rectAreaLight
                width={2}
                height={8}
                color="#4488ff"
                intensity={5}
                position={[-5, 3, -32]}
                lookAt={() => new THREE.Vector3(0, 3, -25)}
            />
        </>
    );
}


// --- Main Scene ---
export default function BazaarScene({ onEnterAlleyTwo }: { onEnterAlleyTwo?: () => void }) {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
                camera={{ fov: 60, position: [0, 1.65, 0] }}
            >
                <Suspense fallback={null}>
                    <DepthGrading />
                    <HumanCameraRig onEnterAlleyTwo={onEnterAlleyTwo} />

                    <AlleyGeometry />
                    <AlleyEnding />
                    <AlleySurfaceBreakupLayer />
                    <ContactShadowSystem />
                    <EnvironmentalMicroMotion />

                    {/* Props would go here, manually placed for now */}
                    <AlleyProps />

                    <AlleyLighting />
                    <SpatialAudioZones />

                    <EffectComposer disableNormalPass>
                        {/* SMAA for crisp edges without heavy MSAA */}
                        <SMAA />
                        {/* Vignette helps focus eye and hide corners */}
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                        {/* Noise adds texture to darkness, preventing banding */}
                        <Noise opacity={0.05} />
                        {/* ToneMapping handled by canvas, but can enforce here if needed */}
                        <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
                    </EffectComposer>
                </Suspense>
            </Canvas>

            {/* UI Overlays */}
            <div style={{
                position: 'absolute', bottom: '20px', left: '20px',
                color: '#fff', opacity: 0.5, fontFamily: 'monospace', fontSize: '12px'
            }}>
                [SIMULATION ACTIVE]
            </div>
        </div>
    );
}
