import { RobotFighter, RobotStats, CombatEvent, MoveType, RobotSkills } from "./CombatTypes";
import { updateAI } from "./AIController";
import { MOVE_DATABASE, INITIAL_SKILLS } from "./SkillTreeData";
import * as THREE from "three";

type CombatEventHandler = (event: CombatEvent) => void;

export class CombatEngine {
    fighters: Map<string, RobotFighter> = new Map();
    listeners: CombatEventHandler[] = [];

    private cooldowns: Map<string, number> = new Map();
    private comboCounters: Map<string, number> = new Map();
    private lastSubTime: number = 0;

    private arenaRadius = 8;
    private arenaCenter = new THREE.Vector3(0, 0, 0);

    constructor() { }

    registerFighter(id: string, name: string, stats: Partial<RobotStats>, position: [number, number, number], color: string, startingWins: number = 0) {
        const fullStats: RobotStats = {
            hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, attackPower: 10, defense: 5, speed: 50, level: 1, wins: startingWins,
            ...stats
        };

        // Auto-unlock skills based on wins (temporary logic)
        const skills = { ...INITIAL_SKILLS };
        // If user has wins, convert to points for UI to spend, or pre-unlock for simplicity now:
        skills.pointsAvailable = startingWins;

        this.fighters.set(id, {
            id,
            name,
            stats: fullStats,
            skills,
            position,
            rotation: [0, 0, 0],
            state: "IDLE",
            targetId: null
        });
        this.cooldowns.set(id, 0);
        this.comboCounters.set(id, 0);
    }

    setTarget(fighterId: string, targetId: string) {
        const f = this.fighters.get(fighterId);
        if (f) f.targetId = targetId;
    }

    subscribe(callback: CombatEventHandler) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private emit(event: CombatEvent) {
        this.listeners.forEach(l => l(event));
    }

    update(dt: number, time: number) {
        this.lastSubTime = time;

        this.fighters.forEach(fighter => {
            if (fighter.stats.hp <= 0) {
                if (fighter.state !== "KO") {
                    fighter.state = "KO";
                    this.emit({ type: "KO", sourceId: fighter.id, targetId: fighter.id });
                }
                return;
            }

            const target = fighter.targetId ? this.fighters.get(fighter.targetId) || null : null;

            const { state, moveDir, action } = updateAI(fighter, target, dt);

            // Only change state if not locked in attack animation (handled loosely here by cooldown check in resolve)
            // Ideally "ATTACKING" state blocks movement. 
            // For now, let's allow overlapping unless we add rigorous animation locks.
            fighter.state = state;

            // 2. Resolve Movement
            if (moveDir.lengthSq() > 0 && fighter.state !== "ATTACKING") {
                const speed = fighter.stats.speed * 0.05 * dt;
                const currentPos = new THREE.Vector3(...fighter.position);

                // Face movement
                const angle = Math.atan2(moveDir.x, moveDir.z);
                fighter.rotation = [0, angle, 0];

                let nextPos = currentPos.add(moveDir.multiplyScalar(speed));

                if (nextPos.distanceTo(this.arenaCenter) > this.arenaRadius) {
                    nextPos = nextPos.sub(this.arenaCenter).normalize().multiplyScalar(this.arenaRadius).add(this.arenaCenter);
                }

                fighter.position = [nextPos.x, nextPos.y, nextPos.z];
            }

            // 3. Resolve Attacks
            if (action === "ATTACK" && target) {
                if (time > (this.cooldowns.get(fighter.id) || 0)) {
                    this.resolveAttack(fighter, target, time);
                }
            }
        });
    }

    private selectMove(fighter: RobotFighter): MoveType {
        // Weighted selection based on unlocked moves
        // Simple logic: 50% Jab, 30% Cross, 20% Fancy stuff if unlocked
        const moves = fighter.skills.unlockedMoves;
        const r = Math.random();

        if (moves.includes("HIGH_KICK") && r > 0.95) return "HIGH_KICK"; // Rare haymaker
        if (moves.includes("UPPERCUT") && r > 0.85) return "UPPERCUT";
        if (moves.includes("HOOK") && r > 0.70) return "HOOK";
        if (moves.includes("CROSS") && r > 0.40) return "CROSS";
        return "JAB"; // Default
    }

    private resolveAttack(attacker: RobotFighter, defender: RobotFighter, time: number) {
        const moveType = this.selectMove(attacker);
        const move = MOVE_DATABASE[moveType];

        // Cooldown modified by speed (Higher speed = Lower cooldown)
        const speedMod = 1 - (attacker.stats.speed / 200);
        const cd = move.cooldownVal * Math.max(0.5, speedMod);
        this.cooldowns.set(attacker.id, time + cd);

        attacker.lastMove = moveType; // For animation syncing

        this.emit({ type: "ATTACK", sourceId: attacker.id, targetId: defender.id, moveType });

        // Hit Calculation
        // Accuracy vs Dodge (Dodge based on Speed + luck)
        const dodgeChance = (defender.stats.speed / 200) * 0.5; // Max ~25% dodge from speed
        const hitRoll = Math.random();

        if (hitRoll < move.accuracy - dodgeChance) {
            // HIT
            const isCrit = Math.random() < move.critChance;

            const rawDmg = attacker.stats.attackPower * move.damageMult;
            const mitigation = defender.stats.defense * 0.2;
            let damage = Math.max(1, rawDmg - mitigation);

            if (isCrit) {
                damage *= 2.0;
                // Flash KO Check: If Crit and (Damage > 30% remaining HP or Move is HIGH_KICK/UPPERCUT)
                if (damage > defender.stats.hp * 0.4 || moveType === "HIGH_KICK") {
                    damage = defender.stats.hp + 10; // Instakill
                }
            }

            defender.stats.hp = Math.max(0, defender.stats.hp - damage);

            // Combo logic
            const combo = (this.comboCounters.get(attacker.id) || 0) + 1;
            this.comboCounters.set(attacker.id, combo);

            if (isCrit) {
                this.emit({ type: "CRIT", sourceId: attacker.id, targetId: defender.id, damage, moveType, comboCount: combo });
            } else {
                this.emit({ type: "HIT", sourceId: attacker.id, targetId: defender.id, damage, moveType, comboCount: combo });
            }

        } else {
            // MISS / DODGE
            this.comboCounters.set(attacker.id, 0); // Reset combo
            this.emit({ type: "DODGE", sourceId: attacker.id, targetId: defender.id, moveType });
        }
    }

    getFighter(id: string) {
        return this.fighters.get(id);
    }
}
