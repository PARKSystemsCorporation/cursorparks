"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

export default function AlleyTwoCameraRig({
    targetVendor,
    onExit,
}: {
    targetVendor: string | null;
    onExit: () => void;
}) {
    const { camera } = useThree();
    const mouse = useRef({ x: 0, y: 0 });
    const touchStartDist = useRef<number>(0);

    useEffect(() => {
        if (!targetVendor) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) onExit();
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
                if (touchStartDist.current - dist > 50) onExit();
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

    useEffect(() => {
        let x = 0, y = 1.7, z = 5;

        if (targetVendor === "smith") {
            x = -2.2; y = 1.7; z = 0.5;
        } else if (targetVendor === "fixer") {
            x = -2.2; y = 1.7; z = -3.5;
        } else if (targetVendor === "merchant") {
            x = 1.8; y = 1.7; z = -7.5;
        }

        gsap.to(camera.position, {
            x, y, z,
            duration: 2.0,
            ease: "power2.inOut",
        });
    }, [targetVendor, camera]);

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
        const noiseX = Math.sin(t * 0.5) * 0.02 + Math.cos(t * 1.5) * 0.01;
        const noiseY = Math.cos(t * 0.3) * 0.02 + Math.sin(t * 1.1) * 0.01;

        const lookX = mouse.current.x * 2;
        const lookY = 1.5 + mouse.current.y * 1 + noiseY;
        const lookZ = camera.position.z - 8;

        const targetPoint = new THREE.Vector3(lookX + noiseX, lookY, lookZ);

        if (targetVendor === "smith") targetPoint.set(-3.7, 1.5, -1 + noiseX);
        if (targetVendor === "fixer") targetPoint.set(-3.7, 1.5, -5 + noiseX);
        if (targetVendor === "merchant") targetPoint.set(3.2, 1.5, -10 + noiseX);

        targetPoint.y += noiseY;
        camera.lookAt(targetPoint);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7, 0.1);
    });

    return null;
}
