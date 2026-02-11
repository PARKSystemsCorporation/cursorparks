"use client";

import React, { useEffect, useState, useRef } from "react";
import { useProgress } from "@react-three/drei";

const LOAD_TEXTS = [
    "INITIALIZING KERNEL...",
    "LOADING ASSETS...",
    "ESTABLISHING SECURE CONNECTION...",
    "DECRYPTING MARKET DATA...",
    "HANDSHAKE PROTOCOL ACCEPTED...",
    "ENTERING THE BAZAAR..."
];

export default function BazaarLoader({ onFinished }: { onFinished?: () => void }) {
    const { progress } = useProgress();
    const [finished, setFinished] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Simulate boot logs
    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < LOAD_TEXTS.length) {
                setLog(prev => [...prev, `> ${LOAD_TEXTS[currentIndex]}`]);
                currentIndex++;
            }
        }, 400);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [log]);

    // Completion Handler
    useEffect(() => {
        if (progress === 100 && !finished) {
            const timer = setTimeout(() => {
                setFinished(true);
                if (onFinished) onFinished();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [progress, finished, onFinished]);

    if (finished) return null;

    return (
        <div style={{
            position: "absolute",
            inset: 0,
            background: "#020205",
            color: "#00ff9d",
            fontFamily: "'Courier New', monospace",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            overflow: "hidden"
        }}>
            {/* Scanlines */}
            <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                backgroundSize: "100% 2px, 3px 100%",
                pointerEvents: "none"
            }} />

            <div style={{ width: "300px", zIndex: 10 }}>
                <h1 style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    letterSpacing: "0.1em",
                    marginBottom: "2rem",
                    textTransform: "uppercase",
                    textShadow: "0 0 10px rgba(0, 255, 157, 0.5)",
                    textAlign: "center"
                }}>
                    SYSTEM BOOT
                </h1>

                {/* Cyber Progress Bar */}
                <div style={{
                    width: "100%",
                    height: "4px",
                    background: "#111",
                    position: "relative",
                    marginBottom: "1rem",
                    border: "1px solid #333"
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#00ff9d",
                        boxShadow: "0 0 10px #00ff9d",
                        transition: "width 0.1s ease-out"
                    }} />
                </div>

                <div style={{
                    height: "100px",
                    overflow: "hidden",
                    fontSize: "0.8rem",
                    opacity: 0.8,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end"
                }}>
                    {log.map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    );
}
