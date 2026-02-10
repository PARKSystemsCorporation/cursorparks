"use client";

import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export default function CameraRig({ targetVendor }: { targetVendor: string | null }) {
    const { camera } = useThree();
    const mouse = useRef({ x: 0, y: 0 });

    // Vendor Focus Positions
    // Broker: [-2.2, 1.4, -2.5] -> Cam: [-1.2, 1.5, -0.5]
    // Barker: [2.2, 1.3, -5] -> Cam: [1.2, 1.4, -3.0]
    // Gamemaster: [-2.0, 1.5, -9] -> Cam: [-1.0, 1.5, -7.0]
    // Gatekeeper: [0, 1.6, -14] -> Cam: [0, 1.6, -11.5]

    useEffect(() => {
        let x = 0, y = 1.7, z = 6; // Default

        if (targetVendor === "broker") { x = -1.2; y = 1.5; z = -0.5; }
        else if (targetVendor === "barker") { x = 1.2; y = 1.4; z = -3.0; }
        else if (targetVendor === "gamemaster") { x = -1.0; y = 1.5; z = -7.0; }
        else if (targetVendor === "gatekeeper") { x = 0; y = 1.6; z = -11.5; }

        gsap.to(camera.position, {
            x, y, z,
            duration: 1.5,
            ease: "power2.inOut"
        });

        // Also rotate towards vendor?
        // Let's rely on the lookAt logic in useFrame
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

        // Handheld Noise
        const noiseX = Math.sin(t * 0.5) * 0.05;
        const noiseY = Math.cos(t * 0.3) * 0.05;

        // Base Look Target (down alley)
        const lookX = mouse.current.x * 2;
        const lookY = 1.5 + mouse.current.y * 1 + noiseY;
        const lookZ = camera.position.z - 5; // Look forward relative to cam

        // If target selected, bias look towards them
        // (We can't easily adhere strictly to them without complex logic, 
        // so we'll just let the user look around freely but from a closer vantage point)

        // Apply rotation
        // Instead of lookAt every frame which overrides GSAP if we animated rotation,
        // we'll just lookAt a target point.
        camera.lookAt(lookX + noiseX, lookY, lookZ);
    });

    return null;
}
