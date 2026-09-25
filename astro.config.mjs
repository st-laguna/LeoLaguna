import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  vite: {
    // Builds must not invalidate the running dev server's optimized 3D modules.
    cacheDir: process.argv.includes('build') ? 'node_modules/.vite-build' : 'node_modules/.vite-dev',
    optimizeDeps: { include: [
      'three', 'three/addons/controls/OrbitControls.js',
      'three/addons/loaders/GLTFLoader.js', 'three/addons/loaders/DRACOLoader.js',
      'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js',
      'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/OutputPass.js',
    ] },
  },
});

