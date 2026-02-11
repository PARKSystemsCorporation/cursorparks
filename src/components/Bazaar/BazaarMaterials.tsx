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
            roughnessMap: txMetalRough,
            color: "#aaa",
            roughness: 1.0,
            metalness: 0.8,
            envMapIntensity: 1.2
        });

        // Dark Metal (for cables, grim) - reuse metal texture but darker
        const darkMetal = new THREE.MeshStandardMaterial({
            map: txMetal, // Reuse map for detail
            roughnessMap: txMetalRough,
            color: "#333",
            roughness: 0.8,
            metalness: 0.5,
        });

        // Wood Crate
        const woodCrate = new THREE.MeshStandardMaterial({
            map: txWood,
            roughnessMap: txWoodRough,
            color: "#8d6e63",
            roughness: 1.0,
            metalness: 0.0,
        });

        // Cloth
        const cloth = new THREE.MeshStandardMaterial({
            map: txCloth,
            normalMap: txClothNormal,
            color: "#fff",
            roughness: 0.9,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        // Rust Pipe
        const rustPipe = new THREE.MeshStandardMaterial({
            map: txRust,
            roughnessMap: txRustRough,
            color: "#aaa",
            roughness: 1.0,
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
