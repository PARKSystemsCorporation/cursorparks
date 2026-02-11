"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import BazaarLoader from "./BazaarLoader";

// Dynamic import for Canvas components to avoid SSR issues with Three.js
const BazaarScene = dynamic(() => import("./BazaarScene"), { ssr: false });

export default function BazaarLanding() {
    const [loaded, setLoaded] = useState(false);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#050510", overflow: "hidden" }}>
            <BazaarLoader onFinished={() => setLoaded(true)} />
            <div style={{ opacity: loaded ? 1 : 0, transition: "opacity 1s ease-in-out", width: "100%", height: "100%" }}>
                <Suspense fallback={null}>
                    <BazaarScene />
                </Suspense>
            </div>
        </div>
    );
}


