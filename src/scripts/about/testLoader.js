import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Resources } from './sceneUtils.js';

// Development-only inspector. Importing this file never downloads a model.
// Usage in a temporary Astro script: console.table(await inspectModel('/models/simba.glb')).
export async function inspectModel(url) {
  if (!import.meta.env?.DEV)
    throw new Error('inspectModel is only available in development.');
  const draco = new DRACOLoader();
  draco.setWorkerLimit(1);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const resources = new Resources();
  try {
    const gltf = await loader.loadAsync(url);
    resources.track(gltf.scene);
    const meshes = [];
    gltf.scene.traverse((node) => {
      if (!node.isMesh) return;
      const geometry = node.geometry;
      meshes.push({
        name: node.name,
        vertices: geometry.attributes.position?.count || 0,
        triangles:
          (geometry.index?.count ?? geometry.attributes.position?.count ?? 0) /
          3,
        materials: Array.isArray(node.material) ? node.material.length : 1,
        skinned: Boolean(node.isSkinnedMesh),
      });
    });
    return {
      meshes,
      animations: gltf.animations.map((clip) => ({
        name: clip.name,
        seconds: clip.duration,
        tracks: clip.tracks.length,
      })),
    };
  } finally {
    resources.dispose();
    draco.dispose();
  }
}
