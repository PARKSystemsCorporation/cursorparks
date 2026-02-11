"use client";

import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

export default function BazaarLoader({ onFinished }: { onFinished?: () => void }) {
    const { active, progress } = useProgress();
    const [messages, setMessages] = useState<string[]>([]);
    const [glitch, setGlitch] = useState(false);
    const [finished, setFinished] = useState(false);

    // Hustle Bustle Text Generator
    useEffect(() => {
        const phrases = [
            "ESTABLISHING UPLINK...",
            "BYPASSING SECURITY PROTOCOLS...",
            "NEGOTIATING HANDSHAKE...",
            "DECRYPTING VENDOR DATA...",
            "LOCATING BLACK MARKET...",
            "AVOIDING PATROLS...",
            "SYNCING NEURAL INTERFACE...",
            "CONNECTING TO SECTOR 7...",
            "LOADING ASSETS...",
            "INITIALIZING FOG SYSTEMS..."
        ];

        const interval = setInterval(() => {
            if (finished) return;
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
            setMessages(prev => [`[${timestamp}] ${randomPhrase}`, ...prev].slice(0, 10));
            setGlitch(true);
            setTimeout(() => setGlitch(false), 100);
        }, 400);

        return () => clearInterval(interval);
    }, [finished]);

    // Completion Handler
    useEffect(() => {
        if (progress === 100 && !finished) {
            // Add a small artificial delay for dramatic effect if it loads too fast
            const timer = setTimeout(() => {
                setFinished(true);
                if (onFinished) onFinished();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [progress, finished, onFinished]);

    if (finished) return null;

    return (
        <div style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            color: "#0f0",
            fontFamily: "monospace",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "2rem",
            pointerEvents: "none", // Let clicks pass through if needed, though usually we block
            overflow: "hidden"
        }}>
            {/* Glitch Overlay */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: glitch ? "rgba(0, 255, 0, 0.1)" : "transparent",
                pointerEvents: "none",
                transition: "background 0.05s"
            }} />

            {/* Progress Bar (Retro Style) */}
            <div style={{ marginBottom: "2rem", width: "100%", maxWidth: "600px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>SYSTEM_BOOT</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ width: "100%", height: "20px", border: "2px solid #33ff33", padding: "2px" }}>
                    <div style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#33ff33",
                        boxShadow: "0 0 10px #33ff33",
                        transition: "width 0.2s ease-out"
                    }} />
                </div>
            </div>

            {/* Rolling Log */}
            <div style={{
                display: "flex",
                flexDirection: "column-reverse",
                height: "300px",
                overflow: "hidden",
                opacity: 0.8,
                fontSize: "14px",
                lineHeight: "1.5",
                textShadow: "0 0 5px rgba(0, 255, 0, 0.5)"
            }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ opacity: 1 - i * 0.1 }}>{msg}</div>
                ))}
            </div>

            {/* Title Overlay */}
            <h1 style={{
                position: "absolute",
                top: "2rem",
                left: "2rem",
                fontSize: "3rem",
                margin: 0,
                color: "#fff",
                textShadow: glitch ? "2px 0 red, -2px 0 blue" : "none",
                letterSpacing: "5px"
            }}>
                MARKET//UPLINK
            </h1>
        </div>
    );
}
