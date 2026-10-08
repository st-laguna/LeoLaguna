import { defineConfig } from 'astro/config';
import { readdir, unlink } from 'node:fs/promises';

export default defineConfig({
  output: 'static',
  integrations: [{
    name: 'exclude-illustrator-temporaries',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        // Keep editor recovery files in public; omit them from deployment output.
        const icons = new URL('icons/', dir);
        for (const entry of await readdir(icons, { withFileTypes: true })) {
          if (!entry.isFile() || !/^~ai-.*\.tmp$/i.test(entry.name)) continue;
          await unlink(new URL(encodeURIComponent(entry.name), icons));
          logger.info(`Excluded editor temporary asset: icons/${entry.name}`);
        }
      },
    },
  }],
  build: {
    inlineStylesheets: 'always',
  },
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

