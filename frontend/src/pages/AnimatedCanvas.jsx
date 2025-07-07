import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";

const AnimatedModel = () => {
  const modelRef = useRef();
  const [animationPlayed, setAnimationPlayed] = useState(false);
  
  // Load the GLB model
  const { scene, animations } = useGLTF("/models/book3.glb");  // ✅ Correct model path
  
  // Load animations
  const { actions } = useAnimations(animations, modelRef);

  useEffect(() => {
    if (actions) {
      // Play animation
      Object.values(actions).forEach((action) => {
        action.play();
      });

      // Set a delay for 3 seconds before restarting animation
      const delay = setTimeout(() => {
        // Reset animation and play it again after 3 seconds
        Object.values(actions).forEach((action) => {
          action.reset().play(); // Reset and play again after delay
        });
        setAnimationPlayed(true);  // Optional: you can track animation play state here
      }, 30000);  // Delay of 3000ms (3 seconds)

      // Clear timeout if the component unmounts
      return () => clearTimeout(delay);
    }
  }, [actions, animationPlayed]);  // Dependency array to restart animation

  return <primitive ref={modelRef} object={scene} scale={1.5} position={[0, -1, 0]} rotation={[0, 30, 0]}/>;
};

const AnimatedCanvas = () => {
  return (
    <Canvas camera={{ position: [50, 3, 3], fov: 4}}>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={5} />
      <AnimatedModel />
      <OrbitControls enableZoom={false} maxPolarAngle={Math.PI} />
    </Canvas>
  );
};

export default AnimatedCanvas;
