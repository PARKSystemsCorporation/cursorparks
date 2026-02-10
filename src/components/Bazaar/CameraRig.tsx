"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export default function CameraRig({ targetVendor }: { targetVendor: string | null }) {
    const { camera } = useThree();
    const mouse = useRef({ x: 0, y: 0 });

    // Vendor Focus Positions (Strictly clamped to Y=1.7)
    // Broker: [-2.2, 1.4, -2.5] -> Cam: [-1.2, 1.7, -0.5]
    // Barker: [2.5, 0, -5] -> Cam: [1.5, 1.7, -3.5]
    // Gamemaster: [-2.5, 0, -9] -> Cam: [-1.2, 1.7, -7.0]
    // Gatekeeper: [0, 0, -14] -> Cam: [0, 1.7, -11.5]

    useEffect(() => {
        let x = 0, y = 1.7, z = 6; // Default

        if (targetVendor === "broker") { x = -1.2; y = 1.7; z = -0.5; }
        else if (targetVendor === "barker") { x = 1.5; y = 1.7; z = -3.5; }
        else if (targetVendor === "gamemaster") { x = -1.2; y = 1.7; z = -7.0; }
        else if (targetVendor === "gatekeeper") { x = 0; y = 1.7; z = -11.5; }

        gsap.to(camera.position, {
            x, y, z,
            duration: 2.0,
            ease: "power2.inOut"
        });

    }, [targetVendor, camera]);

    // Track mouse
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        // Handheld Noise (Rotation only, to simulate lens shake)
        const noiseX = Math.sin(t * 0.5) * 0.02 + Math.cos(t * 1.5) * 0.01;
        const noiseY = Math.cos(t * 0.3) * 0.02 + Math.sin(t * 1.1) * 0.01;

        // Base Look Target (down alley)
        const lookX = mouse.current.x * 2;
        const lookY = 1.5 + mouse.current.y * 1 + noiseY; // Look slightly down/level
        const lookZ = camera.position.z - 10; // Always look "forward" relative to current Z

        // Dynamic LookAt
        // We calculate a target point in world space
        const targetPoint = new THREE.Vector3(
            lookX + noiseX,
            lookY,
            lookZ
        );

        // If locked to a vendor, we should look AT them, plus noise
        if (targetVendor === "broker") targetPoint.set(-2.5, 1.5, -2.5 + noiseX);
        if (targetVendor === "barker") targetPoint.set(2.5, 1.5, -5 + noiseX);
        if (targetVendor === "gamemaster") targetPoint.set(-2.5, 1.5, -9 + noiseX);
        if (targetVendor === "gatekeeper") targetPoint.set(0, 1.6, -14 + noiseX);

        // Apply noise to Y as well
        targetPoint.y += noiseY;

        camera.lookAt(targetPoint);

        // Enforce strict height lock to prevent drifting through floor
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7, 0.1);
    });

    return null;
}
