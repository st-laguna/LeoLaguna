let chromeRestore:(()=>void)|undefined;
function syncMenuChrome(open:boolean){
  if(open&&!chromeRestore){
    const root=document.documentElement,previous=root.style.colorScheme;
    let metas=[...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    const created=!metas.length;
    if(created){const meta=document.createElement('meta');meta.name='theme-color';document.head.append(meta);metas=[meta];}
    const saved=metas.map(meta=>meta.getAttribute('content'));
    metas.forEach(meta=>meta.content='#000000');root.style.colorScheme='dark';
    chromeRestore=()=>{metas.forEach((meta,i)=>{if(created)meta.remove();else if(saved[i]===null)meta.removeAttribute('content');else meta.content=saved[i]!;});root.style.colorScheme=previous;};
  }else if(!open&&chromeRestore){chromeRestore();chromeRestore=undefined;}
}
const mounted = new Map<HTMLButtonElement, { dispose(): void }>();
const compactMedia = '(max-width:700px), (max-width:1000px) and (max-height:500px), (orientation:portrait)';

function mount(toggle: HTMLButtonElement) {
  const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
  const host = toggle.closest<HTMLElement>('.site-header,.mobile-about')!;
  const root = document.documentElement;
  const about = toggle.dataset.menuContext === 'about';
  const media = matchMedia(compactMedia);
  const abort = new AbortController();
  const on = (target: EventTarget, name: string, handler: EventListener) => target.addEventListener(name, handler, { signal: abort.signal });
  const links = [...panel.querySelectorAll<HTMLAnchorElement>('[data-shared-nav-link]')];
  const group = panel.querySelector<HTMLElement>('[data-shared-menu-links]')!;
  const enabled = () => about ? root.hasAttribute('data-about-mobile') : media.matches || root.hasAttribute('data-tablet-portrait') || root.hasAttribute('data-adaptive-hero');
  let open = false;
  function select(link: HTMLAnchorElement | null) {
    group.toggleAttribute('data-selection-active', !!link);
    links.forEach(item => item.toggleAttribute('data-menu-selected', item === link));
  }
  function setOpen(value: boolean, focus = false) {
    open = value && enabled();
    host.toggleAttribute('data-menu-open', open);
    panel.toggleAttribute('data-shared-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', about ? (open ? 'Close menu' : 'Open menu') : (open ? 'Close menu / Cerrar menú' : 'Open menu / Abrir menú'));
    panel.inert = enabled() ? !open : about;
    if (enabled() || about) panel.setAttribute('aria-hidden', String(!open)); else panel.removeAttribute('aria-hidden');
    root.classList.toggle('mobile-menu-open', !!document.querySelector('[data-shared-menu-panel][data-shared-menu-open]'));
    syncMenuChrome(root.classList.contains('mobile-menu-open'));
    if (!open) select(null);
    if (focus) toggle.focus({ preventScroll: true });
  }
  function sync() {
    toggle.toggleAttribute('data-menu-compact', enabled());
    panel.toggleAttribute('data-menu-compact', enabled());
    setOpen(false);
  }
  const blockScroll = (event: Event) => { if(open) event.preventDefault(); };
  window.addEventListener('wheel',blockScroll,{passive:false,signal:abort.signal});
  window.addEventListener('touchmove',blockScroll,{passive:false,signal:abort.signal});
  on(document,'keydown',event=>{if(open&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes((event as KeyboardEvent).key))event.preventDefault();});
  on(toggle, 'click', () => { if (!toggle.disabled) setOpen(!open); });
  on(toggle, 'navigation-menu:close', () => setOpen(false));
  on(panel, 'pointerdown', event => {
    if (!enabled()) return;
    select((event.target as Element).closest<HTMLAnchorElement>('[data-shared-nav-link]'));
  });
  on(panel, 'focusin', event => { if (enabled()) select((event.target as Element).closest<HTMLAnchorElement>('[data-shared-nav-link]')); });
  on(panel, 'click', event => {
    if (!enabled()) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    if (link.matches('[data-shared-nav-link]')) select(link);
    const url = new URL(link.href, location.href);
    // Cross-document anchors stay enabled until native activation/pagehide.
    if (url.origin === location.origin && url.pathname === location.pathname) setOpen(false);
  });
  on(document, 'keydown', event => {
    if (!open) return;
    const key = event as KeyboardEvent;
    if (key.key === 'Escape') { key.preventDefault(); key.stopImmediatePropagation(); setOpen(false, true); }
    if (key.key === 'Tab') {
      const items = [toggle, ...panel.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)')];
      if (key.shiftKey && document.activeElement === items[0]) { key.preventDefault(); items.at(-1)?.focus(); }
      else if (!key.shiftKey && document.activeElement === items.at(-1)) { key.preventDefault(); toggle.focus(); }
    }
  });
  on(media, 'change', sync);
  on(window, 'leo:orientation-ready', sync);
  on(window, 'leo:close-menu', () => setOpen(false));
  on(window, 'pagehide', () => setOpen(false));
  on(window, 'pageshow', () => setOpen(false));
  const observer = new MutationObserver(sync);
  observer.observe(root, {attributes:true,attributeFilter:['data-tablet-portrait','data-about-mobile']});
  sync();
  return { dispose() { setOpen(false); abort.abort(); observer.disconnect(); } };
}
function boot() {
  for (const [toggle, controller] of mounted) if (!toggle.isConnected) { controller.dispose(); mounted.delete(toggle); }
  document.querySelectorAll<HTMLButtonElement>('[data-shared-menu-toggle]').forEach(toggle => { if (!mounted.has(toggle)) mounted.set(toggle, mount(toggle)); });
}
function disposeAll() { mounted.forEach(controller => controller.dispose()); mounted.clear(); }
boot();
document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', disposeAll);
if (import.meta.hot) import.meta.hot.dispose(() => { disposeAll(); document.removeEventListener('astro:page-load', boot); document.removeEventListener('astro:before-swap', disposeAll); });
