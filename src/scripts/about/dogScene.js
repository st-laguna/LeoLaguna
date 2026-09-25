import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Dog } from './Dog.js';
import { Leo } from './Leo.js';
import { InteractiveProps } from './InteractiveProps.js';
import { SCENE, PROPS } from './sceneConfig.js';
import { createLookShader } from './sceneShaders.js';
import {
  damping,
  findBone,
  Resources,
  disposeLateModel,
  runPool,
} from './sceneUtils.js';

// No DOM side effects at module scope: each mount owns its resources and listeners.
export function createAboutScene(section, callbacks = {}) {
  const container = section.querySelector('[data-scene]');
  if (!container) throw new Error('Missing scene container');
  const abort = new AbortController();
  const resources = new Resources();
  const scene = new THREE.Scene();
  const mobilePortrait = matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)');
  const isMobilePortrait = mobilePortrait.matches;
  scene.background = new THREE.Color(document.documentElement.dataset.theme === 'dark' ? '#181818' : SCENE.background);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 150);
  camera.position.fromArray(SCENE.camera);
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'default',
  });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true'); // Equivalent HTML controls are adjacent.
  container.append(canvas);

  const controls = new OrbitControls(camera, canvas);
  controls.target.fromArray(SCENE.target);
  controls.enablePan = false;
  controls.minDistance = 0.8;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotateSpeed = 0.2;
  // Keep vertical page scrolling on touch devices; drag to orbit remains desktop-only.
  const coarse = matchMedia('(pointer: coarse)');
  const configureInput = () => {
    controls.enableRotate = !coarse.matches;
    controls.enableZoom = !coarse.matches;
    canvas.style.touchAction = coarse.matches ? 'pan-y' : 'none';
  };
  configureInput();
  coarse.addEventListener('change', configureInput, { signal: abort.signal });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xa0a0a0, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 15, 10);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {
    left: -10,
    right: 10,
    top: 10,
    bottom: -10,
  });
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.ShadowMaterial({ opacity: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  resources.track(floor);

  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
  });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  const lookPass = new ShaderPass(createLookShader(SCENE));
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(lookPass);
  composer.addPass(outputPass);

  const draco = new DRACOLoader();
  draco.setDecoderPath(SCENE.dracoPath || '/about/draco/');
  draco.setWorkerLimit(2);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const simba = new Dog('Simba', {
    canRest: true,
    baseSpeed: 1.8,
    runProbability: 0.1,
    turnSpeed: 1.5,
  });
  const morena = new Dog('Morena', {
    canRest: true,
    baseSpeed: 4,
    runProbability: 0.9,
    turnSpeed: 3.5,
  });
  const leo = new Leo();
  const props = new InteractiveProps();
  const actors = [simba, morena, leo];
  const entries = new Map();
  const meshEntries = new WeakMap();
  const meshes = [];
  const entrances = [];
  const tweens = new Set();
  const decorations = { gem: null, simba: null, morena: null, leo: null };

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const hits = [];
  const world = new THREE.Vector3();
  const cameraGoal = new THREE.Vector3();
  const movement = new THREE.Vector3();
  const push = new THREE.Vector3();
  const projection = new THREE.Vector3();
  const gemScale = new THREE.Vector3();
  const defaultTarget = new THREE.Vector3().fromArray(SCENE.target);
  const defaultCamera = new THREE.Vector3().fromArray(SCENE.overview);
  const tooltip = section.querySelector('[data-tooltip]');
  let width = 1,
    height = 1,
    rect = null;
  let renderScale = SCENE.renderScale;
  let maxScale = SCENE.renderScale;
  let disposed = false,
    visible = true,
    lost = false,
    leaving = false;
  let paused = false,
    reduced = false,
    allSettled = false;
  let active = null,
    hovered = null,
    transition = null;
  let pointerInside = false,
    pointerDirty = false,
    pointerDown = null;
  let raf = 0,
    previous = 0,
    lastRendered = 0,
    time = 0,
    lastHover = 0;
  let sampledTime = 0,
    sampledFrames = 0,
    fastWindows = 0;
  let loaded = 0,
    failed = 0;
  const total = isMobilePortrait ? 3 : 3 + PROPS.length + 4;
  const on = (target, event, listener, options = {}) =>
    target.addEventListener(event, listener, {
      ...options,
      signal: abort.signal,
    });
  const canRender = () => !disposed && !lost && visible && !document.hidden;
  const ambient = () =>
    !paused && !reduced && !leaving && !(allSettled && entries.size === 0);

  function requestRender() {
    if (canRender() && !raf) raf = requestAnimationFrame(frame);
  }
  function animateValue(object, vars) {
    let animation;
    const duration = reduced ? 0 : (vars.duration ?? 0.8);
    if (!duration) {
      const { onComplete, duration: ignored, delay, ease, ...values } = vars;
      gsap.set(object, values);
      onComplete?.();
      requestRender();
      return null;
    }
    animation = gsap.to(object, {
      ...vars,
      duration,
      paused: !canRender(),
      overwrite: true,
      onUpdate: requestRender,
      onComplete: () => {
        tweens.delete(animation);
        vars.onComplete?.();
        requestRender();
      },
      onInterrupt: () => tweens.delete(animation),
    });
    tweens.add(animation);
    requestRender();
    return animation;
  }
  function register(entry) {
    entries.set(entry.id, entry);
    for (const mesh of entry.meshes) {
      meshes.push(mesh);
      meshEntries.set(mesh, entry);
    }
    entrances.push(entry.entrance);
    entry.entrance.scale.setScalar(reduced ? 1 : 0.001);
    // Separate wrapper: never fight GLB animation tracks or authored model scale.
    if (!reduced && !leaving)
      animateValue(entry.entrance.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.85,
        delay: Math.min(0.3, entries.size * 0.045),
        ease: 'back.out(1.25)',
      });
    callbacks.onItem?.({ id: entry.id, label: entry.label });
  }

  function resize() {
    if (disposed) return;
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    rect = null;
    maxScale = width < 700 ? SCENE.mobileRenderScale : SCENE.renderScale;
    renderScale = Math.min(renderScale, maxScale);
    const scale = Math.min(
      renderScale,
      Math.sqrt(SCENE.maxRenderPixels / (width * height)),
    );
    renderer.setSize(
      Math.max(1, Math.round(width * scale)),
      Math.max(1, Math.round(height * scale)),
      false,
    );
    composer.setSize(
      Math.max(1, Math.round(width * scale)),
      Math.max(1, Math.round(height * scale)),
    );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // CSS-pixel size: lowering internal resolution does not enlarge the intended pixel blocks.
    lookPass.uniforms.resolution.value.set(width, height);
    requestRender();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  on(
    window,
    'scroll',
    () => {
      rect = null;
      if (isMobilePortrait) requestRender();
    },
    { passive: true, capture: true },
  );
  resize();

  function setPointer(event) {
    rect ||= canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    pointerDirty = true;
  }
  function pick() {
    // Match the distortion used by the fragment shader before raycasting.
    const px = pointer.x * 0.5,
      py = pointer.y * 0.5;
    const warp = 1 + SCENE.distortion * (px * px + py * py);
    projection.set(pointer.x * warp, pointer.y * warp, 0);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(projection, camera);
    hits.length = 0;
    raycaster.intersectObjects(meshes, false, hits);
    return hits.length ? meshEntries.get(hits[0].object) : null;
  }
  on(canvas, 'pointermove', (event) => {
    pointerInside = event.pointerType !== 'touch';
    if (
      pointerDown &&
      Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) >
        7
    )
      pointerDown.dragged = true;
    setPointer(event);
    requestRender();
  });
  on(canvas, 'pointerleave', () => {
    pointerInside = false;
    hovered = null;
    canvas.style.cursor = '';
    requestRender();
  });
  on(canvas, 'pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerDown = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      dragged: false,
    };
    setPointer(event);
  });
  on(canvas, 'pointerup', (event) => {
    if (!pointerDown || pointerDown.id !== event.pointerId) return;
    const tap =
      !pointerDown.dragged &&
      Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) <
        7;
    pointerDown = null;
    if (!tap || leaving || isMobilePortrait) return;
    setPointer(event);
    scene.updateMatrixWorld(true);
    const entry = pick();
    if (entry) focus(entry.id);
  });
  on(canvas, 'pointercancel', () => {
    pointerDown = null;
  });
  on(window, 'pointerup', () => {
    pointerDown = null;
  });

  function emitSelection() {
    callbacks.onFocus?.(
      active
        ? {
            id: active.id,
            label: active.label,
            description: active.description,
          }
        : null,
    );
    section.dispatchEvent(
      new CustomEvent('scene:zoom', {
        bubbles: true,
        detail: { zoomed: Boolean(active) },
      }),
    );
  }
  function focus(id) {
    const entry = entries.get(id);
    if (!entry || leaving || disposed || active === entry) return;
    if (transition) {
      transition.tween?.kill();
      transition = null;
    }
    active = entry;
    hovered = null;
    entry.track.updateWorldMatrix(true, false);
    entry.track.getWorldPosition(world);
    const from = camera.position.clone();
    const fromTarget = controls.target.clone();
    const offset = new THREE.Vector3().subVectors(
      camera.position,
      controls.target,
    );
    if (offset.lengthSq() < 0.01) offset.set(1, 0.6, 1);
    offset.normalize().multiplyScalar(entry.kind === 'character' ? 2.2 : 2.6);
    offset.y = Math.max(0.65, offset.y);
    controls.autoRotate = false;
    controls.enabled = false;
    const travel = {
      progress: reduced ? 1 : 0,
      from,
      fromTarget,
      offset,
      returning: false,
    };
    transition = travel;
    emitSelection();
    travel.tween = animateValue(travel, {
      progress: 1,
      duration: 0.9,
      ease: 'power3.inOut',
      onComplete: () => {
        travel.finished = true;
        requestRender();
      },
    });
    if (entry.id === 'leo') leo.skipWait();
    requestRender();
  }
  function reset() {
    if (disposed || leaving) return;
    transition?.tween?.kill();
    active = null;
    hovered = null;
    controls.enabled = false;
    const travel = {
      progress: reduced ? 1 : 0,
      from: camera.position.clone(),
      fromTarget: controls.target.clone(),
      returning: true,
    };
    transition = travel;
    emitSelection();
    travel.tween = animateValue(travel, {
      progress: 1,
      duration: 0.9,
      ease: 'power3.inOut',
      onComplete: () => {
        travel.finished = true;
        requestRender();
      },
    });
    requestRender();
  }

  function updateCamera(delta) {
    if (isMobilePortrait && allSettled) {
      const shell=section.querySelector('.about__scene-shell');
      const bounds=shell.getBoundingClientRect();
      const travel=Math.max(1,shell.offsetHeight-innerHeight);
      const progress=Math.max(0,Math.min(1,-bounds.top/travel));
      const ids=['leo','simba','morena'];
      const scaled=Math.min(2.999,progress*3);
      const index=Math.floor(scaled);
      const local=scaled-index;
      const selected=entries.get(ids[index]);
      const next=index<2?entries.get(ids[index+1]):null;
      const rawBlend=Math.max(0,Math.min(1,(local-.82)/.18));
      const blend=rawBlend*rawBlend*(3-2*rawBlend);
      for(const id of ids){
        const entry=entries.get(id);if(!entry)continue;
        entry.entrance.visible=id===ids[index]||(next&&id===ids[index+1]&&blend>.001);
      }
      if(selected)selected.entrance.scale.setScalar(1-blend*.18);
      if(next)next.entrance.scale.setScalar(blend);
      if(selected){
        selected.track.updateWorldMatrix(true,false);
        selected.track.getWorldPosition(world);
        const theta=Math.PI/2+local*Math.PI;
        const radius=selected.id==='leo'?1.65:1.35;
        camera.position.set(world.x+Math.sin(theta)*radius,world.y+(selected.id === 'leo' ? .22 : .12),world.z+Math.cos(theta)*radius);
        controls.target.copy(world);camera.lookAt(world);
      }
      controls.enabled=false;controls.autoRotate=false;
      return;
    }
    if (transition) {
      const travel = transition;
      if (travel.returning) {
        world.copy(defaultTarget);
        cameraGoal.copy(defaultCamera);
      } else {
        active.track.getWorldPosition(world);
        cameraGoal.copy(world).add(travel.offset);
      }
      camera.position.lerpVectors(travel.from, cameraGoal, travel.progress);
      controls.target.lerpVectors(travel.fromTarget, world, travel.progress);
      if (travel.finished || reduced) {
        transition = null;
        controls.enabled = !leaving;
      }
    } else if (active) {
      active.track.getWorldPosition(world);
      movement
        .subVectors(world, controls.target)
        .multiplyScalar(damping(0.1, delta));
      controls.target.add(movement);
      camera.position.add(movement);
    }
    controls.autoRotate = ambient() && !active && !transition;
    controls.enableDamping = ambient();
    controls.update(delta);
  }

  function updateDecorations(delta) {
    const head = active?.head || hovered?.head;
    if (decorations.gem) {
      const gem = decorations.gem;
      const size = head && !leaving ? 0.25 : 0;
      gemScale.setScalar(size);
      if (reduced || paused) gem.scale.copy(gemScale);
      else gem.scale.lerp(gemScale, damping(0.15, delta));
      gem.visible = gem.scale.x > 0.002;
      if (head) {
        head.getWorldPosition(world);
        world.y += 0.25 + (ambient() ? Math.sin(time * 3) * 0.03 : 0);
        if (reduced || paused) gem.position.copy(world);
        else gem.position.lerp(world, damping(0.2, delta));
        if (ambient()) gem.rotation.y += 2 * delta;
      }
    }
    for (const id of ['simba', 'morena', 'leo']) {
      const halo = decorations[id];
      if (!halo) continue;
      halo.visible = active?.id === id && !leaving;
      if (!halo.visible) continue;
      active.head.getWorldPosition(world);
      world.y += 0.04;
      halo.position.copy(world);
      if (ambient()) {
        halo.rotation.y -= 0.5 * delta;
        halo.rotation.x = Math.sin(time * 2) * 0.1;
        halo.rotation.z = Math.cos(time * 2) * 0.1;
      }
    }
  }
  function updateTooltip() {
    if (!tooltip || !active) return;
    active.track.getWorldPosition(world);
    projection.copy(world).project(camera);
    // Invert the radial distortion so the tooltip follows the visible, warped image.
    const qx = projection.x * 0.5,
      qy = projection.y * 0.5;
    let px = qx,
      py = qy;
    for (let i = 0; i < 5; i++) {
      const factor = 1 + SCENE.distortion * (px * px + py * py);
      px = qx / factor;
      py = qy / factor;
    }
    const x = THREE.MathUtils.clamp(
      (px + 0.5) * width,
      Math.min(120, width / 2),
      Math.max(width - 120, width / 2),
    );
    const y = THREE.MathUtils.clamp(
      (-py + 0.5) * height,
      145,
      Math.max(145, height - 50),
    );
    tooltip.style.setProperty('--tip-x', x + 'px');
    tooltip.style.setProperty('--tip-y', y + 'px');
    tooltip.dataset.offscreen = String(projection.z < -1 || projection.z > 1);
  }
  function collisions(delta) {
    if (!simba.model || !morena.model) return;
    push.subVectors(simba.model.position, morena.model.position);
    push.y = 0;
    const distance = push.length();
    if (distance >= 1.5) return;
    if (distance < 0.0001) push.set(1, 0, 0);
    else push.divideScalar(distance);
    const strength = (1.5 - distance) * Math.min(0.5, 3 * delta);
    simba.model.position.addScaledVector(push, strength);
    morena.model.position.addScaledVector(push, -strength);
  }
  function qualitySample(interval) {
    if (!ambient() || !allSettled || interval > 0.2) return;
    sampledTime += interval;
    sampledFrames++;
    if (sampledTime < 4) return;
    const average = sampledTime / sampledFrames;
    if (average > 0.026 && renderScale > SCENE.minRenderScale) {
      renderScale = Math.max(SCENE.minRenderScale, renderScale - 0.1);
      fastWindows = 0;
      resize();
    } else if (average < 0.019 && renderScale < maxScale) {
      if (++fastWindows >= 3) {
        renderScale = Math.min(maxScale, renderScale + 0.05);
        fastWindows = 0;
        resize();
      }
    } else fastWindows = 0;
    sampledTime = sampledFrames = 0;
  }
  function frame(now) {
    raf = 0;
    if (!canRender()) return;
    const interval = previous ? (now - previous) / 1000 : 1 / 60;
    if (lastRendered && now - lastRendered < 1000 / SCENE.maxFPS - 0.5) {
      requestRender();
      return;
    }
    const frameInterval = 1000 / SCENE.maxFPS;
    lastRendered = lastRendered
      ? now - ((now - lastRendered) % frameInterval)
      : now;
    previous = now;
    const delta = Math.min(interval, 0.05);
    if (ambient()) {
      time += delta;
      for (const actor of actors) actor.update(delta);
      if(!isMobilePortrait){props.update(time, delta);collisions(delta);}
    }
    scene.updateMatrixWorld(true);
    updateCamera(delta);
    if (
      pointerInside &&
      (pointerDirty || now - lastHover > 1000 / SCENE.hoverFPS)
    ) {
      hovered = pick();
      canvas.style.cursor = hovered ? 'pointer' : 'grab';
      pointerDirty = false;
      lastHover = now;
    }
    updateDecorations(delta);
    updateTooltip();
    composer.render();
    qualitySample(interval);
    if (ambient() || tweens.size || transition) requestRender();
  }
  controls.addEventListener('change', requestRender);
  on(window, 'leo:theme-change', () => {
    scene.background.set(document.documentElement.dataset.theme === 'dark' ? '#181818' : SCENE.background);
    requestRender();
  });

  function syncVisibility() {
    cancelAnimationFrame(raf);
    raf = 0;
    previous = lastRendered = 0;
    sampledTime = sampledFrames = 0;
    for (const animation of tweens) animation.paused(!canRender());
    requestRender();
  }
  on(document, 'visibilitychange', syncVisibility);
  on(canvas, 'webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    syncVisibility();
    callbacks.onError?.('The 3D view was interrupted. Reload to try again.');
  });
  on(canvas, 'webglcontextrestored', () => {
    lost = false;
    callbacks.onStatus?.('3D view restored.');
    syncVisibility();
  });

  async function asset(url, accept) {
    try {
      const gltf = await loader.loadAsync(url);
      if (disposed) {
        disposeLateModel(gltf.scene);
        return;
      }
      resources.track(gltf.scene);
      await accept(gltf);
      if (disposed) return;
      resources.track(gltf.scene);
      loaded++;
    } catch (error) {
      if (disposed) return;
      failed++;
      if (import.meta.env?.DEV)
        console.warn('[About] Could not load ' + url, error);
    } finally {
      if (!disposed)
        callbacks.onProgress?.({ completed: loaded + failed, total, failed });
      requestRender();
    }
  }
  async function load() {
    const base = import.meta.env?.BASE_URL || '/';
    const modelURL = (id) => base + 'about/models/' + id + '.glb';
    await runPool(
      [
        ['simba', simba, 'Simba', 'My quieter companion.'],
        ['morena', morena, 'Morena', 'Always on the move.'],
        ['leo', leo, 'Leo', 'Marine biologist. Visual communicator.'],
      ].map(
        ([id, actor, label, description]) =>
          () =>
            asset(modelURL(id), async (gltf) => {
              const model = actor.attach(gltf);
              if(isMobilePortrait)actor.usePortraitIdle();
              // Compile the final material/shadow setup before the entrance starts.
              await renderer.compileAsync(model, camera, scene);
              if (disposed) return;
              const entrance = new THREE.Group();
              entrance.add(model);
              scene.add(entrance);
              const head = findBone(model, 'head');
              register({
                id,
                kind: 'character',
                root: model,
                entrance,
                head,
                track: id === 'leo' ? findBone(model, 'spine1') : head,
                meshes: actor.meshes,
                label,
                description,
              });
            }),
      ),
      3,
      () => disposed,
    );
    if(!isMobilePortrait) await runPool(
      PROPS.map(
        (config) => () =>
          asset(modelURL(config.id), async (gltf) => {
            const entry = props.attach(gltf, config);
            resources.track(entry.root);
            await renderer.compileAsync(entry.root, camera, scene);
            if (disposed) return;
            scene.add(entry.root);
            register({ ...entry, kind: 'prop', track: entry.root, head: null });
          }),
      ),
      2,
      () => disposed,
    );
    if(!isMobilePortrait) await runPool(
      [
        ['gem', 'gem'],
        ['halosimba', 'simba'],
        ['halomorena', 'morena'],
        ['haloleo', 'leo'],
      ].map(
        ([file, id]) =>
          () =>
            asset(modelURL(file), async (gltf) => {
              await renderer.compileAsync(gltf.scene, camera, scene);
              if (disposed) return;
              decorations[id] = gltf.scene;
              gltf.scene.scale.setScalar(id === 'gem' ? 0 : 0.2);
              gltf.scene.visible = false;
              scene.add(gltf.scene);
            }),
      ),
      2,
      () => disposed,
    );
    if (disposed) return;
    allSettled = true;
    callbacks.onReady?.({ loaded, failed, interactive: entries.size });
    requestRender();
  }

  function setPaused(value) {
    paused = value;
    previous = 0;
    requestRender();
  }
  function setReducedMotion(value) {
    reduced = value;
    if (value) for (const animation of [...tweens]) animation.progress(1);
    requestRender();
  }
  function setVisible(value) {
    visible = value;
    syncVisibility();
  }
  function leave() {
    if (disposed || leaving) return;
    leaving = true;
    transition?.tween?.kill();
    transition = null;
    controls.enabled = false;
    hovered = null;
    pointerInside = false;
    for (const animation of [...tweens]) animation.kill();
    for (const entrance of entrances)
      animateValue(entrance.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        duration: 0.36,
        ease: 'power2.in',
      });
    requestRender();
  }
  function resume() {
    leaving = false;
    controls.enabled = true;
    for (const entrance of entrances)
      animateValue(entrance.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: 'power2.out',
      });
    syncVisibility();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    resizeObserver.disconnect();
    cancelAnimationFrame(raf);
    for (const animation of [...tweens]) animation.kill();
    tweens.clear();
    controls.removeEventListener('change', requestRender);
    controls.dispose();
    for (const actor of actors) actor.dispose();
    props.dispose();
    sun.shadow.dispose();
    resources.dispose();
    renderPass.dispose();
    lookPass.dispose();
    outputPass.dispose();
    composer.dispose();
    draco.dispose();
    renderer.dispose();
    canvas.remove();
    meshes.length = entrances.length = 0;
    entries.clear();
    scene.clear();
  }
  requestRender();
  return {
    load,
    focus,
    reset,
    setPaused,
    setReducedMotion,
    setVisible,
    leave,
    resume,
    dispose,
  };
}
