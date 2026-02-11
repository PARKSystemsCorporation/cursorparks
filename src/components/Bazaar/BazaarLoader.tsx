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

    // Failsafe: Force finish after 3 seconds if stuck
    useEffect(() => {
        if (!finished) {
            const timer = setTimeout(() => {
                setFinished(true);
                if (onFinished) onFinished();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [finished, onFinished]);

    if (finished) return null;

    return (
        <div className="bazaar-loader-overlay">
            <h1 className="bazaar-loader-text">
                Entering Market
            </h1>
            <div className="bazaar-loader-bar-container">
                <div className="bazaar-loader-bar" />
            </div>
        </div>
    );
}
