import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { HandData } from '../types';

interface VehicleProps {
  handData: HandData[];
  onScore: (s: number) => void;
}

const Vehicle = ({ handData, onScore }: VehicleProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);
  const lastFloor = useRef(0);
  const scoreRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let targetRotation = 0;

    // Dual hand steering logic
    if (handData && handData.length >= 2) {
      const left = handData.find(h => h.handedness === 'Right') || handData[0];
      const right = handData.find(h => h.handedness === 'Left') || handData[1];

      if (left && right) {
        const dx = (1 - right.landmarks[0].x) - (1 - left.landmarks[0].x);
        const dy = right.landmarks[0].y - left.landmarks[0].y;
        targetRotation = -Math.atan2(dy, dx) * 1.5;
      }
    } else if (handData.length === 1) {
      const hand = handData[0];
      const wrist = hand.landmarks[0];
      targetRotation = (wrist.x - 0.5) * 2.5;
    }

    // Smooth rotation
    rotationRef.current += (targetRotation - rotationRef.current) * 0.1;
    meshRef.current.rotation.z = rotationRef.current;
    meshRef.current.rotation.y = rotationRef.current * 0.5;
    
    // Speed logic
    const currentSpeed = 0.5 + Math.min(1.5, scoreRef.current / 5000);
    
    state.camera.position.z -= currentSpeed;
    state.camera.position.x += (meshRef.current.position.x - state.camera.position.x) * 0.05;
    
    meshRef.current.position.z -= currentSpeed;
    meshRef.current.position.x += -rotationRef.current * (currentSpeed * 15) * delta;

    // Boundary constraint
    meshRef.current.position.x = Math.max(-15, Math.min(15, meshRef.current.position.x));

    // Scoring
    scoreRef.current += 1;
    const displayScore = Math.floor(scoreRef.current / 10);
    if (displayScore > lastFloor.current) {
      lastFloor.current = displayScore;
      onScore(displayScore);
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Futuristic Vehicle Body */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[1.2, 0.4, 2.5]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1} />
        </mesh>
        
        {/* Cockpit */}
        <mesh position={[0, 0.2, -0.2]}>
          <boxGeometry args={[0.8, 0.4, 1]} />
          <meshStandardMaterial color="#00ffff" transparent opacity={0.6} />
        </mesh>

        {/* Thrusters */}
        <mesh position={[0.4, -0.2, 1.25]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh position={[-0.4, -0.2, 1.25]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      </Float>
      
      {/* Front Beam Light */}
      <spotLight position={[0, 0, 1.5]} angle={0.6} penumbra={1} intensity={10} color="#00ffff" castShadow />
    </group>
  );
};

const Track = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const zPos = Math.floor(state.camera.position.z / 20) * 20;
    meshRef.current.position.z = zPos;
  });

  return (
    <group ref={meshRef}>
      {Array.from({ length: 40 }).map((_, i) => (
        <group key={i} position={[0, -1, -i * 20 + 200]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[40, 20]} />
            <meshStandardMaterial color="#050505" wireframe />
          </mesh>
          <mesh position={[20, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[20, 10]} />
            <meshStandardMaterial color="#111" wireframe />
          </mesh>
          <mesh position={[-20, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[20, 10]} />
            <meshStandardMaterial color="#111" wireframe />
          </mesh>
          <mesh position={[19.9, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 20]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <mesh position={[-19.9, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 20]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const VSteer: React.FC<{ handData: HandData[], onScore: (s: number) => void }> = ({ handData, onScore }) => {
  const angle = calculateAngle(handData);

  return (
    <div className="w-full h-full bg-[#000]">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 4, 12]} fov={60} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Vehicle handData={handData} onScore={onScore} />
        <Track />
        
        <fog attach="fog" args={['#000', 5, 60]} />
      </Canvas>

      {/* Visual Steering Wheel Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-12">
        <div className="relative w-full h-full max-w-lg max-h-lg flex items-center justify-center">
          <div 
            className="w-full aspect-square border-4 border-dashed border-orange-500/20 rounded-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className="w-full h-0.5 bg-orange-500/40 relative shadow-[0_0_15px_rgba(234,88,12,0.3)]">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,1)]" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,1)]" />
            </div>
            
            <div className="w-16 h-16 border-2 border-orange-500/40 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
            </div>
          </div>

          <div className="absolute left-0 bottom-0 text-left">
            <div className="text-[10px] font-mono text-cyan-500 opacity-50 uppercase tracking-widest">Navigation</div>
            <div className="text-xl font-bold font-mono text-cyan-500">
              POS: {Math.floor(angle)}°
            </div>
          </div>

          <div className="absolute right-0 bottom-0 text-right">
            <div className="text-[10px] font-mono text-orange-500 opacity-50 uppercase tracking-widest">Reactor</div>
            <div className="text-xl font-bold font-mono text-orange-500">
              STABLE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function calculateAngle(handData: HandData[]) {
  if (handData.length < 2) {
    if (handData.length === 1) {
      const wrist = handData[0].landmarks[0];
      return (wrist.x - 0.5) * 90;
    }
    return 0;
  }
  const left = handData.find(h => h.handedness === 'Right') || handData[0];
  const right = handData.find(h => h.handedness === 'Left') || handData[1];
  
  const h1 = left.landmarks[0];
  const h2 = right.landmarks[0];
  return Math.atan2(h2.y - h1.y, h2.x - h1.x) * (180 / Math.PI);
}
