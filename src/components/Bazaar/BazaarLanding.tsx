"use client";

import React, { Suspense, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import EntryScreen from "@/src/ui/EntryScreen";
import IntroTrainer from "@/src/ui/IntroTrainer";
import { DeploySequenceUI } from "@/src/ui/DeploySequence";
import { isFirstTimeUser, markIntroDone } from "@/src/state/introFlow";
import { InventoryProvider } from "@/src/modules/ui/inventory/InventoryContext";
import { PocketInventory } from "@/src/modules/ui/inventory/PocketInventory";

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
    const [showIntro, setShowIntro] = useState(false);
    const [alley, setAlley] = useState<Alley>("one");
    const [showDeployHint, setShowDeployHint] = useState(false);

    const onEntryEnter = useCallback(() => {
        setEntered(true);
    }, []);

    const onFirstTimeIntro = useCallback(() => {
        if (isFirstTimeUser()) setShowIntro(true);
    }, []);

    const onIntroComplete = useCallback(() => {
        markIntroDone();
        setShowIntro(false);
        setShowDeployHint(true);
    }, []);

    useEffect(() => {
        if (!showDeployHint) return;
        const t = setTimeout(() => setShowDeployHint(false), 8000);
        return () => clearTimeout(t);
    }, [showDeployHint]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#050510", overflow: "hidden" }}>
            {!entered && (
                <EntryScreen onEnter={onEntryEnter} onFirstTimeIntro={onFirstTimeIntro} />
            )}

            <InventoryProvider>
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

                {entered && (
                    <>
                        <PocketInventory />
                        {showDeployHint && (
                            <div
                                style={{
                                    position: "fixed",
                                    bottom: 100,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    padding: "10px 16px",
                                    background: "rgba(26, 20, 16, 0.95)",
                                    border: "1px solid #8b6914",
                                    borderRadius: 8,
                                    color: "#e8d5b7",
                                    fontSize: 12,
                                    fontFamily: "monospace",
                                    zIndex: 50,
                                    maxWidth: 320,
                                    textAlign: "center",
                                }}
                            >
                                Click the ◆ in the bar below, then click the ground to deploy your runner.
                            </div>
                        )}
                    </>
                )}

                {entered && showIntro && (
                    <IntroTrainer visible onComplete={onIntroComplete} />
                )}
                <DeploySequenceUI />
            </InventoryProvider>
        </div>
    );
}


