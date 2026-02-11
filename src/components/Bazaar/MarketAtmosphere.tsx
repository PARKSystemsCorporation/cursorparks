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
    // Afternoon Light: Warm amber sun, cream/brown fill
    const sunColor = "#ffb76b";
    const skyColor = "#ffeedd"; // Pale warm cream
    const groundColor = "#d4b483"; // Dusty brown
    const fogColor = "#eacca7"; // Warm beige fog

    // Position: High and angled for 4-5PM shadows
    const sunPosition: [number, number, number] = [15, 25, 10];

    return (
        <>
            <color attach="background" args={["#f0e0d0"]} />
            {/* Fog: Low density, warm, starts near to layer depth */}
            <fogexp2 attach="fog" args={[fogColor, 0.015]} />

            <ambientLight intensity={0.4} color="#ffeebb" />

            <directionalLight
                position={sunPosition}
                intensity={3.5}
                color={sunColor}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0005}
                shadow-normalBias={0.04}
                shadow-camera-far={80}
                shadow-camera-left={-30}
                shadow-camera-right={30}
                shadow-camera-top={30}
                shadow-camera-bottom={-30}
            />

            {/* Hemisphere fill to lift blacks with warm tones */}
            <hemisphereLight args={[skyColor, groundColor, 0.6]} />

            {/* Sun visual (optional, reusing Sky if desired, but custom color might be needed) */}
            <Sky
                sunPosition={sunPosition}
                turbidity={8}
                rayleigh={0.3} // Lower rayleigh for less blue, more styling
                mieCoefficient={0.005}
                mieDirectionalG={0.7}
            />
        </>
    );
}
