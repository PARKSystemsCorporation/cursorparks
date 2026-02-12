"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useChat, ChatMessage } from "./ChatContext";

const ROBOTO_FONT = "https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff";

interface FloatBubble {
    msg: ChatMessage;
    startY: number;
    y: number;
    opacity: number;
    x: number;
    alive: boolean;
}

/** Renders floating messages inside the 3D canvas. Messages rise upward and fade out. */
export default function FloatingMessages() {
    const { latestUserMessage, latestVendorMessage } = useChat();
    const [bubbles, setBubbles] = useState<FloatBubble[]>([]);
    const seenIds = useRef(new Set<string>());

    // Spawn a bubble when a new message arrives
    useEffect(() => {
        if (latestUserMessage && !seenIds.current.has(latestUserMessage.id)) {
            seenIds.current.add(latestUserMessage.id);
            setBubbles((prev) => [
                ...prev,
                {
                    msg: latestUserMessage,
                    startY: 0.3,
                    y: 0.3,
                    opacity: 1,
                    x: (Math.random() - 0.5) * 0.6,
                    alive: true,
                },
            ]);
        }
    }, [latestUserMessage]);

    useEffect(() => {
        if (latestVendorMessage && !seenIds.current.has(latestVendorMessage.id)) {
            seenIds.current.add(latestVendorMessage.id);
            setBubbles((prev) => [
                ...prev,
                {
                    msg: latestVendorMessage,
                    startY: 1.2,
                    y: 1.2,
                    opacity: 1,
                    x: (Math.random() - 0.5) * 1.5,
                    alive: true,
                },
            ]);
        }
    }, [latestVendorMessage]);

    // Animate bubbles
    useFrame((_, delta) => {
        setBubbles((prev) => {
            let changed = false;
            const next = prev.map((b) => {
                if (!b.alive) return b;
                const newY = b.y + delta * 0.4;
                const elapsed = (newY - b.startY) / 0.4;
                const newOpacity = Math.max(0, 1 - elapsed / 4); // fade over 4 seconds
                if (newOpacity <= 0) {
                    changed = true;
                    return { ...b, alive: false, opacity: 0 };
                }
                changed = true;
                return { ...b, y: newY, opacity: newOpacity };
            });
            if (!changed) return prev;
            return next.filter((b) => b.alive);
        });
    });

    return (
        <group>
            {bubbles.map((b) => (
                <group key={b.msg.id} position={[b.x, b.y, -2]}>
                    {/* Background plate */}
                    <mesh position={[0, 0, -0.01]}>
                        <planeGeometry args={[Math.min(b.msg.text.length * 0.09 + 0.4, 3), 0.3]} />
                        <meshBasicMaterial
                            color={b.msg.senderType === "user" ? "#001a0d" : "#1a0d00"}
                            transparent
                            opacity={b.opacity * 0.5}
                        />
                    </mesh>
                    <Text
                        fontSize={0.12}
                        maxWidth={2.8}
                        color={b.msg.color}
                        font={ROBOTO_FONT}
                        anchorX="center"
                        anchorY="middle"
                        fillOpacity={b.opacity}
                        outlineWidth={0.008}
                        outlineColor="#000000"
                        outlineOpacity={b.opacity}
                    >
                        {b.msg.senderType === "user" ? b.msg.text : `${b.msg.sender}: ${b.msg.text}`}
                    </Text>
                </group>
            ))}
        </group>
    );
}
