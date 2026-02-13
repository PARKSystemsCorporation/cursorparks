"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

const HAND_OFFSET = new THREE.Vector3(0.15, -0.15, -0.4);

export function WalletCardDeployment() {
  const { dragState, setDeployTarget, confirmDeploy } = useInventory();
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !dragState) return;
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
    groupRef.current.position.add(HAND_OFFSET.clone().applyQuaternion(camera.quaternion));
  });

  useEffect(() => {
    if (!dragState) return;
    const canvas = gl.domElement;
    const onPointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(0, 0);
      raycaster.setFromCamera(mouse, camera);
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(ground, hit)) {
        setDeployTarget({ x: hit.x, y: 0, z: hit.z });
        confirmDeploy();
      }
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    return () => canvas.removeEventListener("pointerdown", onPointerDown);
  }, [dragState, camera, gl.domElement, setDeployTarget, confirmDeploy]);

  if (!dragState) return null;

  return (
    <group ref={groupRef}>
      <mesh scale={0.12} castShadow rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 0.5, 0.32]} />
        <meshStandardMaterial
          color="#1c1a18"
          metalness={0.7}
          roughness={0.4}
          emissive="#0a0806"
        />
      </mesh>
    </group>
  );
}
