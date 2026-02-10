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

// --- Configuration ---
const CONFIG = {
    fog: { color: "#020205", near: 1, far: 20 }, // Darker, tighter fog
    lights: {
        ambient: { intensity: 0.2, color: "#1a2030" }, // Deep blue moon fill
        moon: { intensity: 1.5, color: "#8a96c7", position: [10, 20, 10] }, // Hard moon key
        lanterns: { intensity: 3, distance: 10, decay: 2, color: "#ff9000" }, // Fire
    },
    camera: {
        position: [0, 1.7, 6] as [number, number, number],
        fov: 55, // 55mm lens feel (cinematic, less distortion)
    },
    postprocessing: {
        exposure: 1.0,
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
            <hemisphereLight args={["#1a2030", "#050505", 0.5]} />

            {/* Physics World */}
            <Physics gravity={[0, -9.8, 0]}>
                <Environment />
                <Vendor setTarget={onShout} targetId={targetVendor} />
                <Crowd messages={messages} />
            </Physics>

            {/* Camera Control */}
            <CameraRig targetVendor={targetVendor} />
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
            const newSocket = io("http://localhost:3001", {
                transports: ["websocket"],
                reconnectionAttempts: 5,
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
