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
    // Depth Fog: Warm particulate tone instead of pure blue
    const fogColor = isTwilight ? "#2a2420" : "#aaccff";
    const sunX = isTwilight ? 2 : 5;
    const sunY = isTwilight ? 8 : 28;
    const sunZ = isTwilight ? -4 : 8;

    // Increased ambient for better fill in shadows (since texture maps are darker)
    const ambientWarmth = 0.7 + twilightBlend * 0.1;
    // Reduced sun intensity to prevent washout and look less "gamey"
    const sunIntensity = isTwilight ? 0.4 : 1.2;

    return (
        <>
            <color attach="background" args={[skyColor]} />
            {/* Haze: Start closer (8) for depth, end at 45 (cutoff) */}
            <fog attach="fog" args={[fogColor, 8, 45]} />
            <Sky
                sunPosition={[sunX, sunY, sunZ]}
                turbidity={isTwilight ? 10 : 2}
                rayleigh={isTwilight ? 0.5 : 0.8}
                mieCoefficient={isTwilight ? 0.05 : 0.01}
            />
            <ambientLight intensity={ambientWarmth} color="#fff0dd" />
            <directionalLight
                position={[sunX, sunY, sunZ]}
                intensity={sunIntensity}
                color="#fff5e6"
                castShadow
                shadow-mapSize={[2048, 2048]} // Optimized shadow map
                shadow-bias={-0.0001}
                shadow-normalBias={0.02}
                shadow-camera-far={65}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={24}
                shadow-camera-bottom={-20}
            />
            <hemisphereLight args={[isTwilight ? "#445566" : "#88aaff", "#332211", isTwilight ? 1.0 : 0.8]} />
        </>
    );
}
