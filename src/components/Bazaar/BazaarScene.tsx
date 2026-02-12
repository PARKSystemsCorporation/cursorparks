"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import { EffectComposer, ToneMapping, SMAA, Vignette, Noise, Bloom } from "@react-three/postprocessing"; // Added Bloom
import { AlleyGeometry } from "./AlleyGeometry";
import { AlleyEndingPortal } from "./AlleyEnding";
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

        // Stabilization factor: Starts at 1, decays to 0.25 (75% reduction) over 10 seconds
        const stabilization = Math.max(0.25, 1.0 - (time * 0.1));

        // 1. Idle Body Sway (breathing/balance) - Reduced magnitude & Applied Stabilization
        sway.current.x = Math.sin(t) * 0.02 * stabilization; // Was 0.05
        sway.current.y = Math.cos(t * 1.4) * 0.015 * stabilization; // Was 0.03

        // 2. Head Bob (micro) - heavily reduced
        const bob = Math.sin(t * 4) * 0.002 * stabilization;

        // 3. Forward Drift (very slow auto-walk)
        // We stop at -25 (portal)
        if (targetPos.current.z > -25) {
            targetPos.current.z -= 0.005; // Slightly slower drift
        } else {
            if (onEnterAlleyTwo) onEnterAlleyTwo();
        }

        // Apply with stiffer spring for stability
        camera.position.x += (targetPos.current.x + sway.current.x - camera.position.x) * 0.05;
        camera.position.y += (targetPos.current.y + sway.current.y + bob - camera.position.y) * 0.05;
        camera.position.z += (targetPos.current.z - camera.position.z) * 0.05;

        // Look Behavior (Focus shifting)
        // Look ahead but wander slightly
        // Reduced wander amplitude
        const wanderX = Math.sin(time * 0.3) * 0.5 * stabilization;
        const wanderY = Math.cos(time * 0.2) * 0.2 * stabilization;

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
// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("3D Scene Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: 'red', padding: '20px', background: 'rgba(0,0,0,0.8)', position: 'absolute', top: 0, left: 0, zIndex: 1000 }}>
                    <h2>Sim Error</h2>
                    <pre>{this.state.error?.message}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Props (Placeholder) ---
function AlleyProps() {
    return (
        <group position={[0, 0, 0]}>
            <mesh position={[-1.2, 0.4, -4]} castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial color="#8c6043" roughness={0.9} />
            </mesh>
            {/* Grey Box Removed per user request */}

            {/* Red Neon LED Strip - Right Wall Floor Junction */}
            <mesh position={[1.95, 0.05, -15]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.05, 0.05, 30]} />
                <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff0000"
                    emissiveIntensity={10}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}


// --- Main Scene ---
export default function BazaarScene({ onEnterAlleyTwo }: { onEnterAlleyTwo?: () => void }) {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#e6ccb2' }}>
            <ErrorBoundary>
                <Canvas
                    shadows
                    dpr={[1, 1.5]}
                    // Switch to Cineon logic for better saturation in bright light
                    gl={{ antialias: false, toneMapping: THREE.CineonToneMapping, toneMappingExposure: 1.5 }}
                    camera={{ fov: 60, position: [0, 1.65, 0] }}
                >
                    {/* Make Suspense fallback visible in 3D space via HTML or just ensure it doesn't hang */}
                    <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial wireframe color="red" /></mesh>}>
                        {/* Daytime Fog: Very light, mostly clear to show sky */}
                        <color attach="background" args={['#87CEEB']} />
                        <fogExp2 attach="fog" args={['#fff0dd', 0.005]} />

                        <HumanCameraRig onEnterAlleyTwo={onEnterAlleyTwo} />

                        <AlleyGeometry />
                        <AlleyEndingPortal />
                        <AlleySurfaceBreakupLayer />
                        <ContactShadowSystem />
                        <EnvironmentalMicroMotion />

                        <AlleyProps />

                        {/* Daytime Lighting Rig - BRIGHT SUN */}
                        <ambientLight intensity={2.5} color="#fff8e6" />
                        <hemisphereLight args={['#87CEEB', '#504030', 1.5]} />
                        <directionalLight
                            position={[50, 40, -10]}
                            intensity={6}
                            color="#fffaf0"
                            castShadow
                            shadow-bias={-0.0005}
                            shadow-mapSize={[2048, 2048]}
                        />

                        {/* Fill light */}
                        <pointLight position={[0, 4, -10]} intensity={1.5} color="#ffaa55" distance={20} decay={2} />

                        <SpatialAudioZones />

                        <EffectComposer>
                            <SMAA />
                            {/* Subtle Vignette */}
                            <Vignette eskil={false} offset={0.1} darkness={0.3} />
                            {/* Drastically reduced noise */}
                            <Noise opacity={0.015} />
                            {/* Bloom for Neon - threshold set high so only the LED glows */}
                            <Bloom luminanceThreshold={1.5} mipmapBlur intensity={1.5} radius={0.4} />
                            <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </ErrorBoundary>

            <div style={{
                position: 'absolute', bottom: '20px', left: '20px',
                color: '#3d2b1f', opacity: 0.7, fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold'
            }}>
                [DAYTIME SIMULATION ACTIVE]
            </div>
        </div>
    );
}
