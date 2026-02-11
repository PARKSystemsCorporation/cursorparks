"use client";

import React from "react";
import { Html } from "@react-three/drei";
import { VENDOR_PROFILES } from "./vendorProfiles";

type VendorProfileCardProps = {
    vendorId: string;
    color: string;
    position: [number, number, number];
    visible: boolean;
};

export default function VendorProfileCard({
    vendorId,
    color,
    position,
    visible,
}: VendorProfileCardProps) {
    const profile = VENDOR_PROFILES[vendorId];
    if (!profile || !visible) return null;

    const accent = profile.accentColor ?? color;

    return (
        <group position={position}>
            <Html
                transform
                occlude
                distanceFactor={1.5}
                style={{ pointerEvents: "none", userSelect: "none" }}
                center
            >
                <div
                    className="bazaar-vendor-profile-card"
                    style={{ ["--profile-accent" as string]: accent }}
                >
                    <h3 className="bazaar-vendor-profile-title">{profile.title}</h3>
                    <p className="bazaar-vendor-profile-tagline">{profile.tagline}</p>
                    <ul className="bazaar-vendor-profile-specialties">
                        {profile.specialties.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                    <p className="bazaar-vendor-profile-inventory">
                        <span className="bazaar-vendor-profile-inventory-label">Stock: </span>
                        {profile.inventoryHighlights.join(" · ")}
                    </p>
                    <p className="bazaar-vendor-profile-cta">{profile.cta}</p>
                </div>
            </Html>
        </group>
    );
}
