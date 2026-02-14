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
import { ExokinCreationLedStrip } from "./ExokinCreationLedStrip";
import { LightingCycleProvider } from "@/src/components/Bazaar/LightingCycleContext";

/** AlleyProps: lights and sign (from original BazaarScene). */
function AlleyProps() {
  const neonRed = "#ff1f33";
  const neonRedDeep = "#7a0010";
  const laserCore = "#ffd7dc";
  const alleyLength = 30;
  const alleyCenterZ = -15;
  const halfLength = alleyLength / 2;
  const floorY = 0.03;
  const stripWidth = 0.03;
  const stripGlowWidth = 0.13;
  const coreWidth = 0.009;
  const coreHeight = 0.012;

  return (
    <group position={[0, 0, 0]}>
      {/* Inner lane edge strips */}
      <mesh position={[1.95, floorY, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength]} />
        <meshBasicMaterial color={neonRed} toneMapped={false} />
      </mesh>
      <mesh position={[1.95, floorY + 0.012, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[coreWidth, coreHeight, alleyLength]} />
        <meshBasicMaterial color={laserCore} toneMapped={false} />
      </mesh>
      <mesh position={[1.95, floorY - 0.004, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[stripGlowWidth, 0.008, alleyLength]} />
        <meshBasicMaterial color={neonRedDeep} transparent opacity={0.78} toneMapped={false} />
      </mesh>
      <mesh position={[-1.95, floorY, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength]} />
        <meshBasicMaterial color={neonRed} toneMapped={false} />
      </mesh>
      <mesh position={[-1.95, floorY + 0.012, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[coreWidth, coreHeight, alleyLength]} />
        <meshBasicMaterial color={laserCore} toneMapped={false} />
      </mesh>
      <mesh position={[-1.95, floorY - 0.004, alleyCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[stripGlowWidth, 0.008, alleyLength]} />
        <meshBasicMaterial color={neonRedDeep} transparent opacity={0.78} toneMapped={false} />
      </mesh>

      {/* Full floor outline (outside perimeter) */}
      <mesh position={[2.28, floorY, alleyCenterZ]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength + 0.35]} />
        <meshBasicMaterial color={neonRed} toneMapped={false} />
      </mesh>
      <mesh position={[2.28, floorY + 0.012, alleyCenterZ]}>
        <boxGeometry args={[coreWidth, coreHeight, alleyLength + 0.35]} />
        <meshBasicMaterial color={laserCore} toneMapped={false} />
      </mesh>
      <mesh position={[2.28, floorY - 0.004, alleyCenterZ]}>
        <boxGeometry args={[stripGlowWidth, 0.008, alleyLength + 0.35]} />
        <meshBasicMaterial color={neonRedDeep} transparent opacity={0.82} toneMapped={false} />
      </mesh>
      <mesh position={[-2.28, floorY, alleyCenterZ]}>
        <boxGeometry args={[stripWidth, stripWidth, alleyLength + 0.35]} />
        <meshBasicMaterial color={neonRed} toneMapped={false} />
      </mesh>
      <mesh position={[-2.28, floorY + 0.012, alleyCenterZ]}>
        <boxGeometry args={[coreWidth, coreHeight, alleyLength + 0.35]} />
        <meshBasicMaterial color={laserCore} toneMapped={false} />
      </mesh>
      <mesh position={[-2.28, floorY - 0.004, alleyCenterZ]}>
        <boxGeometry args={[stripGlowWidth, 0.008, alleyLength + 0.35]} />
        <meshBasicMaterial color={neonRedDeep} transparent opacity={0.82} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY, alleyCenterZ + halfLength]}>
        <boxGeometry args={[4.6, stripWidth, stripWidth]} />
        <meshBasicMaterial color={neonRed} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY + 0.012, alleyCenterZ + halfLength]}>
        <boxGeometry args={[4.6, coreHeight, coreWidth]} />
        <meshBasicMaterial color={laserCore} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY - 0.004, alleyCenterZ + halfLength]}>
        <boxGeometry args={[4.6, 0.008, stripGlowWidth]} />
        <meshBasicMaterial color={neonRedDeep} transparent opacity={0.82} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY, alleyCenterZ - halfLength]}>
        <boxGeometry args={[4.6, stripWidth, stripWidth]} />
        <meshBasicMaterial color={neonRed} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY + 0.012, alleyCenterZ - halfLength]}>
        <boxGeometry args={[4.6, coreHeight, coreWidth]} />
        <meshBasicMaterial color={laserCore} toneMapped={false} />
      </mesh>
      <mesh position={[0, floorY - 0.004, alleyCenterZ - halfLength]}>
        <boxGeometry args={[4.6, 0.008, stripGlowWidth]} />
        <meshBasicMaterial color={neonRedDeep} transparent opacity={0.82} toneMapped={false} />
      </mesh>

      {/* Interior cross strips for depth cues */}
      {[0, -10, -20].map((z, i) => (
        <group key={i} position={[0, 0.02, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.5, 0.25]} />
            <meshBasicMaterial color={neonRed} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[3.5, 0.06]} />
            <meshBasicMaterial color={laserCore} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
            <planeGeometry args={[3.75, 0.45]} />
            <meshBasicMaterial color={neonRedDeep} transparent opacity={0.6} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.42, 0]} intensity={4.4} distance={11} decay={2} color={neonRed} />
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
          intensity={3.5}
          distance={9}
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
      <LightingCycleProvider>
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
          <ExokinCreationLedStrip />
          <WalletCardDeployment />
          <DeployedRobotsRenderer />
        </CameraOverrideProvider>
      </LightingCycleProvider>

      <SunMoonCycle />
      <pointLight position={[0, 4, -10]} intensity={1.35} color="#ff1730" distance={20} decay={2} />
      <pointLight position={[-30, 6, -7]} intensity={2.0} color="#ff1730" distance={28} decay={2} />

      <SpatialAudioZones />

      <EffectComposer>
        <Bloom luminanceThreshold={0.85} mipmapBlur intensity={1.5} radius={0.55} />
        <ToneMapping adaptive={false} resolution={256} middleGrey={0.6} maxLuminance={16.0} adaptationRate={1.0} />
      </EffectComposer>
    </Suspense>
  );
}
