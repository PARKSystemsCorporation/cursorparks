"use client";

import { Canvas } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { ChatProvider } from "./ChatContext";
import { PerformanceProvider } from "@/src/modules/performance";
import { SceneStateProvider } from "@/src/modules/world/SceneStateContext";
import { SceneOrchestrator } from "@/src/modules/world/SceneOrchestrator";
import { RobotProvider } from "@/src/modules/robot/RobotContext";
import { GlobalChatStream, ChatInput } from "@/src/modules/chat";
import { RadialMenu, VendorTalkPanel, BarterTable } from "@/src/modules/vendors";
import { TrainerProvider } from "@/src/modules/world/TrainerContext";
import { TrainerOverlay } from "@/src/modules/world/TrainerOverlay";
import { ArenaUI } from "@/src/modules/arena";
import { ExokinPanel, ExokinChat } from "@/src/modules/exokin";
import { DebugOverlay } from "@/src/modules/ui/DebugOverlay";
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
          <RobotProvider>
            <TrainerProvider>
            <div style={{ width: "100vw", height: "100vh", background: "#e6ccb2" }}>
            <ErrorBoundary>
              <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: false, toneMapping: THREE.CineonToneMapping, toneMappingExposure: 1.5 }}
                camera={{ fov: 60, position: [0, 1.65, 0] }}
              >
                <SceneOrchestrator />
              </Canvas>
            </ErrorBoundary>

            <DebugOverlay />
            <ExokinChat />
            <GlobalChatStream />
            <VendorTalkPanel />
            <BarterTable />
            <ArenaUI />
            <RadialMenu />
            <TrainerOverlay />
            <ChatInput />

            <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "#3d2b1f", opacity: 0.7, fontFamily: "monospace", fontSize: "12px", fontWeight: "bold" }}>
              [PARKS PUBLIC BAZAAR]
            </div>

            <ExokinPanel />
          </div>
            </TrainerProvider>
            </RobotProvider>
        </SceneStateProvider>
      </PerformanceProvider>
    </ChatProvider>
  );
}

