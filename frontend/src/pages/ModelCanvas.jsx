import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AnimatedModel from "./AnimatedModel";

const ModelCanvas = () => {
  return (
    <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      {/* Load your animated model */}
      <AnimatedModel modelPath="/models/model.glb" scale={1} />

      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

export default ModelCanvas;
