"use client";

import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";

// Dynamic import for Canvas components to avoid SSR issues with Three.js
const BazaarScene = dynamic(() => import("./BazaarScene"), { ssr: false });
const AlleyTwoScene = dynamic(() => import("./AlleyTwoScene"), { ssr: false });

type Alley = "one" | "two";

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Landing Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: 'red', padding: '20px', zIndex: 1000, position: 'relative' }}>
                    <h2>App Error</h2>
                    <pre>{this.state.error?.message}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function BazaarLanding() {
    const [entered, setEntered] = useState(false);
    const [alley, setAlley] = useState<Alley>("one");

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#050510", overflow: "hidden" }}>
            {/* Landing Page Overlay */}
            {!entered && (
                <LandingPage onEnter={() => setEntered(true)} />
            )}

            {/* 3D Scene - Always rendered to preload */}
            <div style={{
                position: "absolute",
                inset: 0,
                opacity: 1,
                zIndex: 0,
                visibility: "visible"
            }}>
                <ErrorBoundary>
                    <Suspense fallback={<div style={{ color: 'white', padding: '20px' }}>Loading Environment...</div>}>
                        {alley === "two" ? (
                            <AlleyTwoScene onReturnToAlleyOne={() => setAlley("one")} />
                        ) : (
                            <BazaarScene onEnterAlleyTwo={() => setAlley("two")} />
                        )}
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    );
}


