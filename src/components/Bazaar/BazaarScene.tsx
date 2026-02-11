/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { useEffect, useState, useRef, Suspense } from "react";
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
    fog: { color: "#060610", near: 2, far: 30 }, // Deeper void
    lights: {
        ambient: { intensity: 0.3, color: "#1a1a2e" }, // Darker ambient for contrast
        moon: { intensity: 4, color: "#4d66cc", position: [10, 20, 10] }, // Cyber blue moon
        lanterns: { intensity: 12, distance: 15, decay: 2, color: "#ffaa00" }, // Popping warm lights
    },
    camera: {
        position: [0, 1.7, 6] as [number, number, number],
        fov: 60, // Slightly wider for cinematic feel
    },
    postprocessing: {
        exposure: 1.2,
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
            <CameraRig targetVendor={targetVendor} onExit={() => onShout("/back")} />

            {/* Post-Processing Stack - Clean HD */}
            <EffectComposer>
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
                {/* <Noise opacity={0.05} /> -- REMOVED for HD Clean look */}
                <Vignette eskil={false} offset={0.1} darkness={0.6} />
                <ToneMapping adaptive={true} resolution={256} middleGrey={0.6} maxLuminance={16.0} averageLuminance={1.0} adaptationRate={1.0} />
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
            const { io } = await import("socket.io-client");
            // Use relative path or env var in real prod. 
            // Reducing reconnection attempts to stop spam in dev if backend is off
            // Use relative path to connect to the same origin (server.js serves both app and socket)
            // matching server.js `path: "/socket"`
            const newSocket = io({
                path: "/socket",
                transports: ["websocket", "polling"], // Allow polling fallback
                reconnection: true,
                timeout: 5000,
            });

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
                dpr={[1, 2]} // High DPI for HD look
                gl={{
                    antialias: true, // Clean lines
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
