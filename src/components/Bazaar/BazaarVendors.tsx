"use client";

import React, { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RealisticVendorBody, VENDOR_APPEARANCE } from "./RealisticVendorBody";

// Vendors for the Main Bazaar Scene
const BAZAAR_VENDORS = [
    {
        id: "barker",
        name: "THE BARKER",
        color: "#aa2222", // Red for the vest/aggressive confident tone
        // Placement: Right wall is at x=2. Shop is at z=-6. 
        // We want him on the right corner of the stall on the right.
        // Shop facade is ~5m wide, centered at z=-6.
        // Let's place him slightly in front and to the side.
        position: [2.8, 0, -4.5] as [number, number, number],
        shoutBubbleOffset: [-0.8, 2.2, 0.5] as [number, number, number],
        shouts: [
            "You want the best? I got the best.",
            "Upgrade yourself. Don't be obsolete.",
            "Gold standard. Literally.",
            "Look at this arm. masterpiece.",
        ],
        shoutInterval: 6000,
    },
] as const;

type BazaarVendorWithShout = (typeof BAZAAR_VENDORS)[number] & {
    setTarget: (id: string) => void;
    targetId: string | null;
};

function BazaarVendorWrapper(props: BazaarVendorWithShout) {
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

    const config = VENDOR_APPEARANCE[props.id];
    if (!config) return null;

    return (
        <RealisticVendorBody
            {...props}
            lastShout={lastShout}
            isTarget={props.targetId === props.id}
            setTarget={props.setTarget}
            config={config}
            shoutBubbleOffset={props.shoutBubbleOffset ?? [0.8, 1.9, 0.5]}
        />
    );
}

export default function BazaarVendors({
    setTarget,
    targetId,
}: {
    setTarget?: (id: string) => void;
    targetId?: string | null;
}) {
    // Default no-op if no interaction handler provided yet
    const safeSetTarget = setTarget || (() => { });
    const safeTargetId = targetId || null;

    return (
        <group>
            {BAZAAR_VENDORS.map((v) => (
                <BazaarVendorWrapper key={v.id} {...v} setTarget={safeSetTarget} targetId={safeTargetId} />
            ))}
        </group>
    );
}
