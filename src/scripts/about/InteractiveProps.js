import * as THREE from 'three';

export class InteractiveProps {
  constructor() {
    this.items = [];
    this.glowMaterials = new Set();
  }

  attach(gltf, { position, id, label, description }) {
    const motion = new THREE.Group();
    const entrance = new THREE.Group();
    entrance.add(gltf.scene);
    motion.add(entrance);
    motion.position.fromArray(position);
    const meshes = [];
    gltf.scene.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = node.receiveShadow = true;
      meshes.push(node);
      if (!/screen|pantalla|display|monitor/i.test(node.name)) return;
      const brighten = (source) => {
        const material = source.clone();
        if (material.emissive) {
          material.emissive.set(0x8fd6ff);
          material.emissiveMap = material.map;
          material.emissiveIntensity = 0.6;
          this.glowMaterials.add(material);
        }
        return material;
      };
      node.material = Array.isArray(node.material)
        ? node.material.map(brighten)
        : brighten(node.material);
    });
    const item = {
      id,
      label,
      description,
      root: motion,
      entrance,
      model: gltf.scene,
      meshes,
      base: new THREE.Vector3().fromArray(position),
      phase: new THREE.Vector3(
        Math.random(),
        Math.random(),
        Math.random(),
      ).multiplyScalar(Math.PI * 2),
      speed: new THREE.Vector3(
        0.15 + Math.random() * 0.2,
        0.1 + Math.random() * 0.15,
        0.15 + Math.random() * 0.2,
      ),
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.24,
        (Math.random() - 0.5) * 0.36,
        (Math.random() - 0.5) * 0.24,
      ),
    };
    this.items.push(item);
    return item;
  }

  update(time, delta) {
    for (const { root, base, phase, speed, spin } of this.items) {
      root.position.set(
        base.x + Math.sin(time * speed.x + phase.x) * 0.3,
        base.y + (Math.sin(time * speed.y + phase.y) + 1) * 0.3,
        base.z + Math.cos(time * speed.z + phase.z) * 0.3,
      );
      root.rotation.x += spin.x * delta;
      root.rotation.y += spin.y * delta;
      root.rotation.z += spin.z * delta;
    }
    for (const material of this.glowMaterials) {
      material.emissiveIntensity = 0.5 + Math.sin(time * 1.2) * 0.15;
    }
  }

  dispose() {
    this.items.length = 0;
    this.glowMaterials.clear();
  }
}
