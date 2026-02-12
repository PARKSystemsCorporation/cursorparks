"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import { EffectComposer, ToneMapping, SMAA, Vignette, Noise, Bloom } from "@react-three/postprocessing"; // Added Bloom
import { AlleyGeometry } from "./AlleyGeometry";
import { AlleyEndingPortal } from "./AlleyEnding";
import { AlleySurfaceBreakupLayer } from "./AlleySurfaceBreakupLayer";
import { ContactShadowSystem } from "./ContactShadowSystem";
import { EnvironmentalMicroMotion } from "./EnvironmentalMicroMotion";
import { SpatialAudioZones } from "./SpatialAudioZones";
import { RobotRepairShop } from "./RobotRepairShop";

import { HotspotNavigation } from "./HotspotNavigation";
import BazaarVendors from "./BazaarVendors";
import InputBar from "./InputBar";
import { ChatProvider } from "./ChatContext";
import FloatingMessages from "./FloatingMessage";
import StreamerChatOverlay from "./StreamerChatOverlay";
import "./BazaarLanding.css";

// --- Human Camera Rig (Legacy - Replaced by HotspotNavigation) ---
// function HumanCameraRig... (REMOVED)
// (Orphaned logic removed)

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
            {/* Brown Box Removed per user request */}

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

            {/* Red Neon LED Strip - Left Wall Floor Junction */}
            <mesh position={[-1.95, 0.05, -15]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.05, 0.05, 30]} />
                <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff0000"
                    emissiveIntensity={10}
                    toneMapped={false}
                />
            </mesh>

            {/* Horizontal Floor Lights - Every 10m (White Blue & Vibrant) */}
            {[0, -10, -20].map((z, i) => (
                <group key={i} position={[0, 0.02, z]}>
                    {/* The Light Strip Mesh - 3 units wide, stretching left-right */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[3.5, 0.3]} />
                        <meshStandardMaterial
                            color="#88ccff"
                            emissive="#88ccff"
                            emissiveIntensity={5}
                            toneMapped={false}
                        />
                    </mesh>
                    {/* The Actual Light Source to illuminate floor */}
                    <pointLight
                        position={[0, 0.5, 0]} // Just above the strip
                        intensity={3}
                        distance={8}
                        decay={2}
                        color="#aaddff"
                    />
                </group>
            ))}

            {/* 'The Public Bazaar' Sign (Left Wall) */}
            <group position={[-1.9, 2.5, -10]} rotation={[0, Math.PI / 2, 0]}>
                {/* Backing Plate */}
                <mesh position={[0, 0, -0.05]}>
                    <boxGeometry args={[4, 1, 0.1]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
                </mesh>

                {/* Text */}
                <Text
                    fontSize={0.5}
                    color="#ffaa00" // Amber/Gold
                    anchorX="center"
                    anchorY="middle"
                // font="/fonts/Inter-Bold.ttf" // Use default if missing
                >
                    The Public Bazaar
                    <meshStandardMaterial
                        color="#ffaa00"
                        emissive="#ffaa00"
                        emissiveIntensity={4}
                        toneMapped={false}
                    />
                </Text>

                {/* Light Source for "Reflection" */}
                <pointLight
                    position={[0, 0, 1]}
                    intensity={5}
                    distance={10}
                    decay={2}
                    color="#ffaa00"
                />
            </group>
        </group>
    );
}


// --- Main Scene ---
export default function BazaarScene({ onEnterAlleyTwo }: { onEnterAlleyTwo?: () => void }) {
    return (
        <ChatProvider>
            <div style={{ width: '100vw', height: '100vh', background: '#e6ccb2' }}>
                <ErrorBoundary>
                    <Canvas
                        shadows
                        dpr={[1, 1.5]}
                        gl={{ antialias: false, toneMapping: THREE.CineonToneMapping, toneMappingExposure: 1.5 }}
                        camera={{ fov: 60, position: [0, 1.65, 0] }}
                    >
                        <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial wireframe color="red" /></mesh>}>
                            <color attach="background" args={['#87CEEB']} />
                            <fogExp2 attach="fog" args={['#fff0dd', 0.005]} />

                            <HotspotNavigation />

                            <AlleyGeometry />
                            <AlleyEndingPortal />
                            <AlleySurfaceBreakupLayer />
                            <ContactShadowSystem />
                            <EnvironmentalMicroMotion />

                            <AlleyProps />
                            <AlleyProps />
                            <RobotRepairShop />
                            <BazaarVendors />

                            <FloatingMessages />

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
                                <Vignette eskil={false} offset={0.1} darkness={0.3} />
                                <Noise opacity={0.015} />
                                <Bloom luminanceThreshold={1.5} mipmapBlur intensity={1.5} radius={0.4} />
                                <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
                            </EffectComposer>
                        </Suspense>
                    </Canvas>
                </ErrorBoundary>

                <StreamerChatOverlay />
                <InputBar />

                <div style={{
                    position: 'absolute', bottom: '20px', left: '20px',
                    color: '#3d2b1f', opacity: 0.7, fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold'
                }}>
                    [DAYTIME SIMULATION ACTIVE]
                </div>
            </div>
        </ChatProvider>
    );
}

