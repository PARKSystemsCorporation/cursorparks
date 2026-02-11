"use client";

import React, { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CyberHuman } from "./Vendor";

const ALLEY_TWO_VENDORS = [
    {
        id: "smith",
        name: "THE SMITH",
        color: "#338855",
        position: [-3.7, 0, -1] as [number, number, number],
        shoutBubbleOffset: [-0.8, 2, 0.5] as [number, number, number],
        shouts: [
            "Hardware? I fix it all.",
            "Circuits, metal, mods. You name it.",
            "Bring me your broken gear.",
            "No job too small.",
        ],
        shoutInterval: 5000,
    },
    {
        id: "fixer",
        name: "THE FIXER",
        color: "#6644aa",
        position: [-3.7, 0, -5] as [number, number, number],
        shoutBubbleOffset: [-0.8, 2, 0.5] as [number, number, number],
        shouts: [
            "Need a connection? I've got 'em.",
            "Data, intel, access. All negotiable.",
            "The right handshake opens doors.",
            "Your problem. My solution.",
        ],
        shoutInterval: 7000,
    },
    {
        id: "merchant",
        name: "THE MERCHANT",
        color: "#ff8800",
        position: [3.2, 0, -10] as [number, number, number],
        shoutBubbleOffset: [0.8, 2, 0.5] as [number, number, number],
        shouts: [
            "Rare finds. One of a kind.",
            "Curios from the deep stack.",
            "You won't see this elsewhere.",
            "Take a look. No obligation.",
        ],
        shoutInterval: 6000,
    },
] as const;

type AlleyTwoVendorWithShout = (typeof ALLEY_TWO_VENDORS)[number] & {
    setTarget: (id: string) => void;
    targetId: string | null;
};

function AlleyTwoVendorWrapper(props: AlleyTwoVendorWithShout) {
    const [lastShout, setLastShout] = useState<string | null>(null);

    useFrame((state) => {
        if (state.clock.elapsedTime * 1000 % props.shoutInterval < 50) {
            if (Math.random() > 0.7) {
                const newShout = props.shouts[Math.floor(Math.random() * props.shouts.length)];
                if (newShout !== lastShout) {
                    setLastShout(newShout);
                }
            }
        }
    });

    return (
        <CyberHuman
            {...props}
            lastShout={lastShout}
            isTarget={props.targetId === props.id}
            setTarget={props.setTarget}
        />
    );
}

export default function AlleyTwoVendors({
    setTarget,
    targetId,
}: {
    setTarget: (id: string) => void;
    targetId: string | null;
}) {
    return (
        <group>
            {ALLEY_TWO_VENDORS.map((v) => (
                <AlleyTwoVendorWrapper key={v.id} {...v} setTarget={setTarget} targetId={targetId} />
            ))}
        </group>
    );
}
