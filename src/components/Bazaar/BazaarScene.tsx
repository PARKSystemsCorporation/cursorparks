"use client";

import { Canvas } from "@react-three/fiber";
import React from "react";
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
import { TrainerOverlay } from "@/src/modules/world/TrainerOverlay";
import { ArenaUI } from "@/src/modules/arena";
import { ExokinChat, ExokinDevice } from "@/src/modules/exokin";
import { CombatProvider } from "@/src/modules/combat/CombatContext";
import { DebugOverlay } from "@/src/modules/ui/DebugOverlay";
import { CoordTracker } from "@/src/modules/ui/CoordTracker";
import { ColiseumArenaTrigger } from "@/src/modules/world/ColiseumArenaTrigger";
import { BackpackMenu } from "@/src/modules/ui/BackpackMenu";
import { MobileControlsProvider } from "@/src/modules/world/MobileControlsContext";
import { MobileDualStickOverlay } from "./MobileDualStickOverlay";
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
  return (
    <ChatProvider>
      <PerformanceProvider>
        <SceneStateProvider onEnterAlleyTwo={onEnterAlleyTwo ?? null}>
          <MobileControlsProvider>
            <RobotProvider>
              <ExokinSpeechMorphologySync />
              <TrainerProvider>
                <CombatProvider>
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
                    <ColiseumArenaTrigger />
                    <RadialMenu />
                    <TrainerOverlay />
                    <ChatInput />

                    <BackpackMenu />
                    <CoordTracker />
                    <MobileDualStickOverlay />
                  </div>
                </CombatProvider>
              </TrainerProvider>
            </RobotProvider>
          </MobileControlsProvider>
        </SceneStateProvider>
      </PerformanceProvider>
    </ChatProvider>
  );
}

