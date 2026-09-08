type PlanktonKind = "drifter" | "wanderer" | "swimmer";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
  kind: PlanktonKind;
  directionTimer: number;
  hue: number;
};

type Config = {
  density: number;
  swimmerRatio: number;
  maxParticles: number;
  minParticles: number;
  retinaLimit: number;
};

const defaultConfig: Config = {
  density: 0.00014,
  swimmerRatio: 0.13,
  maxParticles: 190,
  minParticles: 42,
  retinaLimit: 1.75,
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function mountPlanktonParticles(root: HTMLElement) {

  const canvasElement = root.querySelector<HTMLCanvasElement>("canvas");
  if (!canvasElement) return () => {};

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile = !canHover;
  let isLowPower = false;
  if (!canvasElement) return () => {};

  const context = canvasElement.getContext("2d", { alpha: true });

  if (!context) return () => {};

  const canvas = canvasElement;
  const ctx = context;

  const config: Config = {
    ...defaultConfig,
    density: Number(root.dataset.density) || defaultConfig.density,
    swimmerRatio:
      Number(root.dataset.swimmerRatio) || defaultConfig.swimmerRatio,
  };

  const particles: Particle[] = [];

  let width = 0;
  let height = 0;
  let frame = 0;
  let active = true;
  let visible = true;
  let pointerX = -9999;
  let pointerY = -9999;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function getParticleCount() {
  const area = width * height;

  const mobileFactor = isLowPower
  ? 0.45
  : width < 720
    ? 0.62
    : 1;

  return Math.round(
    clamp(
      area * config.density * mobileFactor,
      config.minParticles,
      config.maxParticles,
    ),
  );
}

  function chooseKind(): PlanktonKind {
    if (Math.random() < config.swimmerRatio) return "swimmer";
    if (Math.random() < 0.34) return "wanderer";
    return "drifter";
  }

  function createParticle(): Particle {
    const kind = chooseKind();
    const angle = random(0, Math.PI * 2);

    const speed =
      kind === "swimmer"
        ? random(0.34, 0.82)
        : kind === "wanderer"
          ? random(0.08, 0.25)
          : random(0.025, 0.12);

    return {
      x: random(0, width),
      y: random(0, height),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: kind === "swimmer" ? random(1.3, 2.8) : random(0.55, 1.9),
      opacity: kind === "swimmer" ? random(0.46, 0.82) : random(0.16, 0.48),
      pulse: random(0, Math.PI * 2),
      pulseSpeed: random(0.012, 0.034),
      kind,
      directionTimer: random(90, 260),
      hue: kind === "swimmer" ? random(164, 188) : random(188, 214),
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, config.retinaLimit);

    // Usa el tamaño del canvas, no del contenedor
    width = Math.max(1, canvas.offsetWidth);
    height = Math.max(1, canvas.offsetHeight);
    isLowPower = isMobile || width < 480;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = getParticleCount();

    while (particles.length < target) particles.push(createParticle());
    while (particles.length > target) particles.pop();
}

  function wrapParticle(particle: Particle) {
    const margin = 24;

    if (particle.x < -margin) particle.x = width + margin;
    if (particle.x > width + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = height + margin;
    if (particle.y > height + margin) particle.y = -margin;
  }

  function updateParticle(particle: Particle, time: number) {
    const currentX = Math.sin(time * 0.00045 + particle.y * 0.018) * 0.16;
    const currentY = Math.cos(time * 0.00038 + particle.x * 0.014) * 0.11;

    if (particle.kind === "swimmer" && !isMobile) {
      particle.directionTimer -= 1;

      if (particle.directionTimer <= 0) {
        const angle = random(0, Math.PI * 2);
        const speed = random(0.34, 0.82);

        particle.vx = particle.vx * 0.68 + Math.cos(angle) * speed * 0.32;
        particle.vy = particle.vy * 0.68 + Math.sin(angle) * speed * 0.32;
        particle.directionTimer = random(110, 290);
      }
    }

    if (particle.kind === "wanderer") {
      particle.vx += random(-0.014, 0.014);
      particle.vy += random(-0.014, 0.014);
      particle.vx *= 0.975;
      particle.vy *= 0.975;
    }

    if (particle.kind === "drifter") {
      particle.vx *= 0.992;
      particle.vy *= 0.992;
    }

    if (canHover) {
      const dx = particle.x - pointerX;
      const dy = particle.y - pointerY;
      const distanceSq = dx * dx + dy * dy;

      const influenceRadius = 110;
      const influenceRadiusSq = influenceRadius * influenceRadius;

  if (distanceSq < influenceRadiusSq) {
    const force = (1 - distanceSq / influenceRadiusSq) * 0.018;
    particle.vx += dx * force;
    particle.vy += dy * force;
  }
}

    particle.x += particle.vx + currentX;
    particle.y += particle.vy + currentY;
    particle.pulse += isLowPower
  ? particle.pulseSpeed * 0.5
  : particle.pulseSpeed;

    wrapParticle(particle);
  }

  function drawParticle(particle: Particle) {
    const pulse = Math.sin(particle.pulse) * 0.18 + 0.82;
    const alpha = particle.opacity * pulse;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = `hsl(${particle.hue} 88% 78%)`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.22;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 3.6, 0, Math.PI * 2);
    ctx.fill();

  if (particle.kind === "swimmer" && !isLowPower) {
    ctx.globalAlpha = alpha * 0.28;
    ctx.strokeStyle = `hsl(${particle.hue} 88% 78%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x - particle.vx * 9, particle.y - particle.vy * 9);
    ctx.stroke();
  }

    ctx.globalAlpha = 1;
  }

  function animate(time = 0) {
    if (!active) return;

    if (visible && !reducedMotion.matches) {
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        updateParticle(particle, time);
        drawParticle(particle);
      }
    }

    frame = window.requestAnimationFrame(animate);
  }

  function onPointerMove(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();

    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
}

  function onPointerLeave() {
    pointerX = -9999;
    pointerY = -9999;
  }

  function destroy() {
    active = false;
    window.cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("astro:before-swap", destroy);
  }

  const resizeObserver = new ResizeObserver(resize);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    },
    { threshold: 0.05 },
  );

  resizeObserver.observe(root);
  intersectionObserver.observe(root);

if (canHover) {
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", onPointerLeave);
}

// esto SIEMPRE, independiente del device
document.addEventListener("astro:before-swap", destroy);

  resize();
animate();

return destroy;
}