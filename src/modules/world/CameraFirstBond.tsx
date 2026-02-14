
"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useCameraOverride } from "./CameraOverrideContext";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

const DURATION = 1.4;

function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

export function CameraFirstBond() {
    const { camera } = useThree();
    const { setActive } = useCameraOverride();
    const state = useRef<{
        active: boolean;
        startTime: number;
        startPos: THREE.Vector3;
        startQuat: THREE.Quaternion;
        targetPos: THREE.Vector3;
        targetQuat: THREE.Quaternion;
    }>({
        active: false,
        startTime: 0,
        startPos: new THREE.Vector3(),
        startQuat: new THREE.Quaternion(),
        targetPos: new THREE.Vector3(),
        targetQuat: new THREE.Quaternion(),
    });

    const { deployAt } = useInventory(); // To trigger spawn if needed, but likely listeners handle it.

    useEffect(() => {
        const handler = (e: CustomEvent<{ x: number; y: number; z: number }>) => {
            // "parks-first-bond-spawn" logic
            // Position: PlayerPos + (Forward * 1.2) + (Left * 0.8)
            // Camera: Move from current to Profile View

            const { x, y, z } = e.detail;
            const exokinPos = new THREE.Vector3(x, y, z);

            setActive(true);
            state.current.active = true;
            state.current.startTime = performance.now();
            state.current.startPos.copy(camera.position);
            state.current.startQuat.copy(camera.quaternion);

            // Desired final camera pos: Relative to Exokin
            // If Exokin is at P, Camera should be roughly at P + Offset, looking at P
            // Profile view: Side-ish.
            // Let's settle camera at ExokinPos + right-forward-up offset?
            // Or just standard "face the creature".

            // User requested: "forward 0.6m, down 0.8m, yaw rotate 180" from START?
            // "Motion: forward 0.6m, down 0.8m, yaw rotate 180, settle"

            // Relative to START position (Player Eye)
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.y = 0;
            forward.normalize();

            // Target position based on relative move logic requested
            // But we also want to FACE the Exokin.
            // If we rotate 180, we are looking BACK at the Exokin (since we walked past it? or it spawned behind?)
            // Wait, spawn is Front-Left.
            // If I look forward, Exokin is at Front-Left.
            // If I move forward and turn 180, I look back at where I was?
            // Let's assume the user wants a "Cinematic Turn" to face the companion.

            // Let's calculate a good "Look At Companion" pose.
            // Target: Simply look at the Exokin from a nice angle.
            // Let's follow the "Move Forward 0.6m, Down 0.8m" instruction relative to start, 
            // AND ensure the final rotation faces the Exokin.

            const moveVec = forward.clone().multiplyScalar(0.6);
            moveVec.y = -0.8;

            const targetPos = camera.position.clone().add(moveVec);
            state.current.targetPos.copy(targetPos);

            const dummyCam = new THREE.Object3D();
            dummyCam.position.copy(targetPos);
            dummyCam.lookAt(exokinPos.x, exokinPos.y + 0.8, exokinPos.z); // Look at head height
            state.current.targetQuat.copy(dummyCam.quaternion);
        };

        window.addEventListener("parks-first-bond-spawn", handler as EventListener);
        return () => window.removeEventListener("parks-first-bond-spawn", handler as EventListener);
    }, [camera, setActive]);

    useFrame(() => {
        if (!state.current.active) return;

        const now = performance.now();
        const elapsed = (now - state.current.startTime) / 1000;
        let t = elapsed / DURATION;

        if (t >= 1) {
            t = 1;
            state.current.active = false;
            setActive(false); // Return control? Or stay locked? 
            // "Settle" - usually implies staying there. 
            // If we return control, FPC snaps back.
            // We probably need to UPDATE the FPC position/rotation to match where we landed, 
            // THEN return control. But FPC logic is separate.
            // For now, let's keep it active/locked or snapped?
            // User said "Settle".
            // UseCameraOverride usually blocks FPC.
            // We might need to manually set FPC camera/ref to match this new state.
            return;
        }

        const k = easeOutCubic(t);

        camera.position.lerpVectors(state.current.startPos, state.current.targetPos, k);
        camera.quaternion.copy(state.current.startQuat).slerp(state.current.targetQuat, k);
    });

    return null;
}
