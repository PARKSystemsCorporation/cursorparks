"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";
// import { eased } from "gsap"; // Not used/doesn't exist in root

// Vendor Positions (Must match Vendor.tsx)
const CAMERA_TARGETS: Record<string, THREE.Vector3> = {
    broker: new THREE.Vector3(-3, 1.5, -2),
    barker: new THREE.Vector3(3, 1.5, -4),
    gamemaster: new THREE.Vector3(-2.5, 1.5, -8),
    gatekeeper: new THREE.Vector3(0, 1.5, -12),
};

const DEFAULT_POS = new THREE.Vector3(0, 1.8, 6);
const LOOK_AT_DEFAULT = new THREE.Vector3(0, 1.5, -10);

export default function CameraRig({ targetVendor }: { targetVendor: string | null }) {
    const { camera } = useThree();
    const vec = new THREE.Vector3();
    const lookAtVec = new THREE.Vector3();

    // Mouse drift
    const mouse = new THREE.Vector2();

    useFrame((state) => {
        // Smooth mouse drift
        mouse.x = THREE.MathUtils.lerp(mouse.x, (state.pointer.x * 0.5), 0.05);
        mouse.y = THREE.MathUtils.lerp(mouse.y, (state.pointer.y * 0.2), 0.05);

        let targetPos = DEFAULT_POS.clone();
        let targetLook = LOOK_AT_DEFAULT.clone();

        if (targetVendor && CAMERA_TARGETS[targetVendor]) {
            // Move closer to vendor
            const vPos = CAMERA_TARGETS[targetVendor];
            // Offset slightly so we aren't INSIDE them
            targetPos = vPos.clone().add(new THREE.Vector3(0, 0, 3));
            targetLook = vPos.clone();
        }

        // Apply Drift
        targetPos.x += mouse.x;
        targetPos.y += mouse.y;

        // Smooth Lerp Camera
        camera.position.lerp(targetPos, 0.04);

        // Smooth LookAt
        // We manually lerp the quaternion or just use lookAt on a dummy and lerp that?
        // Simple approach: lerp a vector then look at it
        // Note: lookAt is instant, so we need to lerp the target vector first.
        // We can't store previous lookAt easily without ref.

        // Actually, just standard lerp on position is enough for "drift".
        // For rotation, let's keep it simple: always look at targetLook
        // But we want it smooth.

        vec.copy(targetLook);
        // We want to interpolate the CURRENT look target.
        // Since Threejs camera doesn't expose "target", we have to manage it.
        // Or we use state.camera.lookAt(x,y,z) every frame.

        state.camera.lookAt(vec);
    });

    return null;
}
