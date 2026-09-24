
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

  function applyTheme(theme: Theme) {
    root.dataset.theme = theme;

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
    readPreference('leo-theme') === 'dark' ? 'dark' : 'light'
  );

  applyLanguage(
    readPreference('leo-language') === 'es' ? 'es' : 'en'
  );

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    applyTheme(readPreference('leo-theme') === 'dark' ? 'dark' : 'light');
    applyLanguage(readPreference('leo-language') === 'es' ? 'es' : 'en');
  });

  // The shared entrance restores its original heading nodes when it finishes.
  // Reapply the chosen language to those restored nodes, too.
  window.addEventListener('leo:page-reveal', () => {
    applyLanguage(readPreference('leo-language') === 'es' ? 'es' : 'en');
  });

  // Cambia entre modo claro y oscuro.
  themeButton?.addEventListener('click', () => {
    const theme: Theme =
      root.dataset.theme === 'dark' ? 'light' : 'dark';

    applyTheme(theme);
    savePreference('leo-theme', theme);
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
