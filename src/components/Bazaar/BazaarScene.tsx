/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import * as THREE from "three";
import { Sky, Environment as DreiEnvironment } from "@react-three/drei";
import BazaarSet from "./Environment";
import Vendor from "./Vendor";
import Crowd from "./Crowd";
import CameraRig from "./CameraRig";
import InputBar from "./InputBar";
import "./BazaarLanding.css";
import { EffectComposer, ToneMapping, SMAA } from "@react-three/postprocessing";
import LedSign from "./LedSign";
import ScrapSign from "./ScrapSign";
import { BazaarMaterialsProvider } from "./BazaarMaterials";
import NeonSign from "./NeonSign";
import LedBar from "./LedBar";
import AlleyLight from "./AlleyLight";

// --- Daylight configuration (high-sun cinematic market) ---
const SKY_BLUE = "#87CEEB";
const CONFIG = {
    fog: { color: "#b8d4e3", near: 18, far: 52 },
    lights: {
        ambient: { intensity: 0.62, color: "#ffffff" },
        sun: { intensity: 2.2, color: "#fff5e6", position: [5, 28, 8] as [number, number, number] },
        hemisphere: { sky: "#a8c8e8", ground: "#c4a574", intensity: 1.45 },
    },
    camera: {
        position: [0, 1.7, 6] as [number, number, number],
        fov: 60,
    },
    postprocessing: {
        exposure: 1.0,
        toneMapping: THREE.ACESFilmicToneMapping,
    },
    shadow: {
        mapSize: 4096,
        normalBias: 0.02,
        cameraFar: 65,
        cameraLeft: -20,
        cameraRight: 20,
        cameraTop: 24,
        cameraBottom: -20,
    },
};

function ShadowMapSetup() {
    const { gl } = useThree();
    useEffect(() => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.shadowMap.needsUpdate = true;
    }, [gl]);
    return null;
}

function SceneContent({ messages, targetVendor, onShout }: { messages: any[], targetVendor: string | null, onShout: (t: string) => void }) {
    return (
        <>
            <ShadowMapSetup />
            <fog attach="fog" args={[CONFIG.fog.color, CONFIG.fog.near, CONFIG.fog.far]} />
            <color attach="background" args={[SKY_BLUE]} />

            {/* Sky dome (bright blue, light atmospheric haze) */}
            <Sky sunPosition={[CONFIG.lights.sun.position[0], CONFIG.lights.sun.position[1], CONFIG.lights.sun.position[2]]} turbidity={4} rayleigh={0.5} mieCoefficient={0.005} />

            {/* Skybox-based IBL for PBR materials */}
            <DreiEnvironment preset="park" background={false} environmentIntensity={1.2} />

            <ambientLight intensity={CONFIG.lights.ambient.intensity} color={CONFIG.lights.ambient.color} />
            <directionalLight
                position={CONFIG.lights.sun.position}
                intensity={CONFIG.lights.sun.intensity}
                color={CONFIG.lights.sun.color}
                castShadow
                shadow-mapSize={[CONFIG.shadow.mapSize, CONFIG.shadow.mapSize]}
                shadow-normalBias={CONFIG.shadow.normalBias}
                shadow-camera-far={CONFIG.shadow.cameraFar}
                shadow-camera-left={CONFIG.shadow.cameraLeft}
                shadow-camera-right={CONFIG.shadow.cameraRight}
                shadow-camera-top={CONFIG.shadow.cameraTop}
                shadow-camera-bottom={CONFIG.shadow.cameraBottom}
            />
            <hemisphereLight args={[CONFIG.lights.hemisphere.sky, CONFIG.lights.hemisphere.ground, CONFIG.lights.hemisphere.intensity]} />

            <BazaarSet />
            <Vendor setTarget={onShout} targetId={targetVendor} />
            <Crowd messages={messages} />

            <LedSign />
            <ScrapSign />

            <NeonSign text="NOODLES" color="#ff0055" position={[6, 4, -8]} rotation={[0, -0.5, 0]} flicker />
            <NeonSign text="OPEN" color="#00ffcc" position={[-5, 3, -2]} rotation={[0, 0.5, 0]} scale={0.8} />
            <NeonSign text="CYBER" color="#aa00ff" position={[0, 5, -10]} scale={1.5} />

            <LedBar color="#ff0055" position={[6, 1, -8]} rotation={[0, 0, Math.PI / 2]} length={4} />
            <LedBar color="#00ffcc" position={[-5, 1, -2]} rotation={[0, 0, Math.PI / 2]} length={3} />
            <LedBar color="#0088ff" position={[0, 0.2, -5]} length={10} thickness={0.1} />

            <AlleyLight position={[-2, 4, 2]} color="#ffaa00" rotation={[-Math.PI / 3, 0.5, 0]} />
            <AlleyLight position={[3, 4, 3]} color="#ffaa00" rotation={[-Math.PI / 3, -0.5, 0]} />

            <CameraRig targetVendor={targetVendor} onExit={() => onShout("/back")} />

            <EffectComposer>
                <SMAA />
                <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
            </EffectComposer>
        </>
    );
}

