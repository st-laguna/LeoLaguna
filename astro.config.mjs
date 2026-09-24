import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  output: 'static',
  vite: {
    // Builds must not invalidate the running dev server's optimized 3D modules.
    cacheDir: command === 'dev' ? 'node_modules/.vite-dev' : 'node_modules/.vite-build',
    optimizeDeps: { include: [
      'three', 'three/addons/controls/OrbitControls.js',
      'three/addons/loaders/GLTFLoader.js', 'three/addons/loaders/DRACOLoader.js',
      'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js',
      'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/OutputPass.js',
    ] },
    plugins: [tailwindcss()],
  },
}));
