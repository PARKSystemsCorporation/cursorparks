"use client";

import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

/** Renders simple placeholder meshes for deployed robots until RobotCompanion is used. */
export function DeployedRobotsPlaceholder() {
  const { deployedRobots } = useInventory();

  return (
    <group>
      {deployedRobots.map((r) => (
        <group key={r.id} position={[r.x, r.y, r.z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.3, 0.4, 0.2]} />
            <meshStandardMaterial color="#ff6b1a" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#c0392b" emissive="#661111" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
