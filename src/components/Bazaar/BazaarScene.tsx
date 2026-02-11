/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { useEffect, useState, Suspense } from "react";
import * as THREE from "three";
import Environment from "./Environment";
import Vendor from "./Vendor";
import Crowd from "./Crowd";
import CameraRig from "./CameraRig";
import InputBar from "./InputBar";
import "./BazaarLanding.css";
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from "@react-three/postprocessing";

// --- Configuration ---
const CONFIG = {
    fog: { color: "#080815", near: 2, far: 25 }, // Slightly brighter fog, further start
    lights: {
        ambient: { intensity: 0.6, color: "#2a3045" }, // Brighter blue fill (was 0.2)
        moon: { intensity: 3, color: "#9aa6d7", position: [10, 20, 10] }, // Stronger moon key (was 1.5)
        lanterns: { intensity: 8, distance: 12, decay: 2, color: "#ffaa00" }, // Bright warm practicals (was 3)
    },
    camera: {
        position: [0, 1.7, 6] as [number, number, number],
        fov: 55,
    },
    postprocessing: {
        exposure: 1.5, // Brighter overall exposure (was 1.0)
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
                shadow-mapSize={[1024, 1024]}
            />
            {/* Hemisphere for ground bounce */}
            <hemisphereLight args={["#2a3045", "#050505", 1.0]} />

            {/* Physics World */}
            <Physics gravity={[0, -9.8, 0]}>
                <Environment />
                <Vendor setTarget={onShout} targetId={targetVendor} />
                <Crowd messages={messages} />
            </Physics>

            {/* Camera Control */}
            <CameraRig targetVendor={targetVendor} />

            {/* Post-Processing Stack */}
            <EffectComposer>
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
                <Noise opacity={0.15} />
                <Vignette eskil={false} offset={0.1} darkness={0.6} />
                <ToneMapping adaptive={true} resolution={256} middleGrey={0.6} maxLuminance={16.0} averageLuminance={1.0} adaptationRate={1.0} />
            </EffectComposer>
        </>
    );
}

export default function BazaarScene() {
    const [messages, setMessages] = useState<any[]>([]);
    const [socket, setSocket] = useState<any>(null);
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
            const { io } = await import("socket.io-client");
            // Use relative path or env var in real prod. 
            // Reducing reconnection attempts to stop spam in dev if backend is off
            const newSocket = io("http://localhost:3001", {
                transports: ["websocket"],
                reconnectionAttempts: 1,
                timeout: 5000,
            });

            newSocket.on("connect_error", () => {
                // Silently fail or log once to avoid console spam
                console.log("Bazaar Backend offline - switching to Simulation Mode");
            });

            newSocket.on("connect", () => {
                console.log("Connected to Bazaar");
                newSocket.emit("request-history");
            });

            newSocket.on("chat-history", (history: any[]) => {
                setMessages(prev => [...history, ...prev].slice(0, 50));
            });

            newSocket.on("chat-message", (msg: any) => {
                setMessages((prev) => [msg, ...prev].slice(0, 50));
            });

            setSocket(newSocket);
        };

        initSocket();
        return () => {
            if (socket) socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        if (socket) {
            socket.emit("chat-message", text);
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
                dpr={[1, 1.5]} // Cap DPI for performance
                gl={{
                    antialias: false, // Grittier look, faster
                    toneMapping: CONFIG.postprocessing.toneMapping,
                    toneMappingExposure: CONFIG.postprocessing.exposure,
                    stencil: false,
                    depth: true
                }}
                camera={CONFIG.camera}
            >
                <Suspense fallback={null}>
                    <SceneContent
                        messages={messages}
                        targetVendor={targetVendor}
                        onShout={(t) => setTargetVendor(t)}
                    />
                </Suspense>
            </Canvas>

            {/* Vignette & Grain Overlay (CSS) */}
            <div className="bazaar-overlay-vignette" />

            <InputBar onShout={handleShout} />
        </div>
    );
}
