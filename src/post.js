import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/** Cinematic grade: vignette, chromatic aberration at the edges, film grain, gentle contrast/saturation. */
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    vignette: { value: 0.55 },
    aberration: { value: 0.012 },
    grain: { value: 0.045 },
    saturation: { value: 1.12 },
    contrast: { value: 1.06 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time, vignette, aberration, grain, saturation, contrast;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = vUv - 0.5;
      float r = length(d);
      float ab = aberration * r * r;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + d * ab).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - d * ab).b;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, saturation);
      col = (col - 0.5) * contrast + 0.5;
      float vig = smoothstep(0.95, 0.3, r);
      col *= mix(1.0, vig, vignette);
      float g = (hash(vUv * (1.0 + fract(time * 13.7))) - 0.5) * grain;
      col += g * (0.35 + 0.65 * (1.0 - lum));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function makeGradePass() {
  return new ShaderPass(GradeShader);
}
