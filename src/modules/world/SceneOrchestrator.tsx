"use client";

import React, { Suspense } from "react";
import { CameraOverrideProvider } from "./CameraOverrideContext";
import { CameraProfileMoment } from "./CameraProfileMoment";
import { EffectComposer, ToneMapping, SMAA, Vignette, Noise, Bloom } from "@react-three/postprocessing";
import { AlleyGeometry } from "@/src/components/Bazaar/AlleyGeometry";
import { AlleyEndingPortal } from "@/src/components/Bazaar/AlleyEnding";
import { PrisonHallwayAndYard } from "@/src/components/Bazaar/PrisonHallwayAndYard";
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
import { ArenaEntrance } from "./ArenaEntrance";
import { WalletCardDeployment } from "@/src/modules/ui/inventory/WalletCardDeployment";
import { DeployedRobotsRenderer } from "@/src/modules/ui/inventory/DeployedRobotsRenderer";
import { CreatureSpawnListener } from "./CreatureSpawnListener";
import { SunMoonCycle } from "./SunMoonCycle";

/** AlleyProps: lights and sign (from original BazaarScene). */
function AlleyProps() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[1.95, 0.05, -15]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.05, 30]} />
        <meshStandardMaterial color="#c0392b" emissive="#c0392b" emissiveIntensity={10} toneMapped={false} />
      </mesh>
      <mesh position={[-1.95, 0.05, -15]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.05, 30]} />
        <meshStandardMaterial color="#c0392b" emissive="#c0392b" emissiveIntensity={10} toneMapped={false} />
      </mesh>
      {[0, -10, -20].map((z, i) => (
        <group key={i} position={[0, 0.02, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.5, 0.3]} />
            <meshStandardMaterial color="#ff6b1a" emissive="#ff6b1a" emissiveIntensity={5} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.5, 0]} intensity={3} distance={8} decay={2} color="#ffaa55" />
        </group>
      ))}
      <group position={[-1.9, 2.5, -10]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[4, 1, 0.1]} />
          <meshStandardMaterial color="#1a1410" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.5, 0.8]} />
          <meshBasicMaterial color="#ff6b1a" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0, 1]} intensity={5} distance={10} decay={2} color="#ffaa00" />
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
      <color attach="background" args={["#eacca7"]} />
      <fogExp2 attach="fog" args={["#fff0dd", 0.005]} />

      <CameraOverrideProvider>
        <PerformanceTicker />
        <FirstPersonController />
        <CameraProfileMoment />

      <AlleyGeometry />
      <PrisonHallwayAndYard />
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
      <ArenaEntrance />
      <CreatureSpawnListener />
      <WalletCardDeployment />
      <DeployedRobotsRenderer />
      </CameraOverrideProvider>

      <SunMoonCycle />
      <pointLight position={[0, 4, -10]} intensity={1.5} color="#ffaa55" distance={20} decay={2} />

      <SpatialAudioZones />

      <EffectComposer>
        <SMAA />
        <Vignette eskil={false} offset={0.1} darkness={0.3} />
        <Noise opacity={0.015} />
        <Bloom luminanceThreshold={1.5} mipmapBlur intensity={1.5} radius={0.4} />
        <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
      </EffectComposer>
    </Suspense>
  );
}
