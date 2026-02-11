"use client";

import { createContext, useContext, useMemo } from "react";
import * as THREE from "three";
import {
    createConcreteWallTexture,
    createConcreteWallNormal,
    createWetFloorTexture,
    createWetFloorRoughness,
    createMetalPanelTexture,
    createWoodCrateTexture,
    createRustPipeTexture,
} from "./ProceduralTextures";

type BazaarMaterials = {
    concreteWall: THREE.MeshStandardMaterial;
    wetFloor: THREE.MeshStandardMaterial;
    metalPanel: THREE.MeshStandardMaterial;
    woodCrate: THREE.MeshStandardMaterial;
    rustPipe: THREE.MeshStandardMaterial;
};

const BazaarMaterialsContext = createContext<BazaarMaterials | null>(null);

export function BazaarMaterialsProvider({ children }: { children: React.ReactNode }) {
    const materials = useMemo(() => {
        // 1. Generate Textures (Once)
        const txConcrete = createConcreteWallTexture();
        const txConcreteNormal = createConcreteWallNormal();

        const txFloor = createWetFloorTexture();
        const txFloorRough = createWetFloorRoughness();

        const txMetal = createMetalPanelTexture();
        const txWood = createWoodCrateTexture();
        const txRust = createRustPipeTexture();

        // 2. Create Materials

        // Wall: Grimy concrete
        const concreteWall = new THREE.MeshStandardMaterial({
            map: txConcrete,
            normalMap: txConcreteNormal,
            color: "#888", // Tint
            roughness: 0.9,
            metalness: 0.1,
        });

        // Floor: Wet, dark, reflective in spots
        const wetFloor = new THREE.MeshStandardMaterial({
            map: txFloor,
            roughnessMap: txFloorRough,
            color: "#666",
            roughness: 1.0,
            metalness: 0.6,
            envMapIntensity: 1.5,
        });

        // Metal Panel: Brushed, tech
        const metalPanel = new THREE.MeshStandardMaterial({
            map: txMetal,
            color: "#aaa",
            roughness: 0.4,
            metalness: 0.8,
        });

        // Wood Crate
        const woodCrate = new THREE.MeshStandardMaterial({
            map: txWood,
            color: "#a67",
            roughness: 0.8,
            metalness: 0.0,
        });

        // Rust Pipe
        const rustPipe = new THREE.MeshStandardMaterial({
            map: txRust,
            color: "#aaa",
            roughness: 0.9,
            metalness: 0.6,
        });

        return {
            concreteWall,
            wetFloor,
            metalPanel,
            woodCrate,
            rustPipe,
        };
    }, []);

    return (
        <BazaarMaterialsContext.Provider value={materials}>
            {children}
        </BazaarMaterialsContext.Provider>
    );
}

export function useBazaarMaterials() {
    const ctx = useContext(BazaarMaterialsContext);
    if (!ctx) {
        throw new Error("useBazaarMaterials must be used within BazaarMaterialsProvider");
    }
    return ctx;
}
