"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useChat } from "@/src/components/Bazaar/ChatContext";
import { usePerformance } from "@/src/modules/performance";

const ETHER_LIFETIME = 4;
const DRIFT_SPEED = 0.3;

interface EtherInstance {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  z: number;
  birth: number;
  isUser: boolean;
}

export function EtherText() {
  const { messages, latestUserMessage } = useChat();
  const { snapshot, setActiveEtherCount } = usePerformance();
  const { camera } = useThree();
  const [instances, setInstances] = useState<EtherInstance[]>([]);
  const seenIdsRef = useRef(new Set<string>());
  const lastIncomingIdRef = useRef<string | null>(null);
  const positionsRef = useRef<Record<string, { x: number; y: number; z: number; birth: number }>>({});
  const groupRefsRef = useRef<Record<string, THREE.Group | null>>({});

  useEffect(() => {
    setActiveEtherCount(instances.length);
  }, [instances.length, setActiveEtherCount]);

  const addInstance = useCallback(
    (ether: EtherInstance) => {
      setInstances((prev) => [...prev, ether]);
      positionsRef.current[ether.id] = { x: ether.x, y: ether.y, z: ether.z, birth: ether.birth };
    },
    []
  );

  useEffect(() => {
    if (!latestUserMessage || seenIdsRef.current.has(latestUserMessage.id)) return;
    seenIdsRef.current.add(latestUserMessage.id);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const dist = 2 + Math.random() * 3;
    const lateral = (Math.random() - 0.5) * 1.5;
    const pos = new THREE.Vector3()
      .copy(camera.position)
      .add(forward.multiplyScalar(dist))
      .add(right.multiplyScalar(lateral));
    const birth = performance.now() / 1000;
    addInstance({
      id: latestUserMessage.id,
      text: latestUserMessage.text,
      color: latestUserMessage.color,
      x: pos.x,
      y: 1.65,
      z: pos.z,
      birth,
      isUser: true,
    });
  }, [latestUserMessage, camera.position, camera.quaternion, addInstance]);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderType === "user") return;
    if (last.id === lastIncomingIdRef.current) return;
    lastIncomingIdRef.current = last.id;
    if (seenIdsRef.current.has(last.id)) return;
    seenIdsRef.current.add(last.id);

    if (instances.length >= snapshot.etherCap) return;
    if (Math.random() >= snapshot.spawnProbability) return;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const dist = 2 + Math.random() * 3;
    const lateral = (Math.random() - 0.5) * 1.5;
    const pos = new THREE.Vector3()
      .copy(camera.position)
      .add(forward.multiplyScalar(dist))
      .add(right.multiplyScalar(lateral));
    const birth = performance.now() / 1000;
    addInstance({ id: last.id, text: last.text, color: last.color, x: pos.x, y: 1.65, z: pos.z, birth, isUser: false });
  }, [messages, camera.position, camera.quaternion, instances.length, snapshot.etherCap, snapshot.spawnProbability, addInstance]);

  useFrame((_state, delta) => {
    const now = performance.now() / 1000;
    const posMap = positionsRef.current;
    const groupRefs = groupRefsRef.current;
    const toRemove: string[] = [];
    for (const id of Object.keys(posMap)) {
      const p = posMap[id]!;
      p.y += DRIFT_SPEED * delta;
      const grp = groupRefs[id];
      if (grp) grp.position.set(p.x, p.y, p.z);
      if (now - p.birth >= ETHER_LIFETIME) toRemove.push(id);
    }
    if (toRemove.length > 0) {
      toRemove.forEach((id) => {
        delete posMap[id];
        delete groupRefs[id];
      });
      setInstances((prev) => prev.filter((e) => !toRemove.includes(e.id)));
    }
  });

  return (
    <group>
      {instances.map((ether) => (
        <group
          key={ether.id}
          ref={(el) => {
            groupRefsRef.current[ether.id] = el;
          }}
          position={[ether.x, ether.y, ether.z]}
        >
          <Text fontSize={0.18} color={ether.color} maxWidth={3} anchorX="center" anchorY="middle" depthOffset={-1}>
            {ether.text}
          </Text>
        </group>
      ))}
    </group>
  );
}
