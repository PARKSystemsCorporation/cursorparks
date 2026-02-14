"use client";

import React, { useCallback } from "react";
import { useTrainer } from "./TrainerContext";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { generateIdentity, setIdentity } from "@/src/systems/creature/identityGenerator";
import BondSelection from "@/src/ui/BondSelection";

export function TrainerOverlay() {
  const { step, completeAndGiveCapsule } = useTrainer();
  const { setBondCapsule } = useInventory();

  const handleBondComplete = useCallback(
    async ({
      gender,
      type,
      name: chosenName,
    }: {
      gender: string;
      type: string;
      name: string;
    }) => {
      if (!type || !gender || !chosenName?.trim()) return;
      if (gender !== "male" && gender !== "female") return;
      const creatureId = `exo-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const ts = Date.now();
      const seedStr = `${chosenName.trim()}-${ts}`;
      let morphology_seed = 0;
      for (let i = 0; i < seedStr.length; i++)
        morphology_seed = (morphology_seed << 5) - morphology_seed + seedStr.charCodeAt(i);
      morphology_seed = morphology_seed >>> 0;
      const identity = generateIdentity(type, morphology_seed, { gender });
      setIdentity(creatureId, identity);
      try {
        await fetch("/api/exokin/creature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatureId,
            name: chosenName.trim(),
            gender,
            type,
            morphology_seed,
            head_type: identity.head_type,
            body_type: identity.body_type,
            tail_type: identity.tail_type,
            color_profile: identity.color_profile,
          }),
        });
      } catch {}
      setBondCapsule({
        id: creatureId,
        type: "capsule",
        variant: type,
        gender,
      });
      completeAndGiveCapsule();
    },
    [setBondCapsule, completeAndGiveCapsule]
  );

  if (step !== 1) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
      }}
    >
      <BondSelection onDeploy={handleBondComplete} onCancel={undefined} />
    </div>
  );
}
