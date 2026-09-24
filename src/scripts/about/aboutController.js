import gsap from 'gsap';
import { message } from './messages.js';

const mounted = new Map();

function mount(section) {
  const abort = new AbortController();
  const on = (target, name, handler, options = {}) =>
    target?.addEventListener(name, handler, {
      ...options,
      signal: abort.signal,
    });
  const query = (selector) => section.querySelector(selector);
  const boxes = [...section.querySelectorAll('[data-box-motion]')];
  const intro = query('.box--intro');
  const timeEl = query('[data-local-time]');
  const status = query('[data-status]');
  let statusMessage = 'Loading my little world…';
  function setStatus(text) { statusMessage = text; status.textContent = message(text); }
  const progress = query('[data-load-progress]');
  const returnButton = query('[data-return]');
  const pauseButton = query('[data-pause]');
  const tooltip = query('[data-tooltip]');
  const tooltipCard = query('[data-tooltip-card]');
  const picker = query('[data-picker]');
  const explore = query('[data-explore]');
  const hint = query('[data-hint]');
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)');
  let reduced = reduceQuery.matches;
  let scene = null,
    starting = false,
    destroyed = false,
    leaving = false;
  let paused = reduced,
    onScreen = true;
  let focused = null,
    launchElement = null,
    watchdog = 0;
  const animations = new Set();

  // A remount (for example during HMR) may reuse the same HTML nodes.
  explore.replaceChildren();
  picker.hidden = true;
  picker.open = false;
  intro.inert = false;
  section.dataset.focused = 'false';
  returnButton.disabled = true;
  returnButton.tabIndex = -1;
  returnButton.setAttribute('aria-hidden', 'true');
  tooltip.setAttribute('aria-hidden', 'true');
  gsap.set([returnButton, tooltipCard], { autoAlpha: 0 });

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  function updateClock() {
    if (!document.hidden && timeEl)
      timeEl.textContent = formatter.format(new Date());
  }
  updateClock();
  const clockTimer = setInterval(updateClock, 30000);
  on(document, 'visibilitychange', updateClock);

  function tween(target, values) {
    if (reduced) {
      const { duration, stagger, delay, ease, onComplete, ...instant } = values;
      gsap.set(target, instant);
      onComplete?.();
      return null;
    }
    let animation;
    animation = gsap.to(target, {
      ...values,
      duration: reduced ? 0 : (values.duration ?? 0.45),
      overwrite: true,
      onComplete: () => {
        animations.delete(animation);
        values.onComplete?.();
      },
      onInterrupt: () => animations.delete(animation),
    });
    animations.add(animation);
    return animation;
  }
  function enter() {
    for (const animation of [...animations]) animation.kill();
    leaving = false;
    boxes.forEach((box, index) => {
      gsap.set(box, { autoAlpha: reduced ? 1 : 0, y: reduced ? 0 : 18 });
      tween(box, {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        delay: reduced ? 0 : index * 0.08,
        ease: 'power3.out',
      });
    });
    scene?.resume();
    if (focused) select(focused);
  }

  function select(item) {
    focused = item;
    const visible = Boolean(item);
    const returnHadFocus = document.activeElement === returnButton;
    section.dataset.focused = String(visible);
    returnButton.disabled = !visible;
    returnButton.tabIndex = visible ? 0 : -1;
    returnButton.setAttribute('aria-hidden', String(!visible));
    if (visible) gsap.set(returnButton, { visibility: 'visible' });
    tween(returnButton, {
      autoAlpha: visible ? 1 : 0,
      y: visible ? 0 : -8,
      duration: 0.3,
    });
    // Keep navigation usable. Only the introductory text exits during inspection.
    const hideIntro = false;
    intro.inert = hideIntro;
    tween(intro, {
      autoAlpha: hideIntro ? 0 : 1,
      y: hideIntro ? -14 : 0,
      duration: hideIntro ? 0.32 : 0.55,
    });
    if (item) {
      query('[data-prop-title]').textContent = message(item.label);
      query('[data-prop-description]').textContent = message(item.description || '');
      tooltip.setAttribute('aria-hidden', 'false');
      gsap.set(tooltipCard, { y: reduced ? 0 : 10 });
      tween(tooltipCard, { autoAlpha: 1, y: 0, duration: 0.3 });
      setStatus('Inspecting ' + item.label);
      if (picker.contains(document.activeElement)) {
        launchElement = document.activeElement;
        returnButton.focus({ preventScroll: true });
      }
      picker.open = false;
    } else {
      tween(tooltipCard, {
        autoAlpha: 0,
        y: 8,
        duration: 0.22,
        onComplete: () => tooltip.setAttribute('aria-hidden', 'true'),
      });
      setStatus('Back to the full scene.');
      if (returnHadFocus) {
        // The previous picker button is inside a closed details: focus its summary instead.
        (launchElement ? picker.querySelector('summary') : pauseButton).focus({
          preventScroll: true,
        });
        launchElement = null;
      }
    }
    for (const button of explore.querySelectorAll('button'))
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.id === item?.id),
      );
  }

  function updatePause() {
    pauseButton.textContent =
      message(paused || reduced ? 'Play motion' : 'Pause motion');
    pauseButton.setAttribute('aria-pressed', String(paused || reduced));
    // Explicit Play overrides the preference for this visit; changing OS settings resets it.
    scene?.setReducedMotion(reduced);
    scene?.setPaused(paused);
  }
  on(pauseButton, 'click', () => {
    if (reduced) {
      reduced = false;
      paused = false;
    } else paused = !paused;
    updatePause();
  });
  on(returnButton, 'click', () => scene?.reset());
  on(mobileQuery, 'change', () => {
    const hideIntro = false;
    intro.inert = hideIntro;
    tween(intro, { autoAlpha: hideIntro ? 0 : 1, y: hideIntro ? -14 : 0 });
  });
  on(section, 'keydown', (event) => {
    if (event.key === 'Escape' && focused) {
      event.preventDefault();
      scene?.reset();
    }
  });
  on(reduceQuery, 'change', () => {
    reduced = reduceQuery.matches;
    paused = reduced;
    if (reduced) for (const animation of [...animations]) animation.progress(1);
    updatePause();
  });

  on(window, 'leo:language-change', () => {
    setStatus(statusMessage);
    updatePause();
    if (focused) {
      query('[data-prop-title]').textContent = message(focused.label);
      query('[data-prop-description]').textContent = message(focused.description || '');
    }
    for (const button of explore.querySelectorAll('button')) button.textContent = message(button.dataset.label);
  });

  async function startScene() {
    if (starting || destroyed || leaving) return;
    starting = true;
    section.removeAttribute('data-scene-unavailable');
    setStatus('Loading my little world…');
    progress.hidden = false;
    section.setAttribute('aria-busy', 'true');
    watchdog = setTimeout(() => {
      if (!destroyed) {
        setStatus('The 3D scene is taking a little longer. You can keep reading.');
        if (mobileQuery.matches) section.setAttribute('data-scene-unavailable', '');
      }
    }, 12000);
    try {
      const { createAboutScene } = await import('./dogScene.js');
      if (destroyed || leaving) {
        starting = false;
        return;
      }
      if (document.documentElement.hasAttribute('data-page-transition')) {
        await new Promise(resolve => {
          on(window, 'leo:page-reveal', resolve, {once:true});
          abort.signal.addEventListener('abort', resolve, {once:true});
        });
      }
      if (destroyed || leaving) { starting = false; return; }
      scene = createAboutScene(section, {
        onItem(item) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = message(item.label);
          button.dataset.label = item.label;
          button.dataset.id = item.id;
          button.setAttribute('aria-pressed', 'false');
          on(button, 'click', () => scene.focus(item.id));
          explore.append(button);
          picker.hidden = false;
        },
        onProgress({ completed, total }) {
          progress.value = completed / total;
        },
        onFocus: select,
        onStatus(message) {
          setStatus(message);
        },
        onError(message) {
          setStatus(message);
          progress.hidden = true;
          section.setAttribute('aria-busy', 'false');
        },
        onReady({ failed, interactive }) {
          clearTimeout(watchdog);
          section.setAttribute('aria-busy', 'false');
          progress.hidden = true;
          section.toggleAttribute('data-scene-unavailable', interactive === 0);
          setStatus(focused
            ? 'Inspecting ' + focused.label
            : interactive === 0
              ? 'The 3D scene is unavailable. All contact links still work.'
              : failed
                ? 'Some details could not load. You can still explore the scene.'
                : 'Ready to explore.');
          hint.hidden = interactive === 0;
          pauseButton.disabled = interactive === 0;
        },
      });
      scene.setVisible(onScreen);
      updatePause();
      pauseButton.disabled = false;
      await scene.load();
    } catch (error) {
      scene?.dispose();
      scene = null;
      if (destroyed) return;
      section.setAttribute('data-scene-unavailable', '');
      setStatus('The 3D view is unavailable on this browser. You can still read about me and get in touch.');
      progress.hidden = true;
      pauseButton.disabled = true;
      section.setAttribute('aria-busy', 'false');
      if (import.meta.env.DEV) console.warn('[About]', error);
    } finally {
      clearTimeout(watchdog);
    }
  }

  const nearObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        nearObserver.disconnect();
        void startScene();
      }
    },
    { rootMargin: '200px' },
  );
  nearObserver.observe(section);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    scene?.setVisible(onScreen);
  });
  visibilityObserver.observe(query('[data-scene]'));
  on(document, 'visibilitychange', () => {
    for (const animation of animations) animation.paused(document.hidden);
  });

  on(window, 'pageshow', (event) => {
    if (event.persisted) {
      if (!document.documentElement.hasAttribute('data-cross-page')) enter();
      scene?.setVisible(onScreen);
      updateClock();
      if (!scene && !starting) void startScene();
    }
  });
  on(window, 'pagehide', (event) => {
    if (event.persisted) scene?.setVisible(false);
    else dispose();
  });

  function dispose() {
    if (destroyed) return;
    destroyed = true;
    abort.abort();
    clearInterval(clockTimer);
    clearTimeout(watchdog);
    nearObserver.disconnect();
    visibilityObserver.disconnect();
    for (const animation of [...animations]) animation.kill();
    animations.clear();
    scene?.dispose();
    mounted.delete(section);
  }
  updatePause();
  if (document.documentElement.hasAttribute('data-cross-page')) {
    // The shared destination entrance owns these nodes during navigation.
    gsap.set(boxes, { autoAlpha: 1, y: 0 });
  } else enter();
  return { dispose };
}

function boot() {
  for (const [section, controller] of mounted)
    if (!section.isConnected) controller.dispose();
  for (const section of document.querySelectorAll('[data-about]')) {
    if (!mounted.has(section)) mounted.set(section, mount(section));
  }
}

boot();
document.addEventListener('astro:page-load', boot);
function disposeAll() {
  for (const controller of [...mounted.values()]) controller.dispose();
}
document.addEventListener('astro:before-swap', disposeAll);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    for (const controller of [...mounted.values()]) controller.dispose();
    document.removeEventListener('astro:page-load', boot);
    document.removeEventListener('astro:before-swap', disposeAll);
  });
