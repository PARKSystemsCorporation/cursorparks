"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

const SPAWN_DISTANCE = 2.2;

export function CreatureSpawnListener() {
  const { camera } = useThree();
  const { deployAt } = useInventory();
  const forwardRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const handler = (e: CustomEvent<{ type: string }>) => {
      const type = e.detail?.type;
      if (!type || type !== "warform" && type !== "companion") return;
      forwardRef.current.set(0, 0, -1).applyQuaternion(camera.quaternion);
      const pos = camera.position.clone().add(forwardRef.current.multiplyScalar(SPAWN_DISTANCE));
      deployAt(type, pos.x, 0, pos.z);
    };
    window.addEventListener("parks-spawn-creature", handler as EventListener);
    return () => window.removeEventListener("parks-spawn-creature", handler as EventListener);
  }, [camera, deployAt]);

  return null;
}
