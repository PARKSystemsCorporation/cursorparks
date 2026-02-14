"use client";

import React, { Suspense } from "react";
import { CameraOverrideProvider } from "./CameraOverrideContext";
import { CameraProfileMoment } from "./CameraProfileMoment";
import { EffectComposer, ToneMapping, Bloom } from "@react-three/postprocessing";
import { AlleyGeometry } from "@/src/components/Bazaar/AlleyGeometry";
import { AlleyEndingPortal } from "@/src/components/Bazaar/AlleyEnding";
import { AlleySurfaceBreakupLayer } from "@/src/components/Bazaar/AlleySurfaceBreakupLayer";
import { ContactShadowSystem } from "@/src/components/Bazaar/ContactShadowSystem";
import { EnvironmentalMicroMotion } from "@/src/components/Bazaar/EnvironmentalMicroMotion";
import { SpatialAudioZones } from "@/src/components/Bazaar/SpatialAudioZones";
import { RobotRepairShop } from "@/src/components/Bazaar/RobotRepairShop";
import { BrokerBooth } from "@/src/components/Bazaar/BrokerBooth";
import BazaarVendors from "@/src/components/Bazaar/BazaarVendors";
import FloatingMessages from "@/src/components/Bazaar/FloatingMessage";
import { useSceneState } from "./SceneStateContext";
import { EtherText } from "@/src/modules/chat/EtherText";
import { FirstPersonController } from "./FirstPersonController";
import { PerformanceTicker } from "./PerformanceTicker";
import { TrainerNPC } from "./TrainerNPC";
import { WalletCardDeployment } from "@/src/modules/ui/inventory/WalletCardDeployment";
import { DeployedRobotsRenderer } from "@/src/modules/ui/inventory/DeployedRobotsRenderer";
import { CreatureSpawnListener } from "./CreatureSpawnListener";
import { SunMoonCycle } from "./SunMoonCycle";
import { StadiumExit } from "@/src/components/Bazaar/StadiumExit";
import { DesertJailColiseum } from "@/src/components/Bazaar/DesertJailColiseum";

/** AlleyProps: lights and sign (from original BazaarScene). */
function AlleyProps() {
  const neonRed = "#ff1428";
  const neonRedDeep = "#66000a";
  const alleyLength = 30;
  const alleyCenterZ = -15;
  const halfLength = alleyLength / 2;
  const floorY = 0.05;
  const stripWidth = 0.05;

  return (
    <group position={[0, 0, 0]}>
      {/* Inner lane edge strips */}
      <mesh position={[1.95, floorY, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength]} />
        <meshStandardMaterial color={neonRedDeep} emissive={neonRed} emissiveIntensity={14} toneMapped={false} />
      </mesh>
      <mesh position={[-1.95, floorY, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength]} />
        <meshStandardMaterial color={neonRedDeep} emissive={neonRed} emissiveIntensity={14} toneMapped={false} />
      </mesh>

      {/* Full floor outline (outside perimeter) */}
      <mesh position={[2.28, floorY, alleyCenterZ]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength + 0.35]} />
        <meshStandardMaterial color={neonRedDeep} emissive={neonRed} emissiveIntensity={16} toneMapped={false} />
      </mesh>
      <mesh position={[-2.28, floorY, alleyCenterZ]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength + 0.35]} />
        <meshStandardMaterial color={neonRedDeep} emissive={neonRed} emissiveIntensity={16} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY, alleyCenterZ + halfLength]}>
        <boxGeometry args={[4.6, stripWidth, stripWidth]} />
        <meshStandardMaterial color={neonRedDeep} emissive={neonRed} emissiveIntensity={16} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY, alleyCenterZ - halfLength]}>
        <boxGeometry args={[4.6, stripWidth, stripWidth]} />
        <meshStandardMaterial color={neonRedDeep} emissive={neonRed} emissiveIntensity={16} toneMapped={false} />
      </mesh>

      {/* Interior cross strips for depth cues */}
      {[0, -10, -20].map((z, i) => (
        <group key={i} position={[0, 0.02, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.5, 0.25]} />
            <meshStandardMaterial color={neonRedDeep} emissive={neonRed} emissiveIntensity={10} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.42, 0]} intensity={2.9} distance={8} decay={2} color={neonRed} />
        </group>
      ))}

      {/* Corner emitters to complete full-area red outline */}
      {[
        [2.28, 0.26, 0.2],
        [-2.28, 0.26, 0.2],
        [2.28, 0.26, -30.2],
        [-2.28, 0.26, -30.2],
      ].map(([x, y, z], i) => (
        <pointLight
          key={`outline-corner-${i}`}
          position={[x, y, z]}
          intensity={1.9}
          distance={6}
          decay={2}
          color={neonRed}
        />
      ))}

      <group position={[-1.9, 2.5, -10]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[4, 1, 0.1]} />
          <meshStandardMaterial color="#1a1410" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.5, 0.8]} />
          <meshBasicMaterial color={neonRed} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0, 1]} intensity={4.6} distance={10} decay={2} color={neonRed} />
      </group>
    </group>
  );
}

/**
 * SceneOrchestrator: 3D scene content (alley, FPS controller, NPCs, lights, effects).
 * Use inside Canvas. Expects PerformanceProvider and SceneStateProvider above.
 */
export function SceneOrchestrator() {
  const { setRadialMenu, onEnterAlleyTwo } = useSceneState();

  return (
    <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial wireframe color="#ff6b1a" /></mesh>}>
      <color attach="background" args={["#f5ecd8"]} />
      <fogExp2 attach="fog" args={["#fff5e8", 0.002]} />

      <CameraOverrideProvider>
        <PerformanceTicker />
        <FirstPersonController />
        <CameraProfileMoment />

        <AlleyGeometry />
        <StadiumExit />
        <DesertJailColiseum />
        <AlleyEndingPortal onEnterPortal={onEnterAlleyTwo ?? undefined} />
        <AlleySurfaceBreakupLayer />
        <ContactShadowSystem />
        <EnvironmentalMicroMotion />

        <AlleyProps />
        <RobotRepairShop />
        <BazaarVendors onRightClick={(id, x, y) => setRadialMenu({ vendorId: id, x, y })} />
        <BrokerBooth />

        <FloatingMessages />
        <EtherText />

        <TrainerNPC />
        <CreatureSpawnListener />
        <WalletCardDeployment />
        <DeployedRobotsRenderer />
      </CameraOverrideProvider>

      <SunMoonCycle />
      <pointLight position={[0, 4, -10]} intensity={1.35} color="#ff1730" distance={20} decay={2} />
      <pointLight position={[-30, 6, -7]} intensity={2.0} color="#ff1730" distance={28} decay={2} />

      <SpatialAudioZones />

      <EffectComposer>
        <Bloom luminanceThreshold={1.5} mipmapBlur intensity={1.0} radius={0.3} />
        <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
      </EffectComposer>
    </Suspense>
  );
}
