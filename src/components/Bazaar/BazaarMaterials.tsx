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
    createMetalPanelRoughness,
    createWoodCrateTexture,
    createWoodCrateRoughness,
    createClothTexture,
    createClothNormal,
    createRustPipeTexture,
    createRustPipeRoughness,
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
    // New generic dark material for cables/trim
    darkMetal: THREE.MeshStandardMaterial;
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
        const txMetalRough = createMetalPanelRoughness();
        const txWood = createWoodCrateTexture();
        const txWoodRough = createWoodCrateRoughness();
        const txCloth = createClothTexture();
        const txClothNormal = createClothNormal();
        const txRust = createRustPipeTexture();
        const txRustRough = createRustPipeRoughness();

        // 2. Create Materials

        // Wall - Warm sandstone/plaster
        const concreteWall = new THREE.MeshStandardMaterial({
            map: txConcrete,
            normalMap: txConcreteNormal,
            color: "#e2d1c3", // Brighter, warm sandstone
            roughness: 0.95,
            metalness: 0.05,
        });

        const concreteWallRight = concreteWall.clone();
        concreteWallRight.color.set("#e6d6c9"); // Lighter sandstone
        concreteWallRight.envMapIntensity = 0.5; // Reduced reflection

        // Floor - Dusty worn stone, less "wet"
        const wetFloor = new THREE.MeshStandardMaterial({
            map: txFloor,
            roughnessMap: txFloorRough,
            color: "#a09489", // Warmer dusty stone
            roughness: 1.0,
            metalness: 0.0, // Totally dry
            envMapIntensity: 0.2,
        });

        // Ground - Dusty
        const dirtRoad = new THREE.MeshStandardMaterial({
            map: txDirt,
            normalMap: txDirtNormal,
            roughnessMap: txDirtRough,
            color: "#c2ae95", // Brighter desert sand/dirt
            roughness: 1.0,
            metalness: 0,
            envMapIntensity: 0.1,
        });

        // Metal - Warmer reflection
        const metalPanel = new THREE.MeshStandardMaterial({
            map: txMetal,
            roughnessMap: txMetalRough,
            color: "#b0a69e", // Slight warm tint to metal
            roughness: 0.7,
            metalness: 0.6,
            envMapIntensity: 0.8
        });

        // Dark Metal
        const darkMetal = new THREE.MeshStandardMaterial({
            map: txMetal,
            roughnessMap: txMetalRough,
            color: "#3e3b38", // Warmer dark grey
            roughness: 0.9,
            metalness: 0.3,
        });

        // Wood Crate - Warm Oak
        const woodCrate = new THREE.MeshStandardMaterial({
            map: txWood,
            roughnessMap: txWoodRough,
            color: "#a68b6c", // Warm oak/sand
            roughness: 1.0,
            metalness: 0.0,
        });

        // Cloth - Worn, dusty
        const cloth = new THREE.MeshStandardMaterial({
            map: txCloth,
            normalMap: txClothNormal,
            color: "#e6dcc3", // Off-white/cream
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        // Rust Pipe
        const rustPipe = new THREE.MeshStandardMaterial({
            map: txRust,
            roughnessMap: txRustRough,
            color: "#a67c52", // Warmer rust
            roughness: 1.0,
            metalness: 0.4,
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
            darkMetal
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

/** Returns materials when inside BazaarMaterialsProvider, otherwise null. Use for components that render in multiple scenes. */
export function useOptionalBazaarMaterials(): BazaarMaterials | null {
    return useContext(BazaarMaterialsContext);
}
