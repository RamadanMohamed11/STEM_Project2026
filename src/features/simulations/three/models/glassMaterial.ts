import type { MeshPhysicalMaterial } from 'three'

// Keep face-on views clear while retaining glancing reflections. This only changes
// alpha on the existing material; it does not sample/refract the screen behind it.
export const glassEdgeOpacity: MeshPhysicalMaterial['onBeforeCompile'] = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <normal_fragment_begin>',
    `#include <normal_fragment_begin>
    float glassEdge = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
    diffuseColor.a *= 0.16 + 0.84 * pow(glassEdge, 2.0);`,
  )
}
