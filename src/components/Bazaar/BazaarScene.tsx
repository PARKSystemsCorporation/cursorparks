/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import * as THREE from "three";
import { Environment as DreiEnvironment } from "@react-three/drei";
import BazaarSet from "./Environment";
import Vendor from "./Vendor";
import Crowd from "./Crowd";
import CameraRig from "./CameraRig";
import InputBar from "./InputBar";
import "./BazaarLanding.css";
import { EffectComposer, ToneMapping, SMAA, Bloom } from "@react-three/postprocessing";
import CameraPresence from "./CameraPresence";
import LedSign from "./LedSign";
import ScrapSign from "./ScrapSign";
import { BazaarMaterialsProvider } from "./BazaarMaterials";
import NeonSign from "./NeonSign";
import LedBar from "./LedBar";
import AlleyLight from "./AlleyLight";
import MarketAtmosphere from "./MarketAtmosphere";
import MarketSoundscape from "./MarketSoundscape";
import DustParticulates from "./DustParticulates";

// --- Market configuration ---
const CONFIG = {
    // NIGHT MODE: Dark, atmospheric, blue-tinted
    fog: { color: "#050a14", near: 10, far: 45 },
    lights: {
        // Very dim ambient - mostly darkness
        ambient: { intensity: 0.15, color: "#112244" },
        // "Moon" or city glow - Cool, soft, from above/behind
        sun: { intensity: 0.8, color: "#88ccff", position: [-5, 20, -10] as [number, number, number] },
        // Ground bounce vs Sky - Dark contrast
        hemisphere: { sky: "#0a1525", ground: "#020205", intensity: 0.4 },
    },
    // Camera config moved to CameraPresence
    postprocessing: {
        exposure: 1.5, // Bright, sunlit exposure
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

function SceneContent({ messages, targetVendor, onShout, onEnterAlleyTwo }: { messages: any[], targetVendor: string | null, onShout: (t: string) => void, onEnterAlleyTwo?: () => void }) {
    return (
        <>
            <ShadowMapSetup />
            <CameraPresence />
            <MarketAtmosphere />
            <DustParticulates />

            <DreiEnvironment preset="park" background={false} environmentIntensity={1.2} />

            <BazaarSet onEnterPortal={onEnterAlleyTwo} />
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
                <Bloom luminanceThreshold={1.5} mipmapBlur intensity={0.2} radius={0.4} />
                <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
            </EffectComposer>
        </>
    );
}

export type BazaarSceneProps = { onEnterAlleyTwo?: () => void };

export default function BazaarScene({ onEnterAlleyTwo }: BazaarSceneProps = {}) {
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
            if (cmd.startsWith("hawker")) setTargetVendor("hawker");
            else if (cmd.startsWith("broker")) setTargetVendor("broker");
            else if (cmd.startsWith("barker")) setTargetVendor("barker");
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
            >
                <BazaarMaterialsProvider>
                    <Suspense fallback={null}>
                        <SceneContent
                            messages={messages}
                            targetVendor={targetVendor}
                            onShout={onShoutTarget}
                            onEnterAlleyTwo={onEnterAlleyTwo}
                        />
                    </Suspense>
                </BazaarMaterialsProvider>
            </Canvas>

            {/* Vignette & Grain Overlay (CSS) */}
            <div className="bazaar-overlay-vignette" />

            <InputBar onShout={handleShout} />
            <MarketSoundscape />
        </div>
    );
}
