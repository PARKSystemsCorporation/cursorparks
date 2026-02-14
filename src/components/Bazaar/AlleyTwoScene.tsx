/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import * as THREE from "three";
import { Sky, Environment as DreiEnvironment } from "@react-three/drei";
import AlleyTwoEnvironment from "./AlleyTwoEnvironment";
import AlleyTwoVendors from "./AlleyTwoVendors";
import AlleyTwoCameraRig from "./AlleyTwoCameraRig";
import InputBar from "./InputBar";
import CodeVendorPopout from "./CodeVendorPopout";
import { ChatProvider } from "./ChatContext";
import FloatingMessages from "./FloatingMessage";
import StreamerChatOverlay from "./StreamerChatOverlay";
import "./BazaarLanding.css";
import { EffectComposer, ToneMapping, SMAA } from "@react-three/postprocessing";
import { BazaarMaterialsProvider } from "./BazaarMaterials";

// Alley Two: slightly duskier, narrower feel
const SKY_BLUE = "#6b8ca8";
const CONFIG = {
    fog: { color: "#8fa4b8", near: 12, far: 40 },
    lights: {
        ambient: { intensity: 0.55, color: "#ffffff" },
        sun: { intensity: 1.8, color: "#fff0e0", position: [3, 24, 4] as [number, number, number] },
        hemisphere: { sky: "#8899b0", ground: "#a89070", intensity: 1.2 },
    },
    camera: {
        position: [0, 1.7, 5] as [number, number, number],
        fov: 60,
    },
    postprocessing: {
        exposure: 0.95,
        toneMapping: THREE.ACESFilmicToneMapping,
    },
    shadow: {
        mapSize: 4096,
        normalBias: 0.02,
        cameraFar: 50,
        cameraLeft: -12,
        cameraRight: 12,
        cameraTop: 20,
        cameraBottom: -12,
    },
};

function ShadowMapSetup() {
    const { gl } = useThree();
    useEffect(() => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.shadowMap.needsUpdate = true;
    }, [gl]);
    return null;
}

function AlleyTwoSceneContent({
    targetVendor,
    onShout,
    onReturnToAlleyOne,
}: {
    targetVendor: string | null;
    onShout: (t: string) => void;
    onReturnToAlleyOne?: () => void;
}) {
    return (
        <>
            <ShadowMapSetup />
            <fog attach="fog" args={[CONFIG.fog.color, CONFIG.fog.near, CONFIG.fog.far]} />
            <color attach="background" args={[SKY_BLUE]} />

            <Sky
                sunPosition={[CONFIG.lights.sun.position[0], CONFIG.lights.sun.position[1], CONFIG.lights.sun.position[2]]}
                turbidity={5}
                rayleigh={0.6}
                mieCoefficient={0.008}
            />

            <DreiEnvironment preset="park" background={false} environmentIntensity={1.0} />

            <ambientLight intensity={CONFIG.lights.ambient.intensity} color={CONFIG.lights.ambient.color} />
            <directionalLight
                position={CONFIG.lights.sun.position}
                intensity={CONFIG.lights.sun.intensity}
                color={CONFIG.lights.sun.color}
                castShadow
                shadow-mapSize={[CONFIG.shadow.mapSize, CONFIG.shadow.mapSize]}
                shadow-normalBias={CONFIG.shadow.normalBias}
                shadow-camera-far={CONFIG.shadow.cameraFar}
                shadow-camera-left={CONFIG.shadow.cameraLeft}
                shadow-camera-right={CONFIG.shadow.cameraRight}
                shadow-camera-top={CONFIG.shadow.cameraTop}
                shadow-camera-bottom={CONFIG.shadow.cameraBottom}
            />
            <hemisphereLight args={[CONFIG.lights.hemisphere.sky, CONFIG.lights.hemisphere.ground, CONFIG.lights.hemisphere.intensity]} />

            <AlleyTwoEnvironment onReturn={onReturnToAlleyOne} />
            <AlleyTwoVendors setTarget={onShout} targetId={targetVendor} />

            <FloatingMessages />

            <AlleyTwoCameraRig targetVendor={targetVendor} onExit={() => onShout("/back")} />

            <EffectComposer>
                <SMAA />
                <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
            </EffectComposer>
        </>
    );
}

export type AlleyTwoSceneProps = {
    onReturnToAlleyOne?: () => void;
};

export default function AlleyTwoScene({ onReturnToAlleyOne }: AlleyTwoSceneProps = {}) {
    const [, setMessages] = useState<any[]>([]);
    const socketRef = useRef<any>(null);
    const [targetVendor, setTargetVendor] = useState<string | null>(null);

    useEffect(() => {
        setMessages([
            { id: "init-1", content: "The back alley whispers...", timestamp: Date.now() },
            { id: "init-2", content: "Deals happen in the shadows.", timestamp: Date.now() },
        ]);
    }, []);

    useEffect(() => {
        const onConnectError = (err: Error) => {
            console.warn("AlleyTwo Socket Error:", err.message);
        };
        const onConnect = () => {
            console.log("Connected to AlleyTwo");
        };
        const onAlley2Init = (data: any) => {
            if (data && data.messages) {
                setMessages((prev) => [...data.messages, ...prev].slice(0, 50));
            }
        };
        const onAlley2Shout = (msg: any) => {
            setMessages((prev) => [msg, ...prev].slice(0, 50));
        };

        const initSocket = async () => {
            const { getSocket } = await import("../../engine/socketClient");
            const socket = getSocket();
            socketRef.current = socket;

            socket.on("connect_error", onConnectError);
            socket.on("connect", onConnect);
            socket.on("alley2:init", onAlley2Init);
            socket.on("alley2:shout", onAlley2Shout);
        };

        initSocket();

        return () => {
            const socket = socketRef.current;
            if (socket) {
                socket.off("connect_error", onConnectError);
                socket.off("connect", onConnect);
                socket.off("alley2:init", onAlley2Init);
                socket.off("alley2:shout", onAlley2Shout);
            }
        };
    }, []);



    const onShoutTarget = useCallback((t: string) => {
        if (t === "/back" || t === "back") setTargetVendor(null);
        else setTargetVendor(t);
    }, []);

    return (
        <ChatProvider>
            <div className="bazaar-canvas-container">
                <Canvas
                    shadows
                    dpr={[1, 1.5]}
                    gl={{
                        antialias: false,
                        toneMapping: CONFIG.postprocessing.toneMapping,
                        toneMappingExposure: CONFIG.postprocessing.exposure,
                        powerPreference: "default",
                        stencil: false,
                        depth: true,
                    }}
                    camera={CONFIG.camera}
                >
                    <BazaarMaterialsProvider>
                        <Suspense fallback={null}>
                            <AlleyTwoSceneContent
                                targetVendor={targetVendor}
                                onShout={onShoutTarget}
                                onReturnToAlleyOne={onReturnToAlleyOne}
                            />
                        </Suspense>
                    </BazaarMaterialsProvider>
                </Canvas>

                <div className="bazaar-overlay-vignette" />

                {targetVendor === "coder" && (
                    <CodeVendorPopout onClose={() => setTargetVendor(null)} />
                )}

                <StreamerChatOverlay />
                <InputBar />
            </div>
        </ChatProvider>
    );
}
