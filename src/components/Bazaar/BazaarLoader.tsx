"use client";

import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

export default function BazaarLoader({ onFinished }: { onFinished?: () => void }) {
    const { progress } = useProgress();
    const [finished, setFinished] = useState(false);

    // Completion Handler
    useEffect(() => {
        if (progress === 100 && !finished) {
            const timer = setTimeout(() => {
                setFinished(true);
                if (onFinished) onFinished();
            }, 500); // Short delay
            return () => clearTimeout(timer);
        }
    }, [progress, finished, onFinished]);

    if (finished) return null;

    return (
        <div style={{
            position: "absolute",
            inset: 0,
            background: "#050510",
            color: "#fff",
            fontFamily: "sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
        }}>
            <h1 style={{
                fontSize: "1.5rem",
                fontWeight: "300",
                letterSpacing: "0.2em",
                marginBottom: "2rem",
                textTransform: "uppercase"
            }}>
                Entering Market
            </h1>

            {/* Simple Line Progress */}
            <div style={{ width: "200px", height: "2px", background: "#333", position: "relative" }}>
                <div style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#fff",
                    transition: "width 0.2s ease-out"
                }} />
            </div>

            <div style={{
                marginTop: "1rem",
                fontSize: "0.8rem",
                color: "#666",
                letterSpacing: "0.1em"
            }}>
                {Math.round(progress)}%
            </div>
        </div>
    );
}
