/**
 * Studio-style laboratory lighting with a neutral white balance.
 *
 * One shadow-casting key light is sufficient for readable vessel silhouettes;
 * the low-intensity fill and rim are shadow-free to avoid expensive extra maps.
 * Glass and translucent liquids remain legible without a blown-out point light.
 */
export function LaboratoryLighting() {
  return (
    <>
      <ambientLight color="#e8f0f0" intensity={0.22} />
      <hemisphereLight args={['#ecf6f8', '#91a2a4', 0.75]} />

      {/* Soft warm-neutral key: enough contrast for the tools and worktop. */}
      <directionalLight
        position={[-3.8, 7.2, 5]}
        color="#fff5eb"
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4.6}
        shadow-camera-bottom={-4.6}
        shadow-camera-near={0.5}
        shadow-camera-far={19}
        shadow-bias={-0.00016}
        shadow-normalBias={0.018}
        shadow-radius={3}
      />

      {/* Cool daylight fill prevents black undercuts without flattening glass. */}
      <directionalLight position={[4.2, 3.8, -2.6]} color="#d8ebf3" intensity={0.8} />

      {/* Controlled rear edge separation, not a high-energy specular hotspot. */}
      <directionalLight position={[1.2, 4.4, -4.3]} color="#eff9fb" intensity={0.45} />
    </>
  )
}
