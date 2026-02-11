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
    createWoodCrateRoughness,
    createClothTexture,
    createRustPipeTexture,
} from "./ProceduralTextures";

type BazaarMaterials = {
    concreteWall: THREE.MeshStandardMaterial;
    concreteWallRight: THREE.MeshStandardMaterial;
    wetFloor: THREE.MeshStandardMaterial;
    dirtRoad: THREE.MeshStandardMaterial;
    metalPanel: THREE.MeshStandardMaterial;
    woodCrate: THREE.MeshStandardMaterial;
    rustPipe: THREE.MeshStandardMaterial;
    cloth: THREE.MeshStandardMaterial;
};

const BazaarMaterialsContext = createContext<BazaarMaterials | null>(null);

export function BazaarMaterialsProvider({ children }: { children: React.ReactNode }) {
    const materials = useMemo(() => {
        // 1. Generate Textures
        const txConcrete = createConcreteWallTexture();
        const txConcreteNormal = createConcreteWallNormal();

        const txFloor = createWetFloorTexture();
        const txFloorRough = createWetFloorRoughness();
        const txDirt = createDirtRoadTexture();
        const txDirtNormal = createDirtRoadNormal();
        const txDirtRough = createDirtRoadRoughness();

        const txMetal = createMetalPanelTexture();
        const txWood = createWoodCrateTexture();
        const txWoodRough = createWoodCrateRoughness();
        const txCloth = createClothTexture();
        const txRust = createRustPipeTexture();

        // 2. Create Materials

        // Wall
        const concreteWall = new THREE.MeshStandardMaterial({
            map: txConcrete,
            normalMap: txConcreteNormal,
            color: "#888",
            roughness: 0.9,
            metalness: 0.1,
        });

        const concreteWallRight = concreteWall.clone();
        concreteWallRight.color.set("#bbb");
        concreteWallRight.envMapIntensity = 1.2;

        // Floor
        const wetFloor = new THREE.MeshStandardMaterial({
            map: txFloor,
            roughnessMap: txFloorRough,
            color: "#666",
            roughness: 1.0,
            metalness: 0.6,
            envMapIntensity: 1.5,
        });

        // Ground
        const dirtRoad = new THREE.MeshStandardMaterial({
            map: txDirt,
            normalMap: txDirtNormal,
            roughnessMap: txDirtRough,
            color: "#5a4a3f",
            roughness: 1.0,
            metalness: 0,
            envMapIntensity: 0.2,
        });

        // Metal
        const metalPanel = new THREE.MeshStandardMaterial({
            map: txMetal,
            color: "#aaa",
            roughness: 0.4,
            metalness: 0.8,
        });

        // Wood Crate (Improved)
        const woodCrate = new THREE.MeshStandardMaterial({
            map: txWood,
            roughnessMap: txWoodRough,
            color: "#8d6e63", // Slightly lighter to show texture
            roughness: 1.0,
            metalness: 0.0,
        });

        // Cloth (New)
        const cloth = new THREE.MeshStandardMaterial({
            map: txCloth,
            color: "#fff",
            roughness: 0.9,
            metalness: 0.05,
            side: THREE.DoubleSide
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
            cloth,
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
