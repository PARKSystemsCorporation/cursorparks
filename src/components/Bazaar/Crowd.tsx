"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";

interface Message {
    id: number;
    content: string;
    // We'll ignore the backend positions normally and allow the crowd system to place them
    // but if backend provides, we can use. For now, random spawn in alley.
}

// Floating Text Component
function ChatBubble({ message, index, count }: { message: Message; index: number; count: number }) {
    const ref = useRef<any>(null);
    const birthTime = useMemo(() => Date.now(), []);

    // Deterministic random start position based on ID or index
    const startPos = useMemo(() => {
        return {
            x: (Math.random() - 0.5) * 4, // Spread across alley width
            y: 0.5 + Math.random() * 2,    // Start low-ish
            z: (Math.random() - 0.5) * 6 - 4 // Spread in depth
        };
    }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const age = (Date.now() - birthTime) / 1000;
        const life = 15; // Long life but fades

        // Rise like smoke
        const yOffset = age * 0.3; // Rise speed
        const xDrift = Math.sin(age * 0.5 + index) * 0.5; // Wafting

        ref.current.position.set(
            startPos.x + xDrift,
            startPos.y + yOffset,
            startPos.z
        );

        // Opacity management (Congestion)
        // More specific logic: if count is high, fade faster?
        // simple linear fade for now
        let opacity = 1;
        if (age < 0.5) opacity = age / 0.5; // Fade in
        else if (age > life - 3) opacity = (life - age) / 3; // Fade out

        // Congestion hack: if many messages, max opacity is lower
        const maxOpacity = Math.max(0.3, 1 - (count / 50));
        ref.current.color = opacity * maxOpacity; // Trick: Troika text handles opacity via color alpha often or material

        ref.current.material.opacity = opacity * maxOpacity;
        ref.current.material.transparent = true;
        ref.current.material.depthWrite = false; // Prevent blocking other transparents
    });

    return (
        <Billboard>
            <Text
                ref={ref}
                fontSize={0.35}
                color="#eeeeee"
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                anchorX="center"
                anchorY="middle"
                maxWidth={3.5}
                textAlign="center"
                outlineWidth={0.03}
                outlineColor="#000000"
                outlineBlur={0.05} // Soft shadow look
            >
                {message.content}
            </Text>
        </Billboard>
    );
}

export default function Crowd({ messages }: { messages: any[] }) {
    // Only render last 30 messages to prevent performance kill, 
    // or render all if we want CHAOS. User asked for high density.
    // Let's render up to 50 recent.
    const recentMessages = messages.slice(-50);

    return (
        <group>
            {recentMessages.map((msg, i) => (
                <ChatBubble key={msg.id || i} message={msg} index={i} count={recentMessages.length} />
            ))}
        </group>
    );
}
