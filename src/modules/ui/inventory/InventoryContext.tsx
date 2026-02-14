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
  /** EXOKIN bond capsule (device under chat); not shown in quick bar */
  bondCapsule: InventoryItem | null;
  /** When user is dragging a capsule to throw */
  dragState: DragState | null;
  /** World position where user wants to deploy (set by 3D raycast) */
  deployTarget: { x: number; y: number; z: number } | null;
  /** Screen position of pointer during bond drag (for raycast); set by ExokinDevice. */
  bondDragScreenPos: { clientX: number; clientY: number } | null;
};

function makeEmptyPocket(slots: number): PocketState {
  return Array(slots).fill(null);
}

const initialPockets: InventoryState = {
  pocketA: makeEmptyPocket(POCKET_SLOTS.pocketA),
  pocketB: makeEmptyPocket(POCKET_SLOTS.pocketB),
  cargoC: makeEmptyPocket(POCKET_SLOTS.cargoC),
  cargoD: makeEmptyPocket(POCKET_SLOTS.cargoD),
  bondCapsule: null,
  dragState: null,
  deployTarget: null,
  bondDragScreenPos: null,
};

export type MorphParams = {
  intensity?: string;
  head?: { scaleX: number; scaleY: number; scaleZ: number; tiltX: number; tiltZ: number; offsetX: number; offsetZ: number };
  body?: { scaleX: number; scaleY: number; scaleZ: number; tiltX: number; tiltZ: number; offsetX: number; offsetZ: number };
  tail?: { scaleX: number; scaleY: number; scaleZ: number; tiltX: number; tiltZ: number; offsetX: number; offsetZ: number };
};

export type DeployedRobot = {
  id: string;
  x: number;
  y: number;
  z: number;
  variant?: string;
  creatureId?: string;
  identity?: {
    gender: string;
    role: string;
    head_type: string;
    body_type: string;
    tail_type: string;
    color_profile: Record<string, unknown>;
    morphParams?: MorphParams;
  };
};

const initialDeployed: DeployedRobot[] = [];

type InventoryContextValue = InventoryState & {
  setPocket: (pocket: PocketId, slots: PocketState) => void;
  addItem: (pocket: PocketId, item: InventoryItem) => boolean;
  removeItem: (pocket: PocketId, slotIndex: number) => InventoryItem | null;
  setBondCapsule: (item: InventoryItem | null) => void;
  startDrag: (pocket: PocketId, slotIndex: number) => void;
  cancelDrag: () => void;
  /** Start throw from quick bar pocket */
  startCapsuleThrow: (pocket: PocketId, slotIndex: number) => void;
  /** Start deploy from EXOKIN device (bond); only bond uses drag-from-diamond. */
  startBondDeploy: () => void;
  setDeployTarget: (pos: { x: number; y: number; z: number } | null) => void;
  /** Set screen position during bond drag (for 3D raycast). */
  setBondDragScreenPos: (pos: { clientX: number; clientY: number } | null) => void;
  /** Confirm deploy: remove from pocket or bond, clear drag, dispatch wallet card deploy. */
  confirmDeploy: (position?: { x: number; y: number; z: number } | null) => InventoryItem | null;
  /** Add a deployed creature at world position (called after wallet card sequence) */
  deployAt: (variant: string, x: number, y: number, z: number, options?: { identity?: DeployedRobot["identity"]; creatureId?: string }) => void;
  deployedRobots: DeployedRobot[];
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InventoryState>(initialPockets);
  const [deployedRobots, setDeployedRobots] = useState<DeployedRobot[]>(initialDeployed);

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
    setState((s) => ({ ...s, dragState: null, deployTarget: null, bondDragScreenPos: null }));
  }, []);

  const setBondDragScreenPos = useCallback((pos: { clientX: number; clientY: number } | null) => {
    setState((s) => ({ ...s, bondDragScreenPos: pos }));
  }, []);

  const setBondCapsule = useCallback((item: InventoryItem | null) => {
    setState((s) => ({ ...s, bondCapsule: item }));
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

  const startBondDeploy = useCallback(() => {
    setState((s) => {
      if (!s.bondCapsule || s.bondCapsule.type !== "capsule") return s;
      return {
        ...s,
        dragState: { item: s.bondCapsule, pocket: "pocketA", slotIndex: 0, fromBond: true },
        deployTarget: null,
      };
    });
  }, []);

  const setDeployTarget = useCallback((pos: { x: number; y: number; z: number } | null) => {
    setState((s) => ({ ...s, deployTarget: pos }));
  }, []);

  const confirmDeploy = useCallback((position?: { x: number; y: number; z: number } | null): InventoryItem | null => {
    let deployed: InventoryItem | null = null;
    let target: { x: number; y: number; z: number } | null = position ?? null;
    setState((s) => {
      const useTarget = position ?? s.deployTarget;
      if (!s.dragState || !useTarget) return s;
      const item = s.dragState.item;
      deployed = item;
      target = useTarget;
      if (s.dragState.fromBond) {
        return { ...s, bondCapsule: null, dragState: null, deployTarget: null, bondDragScreenPos: null };
      }
      const arr = [...s[s.dragState.pocket]];
      arr[s.dragState.slotIndex] = null;
      return {
        ...s,
        [s.dragState.pocket]: arr,
        dragState: null,
        deployTarget: null,
        bondDragScreenPos: null,
      };
    });
    if (deployed && target && typeof window !== "undefined") {
      const item = deployed as InventoryItem;
      const type = item.variant === "warform" ? "warform" : "companion";
      const gender = item.gender ?? undefined;
      window.dispatchEvent(
        new CustomEvent("parks-deploy-wallet-card", {
          detail: { type, position: target, creatureId: item.id, gender },
        })
      );
    }
    return deployed;
  }, []);

  const deployAt = useCallback(
    (
      variant: string,
      x: number,
      y: number,
      z: number,
      options?: { identity?: DeployedRobot["identity"]; creatureId?: string }
    ) => {
      const id = options?.creatureId ?? `creature-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const creatureId = options?.creatureId ?? id;
      const identity = options?.identity;
      setDeployedRobots((prev) => [
        ...prev,
        { id, x, y, z, variant, creatureId, identity },
      ]);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("exokin-deployed", {
            detail: { id, creatureId, variant, identity },
          })
        );
      }
    },
    []
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      ...state,
      setPocket,
      addItem,
      removeItem,
      setBondCapsule,
      startDrag,
      cancelDrag,
      startCapsuleThrow,
      startBondDeploy,
      setDeployTarget,
      setBondDragScreenPos,
      confirmDeploy,
      deployAt,
      deployedRobots,
    }),
    [state, setPocket, addItem, removeItem, setBondCapsule, startDrag, cancelDrag, startCapsuleThrow, startBondDeploy, setDeployTarget, setBondDragScreenPos, confirmDeploy, deployAt, deployedRobots]
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
      setBondCapsule: () => {},
      startDrag: () => {},
      cancelDrag: () => {},
      startCapsuleThrow: () => {},
      startBondDeploy: () => {},
      setDeployTarget: () => {},
      setBondDragScreenPos: () => {},
      confirmDeploy: () => null,
      deployAt: () => {},
      deployedRobots: [],
    };
  }
  return ctx;
}
