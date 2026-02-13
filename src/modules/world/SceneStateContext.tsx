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
  onEnterAlleyTwo: (() => void) | null;
};

const SceneStateContext = createContext<SceneStateContextValue | null>(null);

export function SceneStateProvider({
  children,
  onEnterAlleyTwo = null,
}: {
  children: React.ReactNode;
  onEnterAlleyTwo?: (() => void) | null;
}) {
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
        onEnterAlleyTwo,
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
      onEnterAlleyTwo: null,
    };
  }
  return ctx;
}
