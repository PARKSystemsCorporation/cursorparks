"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CombatEngine } from "./CombatEngine";
import { useCombat } from "./CombatContext";
import { RobotWarrior } from "./RobotWarrior";
import { useSceneState } from "@/src/modules/world/SceneStateContext";
import { RobotState } from "./CombatTypes";

/**
 * Combatant Wrapper
 * Reads directly from engine to update transforms.
 * Only re-renders RobotWarrior when 'state' changes (IDLE -> ATTACK).
 */
function Combatant({ engine, id, color }: { engine: CombatEngine, id: string, color: string }) {
    const groupRef = useRef<THREE.Group>(null);
    const [visualState, setVisualState] = useState<RobotState>("IDLE");

    useFrame(() => {
        const fighter = engine.getFighter(id);
        if (!fighter || !groupRef.current) return;

        // Update Transform
        groupRef.current.position.set(...fighter.position);
        // Convert rotation array or Euler to quaternion if needed, but array works for set()
        // However, THREE.Group.rotation.set toma Euler components.
        // fighter.rotation is [x, y, z]
        groupRef.current.rotation.set(fighter.rotation[0], fighter.rotation[1], fighter.rotation[2]);

        // Update visual state if changed
        if (fighter.state !== visualState) {
            setVisualState(fighter.state);
        }
    });

    return (
        <group ref={groupRef}>
            <RobotWarrior state={visualState} colorHex={color} />
        </group>
    );
}

export function CombatScene() {
    const { sceneMode } = useSceneState();
    const engine = useCombat();
    const initialized = useRef(false);

    // Initialize Fighters on mount
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Create Fighter A (Player side?)
        // Starting roughly where the player enters the circle
        // Center of Arena is roughly 0,0 locally in this group
        // Prison Yard is roughly Y=20 world, but this group is placed there.

        engine.registerFighter("A", "Unit-Alpha", {
            hp: 100, maxHp: 100, energy: 100, maxEnergy: 100,
            attackPower: 12, defense: 5, speed: 60
        }, [-3, 0, 0], "#00ffff");

        // Create Fighter B (Enemy)
        engine.registerFighter("B", "Unit-Omega", {
            hp: 120, maxHp: 120, energy: 100, maxEnergy: 100,
            attackPower: 15, defense: 8, speed: 40
        }, [3, 0, 0], "#ff0044");

        engine.setTarget("A", "B");
        engine.setTarget("B", "A");

    }, [engine]);

    useFrame((state, delta) => {
        if (sceneMode === "in_arena") {
            engine.update(delta, state.clock.elapsedTime);
        }
    });

    if (sceneMode !== "in_arena") return null;

    return (
        // Adjust Y slightly to sit on floor. Arena floor is at Y=20 world.
        <group position={[0, 20.05, 0]}>
            <Combatant engine={engine} id="A" color="#00ffff" />
            <Combatant engine={engine} id="B" color="#ff0044" />
        </group>
    );
}
