import * as THREE from 'three';
import { damping, toonMaterials } from './sceneUtils.js';

export class Dog {
  constructor(name, options = {}) {
    this.name = name;
    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.portraitMode = false;

    // Personalidad
    this.baseSpeedUnitsPerSec = options.baseSpeed ?? 1.5;
    this.runProbability = options.runProbability ?? 0.5;
    this.turnSpeed = options.turnSpeed ?? 2.0;
    this.meshes = [];
    this._direction = new THREE.Vector3();
    this._toDest = new THREE.Vector3();
    this._closest = new THREE.Vector3();
    this._waypoint = new THREE.Vector3();
    this._rotation = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);
    this._finished = (event) => this.onActionFinished(event);

    // Sistema de marchas para frenado orgánico (0: idle, 1: walk, 2: trot, 3: run)
    this.gaitLevels = ['idle', 'walk_fwd', 'trot_fwd', 'run_fwd'];
    this.currentGaitIndex = 0;
    this.targetGaitIndex = 0;
    this.gaitTimer = 0;

    // Navegación y Límites
    this.roamDest = new THREE.Vector3();
    this.waypoint = null; // Para rodear obstáculos
    this.isIdling = false;
    this.idleTimer = 0;

    // Descanso
    this.canRest = options.canRest ?? false;
    this.isRestSequenceActive = false;
    this.restStep = null;
    this.restStepTimer = 0;

