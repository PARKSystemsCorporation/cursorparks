"use client";

import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { RobotCompanion } from "@/src/modules/robot/RobotCompanion";

/** Renders first deployed robot as RobotCompanion (with follow + chat); others as simple placeholder. */
export function DeployedRobotsRenderer() {
  const { deployedRobots } = useInventory();

  return (
    <>
      {deployedRobots.length > 0 && (
        <RobotCompanion position={[deployedRobots[0].x, deployedRobots[0].y, deployedRobots[0].z]} />
      )}
      {deployedRobots.slice(1).map((r) => (
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
    </>
  );
}
