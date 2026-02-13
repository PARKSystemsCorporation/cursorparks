"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useRobot } from "./RobotContext";

const FOLLOW_SPEED = 2.5;
const FOLLOW_DISTANCE = 1.8;
const FOLLOW_HEIGHT = 0;
const BOB_AMPLITUDE = 0.03;
const BOB_FREQ = 2;
const SPEECH_DURATION_MS = 4000;

export function RobotCompanion({ position: initialPos }: { position: [number, number, number] }) {
  const { camera } = useThree();
  const { getMood, lastResponse, tick } = useRobot();
  const groupRef = useRef<THREE.Group>(null);
  const ledRef = useRef<THREE.Mesh>(null);
  const [speechVisible, setSpeechVisible] = useState(false);

  useEffect(() => {
    if (lastResponse) {
      setSpeechVisible(true);
      const t = setTimeout(() => setSpeechVisible(false), SPEECH_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [lastResponse]);

  useFrame((state, delta) => {
    tick(delta);
    if (!groupRef.current) return;
    const target = new THREE.Vector3(
      camera.position.x - Math.sin(camera.rotation.y) * FOLLOW_DISTANCE,
      camera.position.y + FOLLOW_HEIGHT,
      camera.position.z - Math.cos(camera.rotation.y) * FOLLOW_DISTANCE
    );
    groupRef.current.position.lerp(target, delta * FOLLOW_SPEED);
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * BOB_FREQ) * BOB_AMPLITUDE;
    const mood = getMood();
    const ledColor = mood.valence > 0.6 ? "#22aa22" : mood.valence < 0.4 ? "#cc2222" : "#dd8800";
    if (ledRef.current && (ledRef.current.material as THREE.MeshStandardMaterial).emissive) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(ledColor);
      mat.emissive.set(ledColor);
    }
  });

  return (
    <group ref={groupRef} position={initialPos}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.32, 0.42, 0.22]} />
        <meshStandardMaterial color="#ff6b1a" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#ff6b1a" roughness={0.5} />
      </mesh>
      <mesh ref={ledRef} position={[0, 0.72, 0.12]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#dd8800" emissive="#dd8800" emissiveIntensity={0.8} />
      </mesh>
      {speechVisible && lastResponse && (
        <group position={[0, 1.1, 0.5]}>
          <mesh>
            <planeGeometry args={[1.4, 0.5]} />
            <meshBasicMaterial color="#1a1410" transparent opacity={0.9} depthTest={false} />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.08}
            color="#e8d5b7"
            maxWidth={1.2}
            anchorX="center"
            anchorY="middle"
            depthOffset={-0.5}
          >
            {lastResponse}
          </Text>
        </group>
      )}
    </group>
  );
}
