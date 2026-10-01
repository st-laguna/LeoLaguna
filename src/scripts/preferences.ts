
  import en from '../i18n/en.json';
  import es from '../i18n/es.json';

  type Language = 'en' | 'es';
  type Theme = 'light' | 'dark';

  const translations: Record<Language, Record<string, string>> = {
    en,
    es,
  };

  const root = document.documentElement;

  const themeButton =
    document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

  const languageButtons =
    document.querySelectorAll<HTMLButtonElement>('[data-language]');

  function readPreference(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function savePreference(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Los controles funcionan aunque no se pueda guardar la elección.
    }
  }

  function initialTheme(): Theme {
    const saved=readPreference('leo-theme');
    return saved==='dark'||saved==='light'?saved:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }
  function applyTheme(theme: Theme) {
    root.dataset.theme = theme;
    document.querySelector<HTMLLinkElement>('#site-favicon')?.setAttribute('href', `/favicon-${theme}.svg`);

    themeButton?.setAttribute(
      'aria-checked',
      String(theme === 'dark')
    );
    window.dispatchEvent(new CustomEvent('leo:theme-change', {detail:theme}));
  }

  function applyLanguage(language: Language) {
    root.lang = language;

    const dictionary = translations[language];

    document.querySelectorAll<HTMLElement>('[data-i18n]')
      .forEach((element) => {
        const key = element.dataset.i18n;
        if (!key) return;

        const text = dictionary[key];

        if (text !== undefined) {
          element.textContent = text;
        }
      });

    document.querySelectorAll<HTMLElement>('[data-en][data-es]').forEach(element => {
      element.textContent = element.dataset[language] ?? '';
    });

    languageButtons.forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.language === language)
      );
    });
    window.dispatchEvent(new CustomEvent('leo:language-change', {detail:language}));
  }

  // Recupera las preferencias guardadas.
  applyTheme(
    initialTheme()
  );

  applyLanguage(
    readPreference('leo-language') === 'es' ? 'es' : 'en'
  );

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    applyTheme(initialTheme());
    applyLanguage(readPreference('leo-language') === 'es' ? 'es' : 'en');
  });

  // The shared entrance restores its original heading nodes when it finishes.
  // Reapply the chosen language to those restored nodes, too.
  window.addEventListener('leo:page-reveal', () => {
    applyLanguage(readPreference('leo-language') === 'es' ? 'es' : 'en');
  });

  const themeWipe = document.querySelector<HTMLElement>('[data-theme-wipe]');
  let themeTransitioning = false;

  async function transitionTheme(theme: Theme) {
    if (themeTransitioning) return;
    const commit = () => { applyTheme(theme); savePreference('leo-theme', theme); };
    if (!themeWipe || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit();
      return;
    }

    themeTransitioning = true;
    let animation: Animation | undefined;
    let committed = false;
    const transform = (x: string) => `translate3d(${x},0,0) skewX(var(--theme-wipe-angle))`;
    try {
      // Read the destination palette already defined in global.css.
      themeWipe.style.backgroundColor = theme === 'dark'
        ? '#000000' : '#f7f7f7';
      themeWipe.hidden = false;
      themeWipe.showPopover?.();
      themeWipe.style.willChange = 'transform';
      animation = themeWipe.animate(
        [{transform:transform('-100%')}, {transform:transform('0%')}],
        {duration:500, easing:'cubic-bezier(.76,0,1,1)', fill:'forwards'}
      );
      await animation.finished;
      // The completed entry is held at zero: all four corners are covered.
      root.setAttribute('data-theme-switching', '');
      commit();
      committed = true;
      await new Promise<void>(resolve => requestAnimationFrame(() => {
        // Resolve theme styles under cover before restoring transitions.
        void getComputedStyle(root).backgroundColor;
        void getComputedStyle(document.body).backgroundColor;
        requestAnimationFrame(() => resolve());
      }));
      root.removeAttribute('data-theme-switching');
      animation.cancel();
      animation = themeWipe.animate(
        [{transform:transform('0%')}, {transform:transform('100%')}],
        {duration:550, easing:'cubic-bezier(0,0,.24,1)', fill:'forwards'}
      );
      await animation.finished;
    } catch {
      if (!committed) commit();
    } finally {
      themeWipe.hidePopover?.();
      themeWipe.hidden = true;
      animation?.cancel();
      themeWipe.style.removeProperty('will-change');
      themeWipe.style.removeProperty('background-color');
      root.removeAttribute('data-theme-switching');
      themeTransitioning = false;
    }
  }

  // Keep one wipe in flight; all theme side effects still live in applyTheme.
  themeButton?.addEventListener('click', () => {
    if (themeTransitioning) return;
    void transitionTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  // Cambia entre inglés y español.
  languageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const language = button.dataset.language;

      if (language !== 'en' && language !== 'es') return;

      applyLanguage(language);
      savePreference('leo-language', language);
    });
  });
