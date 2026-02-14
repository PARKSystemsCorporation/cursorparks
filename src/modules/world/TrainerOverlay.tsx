"use client";

import React, { useCallback, useRef } from "react";
import { useTrainer } from "./TrainerContext";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { generateIdentity, setIdentity } from "@/src/systems/creature/identityGenerator";
import BondSelection from "@/src/ui/BondSelection";

const ONBOARDING_SPAWN_POS = { x: 1.0, y: 0, z: -10.8 };

export function TrainerOverlay() {
  const { step, completeAndGiveCapsule } = useTrainer();
  const { setBondCapsule } = useInventory();
  const submittingRef = useRef(false);

  const handleBondComplete = useCallback(
    async ({
      gender,
      type,
    }: {
      gender: string;
      type: string;
    }) => {
      if (submittingRef.current) return;
      if (!type || !gender) return;
      if (gender !== "male" && gender !== "female") return;
      submittingRef.current = true;
      const creatureId = `exo-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const seedStr = `${type}-${gender}-${Date.now()}-${Math.random()}`;
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

      // First-time onboarding sequence:
      // focus camera -> spawn front-left -> prompt name in chat bar.
      window.dispatchEvent(new CustomEvent("parks-onboarding-focus-start"));
      window.dispatchEvent(
        new CustomEvent("parks-spawn-creature", {
          detail: { type, creatureId, identity, position: ONBOARDING_SPAWN_POS },
        })
      );
      window.dispatchEvent(
        new CustomEvent("parks-onboarding-name-request", {
          detail: { creatureId, type, gender },
        })
      );

      completeAndGiveCapsule();
      submittingRef.current = false;
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
