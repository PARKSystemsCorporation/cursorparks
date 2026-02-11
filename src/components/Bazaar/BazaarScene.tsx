/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Canvas } from "@react-three/fiber";
// import { Physics } from "@react-three/cannon"; // Optimized: Removed unused physics engine
import { useEffect, useState, useRef, Suspense } from "react";
import * as THREE from "three";
import Environment from "./Environment";
import Vendor from "./Vendor";
import Crowd from "./Crowd";
import CameraRig from "./CameraRig";
import InputBar from "./InputBar";
import "./BazaarLanding.css";
import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA } from "@react-three/postprocessing";
import LedSign from "./LedSign";
import ScrapSign from "./ScrapSign";
import { BazaarMaterialsProvider } from "./BazaarMaterials";
import NeonSign from "./NeonSign";
import LedBar from "./LedBar";
import AlleyLight from "./AlleyLight";
import { BAZAAR_BRIGHTNESS } from "./brightness";

// --- Configuration ---
const CONFIG = {
    fog: { color: "#060610", near: 5, far: 50 }, // Deeper void, pushed back for visibility
    lights: {
        ambient: { intensity: 1.5, color: "#1a1a2e" }, // Much brighter base
        moon: { intensity: 8, color: "#4d66cc", position: [10, 20, 10] }, // Stronger moon
        lanterns: { intensity: 12, distance: 15, decay: 2, color: "#ffaa00" }, // Keep warm lights popping
    },
    camera: {
        position: [0, 1.7, 6] as [number, number, number],
        fov: 60,
    },
    postprocessing: {
        exposure: 1.5 * BAZAAR_BRIGHTNESS, // Brighter
        toneMapping: THREE.ACESFilmicToneMapping
    }
};

function SceneContent({ messages, targetVendor, onShout }: { messages: any[], targetVendor: string | null, onShout: (t: string) => void }) {
    return (
        <>
            {/* Cinematic Atmosphere */}
            <fog attach="fog" args={[CONFIG.fog.color, CONFIG.fog.near, CONFIG.fog.far]} />
            <color attach="background" args={[CONFIG.fog.color]} />

            {/* Cinematic Lighting System */}
            <ambientLight intensity={CONFIG.lights.ambient.intensity} color={CONFIG.lights.ambient.color} />
            <directionalLight
                position={[10, 20, 5]}
                intensity={CONFIG.lights.moon.intensity}
                color={CONFIG.lights.moon.color}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />
            {/* Hemisphere for ground bounce */}
            <hemisphereLight args={["#2a3045", "#050505", 1.0]} />

            {/* Optimized: Removed Physics wrapper as no bodies are used */}
            <Environment />
            <Vendor setTarget={onShout} targetId={targetVendor} />
            <Crowd messages={messages} />

            <LedSign />
            <ScrapSign />

            {/* --- NEW CYBERPUNK LIGHTING --- */}
            {/* Neon Signs */}
            <NeonSign text="NOODLES" color="#ff0055" position={[6, 4, -8]} rotation={[0, -0.5, 0]} flicker />
            <NeonSign text="OPEN" color="#00ffcc" position={[-5, 3, -2]} rotation={[0, 0.5, 0]} scale={0.8} />
            <NeonSign text="CYBER" color="#aa00ff" position={[0, 5, -10]} scale={1.5} />

            {/* LED Bars */}
            <LedBar color="#ff0055" position={[6, 1, -8]} rotation={[0, 0, Math.PI / 2]} length={4} />
            <LedBar color="#00ffcc" position={[-5, 1, -2]} rotation={[0, 0, Math.PI / 2]} length={3} />
            <LedBar color="#0088ff" position={[0, 0.2, -5]} length={10} thickness={0.1} />

            {/* Alleyway Lights */}
            <AlleyLight position={[-2, 4, 2]} color="#ffaa00" rotation={[-Math.PI / 3, 0.5, 0]} />
            <AlleyLight position={[3, 4, 3]} color="#ffaa00" rotation={[-Math.PI / 3, -0.5, 0]} />

            {/* Camera Control */}
            <CameraRig targetVendor={targetVendor} onExit={() => onShout("/back")} />

            {/* Post-Processing Stack - Clean HD */}
            <EffectComposer>
                <SMAA />
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
                <Vignette eskil={false} offset={0.1} darkness={0.6} />
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
    useEffect(() => {
        const initSocket = async () => {
            // Optimized: Use shared socket singleton to share connection
            const { getSocket } = await import("../../engine/socketClient");
            const newSocket = getSocket();

            newSocket.on("connect_error", (err) => {
                console.warn("Bazaar Socket Error:", err.message);
                // Don't disconnect immediately, let it retry
            });

            newSocket.on("connect", () => {
                console.log("Connected to Bazaar");
                // newSocket.emit("request-history"); // Handled by bazaar:init automatically on connect
            });

            newSocket.on("bazaar:init", (data: any) => {
                if (data && data.messages) {
                    setMessages(prev => [...data.messages, ...prev].slice(0, 50));
                }
            });

            newSocket.on("bazaar:shout", (msg: any) => {
                setMessages((prev) => [msg, ...prev].slice(0, 50));
            });

            socketRef.current = newSocket;
        };

        initSocket();
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const handleShout = (text: string) => {
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
    };

    return (
        <div className="bazaar-canvas-container">
            <Canvas
                shadows
                dpr={[1, 1.5]} // Optimized: Capped at 1.5x to save 44% pixel fill rate on retina screens
                gl={{
                    antialias: false, // Handled by SMAA post-process instead (cheaper)
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
                            onShout={(t) => setTargetVendor(t)}
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
