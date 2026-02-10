"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import BazaarEnvironment from "./Environment";
import Crowd from "./Crowd";
import Vendors from "./Vendor";
import CameraRig from "./CameraRig";
import InputBar from "./InputBar";
import { io, Socket } from "socket.io-client";
import "./BazaarLanding.css";

// Move socket init outside to avoid reconnects on re-renders, 
// or use a context/effect. For simplicity, we'll use a singleton pattern or ref.
let socket: Socket;

export default function BazaarScene() {
    const [messages, setMessages] = useState<any[]>([]);
    const [targetVendor, setTargetVendor] = useState<string | null>(null);

    // Initialize Socket
    useEffect(() => {
        // Only connect if not already connected
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
                // Keep only last 100 on client too
                if (next.length > 100) return next.slice(next.length - 100);
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
            if (cmd === "/broker") setTargetVendor("broker");
            else if (cmd === "/barker") setTargetVendor("barker");
            else if (cmd === "/games") setTargetVendor("gamemaster");
            else if (cmd === "/vip") setTargetVendor("gatekeeper");
            return;
        }

        // Default shout
        socket.emit("bazaar:shout", { content: text });
        // Vendor "listening" logic could go here (reset target if random shout?)
        setTargetVendor(null);
    };

    return (
        <>
            <div className="bazaar-canvas-container">
                <Canvas
                    shadows
                    camera={{ position: [0, 2, 8], fov: 60 }}
                    dpr={[1, 2]}
                >
                    {/* Fog for Depth/Crowd Density */}
                    <fog attach="fog" args={['#050510', 5, 25]} />

                    {/* Lighting */}
                    <ambientLight intensity={0.2} />
                    <pointLight position={[0, 4, 0]} intensity={0.5} color="#ffaa00" distance={10} decay={2} />

                    <Suspense fallback={null}>
                        <Physics gravity={[0, -9.81, 0]}>
                            <BazaarEnvironment />
                            <Vendors target={targetVendor} />
                        </Physics>
                        <Crowd messages={messages} />
                    </Suspense>

                    <CameraRig targetVendor={targetVendor} />
                </Canvas>

                <Loader />
                <InputBar onShout={handleShout} />
            </div>
        </>
    );
}