export default function BazaarScene() {
    const [messages, setMessages] = useState<any[]>([]);
    const socketRef = useRef<any>(null); // Use ref to prevent re-renders on socket changes
    const [targetVendor, setTargetVendor] = useState<string | null>(null);

    // Initial Message for atmosphere
    useEffect(() => {
        setMessages([
            { id: "init-1", content: "The market is open...", timestamp: Date.now() },
            { id: "init-2", content: "Don't stare at the shadows.", timestamp: Date.now() }
        ]);
    }, []);

    // Socket Connection (Simulated if backend missing for dev)
    // Uses shared socket singleton - do NOT disconnect on unmount; only remove Bazaar-specific listeners
    useEffect(() => {
        const onConnectError = (err: Error) => {
            console.warn("Bazaar Socket Error:", err.message);
        };
        const onConnect = () => {
            console.log("Connected to Bazaar");
        };
        const onBazaarInit = (data: any) => {
            if (data && data.messages) {
                setMessages((prev) => [...data.messages, ...prev].slice(0, 50));
            }
        };
        const onBazaarShout = (msg: any) => {
            setMessages((prev) => [msg, ...prev].slice(0, 50));
        };

        const initSocket = async () => {
            const { getSocket } = await import("../../engine/socketClient");
            const socket = getSocket();
            socketRef.current = socket;

            socket.on("connect_error", onConnectError);
            socket.on("connect", onConnect);
            socket.on("bazaar:init", onBazaarInit);
            socket.on("bazaar:shout", onBazaarShout);
        };

        initSocket();

        return () => {
            const socket = socketRef.current;
            if (socket) {
                socket.off("connect_error", onConnectError);
                socket.off("connect", onConnect);
                socket.off("bazaar:init", onBazaarInit);
                socket.off("bazaar:shout", onBazaarShout);
            }
        };
    }, []);

    const handleShout = useCallback((text: string) => {
        // Command parsing for local feedback (immediate)
        if (text.startsWith("/")) {
            const cmd = text.slice(1).toLowerCase();
            if (cmd.startsWith("broker")) setTargetVendor("broker");
            else if (cmd.startsWith("barker")) setTargetVendor("barker");
            else if (cmd.startsWith("gamemaster") || cmd === "gm") setTargetVendor("gamemaster");
            else if (cmd.startsWith("gatekeeper")) setTargetVendor("gatekeeper");
            else if (cmd === "reset" || cmd === "back") setTargetVendor(null);
        }

        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("bazaar:shout", { content: text });
        } else {
            // Local fallback
            const msg = { id: Date.now().toString(), content: text, timestamp: Date.now() };
            setMessages(prev => [msg, ...prev].slice(0, 50));
        }
    }, []);

    const onShoutTarget = useCallback((t: string) => setTargetVendor(t), []);

    return (
        <div className="bazaar-canvas-container">
            <Canvas
                shadows
                dpr={[1, 1.5]} // Optimized: Capped at 1.5x to save 44% pixel fill rate on retina screens
                gl={{
                    antialias: false,
                    toneMapping: CONFIG.postprocessing.toneMapping,
                    toneMappingExposure: CONFIG.postprocessing.exposure,
                    powerPreference: 'default', // Don't force discrete GPU on laptops
                    stencil: false,
                    depth: true
                }}
                camera={CONFIG.camera}
            >
                <BazaarMaterialsProvider>
                    <Suspense fallback={null}>
                        <SceneContent
                            messages={messages}
                            targetVendor={targetVendor}
                            onShout={onShoutTarget}
                        />
                    </Suspense>
                </BazaarMaterialsProvider>
            </Canvas>

            {/* Vignette & Grain Overlay (CSS) */}
            <div className="bazaar-overlay-vignette" />

            <InputBar onShout={handleShout} />
        </div>
    );
}
