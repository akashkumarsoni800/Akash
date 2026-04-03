import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';

const AvatarModel = () => {
  // Using a verified public ReadyPlayerMe developer model
  const { scene, animations } = useGLTF('https://models.readyplayer.me/64db55075608d0e53a35e468.glb');
  const { actions } = useAnimations(animations, scene);

  React.useEffect(() => {
    // Basic idle animation if available, otherwise just render
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.keys(actions)[0];
      actions[firstAction]?.play();
    }
  }, [actions]);

  return <primitive object={scene} scale={2} position={[0, -2, 0]} rotation={[0, -0.4, 0]} />;
};

const Character = () => {
  return (
    <div className="w-full h-[400px] md:h-[600px] relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={35} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          <AvatarModel />
          <ContactShadows 
            position={[0, -2, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4.5} 
          />
        </Suspense>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] -z-10 pointer-events-none" />
    </div>
  );
};

export default Character;
