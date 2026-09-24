import { Vector2 } from 'three';

// Distortion + chromatic aberration + pixel sampling in ONE fullscreen pass.
// Quantize the output UV first: equivalent ordering to lens -> pixel in the original.
export function createLookShader(config) {
  return {
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: new Vector2(1, 1) },
      pixelSize: { value: config.pixelSize },
      distortionAmount: { value: config.distortion },
      chromaAmount: { value: config.chroma },
    },
    vertexShader:
      'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float pixelSize, distortionAmount, chromaAmount;
      varying vec2 vUv;
      float sampleChannel(vec2 uv, vec2 direction, float amount, bool red) {
        float sum = 0.0;
        for (int i = 0; i < 4; i++) {
          vec4 c = texture2D(tDiffuse, clamp(uv + direction * amount * float(i) / 3.0, 0.0, 1.0));
          sum += red ? c.r : c.b;
        }
        return sum * 0.25;
      }
      void main() {
        vec2 cell = pixelSize / resolution;
        vec2 p = cell * floor(vUv / cell) - 0.5;
        float distanceFromCenter = length(p);
        vec2 uv = p * (1.0 + distortionAmount * dot(p, p)) + 0.5;
        float mask = smoothstep(0.2, 0.75, distanceFromCenter);
        float amount = chromaAmount * mask * mask;
        vec2 direction = p / (distanceFromCenter + 0.00001);
        float r = sampleChannel(uv, direction, amount, true);
        float g = texture2D(tDiffuse, clamp(uv, 0.0, 1.0)).g;
        float b = sampleChannel(uv, -direction, amount, false);
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `,
  };
}
