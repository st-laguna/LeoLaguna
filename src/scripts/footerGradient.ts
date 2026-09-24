/**
 * footerGradient.ts
 *
 * Fondo WebGL del footer: 1 canvas, 1 plano, 1 shader.
 * - Tres "pliegues de cristal" superpuestos (campo de distancia + gaussianas),
 *   cada uno con núcleo blanco, halo cyan, borde coral y ecos internos —
 *   nada de ruido/FBM: el movimiento es puramente sinusoidal y muy lento.
 * - Halation/glow procedural en cada borde
 * - Dithering fino para evitar banding en zonas oscuras
 * - Se apaga por completo (deja de renderizar) cuando el footer no está en pantalla
 * - Respeta prefers-reduced-motion (congela el shader en un frame estático)
 *
 * Todos los parámetros ajustables viven en `CONFIG` más abajo.
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Parámetros fáciles de modificar
// ---------------------------------------------------------------------------
export const CONFIG = {
  speed: 1.0, // multiplicador global de tiempo — todo el movimiento ya es lento por diseño en el shader
  halationIntensity: 1.0, // fuerza global del glow de los tres pliegues
  ditherStrength: 1.0, // multiplicador del dithering (1.0 = normal)
  maxDPR: 1.5, // devicePixelRatio máximo permitido (rendimiento)
  colors: {
    base: [0.008, 0.012, 0.02], // negro / navy profundo de fondo
    core: [0.92, 0.95, 1.0], // núcleo blanco-crema de cada pliegue
    cyan: [0.05, 0.4, 0.8], // halo exterior
    coral: [1.0, 0.38, 0.16], // borde interior
    echo1: [0.1, 0.26, 0.42], // eco 1 (grosor del cristal)
    echo2: [0.05, 0.16, 0.3], // eco 2 (más profundo)
    ambient: [0.02, 0.1, 0.2], // resplandor ambiental suave
  },
};

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uHalation;
  uniform float uDither;

  uniform vec3 uBase;
  uniform vec3 uCore;
  uniform vec3 uCyan;
  uniform vec3 uCoral;
  uniform vec3 uEcho1;
  uniform vec3 uEcho2;
  uniform vec3 uAmbient;

  varying vec2 vUv;

  float gaussian(float x, float width) {
    return exp(-(x * x) / (width * width));
  }

  // Ondulación orgánica suave y lenta — solo dos armónicos, sin ruido/FBM.
  float warp(float y, float t, float speed, float phase) {
    return sin(y * 1.1 + t * speed + phase) * 0.5
         + cos(y * 0.5 - t * speed * 0.6 + phase * 1.7) * 0.3;
  }

  // Un pliegue de "cristal": núcleo brillante + halo cyan + borde coral + ecos internos,
  // recortado a negro en el lado opuesto para el look fotográfico.
  vec3 fold(vec2 p, float angle, float centerOffset, float t, float speed, float phase, float weight) {
    float s = sin(angle);
    float c = cos(angle);
    vec2 rp = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

    float d = rp.x - centerOffset + warp(rp.y, t, speed, phase) * 0.4;

    vec3 col = vec3(0.0);
    col += uCyan  * gaussian(d - 0.09, 0.20) * 0.75;
    col += uCore  * gaussian(d, 0.045) * 1.25;
    col += uCoral * gaussian(d + 0.07, 0.075) * 0.85;
    col += uEcho1 * gaussian(d + 0.32, 0.07) * 0.4;
    col += uEcho2 * gaussian(d + 0.5, 0.05) * 0.22;
    col += uAmbient * smoothstep(0.6, -1.6, d) * 0.35;

    float falloff = smoothstep(0.6, -0.1, d - 0.25);
    return col * falloff * weight;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / max(uResolution.y, 1.0);

    float t = uTime;

    vec3 glow = vec3(0.0);
    // Tres pliegues a distinto ángulo, posición, velocidad y peso —
    // dan sensación de varias superficies de cristal superpuestas.
    glow += fold(p, -0.55,  0.35, t, 0.05,  0.0, 1.0);
    glow += fold(p,  0.35, -0.55, t, 0.035, 2.1, 0.7);
    glow += fold(p, -0.15,  1.10, t, 0.07,  4.6, 0.5);

    vec3 color = uBase + glow * uHalation;

    // dithering fino para eliminar banding en zonas oscuras
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    color += (noise - 0.5) / 255.0 * 2.0 * uDither;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

interface FooterGradientHandle {
  dispose: () => void;
}

/**
 * Inicializa el shader en el canvas dado. Devuelve un handle con `dispose()`
 * para limpiar todo (usado en astro:before-swap / desmontaje de página).
 */
export function initFooterGradient(
  canvas: HTMLCanvasElement,
  container: HTMLElement
): FooterGradientHandle {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.maxDPR));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uHalation: { value: CONFIG.halationIntensity },
    uDither: { value: CONFIG.ditherStrength },
    uBase: { value: new THREE.Vector3(...CONFIG.colors.base) },
    uCore: { value: new THREE.Vector3(...CONFIG.colors.core) },
    uCyan: { value: new THREE.Vector3(...CONFIG.colors.cyan) },
    uCoral: { value: new THREE.Vector3(...CONFIG.colors.coral) },
    uEcho1: { value: new THREE.Vector3(...CONFIG.colors.echo1) },
    uEcho2: { value: new THREE.Vector3(...CONFIG.colors.echo2) },
    uAmbient: { value: new THREE.Vector3(...CONFIG.colors.ambient) },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let isVisible = false;
  let rafId: number | null = null;
  const startTime = performance.now();

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    uniforms.uResolution.value.set(width, height);
  }

  function renderStaticFrame() {
    // Frame único, sin animar — para prefers-reduced-motion.
    resize();
    uniforms.uTime.value = 0;
    renderer.render(scene, camera);
  }

  function loop() {
    if (!isVisible) {
      rafId = null;
      return;
    }
    const elapsed = (performance.now() - startTime) / 1000;
    uniforms.uTime.value = elapsed * CONFIG.speed;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (prefersReducedMotion) {
      renderStaticFrame();
      return;
    }
    if (rafId !== null) return;
    resize();
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isVisible = entry.isIntersecting;
        if (isVisible) start();
        else stop();
      }
    },
    { threshold: 0.01 }
  );
  observer.observe(container);

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (prefersReducedMotion) renderStaticFrame();
  });
  resizeObserver.observe(container);

  resize();
  if (prefersReducedMotion) renderStaticFrame();

  function dispose() {
    stop();
    observer.disconnect();
    resizeObserver.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  }

  return { dispose };
}