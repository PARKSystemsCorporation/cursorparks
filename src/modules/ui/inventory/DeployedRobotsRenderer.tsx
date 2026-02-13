"use client";

import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { WarformCreature, CompanionCreature, ModularCreature } from "@/src/modules/ui/inventory/CreatureMeshes";
import type { CreatureIdentity } from "@/src/modules/ui/inventory/CreatureMeshes";
import { CompanionFollow } from "@/src/modules/ui/inventory/CompanionFollow";
import { RobotCompanion } from "@/src/modules/robot/RobotCompanion";

function StaticCreature({ variant, identity }: { variant?: string; identity?: CreatureIdentity }) {
  if (identity) return <ModularCreature identity={identity} />;
  if (variant === "warform") return <WarformCreature />;
  if (variant === "companion") return <CompanionCreature />;
  return (
    <>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.2]} />
        <meshStandardMaterial color="#4a4238" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#5c5044" roughness={0.6} />
      </mesh>
    </>
  );
}

/** Renders deployed creatures by variant/identity. First companion follows player; warforms and others stay at deploy position. */
export function DeployedRobotsRenderer() {
  const { deployedRobots } = useInventory();

  return (
    <>
      {deployedRobots.map((r, i) => {
        const pos: [number, number, number] = [r.x, r.y, r.z];
        const isFirst = i === 0;
        const identity = r.identity as CreatureIdentity | undefined;
        if (isFirst && (r.variant === "companion" || identity?.role === "companion")) {
          return <CompanionFollow key={r.id} position={pos} identity={identity} />;
        }
        if (isFirst && (r.variant === "warform" || identity?.role === "warrior")) {
          return (
            <group key={r.id} position={pos}>
              {identity ? <ModularCreature identity={identity} /> : <WarformCreature />}
            </group>
          );
        }
        if (isFirst && !r.variant) {
          return <RobotCompanion key={r.id} position={pos} />;
        }
        return (
          <group key={r.id} position={pos}>
            <StaticCreature variant={r.variant} identity={identity} />
          </group>
        );
      })}
    </>
  );
}
