"use client";

import { createContext, useContext, useMemo } from "react";
import * as THREE from "three";
import {
    createConcreteWallTexture,
    createConcreteWallNormal,
    createWetFloorTexture,
    createWetFloorRoughness,
    createDirtRoadTexture,
    createDirtRoadNormal,
    createDirtRoadRoughness,
    createMetalPanelTexture,
    createWoodCrateTexture,
    createRustPipeTexture,
} from "./ProceduralTextures";

type BazaarMaterials = {
    concreteWall: THREE.MeshStandardMaterial;
    concreteWallRight: THREE.MeshStandardMaterial; // Brighter for sun-lit right side
    wetFloor: THREE.MeshStandardMaterial;
    dirtRoad: THREE.MeshStandardMaterial;
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
        const txDirt = createDirtRoadTexture();
        const txDirtNormal = createDirtRoadNormal();
        const txDirtRough = createDirtRoadRoughness();

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

        // Right wall: Brighter (sun-lit side of alley)
        const concreteWallRight = concreteWall.clone();
        concreteWallRight.color.set("#bbb");
        concreteWallRight.envMapIntensity = 1.2;

        // Floor: Wet, dark, reflective in spots (night / alternate)
        const wetFloor = new THREE.MeshStandardMaterial({
            map: txFloor,
            roughnessMap: txFloorRough,
            color: "#666",
            roughness: 1.0,
            metalness: 0.6,
            envMapIntensity: 1.5,
        });

        // Ground: Rough dirt (uneven, pebbly, rutted)
        const dirtRoad = new THREE.MeshStandardMaterial({
            map: txDirt,
            normalMap: txDirtNormal,
            roughnessMap: txDirtRough,
            color: "#5a4a3f",
            roughness: 1.0,
            metalness: 0,
            envMapIntensity: 0.2,
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
            concreteWallRight,
            wetFloor,
            dirtRoad,
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
