"use client";

import React, { createContext, useContext, useMemo, useRef } from "react";

export type MobileAxes = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  moving: boolean;
  looking: boolean;
};

type MobileControlsContextValue = {
  axesRef: React.MutableRefObject<MobileAxes>;
  setMove: (x: number, y: number, active: boolean) => void;
  setLook: (x: number, y: number, active: boolean) => void;
  reset: () => void;
};

const defaultAxes: MobileAxes = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  moving: false,
  looking: false,
};

const MobileControlsContext = createContext<MobileControlsContextValue | null>(null);

export function MobileControlsProvider({ children }: { children: React.ReactNode }) {
  const axesRef = useRef<MobileAxes>({ ...defaultAxes });

  const value = useMemo<MobileControlsContextValue>(() => {
    return {
      axesRef,
      setMove: (x, y, active) => {
        axesRef.current.moveX = x;
        axesRef.current.moveY = y;
        axesRef.current.moving = active;
      },
      setLook: (x, y, active) => {
        axesRef.current.lookX = x;
        axesRef.current.lookY = y;
        axesRef.current.looking = active;
      },
      reset: () => {
        axesRef.current = { ...defaultAxes };
      },
    };
  }, []);

  return <MobileControlsContext.Provider value={value}>{children}</MobileControlsContext.Provider>;
}

export function useMobileControls() {
  const ctx = useContext(MobileControlsContext);
  if (!ctx) {
    const axesRef = { current: { ...defaultAxes } };
    return {
      axesRef,
      setMove: () => {},
      setLook: () => {},
      reset: () => {},
    };
  }
  return ctx;
}
