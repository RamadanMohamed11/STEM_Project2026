/** Shared flame shader (L6 reaction flames, L7 burners): noise-flickered additive teardrop. */
export const FLAME_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
export const FLAME_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float y = vUv.y;
    float x = (vUv.x - 0.5) * 2.0;
    x += 0.14 * sin(y * 9.0 - uTime * 11.0) * sin(uTime * 5.3 + y * 3.0) * y;
    float width = mix(0.9, 0.02, pow(y, 0.75)) * (1.0 - 0.12 * sin(uTime * 13.0 + y * 8.0));
    float body = 1.0 - smoothstep(width * 0.55, width, abs(x));
    body *= smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.7, 1.0, y));
    float core = (1.0 - smoothstep(0.0, width * 0.5, abs(x))) * (1.0 - smoothstep(0.05, 0.5, y));
    vec3 col = mix(uColor, vec3(1.0, 0.97, 0.86), core * 0.85);
    float a = body * uIntensity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col * a, a);
  }
`
