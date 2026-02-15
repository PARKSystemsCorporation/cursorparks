"use client";

import React from "react";
import { RobotRepairShop } from "@/src/components/Bazaar/RobotRepairShop";
import { BrokerBooth } from "@/src/components/Bazaar/BrokerBooth";
import BazaarVendors from "@/src/components/Bazaar/BazaarVendors";
import FloatingMessages from "@/src/components/Bazaar/FloatingMessage";
import { EtherText } from "@/src/modules/chat/EtherText";
import { TrainerNPC } from "@/src/modules/world/TrainerNPC";
import { WalletCardDeployment } from "@/src/modules/ui/inventory/WalletCardDeployment";
import { DeployedRobotsRenderer } from "@/src/modules/ui/inventory/DeployedRobotsRenderer";
import { CreatureSpawnListener } from "@/src/modules/world/CreatureSpawnListener";
import { ExokinCreationLedStrip } from "@/src/modules/world/ExokinCreationLedStrip";
import { useSceneState } from "@/src/modules/world/SceneStateContext";

// Export the deferred content component for lazy loading
export default function DeferredSceneContent() {
    const { setRadialMenu } = useSceneState();

    return (
        <>
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
        </>
    );
}
