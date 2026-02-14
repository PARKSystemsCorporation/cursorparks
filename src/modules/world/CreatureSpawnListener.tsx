"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import type { DeployedRobot } from "@/src/modules/ui/inventory/InventoryContext";
import { clampPosition } from "@/src/modules/world/firstPersonBounds";

/** Front-left of player in local space: left ~1m, forward ~1.5m. */


export function CreatureSpawnListener() {
  const { camera } = useThree();
  const { deployAt } = useInventory();

  useEffect(() => {
    const handler = (e: CustomEvent<{ type: string; position?: { x: number; y: number; z: number }; identity?: DeployedRobot["identity"]; creatureId?: string }>) => {
      const d = e.detail;
      const type = d?.type;
      if (!type || (type !== "warform" && type !== "companion")) return;
      const facingForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      facingForward.y = 0;
      facingForward.normalize();
      const yaw = Math.atan2(facingForward.x, facingForward.z);
      let x: number;
      let y: number;
      let z: number;
      if (d?.position && typeof d.position.x === "number" && typeof d.position.z === "number") {
        const clamped = clampPosition(d.position.x, d.position.z);
        x = clamped.x;
        z = clamped.z;
        y = 0;
      } else {
        // Player Relative Logic: PlayerPos + (Forward * 1.2) + (Left * 0.8)
        // We need player rotation. Camera quaternion is good proxy for yaw if FPC is active.

        // Forward vector (projected on XZ)
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        fwd.y = 0;
        fwd.normalize();

        // Left vector
        const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion);
        left.y = 0;
        left.normalize();

        const offset = fwd.clone().multiplyScalar(1.2).add(left.clone().multiplyScalar(2.5));
        const spawnPos = camera.position.clone().add(offset);
        // Ground it
        spawnPos.y = 0;
        const clamped = clampPosition(spawnPos.x, spawnPos.z);

        x = clamped.x;
        z = clamped.z;
        y = 0;
      }
      deployAt(type, x, y, z, { identity: d?.identity, creatureId: d?.creatureId });

      // If this is a First Bond event (no existing creatureId or explicitly flagged), 
      // we might want to trigger the specific camera event.
      // But typically the CALLER triggers the camera event.
      // The listener just places the mesh.
      // We will emit 'parks-spawn-occurred' as generic.

      window.dispatchEvent(
        new CustomEvent("parks-spawn-occurred", { detail: { x, y, z, yaw } })
      );
    };
    window.addEventListener("parks-spawn-creature", handler as EventListener);
    return () => window.removeEventListener("parks-spawn-creature", handler as EventListener);
  }, [camera, deployAt]);

  return null;
}
