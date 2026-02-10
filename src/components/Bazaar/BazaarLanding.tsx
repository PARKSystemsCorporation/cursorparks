"use client";

import dynamic from "next/dynamic";

// Dynamic import for Canvas components to avoid SSR issues with Three.js
const BazaarScene = dynamic(() => import("./BazaarScene"), { ssr: false });

export default function BazaarLanding() {
    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#050510", overflow: "hidden" }}>
            <BazaarScene />
        </div>
    );
}


