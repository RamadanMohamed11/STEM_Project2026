import { Environment, Lightformer } from '@react-three/drei'

/** One shadow map and a static, locally generated softbox reflection environment. */
export function LaboratoryLighting() {
  return (
    <>
      <ambientLight color="#f1f0e7" intensity={0.12} />
      <hemisphereLight args={['#eef2ee', '#82918a', 0.45]} />
      <directionalLight
        position={[-3.8, 7.2, 5]}
        color="#fff7ea"
        intensity={2.25}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4.6}
        shadow-camera-right={4.6}
        shadow-camera-top={4.2}
        shadow-camera-bottom={-4.2}
        shadow-camera-near={0.5}
        shadow-camera-far={19}
        shadow-bias={-0.00012}
        shadow-normalBias={0.003}
        shadow-radius={3}
      />
      <directionalLight position={[4.2, 3.8, -2.6]} color="#e4eef1" intensity={0.55} />

      {/* No HDRI download or per-frame capture. Broad panels give glass and steel
          coherent reflections without screen-space refraction or postprocessing. */}
      <Environment resolution={128} frames={1} environmentIntensity={0.65}>
        <color attach="background" args={['#59645e']} />
        <Lightformer
          form="rect"
          position={[-2.8, 4.8, 1.5]}
          rotation={[Math.PI / 2, 0, 0.25]}
          scale={[3.5, 1.8, 1]}
          intensity={2.5}
          color="#fff8ec"
        />
        <Lightformer
          form="rect"
          position={[4, 2.2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1.3, 3, 1]}
          intensity={1.8}
          color="#edf3f1"
        />
        <Lightformer
          form="rect"
          position={[-3.5, 2, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[0.7, 2.7, 1]}
          intensity={1.2}
          color="#f5f5e9"
        />
        <Lightformer
          form="rect"
          position={[0, 2.8, -4]}
          scale={[4, 0.8, 1]}
          intensity={1.5}
          color="#e5eeeb"
        />
      </Environment>
    </>
  )
}
