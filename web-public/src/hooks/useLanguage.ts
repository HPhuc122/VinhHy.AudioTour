import { useState } from 'react';

export type Lang = 'vi' | 'en' | 'zh' | 'ko' | 'ja' | 'fr';

const LANG_KEY = 'vh_lang';
/** Set when user explicitly picks a language via the Navbar selector — QR auto-detect won't override this. */
const LANG_USER_CHOSEN_KEY = 'vh_lang_chosen';

export const LANG_LABELS: Record<Lang, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
};

const SUPPORTED_LANGS = Object.keys(LANG_LABELS) as Lang[];

/**
 * Map browser locale tags to our supported languages.
 * navigator.language can be e.g. "zh-TW", "en-US", "ko-KR" etc.
 */
export function detectBrowserLang(): Lang {
  const browserLocales = navigator.languages?.length
    ? [...navigator.languages]
    : [navigator.language];

  for (const locale of browserLocales) {
    const base = locale.split('-')[0].toLowerCase();
    const match = SUPPORTED_LANGS.find((l) => l === base);
    if (match) return match;
  }
  return 'vi'; // default fallback
}

export function normalizeLanguage(value: string | null): Lang {
  return value && SUPPORTED_LANGS.includes(value as Lang) ? (value as Lang) : 'vi';
}

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    // If there's already a stored language preference, respect it
    if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
      return stored as Lang;
    }
    // No stored preference → detect from browser language
    return detectBrowserLang();
  });

  /** Called when the user explicitly picks a language in the Navbar. */
  const setLang = (nextLanguage: Lang) => {
    localStorage.setItem(LANG_KEY, nextLanguage);
    // Mark as user-chosen so QR auto-detect won't override it
    localStorage.setItem(LANG_USER_CHOSEN_KEY, '1');
    setLangState(nextLanguage);
  };

  /**
   * Called by QrLandingPage on mount.
   * Applies the detected browser language ONLY if the user has NOT
   * already explicitly chosen one via the language selector.
   */
  const setLangFromBrowser = (detectedLang: Lang) => {
    const userChose = !!localStorage.getItem(LANG_USER_CHOSEN_KEY);
    if (!userChose) {
      localStorage.setItem(LANG_KEY, detectedLang);
      setLangState(detectedLang);
    }
  };

  return { lang, setLang, setLangFromBrowser };
}
