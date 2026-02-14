"use client";

import { Canvas } from "@react-three/fiber";
import React, { useEffect } from "react";
import * as THREE from "three";
import { ChatProvider } from "./ChatContext";
import { PerformanceProvider } from "@/src/modules/performance";
import { SceneStateProvider } from "@/src/modules/world/SceneStateContext";
import { SceneOrchestrator } from "@/src/modules/world/SceneOrchestrator";
import { RobotProvider } from "@/src/modules/robot/RobotContext";
import { ExokinSpeechMorphologySync } from "@/src/modules/robot/ExokinSpeechMorphologySync";
import { WorldChatPanel, ChatInput } from "@/src/modules/chat";
import { RadialMenu, VendorTalkPanel, BarterTable } from "@/src/modules/vendors";
import { TrainerProvider } from "@/src/modules/world/TrainerContext";
import { ArenaUI } from "@/src/modules/arena";
import { ExokinChat, ExokinDevice } from "@/src/modules/exokin";
import { DebugOverlay } from "@/src/modules/ui/DebugOverlay";
import { CoordTracker } from "@/src/modules/ui/CoordTracker";
import FirstBondPanel, { FirstBondData } from "@/src/ui/FirstBondPanel";
import "./BazaarLanding.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("3D Scene Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: "20px", background: "rgba(0,0,0,0.8)", position: "absolute", top: 0, left: 0, zIndex: 1000 }}>
          <h2>Sim Error</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function BazaarScene({ onEnterAlleyTwo }: { onEnterAlleyTwo?: () => void }) {
  const [checkingExokin, setCheckingExokin] = React.useState(true);
  const [showBondPanel, setShowBondPanel] = React.useState(false);

  useEffect(() => {
    if (showBondPanel) {
      document.body.classList.add("parks-ui-open");
    } else {
      document.body.classList.remove("parks-ui-open");
    }
  }, [showBondPanel]);

  React.useEffect(() => {
    // Check if Exokin exists
    fetch("/api/exokin/get")
      .then((res) => res.json())
      .then((data) => {
        if (data.found && data.exokin) {
          // Exokin exists -> Spawn immediately
          // slight delay to ensure scene is ready?
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("parks-spawn-creature", {
              detail: {
                type: data.exokin.type,
                identity: {
                  // Reconstruct minimal identity for visuals until full load
                  gender: data.exokin.gender,
                  role: data.exokin.type === "warform" ? "warrior" : "companion",
                  // For now we might need to rely on the randomizer in the listener if seeds aren't fully piped
                  // But we have morphologySeed.
                  // Ideally we pass the seed to the listener. 
                  // The listener uses `deployAt`.
                },
                creatureId: data.exokin.id
              }
            }));
          }, 1000);
        } else {
          setShowBondPanel(true);
        }
      })
      .catch((err) => console.error("Exokin check failed", err))
      .finally(() => setCheckingExokin(false));
  }, []);

  const handleBondComplete = React.useCallback((data: FirstBondData) => {
    setShowBondPanel(false);
    // 1. Spawn Creature (Mesh)
    window.dispatchEvent(new CustomEvent("parks-spawn-creature", {
      detail: {
        type: data.type,
        identity: {
          gender: data.gender,
          role: data.type === "warform" ? "warrior" : "companion",
        },
        // created now
      }
    }));

    // 2. Trigger Camera Moment (Logic: CameraFirstBond listens to this)
    // We pass 0,0,0 as placeholder, component calculates relative pos.
    // Or we can calculate here? No, component does relative logic.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("parks-first-bond-spawn", {
        detail: { x: 0, y: 0, z: 0 }
      }));
    }, 100);
  }, []);

  return (
    <ChatProvider>
      <PerformanceProvider>
        <SceneStateProvider onEnterAlleyTwo={onEnterAlleyTwo ?? null}>
          <RobotProvider>
            <ExokinSpeechMorphologySync />
            <TrainerProvider>
              <div style={{ width: "100vw", height: "100vh", background: "#e6ccb2" }}>
                <ErrorBoundary>
                  <Canvas
                    shadows
                    dpr={[1, 1.5]}
                    gl={{ antialias: false, toneMapping: THREE.CineonToneMapping, toneMappingExposure: 1.5 }}
                    camera={{ fov: 60, position: [0, 1.65, -12] }}
                  >
                    <SceneOrchestrator />
                  </Canvas>
                </ErrorBoundary>

                <DebugOverlay />
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    bottom: 100,
                    width: 300,
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 25,
                    pointerEvents: "none",
                    border: "1px solid #8b6914",
                    borderRadius: 6,
                    overflow: "hidden",
                    boxShadow: "-3px 0 20px rgba(255, 107, 26, 0.14), 0 0 24px rgba(255, 107, 26, 0.08), 0 4px 20px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <div style={{ flex: 1, minHeight: 0, pointerEvents: "auto" }}>
                    <ExokinChat />
                  </div>
                  <ExokinDevice />
                </div>
                <WorldChatPanel />
                <VendorTalkPanel />
                <BarterTable />
                <ArenaUI />
                <RadialMenu />
                <ChatInput />

                <CoordTracker />
                {showBondPanel && <FirstBondPanel onComplete={handleBondComplete} />}
              </div>
            </TrainerProvider>
          </RobotProvider>
        </SceneStateProvider>
      </PerformanceProvider>
    </ChatProvider>
  );
}

