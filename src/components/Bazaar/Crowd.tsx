"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";

interface Message {
    id: number;
    content: string;
}

// Ref type for drei Text (Troika) - has position + fill/outline opacity
interface TextMeshRef extends THREE.Object3D {
    fillOpacity?: number;
    outlineOpacity?: number;
}

// Floating Text Component (Pure presentation now)
const ChatBubble = React.memo(({ message, bubbleRef }: { message: Message; bubbleRef: (el: TextMeshRef | null) => void }) => {
    return (
        <Billboard>
            <Text
                ref={bubbleRef}
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
            >
                {message.content}
            </Text>
        </Billboard>
    );
});
ChatBubble.displayName = "ChatBubble";

export default function Crowd({ messages }: { messages: Message[] }) {
    const recentMessages = messages.slice(-60); // Show more chaos
    const refs = useRef<(TextMeshRef | null)[]>([]);

    // Reset refs array when messages change length substantially to avoid stale refs
    // actually, just keep it loose, index-based access is fine
    refs.current = refs.current.slice(0, recentMessages.length);

    // Initial random positions state (static per message index to stay stable)
    // We use a stable seed or just index based math to keep it deterministic-ish 
    // or just store it. Storing is safer for "drift".
    const stateRefs = useRef<Array<{
        startPos: THREE.Vector3,
        birthTime: number,
        driftSpeed: number
    }>>([]);

    // Initialize state for new messages
    useEffect(() => {
        // Ensure state exists for all
        for (let i = 0; i < recentMessages.length; i++) {
            if (!stateRefs.current[i]) {
                stateRefs.current[i] = {
                    startPos: new THREE.Vector3(
                        (Math.random() - 0.5) * 5,
                        0.5 + Math.random() * 1.5,
                        (Math.random() - 0.5) * 8 - 4
                    ),
                    birthTime: Date.now(),
                    driftSpeed: 0.2 + Math.random() * 0.3
                }
            }
        }
    }, [recentMessages.length]); // Only run on length change

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const now = Date.now();
        const count = recentMessages.length;

        refs.current.forEach((ref, i) => {
            if (!ref || !stateRefs.current[i]) return;

            const state = stateRefs.current[i];
            const age = (now - state.birthTime) / 1000;
            const life = 12;

            // Physics: Rise and Drift
            const yOffset = age * state.driftSpeed;
            const xDrift = Math.sin(age * 0.5 + i) * 0.5 + Math.sin(t * 2 + i) * 0.05;

            ref.position.set(
                state.startPos.x + xDrift,
                state.startPos.y + yOffset,
                state.startPos.z
            );

            ref.rotation.z = Math.sin(t * 3 + i) * 0.05;

            // Opacity / Fade 
            let opacity = 1;
            if (age < 1) opacity = age;
            else if (age > life - 2) opacity = (life - age) / 2;

            const densityFactor = Math.max(0.4, 1 - (count / 60));
            const finalOpacity = opacity * densityFactor;

            ref.fillOpacity = finalOpacity;
            ref.outlineOpacity = finalOpacity;
        });
    });

    return (
        <group>
            {recentMessages.map((msg, i) => (
                <ChatBubble
                    key={msg.id || i}
                    message={msg}
                    bubbleRef={(el) => (refs.current[i] = el)}
                />
            ))}
        </group>
    );
}
