"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import type { DeployedRobot } from "@/src/modules/ui/inventory/InventoryContext";

/** Front-left of player in local space: left ~1m, forward ~1.5m. */
const FRONT_LEFT_OFFSET = new THREE.Vector3(-1, 0, -1.5);

export function CreatureSpawnListener() {
  const { camera } = useThree();
  const { deployAt } = useInventory();
  const offsetWorld = useRef(new THREE.Vector3());

  useEffect(() => {
    const handler = (e: CustomEvent<{ type: string; position?: { x: number; y: number; z: number }; identity?: DeployedRobot["identity"]; creatureId?: string }>) => {
      const d = e.detail;
      const type = d?.type;
      if (!type || (type !== "warform" && type !== "companion")) return;
      let x: number;
      let y: number;
      let z: number;
      if (d?.position && typeof d.position.x === "number" && typeof d.position.z === "number") {
        x = d.position.x;
        z = d.position.z;
        y = typeof d.position.y === "number" ? d.position.y : 0;
      } else {
        offsetWorld.current.copy(FRONT_LEFT_OFFSET).applyQuaternion(camera.quaternion);
        const spawnPos = camera.position.clone().add(offsetWorld.current);
        x = spawnPos.x;
        z = spawnPos.z;
        y = 0;
      }
      deployAt(type, x, y, z, { identity: d?.identity, creatureId: d?.creatureId });
      window.dispatchEvent(
        new CustomEvent("parks-spawn-occurred", { detail: { x, y, z } })
      );
    };
    window.addEventListener("parks-spawn-creature", handler as EventListener);
    return () => window.removeEventListener("parks-spawn-creature", handler as EventListener);
  }, [camera, deployAt]);

  return null;
}