    this.pickNewRoamPoint();
  }

  attach(gltf) {
    this.model = gltf.scene;
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

    this.mixer.addEventListener('finished', this._finished);
    this.model.position.copy(this.roamDest);
    this.playAction('idle');

    this.mixer.update(0);
    return this.model;
  }

  playAction(
    name,
    { fadeDuration = 0.5, loop = true, clampWhenFinished = false } = {},
  ) {
    const next = this.actions[name];
    if (!next) return false;
    if (this.currentAction === next && next.isRunning()) return true;
    if (this.currentAction) this.currentAction.fadeOut(fadeDuration);

    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = clampWhenFinished;
    next.fadeIn(fadeDuration).play();
    this.currentAction = next;
    return true;
  }

  // Destinos dentro del radio de 4.5 unidades y fuera del centro.
  pickNewRoamPoint() {
    let valid = false;
    let rx, rz;

    while (!valid) {
      // Radio seguro entre 1m y 4.5m para no chocar con la pared invisible
      const r = 1.0 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      rx = Math.cos(theta) * r;
      rz = Math.sin(theta) * r;

      // Zona prohibida al centro reducida (1x1 -> de -0.5 a 0.5)
      if (Math.abs(rx) > 0.5 || Math.abs(rz) > 0.5) {
        valid = true;
      }
    }

    this.roamDest.set(rx, 0, rz);
    this.waypoint = null;
    this.isIdling = false;
    this.tripGait = Math.random() < this.runProbability ? 3 : 2;
  }

  // Verifica si la línea recta cruza la zona central prohibida
  checkCentralObstacle(pos) {
    if (this.waypoint) return this.waypoint;

    // Proyección sobre el segmento; conservar la longitud antes de normalizar.
    const toDest = this._toDest.subVectors(this.roamDest, pos);
    const distance = toDest.length();
    if (distance < 0.0001) return this.roamDest;
    toDest.divideScalar(distance);
    const projectionLength = -pos.dot(toDest);

    if (projectionLength > 0 && projectionLength < distance) {
      const closestPoint = this._closest
        .copy(pos)
        .addScaledVector(toDest, projectionLength);

      // Si pasan a menos de 0.8 metros del centro, se desvían ligeramente
      if (closestPoint.lengthSq() < 0.64) {
        // Un desvío lateral sutil de 1.2 metros
        const side =
          -toDest.z * closestPoint.x + toDest.x * closestPoint.z < 0 ? -1 : 1;
        this.waypoint = this._waypoint
          .set(-toDest.z, 0, toDest.x)
          .multiplyScalar(1.2 * side)
          .add(closestPoint);
        return this.waypoint;
      }
    }
    return this.roamDest;
  }

  updateGaitTransition(delta) {
    if (this.gaitTimer > 0) this.gaitTimer -= delta;

    if (this.gaitTimer <= 0 && this.currentGaitIndex !== this.targetGaitIndex) {
      if (this.currentGaitIndex < this.targetGaitIndex) {
        this.currentGaitIndex++;
      } else {
        this.currentGaitIndex--;
      }

      const gaitName = this.gaitLevels[this.currentGaitIndex];
      this.playAction(gaitName, { fadeDuration: 0.6 });
      this.gaitTimer = 0.6; // Transición lenta para frenado orgánico
    }
  }

  startRestSequence() {
    if (
      !['idle_to_idle_sit', 'idle_sit_to_idle_lay', 'idle_lay_to_idle'].every(
        (name) => this.actions[name],
      )
    ) {
      this.pickNewRoamPoint();
      return;
    }
    this.isRestSequenceActive = true;
    this.targetGaitIndex = 0;
  }

  onActionFinished(e) {
    if (!this.isRestSequenceActive || e.action !== this.currentAction) return;
    const clipName = e.action.getClip().name;

    if (this.restStep === 'sitting' && clipName === 'idle_to_idle_sit') {
      if (
        this.name === 'Simba' &&
        this.actions.idle_sit_one_off_scratch &&
        Math.random() < 0.4
      ) {
        this.restStep = 'scratching';
        this.playAction('idle_sit_one_off_scratch', {
          loop: false,
          clampWhenFinished: true,
        });
      } else {
        this.restStep = 'sit_hold';
        this.restStepTimer = 10 + Math.random() * 10;
      }
    } else if (
      this.restStep === 'scratching' &&
      clipName === 'idle_sit_one_off_scratch'
    ) {
      this.restStep = 'sit_hold';
      this.restStepTimer = 10 + Math.random() * 10;
    } else if (
      this.restStep === 'laying' &&
      clipName === 'idle_sit_to_idle_lay'
    ) {
      this.restStep = 'lay_hold';
      this.restStepTimer = 20;
    } else if (
      this.restStep === 'getting_up' &&
      clipName === 'idle_lay_to_idle'
    ) {
      this.restStep = 'idle_after';
      this.restStepTimer = 1.0;
    }
  }

  updateResting(delta) {
    if (this.currentGaitIndex !== 0) return;

    if (this.restStep === null) {
      this.restStep = 'sitting';
      this.playAction('idle_to_idle_sit', {
        loop: false,
        clampWhenFinished: true,
      });
      return;
    }

    if (this.restStepTimer > 0) {
      this.restStepTimer -= delta;

      if (this.restStepTimer <= 0) {
        if (this.restStep === 'sit_hold') {
          this.restStep = 'laying';
          this.playAction('idle_sit_to_idle_lay', {
            loop: false,
            clampWhenFinished: true,
          });
        } else if (this.restStep === 'lay_hold') {
          this.restStep = 'getting_up';
          this.playAction('idle_lay_to_idle', {
            loop: false,
            clampWhenFinished: true,
          });
        } else if (this.restStep === 'idle_after') {
          this.isRestSequenceActive = false;
          this.restStep = null;
          this.pickNewRoamPoint();
        }
      }
    }
  }

  updateMovement(delta) {
    if (this.isIdling) {
      this.idleTimer -= delta;
      if (this.idleTimer <= 0) {
        if (
          this.canRest &&
          Math.random() < (this.name === 'Simba' ? 0.5 : 0.15)
        ) {
          this.startRestSequence();
        } else {
          this.pickNewRoamPoint();
        }
      }
      return;
    }

    const pos = this.model.position;
    const currentTarget = this.checkCentralObstacle(pos);

    const dir = this._direction.subVectors(currentTarget, pos);
    dir.y = 0;
    const dist = dir.length();

    // Sistema de frenado orgánico (asocia marcha con distancia al objetivo)
    if (dist < 0.5 && currentTarget === this.roamDest) {
      this.targetGaitIndex = 0; // Freno total
    } else if (dist < 2.5) {
      this.targetGaitIndex = 1; // Camina
    } else if (dist < 5.0) {
      this.targetGaitIndex = 2; // Trota
    } else {
      // Tramos largos: decide por personalidad
      this.targetGaitIndex = this.tripGait;
    }

    // Si llegó al waypoint intermedio, lo limpia para seguir al destino real
    if (dist < 0.25 && currentTarget === this.waypoint) {
      this.waypoint = null;
    }

    // Detención definitiva solo cuando la animación llega a 'idle'
    if (this.targetGaitIndex === 0 && this.currentGaitIndex === 0) {
      this.isIdling = true;
      this.idleTimer = 2 + Math.random() * 4;
      return;
    }

    if (this.currentGaitIndex > 0) {
      dir.normalize();

      const targetQuaternion = this._rotation.setFromAxisAngle(
        this._up,
        Math.atan2(dir.x, dir.z),
      );

      // Limita la rotación para obligar al perro a avanzar mientras da la vuelta (Inercia)
      this.model.quaternion.slerp(
        targetQuaternion,
        damping(Math.min(0.99, this.turnSpeed / 60), delta),
      );

      const currentSpeed =
        this.baseSpeedUnitsPerSec * (this.currentGaitIndex / 3);
      pos.addScaledVector(dir, Math.min(dist, currentSpeed * delta));
    }
  }

  update(delta) {
    if (!this.model || !this.mixer) return;
    this.mixer.update(delta);

    if (this.portraitMode) return;

    this.updateGaitTransition(delta);

    if (this.isRestSequenceActive) {
      this.updateResting(delta);
    } else {
      this.updateMovement(delta);
    }
  }

  usePortraitIdle() {
    this.portraitMode = true;
    this.model?.position.set(0, 0, 0);
    this.model?.rotation.set(0, 0, 0);
    const seated = Object.keys(this.actions).find(name => /idle[_-]?sit$/i.test(name));
    this.playAction(seated || (this.actions.idle ? 'idle' : Object.keys(this.actions)[0]), { fadeDuration: 0, loop: true });
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
