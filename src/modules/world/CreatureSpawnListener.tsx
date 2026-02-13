"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import type { DeployedRobot } from "@/src/modules/ui/inventory/InventoryContext";

const SPAWN_DISTANCE = 2.2;

export function CreatureSpawnListener() {
  const { camera } = useThree();
  const { deployAt } = useInventory();
  const forwardRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const handler = (e: CustomEvent<{ type: string; position?: { x: number; y: number; z: number }; identity?: DeployedRobot["identity"]; creatureId?: string }>) => {
      const d = e.detail;
      const type = d?.type;
      if (!type || (type !== "warform" && type !== "companion")) return;
      const pos = d.position
        ? { x: d.position.x, y: d.position.y ?? 0, z: d.position.z }
        : (() => {
            forwardRef.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
            const p = camera.position.clone().add(forwardRef.current.multiplyScalar(SPAWN_DISTANCE));
            return { x: p.x, y: 0, z: p.z };
          })();
      deployAt(type, pos.x, pos.y, pos.z, { identity: d?.identity, creatureId: d?.creatureId });
    };
    window.addEventListener("parks-spawn-creature", handler as EventListener);
    return () => window.removeEventListener("parks-spawn-creature", handler as EventListener);
  }, [camera, deployAt]);

  return null;
}
