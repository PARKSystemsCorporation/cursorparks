"use client";

import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";

// Dynamic import for Canvas components to avoid SSR issues with Three.js
const BazaarScene = dynamic(() => import("./BazaarScene"), { ssr: false });
const AlleyTwoScene = dynamic(() => import("./AlleyTwoScene"), { ssr: false });

type Alley = "one" | "two";

export default function BazaarLanding() {
    const [entered, setEntered] = useState(false);
    const [alley, setAlley] = useState<Alley>("one");

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#050510", overflow: "hidden" }}>
            {/* Landing Page Overlay - Only remove from DOM when entered is true? 
                Actually, we want it to fade out. Let's keep it mounted but hidden/faded out 
                so using a simple conditional rendering might be abrupt if we want a transition.
                For now, we'll just unmount it or hide it.
            */}
            {!entered && (
                <LandingPage onEnter={() => setEntered(true)} />
            )}

            {/* 3D Scene - Always rendered to preload, but z-index controlled or visibility */}
            <div style={{
                position: "absolute",
                inset: 0,
                opacity: 1, // Keep opacity 1 so it renders, but it's behind the landing page if z-index is lower
                zIndex: 0,
                visibility: "visible" // Essential for pre-rendering
            }}>
                <Suspense fallback={null}>
                    {alley === "two" ? (
                        <AlleyTwoScene onReturnToAlleyOne={() => setAlley("one")} />
                    ) : (
                        <BazaarScene onEnterAlleyTwo={() => setAlley("two")} />
                    )}
                </Suspense>
            </div>
        </div>
    );
}


