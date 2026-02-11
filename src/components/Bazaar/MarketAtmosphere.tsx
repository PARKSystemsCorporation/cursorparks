"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";

// Cycles between day and twilight over ~90 seconds for immersive feel
const CYCLE_DURATION = 90;
const TWILIGHT_START = 0.6;
const UPDATE_INTERVAL = 0.15;

export default function MarketAtmosphere() {
    const phaseRef = useRef(0);
    const [phase, setPhase] = useState(0);

    const accumRef = useRef(0);
    useFrame((_, delta) => {
        phaseRef.current += delta / CYCLE_DURATION;
        if (phaseRef.current > 1) phaseRef.current -= 1;
        accumRef.current += delta;
        if (accumRef.current >= UPDATE_INTERVAL) {
            accumRef.current = 0;
            setPhase(phaseRef.current);
        }
    });

    const p = phase;
    const isTwilight = p > TWILIGHT_START;
    const twilightBlend = isTwilight ? (p - TWILIGHT_START) / (1 - TWILIGHT_START) : 0;
    const skyColor = isTwilight ? "#4a5a7a" : "#87CEEB";
    const fogColor = isTwilight ? "#6b7a94" : "#b8d4e3";
    const sunX = isTwilight ? 2 : 5;
    const sunY = isTwilight ? 8 : 28;
    const sunZ = isTwilight ? -4 : 8;
    const ambientWarmth = 0.55 + twilightBlend * 0.15;
    const sunIntensity = isTwilight ? 0.9 : 2.2;

    return (
        <>
            <color attach="background" args={[skyColor]} />
            <fog attach="fog" args={[fogColor, 14, 48]} />
            <Sky
                sunPosition={[sunX, sunY, sunZ]}
                turbidity={isTwilight ? 8 : 4}
                rayleigh={isTwilight ? 0.8 : 0.5}
                mieCoefficient={isTwilight ? 0.03 : 0.005}
            />
            <ambientLight intensity={ambientWarmth} color="#fff5e6" />
            <directionalLight
                position={[sunX, sunY, sunZ]}
                intensity={sunIntensity}
                color="#fff5e6"
                castShadow
                shadow-mapSize={[4096, 4096]}
                shadow-normalBias={0.02}
                shadow-camera-far={65}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={24}
                shadow-camera-bottom={-20}
            />
            <hemisphereLight args={[isTwilight ? "#8899b0" : "#a8c8e8", "#c4a574", isTwilight ? 1.1 : 1.45]} />
        </>
    );
}
