import * as THREE from 'three';

export function damping(alphaAt60, delta) {
  return 1 - Math.pow(1 - alphaAt60, Math.max(0, delta) * 60);
}

export function findBone(root, name) {
  let exact = null;
  let partial = null;
  root.traverse((node) => {
    if (!node.isBone) return;
    const key = node.name.toLowerCase();
    if (key === name.toLowerCase()) exact = node;
    else if (!partial && key.includes(name.toLowerCase())) partial = node;
  });
  return exact || partial || root;
}

export function toonMaterials(root) {
  const replacements = new Map();
  function convert(source) {
    if (!source) return new THREE.MeshToonMaterial();
    if (!replacements.has(source))
      replacements.set(
        source,
        new THREE.MeshToonMaterial({
          map: source.map || null,
          color: source.color || 0xffffff,
          transparent: source.transparent,
          opacity: source.opacity,
          alphaTest: source.alphaTest,
          alphaMap: source.alphaMap,
          side: source.side,
          vertexColors: source.vertexColors,
          depthWrite: source.depthWrite,
        }),
      );
    return replacements.get(source);
  }
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = node.receiveShadow = true;
    node.material = Array.isArray(node.material)
      ? node.material.map(convert)
      : convert(node.material);
  });
}

// Track original and replacement materials; release shared resources only once.
export class Resources {
  constructor() {
    this.items = new Set();
    this.bitmaps = new Set();
  }
  track(root) {
    root.traverse((node) => {
      if (node.geometry) this.items.add(node.geometry);
      if (node.skeleton) this.items.add(node.skeleton);
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        if (!material) continue;
        this.items.add(material);
        for (const value of Object.values(material)) {
          if (!value?.isTexture) continue;
          this.items.add(value);
          if (typeof value.image?.close === 'function')
            this.bitmaps.add(value.image);
        }
      }
    });
    return root;
  }
  dispose() {
    for (const item of this.items) item.dispose();
    for (const bitmap of this.bitmaps) bitmap.close();
    this.items.clear();
    this.bitmaps.clear();
  }
}

export function disposeLateModel(root) {
  const resources = new Resources();
  resources.track(root);
  resources.dispose();
}

export async function runPool(
  tasks,
  concurrency = 3,
  shouldStop = () => false,
) {
  let next = 0;
  async function worker() {
    while (next < tasks.length && !shouldStop()) await tasks[next++]();
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, worker),
  );
}
