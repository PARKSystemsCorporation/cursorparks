"use client";

import { useEffect } from "react";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { useRobot } from "./RobotContext";

/**
 * Syncs first deployed EXOKIN identity to speech morphology (angular/smooth, cold/warm).
 * One species: body and color influence proto-language.
 */
export function ExokinSpeechMorphologySync() {
  const { deployedRobots } = useInventory();
  const { setSpeechMorphology } = useRobot();

  useEffect(() => {
    const first = deployedRobots.find((r) => r.identity);
    setSpeechMorphology(first?.identity ?? null);
  }, [deployedRobots, setSpeechMorphology]);

  return null;
}
