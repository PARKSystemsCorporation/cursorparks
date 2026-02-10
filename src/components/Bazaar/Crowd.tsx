"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface Message {
    id: number;
    content: string;
    x: number;
    y: number;
    z: number;
    timestamp: number;
}

// Floating Text Component
function ChatBubble({ message, index }: { message: Message; index: number }) {
    const ref = useRef<any>(null);
    const birthTime = useMemo(() => Date.now(), []);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const age = (Date.now() - birthTime) / 1000;

        // Float UP
        ref.current.position.y = message.y + age * 0.5;

        // Fade Out
        const life = 10; // 10 seconds life
        let opacity = 1;
        if (age > life - 2) {
            opacity = (life - age) / 2;
        }
        if (age > life) opacity = 0;

        ref.current.material.opacity = opacity;
        ref.current.lookAt(0, 1.5, 8); // Look at camera roughly
    });

    return (
        <Text
            ref={ref}
            position={[message.x, message.y, message.z]}
            fontSize={0.4}
            color="#cccccc"
            anchorX="center"
            anchorY="middle"
            maxWidth={4}
            textAlign="center"
            outlineWidth={0.02}
            outlineColor="#000000"
            font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" // Default font
        >
            {message.content}
        </Text>
    );
}

export default function Crowd({ messages }: { messages: any[] }) {
    return (
        <group>
            {messages.map((msg, i) => (
                <ChatBubble key={msg.id || i} message={msg} index={i} />
            ))}
        </group>
    );
}
