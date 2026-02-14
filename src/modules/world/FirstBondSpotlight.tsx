
"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useLayoutEffect, useState } from "react";
import * as THREE from "three";

export function FirstBondSpotlight({ active }: { active: boolean }) {
    const { camera } = useThree();
    const spotlightRef = useRef<THREE.SpotLight>(null);
    const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());
    const [positionSet, setPositionSet] = useState(false);

    // We need to set the position ONCE when active becomes true, 
    // based on the camera's CURRENT position/rotation.
    // This must match the spawn logic: 
    // PlayerPos + (Forward * 1.2) + (Left * 0.8)

    useFrame(() => {
        if (!active) {
            if (positionSet) setPositionSet(false);
            return;
        }

        if (!positionSet && spotlightRef.current) {
            // Calculate spawn position relative to CURRENT camera
            const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            fwd.y = 0;
            fwd.normalize();

            const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion);
            left.y = 0;
            left.normalize();

            const offset = fwd.clone().multiplyScalar(1.2).add(left.clone().multiplyScalar(0.8));
            const spawnPos = camera.position.clone().add(offset);
            spawnPos.y = 0; // Ground level

            // Set Target
            targetRef.current.position.copy(spawnPos);
            targetRef.current.updateMatrixWorld();

            // Set Light Position (Above)
            spotlightRef.current.position.set(spawnPos.x, 4, spawnPos.z);
            spotlightRef.current.target = targetRef.current;

            setPositionSet(true);
        }
    });

    if (!active) return null;

    return (
        <group>
            <primitive object={targetRef.current} />
            <spotLight
                ref={spotlightRef}
                intensity={8}
                angle={0.6}
                penumbra={0.5}
                distance={10}
                castShadow
                color="#ffffff"
            />
            {/* Optional: Add a subtle ground decal or glow? */}
            <mesh position={[targetRef.current.position.x, 0.02, targetRef.current.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.5, 32]} />
                <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
            </mesh>
        </group>
    );
}
