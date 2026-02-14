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
    const touchLookPoint = useRef<{ x: number; y: number } | null>(null);

    const isInteractiveTarget = (target: EventTarget | null) => {
        if (!(target instanceof HTMLElement)) return false;
        return !!target.closest("button, input, textarea, select, [role='button'], a");
    };

    useEffect(() => {
        if (!targetVendor) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) onExit();
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (isInteractiveTarget(e.target)) return;
            if (e.touches.length === 1) {
                touchLookPoint.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                };
            }
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDist.current = Math.sqrt(dx * dx + dy * dy);
                touchLookPoint.current = null;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isInteractiveTarget(e.target)) return;
            if (e.touches.length === 1 && touchLookPoint.current) {
                const touch = e.touches[0];
                const dx = touch.clientX - touchLookPoint.current.x;
                const dy = touch.clientY - touchLookPoint.current.y;
                touchLookPoint.current = { x: touch.clientX, y: touch.clientY };
                mouse.current.x = THREE.MathUtils.clamp(mouse.current.x + (dx / window.innerWidth) * 2, -1, 1);
                mouse.current.y = THREE.MathUtils.clamp(mouse.current.y - (dy / window.innerHeight) * 2, -1, 1);
                e.preventDefault();
            }
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (touchStartDist.current - dist > 50) onExit();
            }
        };
        const handleTouchEnd = () => {
            touchLookPoint.current = null;
        };

        window.addEventListener("wheel", handleWheel);
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
        window.addEventListener("touchcancel", handleTouchEnd);

        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("touchcancel", handleTouchEnd);
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
