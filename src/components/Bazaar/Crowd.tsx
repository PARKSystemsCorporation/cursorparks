"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";

interface Message {
    id: number;
    content: string;
}

// Floating Text Component
function ChatBubble({ message, index, count }: { message: Message; index: number; count: number }) {
    const textRef = useRef<any>(null);
    const birthTime = useMemo(() => Date.now(), []);

    // Deterministic random start position
    const startPos = useMemo(() => {
        return new THREE.Vector3(
            (Math.random() - 0.5) * 5, // Wider spread
            0.5 + Math.random() * 1.5, // Start height
            (Math.random() - 0.5) * 8 - 4 // Depth spread
        );
    }, []);

    const driftSpeed = useMemo(() => 0.2 + Math.random() * 0.3, []);

    useFrame(({ clock }) => {
        if (!textRef.current) return;
        const t = clock.getElapsedTime();
        const age = (Date.now() - birthTime) / 1000;
        const life = 12; // Seconds to live

        // Physics: Rise and Drift
        // Smoke-like motion: rise steadily, drift horizontally with noise
        const yOffset = age * driftSpeed;
        const xDrift = Math.sin(age * 0.5 + index) * 0.5 + Math.sin(t * 2 + index) * 0.05; // Macro + Micro jitter

        textRef.current.position.set(
            startPos.x + xDrift,
            startPos.y + yOffset,
            startPos.z
        );

        // Rotation Jitter (Wind buffeting)
        textRef.current.rotation.z = Math.sin(t * 3 + index) * 0.05;

        // Opacity / Fade 
        let opacity = 1;
        if (age < 1) opacity = age; // Fade in
        else if (age > life - 2) opacity = (life - age) / 2; // Fade out

        // Congestion adjustment
        const densityFactor = Math.max(0.4, 1 - (count / 60));
        const finalOpacity = opacity * densityFactor;

        // Apply visual updates
        textRef.current.fillOpacity = finalOpacity;
        textRef.current.outlineOpacity = finalOpacity;
    });

    return (
        <Billboard>
            <Text
                ref={textRef}
                fontSize={0.3} // Slightly smaller for scale
                color="#e0dcca" // Warm paper/parchment white
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                anchorX="center"
                anchorY="middle"
                maxWidth={4}
                textAlign="center"
                outlineWidth={0.02}
                outlineColor="#1a1a1a" // Softer outline
                outlineBlur={0.04} // Smoky edges
                depthWrite={false} // Transparent sorting
            >
                {message.content}
            </Text>
        </Billboard>
    );
}

export default function Crowd({ messages }: { messages: any[] }) {
    const recentMessages = messages.slice(-60); // Show more chaos

    return (
        <group>
            {recentMessages.map((msg, i) => (
                <ChatBubble key={msg.id || i} message={msg} index={i} count={recentMessages.length} />
            ))}
        </group>
    );
}
