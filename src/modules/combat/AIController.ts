
import * as THREE from "three";
import { RobotFighter, RobotState } from "./CombatTypes";

const ATTACK_RANGE = 2.5;
const RETREAT_HP_THRESHOLD = 0.2; // 20% HP
const VIEW_DISTANCE = 15;

export function updateAI(
    me: RobotFighter,
    target: RobotFighter | null,
    dt: number
): { state: RobotState; moveDir: THREE.Vector3; action?: "ATTACK" } {
    const result = {
        state: me.state,
        moveDir: new THREE.Vector3(0, 0, 0),
        action: undefined as "ATTACK" | undefined,
    };

    if (me.stats.hp <= 0) {
        if (result.state !== "KO") return { ...result, state: "KO" };
        return result;
    }

    if (!target || target.stats.hp <= 0) {
        // Victory or Idle
        return { ...result, state: "IDLE" }; // Or VICTORY
    }

    const myPos = new THREE.Vector3(...me.position);
    const targetPos = new THREE.Vector3(...target.position);
    const dist = myPos.distanceTo(targetPos);

    // --- FSM TRANSITIONS ---

    switch (me.state) {
        case "IDLE":
            if (dist < VIEW_DISTANCE) {
                result.state = "APPROACHING" as any; // Using "MOVING" in types, mapped here
            }
            break;

        case "MOVING": // Mapped from APPROACH
            // Check for retreat
            if (me.stats.hp / me.stats.maxHp < RETREAT_HP_THRESHOLD && Math.random() < 0.01) {
                // Chance to give up or retreat? For now, fearless bots or simple retreat logic
                // result.state = "RETREAT"; 
            }

            if (dist <= ATTACK_RANGE) {
                result.state = "ATTACKING";
            } else {
                // Steering towards target
                const dir = new THREE.Vector3().subVectors(targetPos, myPos).normalize();
                result.moveDir.copy(dir);
            }
            break;

        case "ATTACKING":
            // Verify still in range, otherwise approach
            if (dist > ATTACK_RANGE + 0.5) {
                result.state = "MOVING";
            } else {
                // Attack logic is handled by cooldowns in CombatEngine, 
                // but here we signal the intent.
                // If we are 'ATTACKING', we stay there until the action completes or we move.
                // For simple update: keep facing target.
                const dir = new THREE.Vector3().subVectors(targetPos, myPos).normalize();
                result.moveDir.copy(dir).multiplyScalar(0.01); // Tiny movement to keep rotation updating
                result.action = "ATTACK";
            }
            break;

        case "HIT": // If we add a HIT state
        case "BLOCK":
            // Transient states, usually reset by timer in Engine
            break;

        case "KO":
            // Do nothing
            break;
    }

    // Mapping "APPROACHING" back to "MOVING" for the shared type
    if ((result.state as any) === "APPROACHING") result.state = "MOVING";

    return result;
}
