"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DragState, InventoryItem, PocketId } from "./types";
import { POCKET_SLOTS } from "./types";

type PocketState = (InventoryItem | null)[];

type InventoryState = {
  pocketA: PocketState;
  pocketB: PocketState;
  cargoC: PocketState;
  cargoD: PocketState;
  /** When user is dragging a capsule to throw */
  dragState: DragState | null;
  /** World position where user wants to deploy (set by 3D raycast) */
  deployTarget: { x: number; y: number; z: number } | null;
};

function makeEmptyPocket(slots: number): PocketState {
  return Array(slots).fill(null);
}

const initialPockets: InventoryState = {
  pocketA: makeEmptyPocket(POCKET_SLOTS.pocketA),
  pocketB: makeEmptyPocket(POCKET_SLOTS.pocketB),
  cargoC: makeEmptyPocket(POCKET_SLOTS.cargoC),
  cargoD: makeEmptyPocket(POCKET_SLOTS.cargoD),
  dragState: null,
  deployTarget: null,
};

const initialDeployed: { id: string; x: number; y: number; z: number; variant?: string }[] = [];

type InventoryContextValue = InventoryState & {
  setPocket: (pocket: PocketId, slots: PocketState) => void;
  addItem: (pocket: PocketId, item: InventoryItem) => boolean;
  removeItem: (pocket: PocketId, slotIndex: number) => InventoryItem | null;
  startDrag: (pocket: PocketId, slotIndex: number) => void;
  cancelDrag: () => void;
  /** Start throw: set dragState so 3D shows capsule in hand; deploy happens on ground click */
  startCapsuleThrow: (pocket: PocketId, slotIndex: number) => void;
  /** Called by 3D when user clicks ground to deploy */
  setDeployTarget: (pos: { x: number; y: number; z: number } | null) => void;
  /** Confirm deploy: remove capsule from pocket, clear drag, spawn robot at deployTarget, return item */
  confirmDeploy: () => InventoryItem | null;
  /** Deploy a creature at world position (e.g. from bond intro spawn in front of player) */
  deployAt: (variant: string, x: number, y: number, z: number) => void;
  /** Positions of deployed robots (for 3D rendering) */
  deployedRobots: { id: string; x: number; y: number; z: number; variant?: string }[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InventoryState>(initialPockets);
  const [deployedRobots, setDeployedRobots] = useState<{ id: string; x: number; y: number; z: number; variant?: string }[]>(initialDeployed);

  const setPocket = useCallback((pocket: PocketId, slots: PocketState) => {
    setState((s) => ({ ...s, [pocket]: [...slots] }));
  }, []);

  const addItem = useCallback((pocket: PocketId, item: InventoryItem): boolean => {
    setState((s) => {
      const arr = [...s[pocket]];
      const idx = arr.findIndex((x) => x === null);
      if (idx < 0) return s;
      arr[idx] = item;
      return { ...s, [pocket]: arr };
    });
    return true;
  }, []);

  const removeItem = useCallback((pocket: PocketId, slotIndex: number): InventoryItem | null => {
    let removed: InventoryItem | null = null;
    setState((s) => {
      const arr = [...s[pocket]];
      removed = arr[slotIndex] ?? null;
      arr[slotIndex] = null;
      return { ...s, [pocket]: arr };
    });
    return removed;
  }, []);

  const startDrag = useCallback(() => {
    // Used for reordering; for capsule throw we use startCapsuleThrow
  }, []);

  const cancelDrag = useCallback(() => {
    setState((s) => ({ ...s, dragState: null, deployTarget: null }));
  }, []);

  const startCapsuleThrow = useCallback((pocket: PocketId, slotIndex: number) => {
    setState((s) => {
      const arr = s[pocket];
      const item = arr[slotIndex];
      if (!item || item.type !== "capsule") return s;
      return {
        ...s,
        dragState: { item, pocket, slotIndex },
        deployTarget: null,
      };
    });
  }, []);

  const setDeployTarget = useCallback((pos: { x: number; y: number; z: number } | null) => {
    setState((s) => ({ ...s, deployTarget: pos }));
  }, []);

  const confirmDeploy = useCallback((): InventoryItem | null => {
    let deployed: InventoryItem | null = null;
    let target: { x: number; y: number; z: number } | null = null;
    setState((s) => {
      if (!s.dragState || !s.deployTarget) return s;
      deployed = s.dragState.item;
      target = s.deployTarget;
      const arr = [...s[s.dragState.pocket]];
      arr[s.dragState.slotIndex] = null;
      return {
        ...s,
        [s.dragState.pocket]: arr,
        dragState: null,
        deployTarget: null,
      };
    });
    if (deployed && target) {
      setDeployedRobots((prev) => [
        ...prev,
        { id: `robot-${Date.now()}`, x: target!.x, y: target!.y, z: target!.z, variant: deployed!.variant },
      ]);
    }
    return deployed;
  }, []);

  const deployAt = useCallback((variant: string, x: number, y: number, z: number) => {
    setDeployedRobots((prev) => [
      ...prev,
      { id: `creature-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, x, y, z, variant },
    ]);
  }, []);

  const value = useMemo<InventoryContextValue>(
    () => ({
      ...state,
      setPocket,
      addItem,
      removeItem,
      startDrag,
      cancelDrag,
      startCapsuleThrow,
      setDeployTarget,
      confirmDeploy,
      deployAt,
      deployedRobots,
    }),
    [state, setPocket, addItem, removeItem, startDrag, cancelDrag, startCapsuleThrow, setDeployTarget, confirmDeploy, deployAt, deployedRobots]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    return {
      ...initialPockets,
      setPocket: () => {},
      addItem: () => false,
      removeItem: () => null,
      startDrag: () => {},
      cancelDrag: () => {},
      startCapsuleThrow: () => {},
      setDeployTarget: () => {},
      confirmDeploy: () => null,
      deployAt: () => {},
      deployedRobots: [],
    };
  }
  return ctx;
}
