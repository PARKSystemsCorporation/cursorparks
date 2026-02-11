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
            }, 200);
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
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
        }}>
            <h1 style={{
                fontSize: "1.5rem",
                fontWeight: "300",
                letterSpacing: "0.2em",
                textTransform: "uppercase"
            }}>
                Entering Market
            </h1>
        </div>
    );
}
