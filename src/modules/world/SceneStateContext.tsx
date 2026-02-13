"use client";

import React, { createContext, useContext, useState } from "react";

export type SceneMode = "idle" | "talking_vendor" | "trading" | "in_arena";

export type RadialMenuState = { vendorId: string; x: number; y: number } | null;

type SceneStateContextValue = {
  sceneMode: SceneMode;
  setSceneMode: (mode: SceneMode) => void;
  selectedVendorId: string | null;
  setSelectedVendorId: (id: string | null) => void;
  radialMenu: RadialMenuState;
  setRadialMenu: (v: RadialMenuState) => void;
};

const SceneStateContext = createContext<SceneStateContextValue | null>(null);

export function SceneStateProvider({ children }: { children: React.ReactNode }) {
  const [sceneMode, setSceneMode] = useState<SceneMode>("idle");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [radialMenu, setRadialMenu] = useState<RadialMenuState>(null);
  return (
    <SceneStateContext.Provider
      value={{
        sceneMode,
        setSceneMode,
        selectedVendorId,
        setSelectedVendorId,
        radialMenu,
        setRadialMenu,
      }}
    >
      {children}
    </SceneStateContext.Provider>
  );
}

export function useSceneState(): SceneStateContextValue {
  const ctx = useContext(SceneStateContext);
  if (!ctx) {
    return {
      sceneMode: "idle",
      setSceneMode: () => {},
      selectedVendorId: null,
      setSelectedVendorId: () => {},
      radialMenu: null,
      setRadialMenu: () => {},
    };
  }
  return ctx;
}
