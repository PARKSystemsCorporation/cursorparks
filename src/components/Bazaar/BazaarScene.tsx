"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Loader, Stars, BakeShadows, Preload } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import BazaarEnvironment from "./Environment";
import Crowd from "./Crowd";
import Vendors from "./Vendor";
import CameraRig from "./CameraRig";
import InputBar from "./InputBar";
import { io, Socket } from "socket.io-client";
import * as THREE from "three";
import "./BazaarLanding.css";

// --- Scene Configuration ---
const CONFIG = {
    fog: { color: "#050510", near: 2, far: 18 },
    lights: {
        ambient: { intensity: 0.1, color: "#8a96c7" }, // Cool moonlight
        lanterns: { intensity: 2.5, distance: 8, decay: 2, color: "#ffaa33" }, // Warm fire
    },
    camera: {
        position: [0, 1.7, 6] as [number, number, number], // Human eye level
        fov: 65,
    },
    postprocessing: {
        exposure: 1.2
    }
};

let socket: Socket;

function SceneContent({ messages, targetVendor, onShout }: { messages: any[], targetVendor: string | null, onShout: (t: string) => void }) {
    // Subtle handheld camera shake or drift could go here in a generic useFrame if not in CameraRig
    return (
        <>
            <fog attach="fog" args={[CONFIG.fog.color, CONFIG.fog.near, CONFIG.fog.far]} />
            <color attach="background" args={[CONFIG.fog.color]} />

            {/* Lighting Setup */}
            <ambientLight intensity={CONFIG.lights.ambient.intensity} color={CONFIG.lights.ambient.color} />

            {/* Main Moon/City Light */}
            <directionalLight
                position={[5, 10, 5]}
                intensity={0.3}
                color="#aaccff"
                castShadow
                shadow-bias={-0.001}
            />

            <Suspense fallback={null}>
                <Physics gravity={[0, -9.81, 0]}>
                    <BazaarEnvironment />
                    <Vendors target={targetVendor} />
                </Physics>
                <Crowd messages={messages} />
            </Suspense>

            <CameraRig targetVendor={targetVendor} />

            {/* Preload assets if we had them */}
            <Preload all />
        </>
    );
}

export default function BazaarScene() {
    const [messages, setMessages] = useState<any[]>([]);
    const [targetVendor, setTargetVendor] = useState<string | null>(null);

    // Initialize Socket
    useEffect(() => {
        if (!socket) {
            socket = io({
                path: "/socket",
            });
        }

        socket.on("bazaar:init", (data) => {
            if (data && data.messages) {
                setMessages(data.messages);
            }
        });

        socket.on("bazaar:shout", (msg) => {
            setMessages((prev) => {
                const next = [...prev, msg];
                if (next.length > 80) return next.slice(next.length - 80);
                return next;
            });
        });

        return () => {
            socket.off("bazaar:init");
            socket.off("bazaar:shout");
        };
    }, []);

    const handleShout = (text: string) => {
        // Check for slash commands
        if (text.startsWith("/")) {
            const cmd = text.toLowerCase().trim();
            if (cmd.includes("broker")) setTargetVendor("broker");
            else if (cmd.includes("barker")) setTargetVendor("barker");
            else if (cmd.includes("game")) setTargetVendor("gamemaster");
            else if (cmd.includes("vip") || cmd.includes("gate")) setTargetVendor("gatekeeper");
            // Also allow clearing focus
            else if (cmd === "/reset" || cmd === "/back") setTargetVendor(null);
            return;
        }

        // Default shout
        if (socket) socket.emit("bazaar:shout", { content: text });
        setTargetVendor(null); // Shout breaks focus
    };

    return (
        <div className="bazaar-canvas-container">
            <Canvas
                shadows
                camera={{ position: CONFIG.camera.position, fov: CONFIG.camera.fov }}
                dpr={[1, 1.5]} // Cap DPR for performance
                gl={{
                    antialias: false, // Gritty look
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: CONFIG.postprocessing.exposure
                }}
            >
                <SceneContent messages={messages} targetVendor={targetVendor} onShout={handleShout} />
            </Canvas>

            <Loader />
            <InputBar onShout={handleShout} />

            {/* Visual overlay for vignette/grain could be CSS or PostProcessing */}
            <div className="bazaar-overlay-vignette pointer-events-none" />
        </div>
    );
}
