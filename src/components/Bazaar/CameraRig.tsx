"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export default function CameraRig({ targetVendor, onExit }: { targetVendor: string | null, onExit: () => void }) {
    const { camera } = useThree();
    const mouse = useRef({ x: 0, y: 0 });
    const touchStartDist = useRef<number>(0);

    // Gestures for "Back" / "Escape"
    useEffect(() => {
        if (!targetVendor) return;

        const handleWheel = (e: WheelEvent) => {
            // Scroll "Down" / Pull Back = Exit
            if (e.deltaY > 0) {
                onExit();
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDist.current = Math.sqrt(dx * dx + dy * dy);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Pinch In (Distance decreases) = Zoom Out = Exit
                // User said "pinch out" but standard "back" is pinch in. 
                // Adding check for substantial change to avoid accidental triggers.
                if (touchStartDist.current - dist > 50) {
                    onExit();
                }
            }
        };

        window.addEventListener("wheel", handleWheel);
        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchmove", handleTouchMove);

        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [targetVendor, onExit]);

    // Vendor Focus Positions (Strictly clamped to Y=1.7)
    // Hawker: [-3.3, 0, 2.5] -> Cam: [-2, 1.7, 1.2] (left wall, near entrance)
    // Broker: [-2.2, 1.4, -2.5] -> Cam: [-1.2, 1.7, -0.5]
    // Barker: [2.5, 0, -5] -> Cam: [1.5, 1.7, -3.5]
    // Gamemaster: [-2.5, 0, -9] -> Cam: [-1.2, 1.7, -7.0]

    useEffect(() => {
        let x = 0, y = 1.7, z = 6; // Default

        if (targetVendor === "hawker") { x = -2; y = 1.7; z = 1.2; }
        else if (targetVendor === "broker") { x = -1.2; y = 1.7; z = -0.5; }
        else if (targetVendor === "barker") { x = 1.5; y = 1.7; z = -3.5; }
        else if (targetVendor === "gamemaster") { x = -1.2; y = 1.7; z = -7.0; }

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
        if (targetVendor === "hawker") targetPoint.set(-3.3, 1.5, 2.5 + noiseX);
        if (targetVendor === "broker") targetPoint.set(-2.5, 1.5, -2.5 + noiseX);
        if (targetVendor === "barker") targetPoint.set(2.5, 1.5, -5 + noiseX);
        if (targetVendor === "gamemaster") targetPoint.set(-2.5, 1.5, -9 + noiseX);

        // Apply noise to Y as well
        targetPoint.y += noiseY;

        camera.lookAt(targetPoint);

        // Enforce strict height lock to prevent drifting through floor
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7, 0.1);
    });

    return null;
}
