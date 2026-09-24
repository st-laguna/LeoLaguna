import * as THREE from 'three';
import { toonMaterials } from './sceneUtils.js';

export class Leo {
  constructor() {
    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.portraitMode = false;

    // Mallas de Leo, para el raycast del click
    this.meshes = [];

    // Máquina de estados: getting_up -> waiting -> gesturing
    this.state = 'getting_up';
    this.stateTimer = 0;
    this.hasGreeted = false;
    this.gestureIndex = 0;
    this._finished = (event) => this.onActionFinished(event);

    this.GESTURES = [
      'aburrido',
      'acknowledging',
      'alrededores',
      'angry_gesture',
      'annoyed_head_shake',
      'Arm_Stretching',
      'being_cocky',
      'dismissing_gesture',
      'happy_hand_gesture',
      'hard_head_nod',
      'head_nod_yes',
      'lengthy_head_nod',
      'look_away_gesture',
      'mirando',
      'moscas',
      'relieved_sigh',
      'sarcastic_head_nod',
      'shaking_head_no',
      'thoughtful_head_shake',
      'weight_shift',
    ];
  }

  attach(gltf) {
    this.model = gltf.scene;
    this.model.position.set(0, 0, 0);
    toonMaterials(this.model);
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        this.meshes.push(child);
      }
    });

    this.mixer = new THREE.AnimationMixer(this.model);

    gltf.animations.forEach((clip) => {
      this.actions[clip.name] = this.mixer.clipAction(clip);
    });

    this.GESTURES = this.GESTURES.filter((name) => this.actions[name]);
    this.mixer.addEventListener('finished', this._finished);

    // --- Fix bug "bind-pose falling"
    const standAction = this.actions['stand'];
    if (standAction) {
      standAction.reset();
      standAction.setLoop(THREE.LoopOnce, 1);
      standAction.clampWhenFinished = true;
      standAction.setEffectiveWeight(1);
      standAction.play();
      this.currentAction = standAction;
    } else {
      this.startState('waiting');
    }

    this.mixer.update(0);
    return this.model;
  }

  // Transiciones cortas sin deformar la velocidad de los clips.
  playAction(
    name,
    { duration = 0.2, loop = true, clampWhenFinished = false } = {},
  ) {
    const next = this.actions[name];
    if (!next) {
      return false;
    }
    if (this.currentAction === next && next.isRunning()) return true;

    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = clampWhenFinished;
    next.play();

    if (this.currentAction) {
      this.currentAction.crossFadeTo(next, duration, false);
    }

    this.currentAction = next;
    return true;
  }

  startState(state) {
    if (state === 'waiting') {
      this.state = 'waiting';

      // El GLB original utiliza 'iddle' con doble d.
      this.playAction(this.actions.iddle ? 'iddle' : 'idle', {
        duration: 0.3,
        loop: true,
      });

      // Después de saludar por primera vez, espera entre 4 y 9 segundos
      this.stateTimer = this.hasGreeted ? 4 + Math.random() * 5 : 0.3;
      return;
    }

    if (state === 'gesturing') {
      if (!this.GESTURES.length && (this.hasGreeted || !this.actions.hi)) {
        this.hasGreeted = true;
        this.startState('waiting');
        return;
      }
      // 1. Siempre saluda la primera vez
      const gestureName = this.hasGreeted
        ? this.GESTURES[this.gestureIndex]
        : 'hi';

      // 2. Registra que ya saludó, o avanza al siguiente gesto de la lista
      if (!this.hasGreeted) {
        this.hasGreeted = true;
      } else {
        this.gestureIndex = (this.gestureIndex + 1) % this.GESTURES.length;
      }

      // 3. Reproduce el gesto correspondiente con transición rápida (0.2)
      const ok = this.playAction(gestureName, {
        loop: false,
        clampWhenFinished: true,
        duration: 0.2,
      });

      if (ok) {
        this.state = 'gesturing';
      } else {
        // Un clip opcional ausente no interrumpe el ciclo.
        this.startState('waiting');
      }
    }
  }

  onActionFinished(e) {
    if (e.action !== this.currentAction) return;
    const clipName = e.action.getClip().name;
    if (
      clipName === 'stand' ||
      clipName === 'hi' ||
      this.GESTURES.includes(clipName)
    ) {
      this.startState('waiting');
    }
  }

  skipWait() {
    if (this.state === 'waiting') {
      this.stateTimer = 0;
    }
  }

  update(delta) {
    if (!this.mixer) return;
    this.mixer.update(delta);

    if (this.portraitMode) return;

    if (this.state === 'waiting') {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) this.startState('gesturing');
    }
  }

  usePortraitIdle() {
    this.portraitMode = true;
    this.state = 'waiting';
    this.model?.position.set(0, 0, 0);
    this.model?.rotation.set(0, 0, 0);
    this.playAction(this.actions.iddle ? 'iddle' : 'idle', { duration: 0, loop: true });
  }

  dispose() {
    if (this.mixer) {
      this.mixer.removeEventListener('finished', this._finished);
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.model);
    }
    this.meshes.length = 0;
    this.actions = {};
    this.currentAction = this.mixer = this.model = null;
  }
}
