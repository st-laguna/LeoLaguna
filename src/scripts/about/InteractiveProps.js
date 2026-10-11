import * as THREE from 'three';

// Desktop-only halo with depth on both sides of Leo, so oblique views stay balanced.
const DESKTOP_FLOATS = {
  laptop:     { position: [-1.38, 1.92,  .38], tilt: [.08, -.14, -.16] },
  book:       { position: [ -.82, 2.22, -1.08], tilt: [-.12, .19, .21] },
  ipad:       { position: [  .42, 2.08, -1.34], tilt: [.16, -.18, -.13] },
  painting:   { position: [ 1.42, 2.00,  -.42], tilt: [-.1, .14, .18] },
  controller: { position: [ 1.22, 1.78,   .88], tilt: [.14, -.24, -.19] },
  luggage:    { position: [  .48, 1.90,  1.34], tilt: [-.08, .17, .14] },
  'dog-bone': { position: [ -.92, 1.84,  1.16], tilt: [.17, -.12, -.23] },
};

export class InteractiveProps {
  constructor({ desktop = false } = {}) {
    this.desktop = desktop;
    this.items = [];
    this.glowMaterials = new Set();
  }

  attach(gltf, { position, id, title, text, image }) {
    const layout = this.desktop ? DESKTOP_FLOATS[id] : null;
    if (layout) position = layout.position;
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
      label: title,
      description: text,
      image,
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
    };
    if (layout) {
      // Stable per-object phases keep the composition casual even on its first frame.
      const index = Object.keys(DESKTOP_FLOATS).indexOf(id);
      item.phase.set(.7 + index * 2.39, 1.6 + index * 1.73, .3 + index * 2.87);
      item.speed.set((index % 2 ? -1 : 1) * (.39 + index * .027), (index % 3 ? 1 : -1) * (.48 - index * .019), (index % 2 ? 1 : -1) * (.34 + index * .023));
      item.amplitude = new THREE.Vector3(.065 + (index % 3) * .012, .055 + (index % 4) * .009, .07 + (index % 2) * .018);
      item.rest = new THREE.Quaternion().setFromEuler(new THREE.Euler(...layout.tilt));
      item.localRotation = new THREE.Euler();
      item.localQuaternion = new THREE.Quaternion();
      motion.quaternion.copy(item.rest);
    }
    this.items.push(item);
    if (layout) this.update(0);
    return item;
  }

  update(time) {
    for (const item of this.items) {
      const { root, base, phase, speed } = item;
      if (item.rest) {
        const { amplitude, rest, localRotation, localQuaternion } = item;
        root.position.set(
          base.x + Math.sin(time * speed.x + phase.x) * amplitude.x,
          base.y + Math.sin(time * speed.y + phase.y) * amplitude.y,
          base.z + Math.cos(time * speed.z + phase.z) * amplitude.z,
        );
        // Bounded local-axis rocking around the centered prop, never a 360-degree spin.
        localRotation.set(
          Math.sin(time * speed.z * 1.13 + phase.y) * .10,
          Math.sin(time * speed.x * .91 + phase.z) * .14,
          Math.cos(time * speed.y * 1.07 + phase.x) * .085,
        );
        root.quaternion.copy(rest).multiply(localQuaternion.setFromEuler(localRotation));
        continue;
      }
      root.position.set(
        base.x + Math.sin(time * speed.x + phase.x) * 0.08,
        base.y + (Math.sin(time * speed.y + phase.y) + 1) * 0.08,
        base.z + Math.cos(time * speed.z + phase.z) * 0.08,
      );
      root.rotation.x = Math.sin(time * speed.x + phase.x) * .035;
      root.rotation.y = Math.sin(time * speed.y + phase.y) * .045;
      root.rotation.z = Math.sin(time * speed.z + phase.z) * .035;
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
