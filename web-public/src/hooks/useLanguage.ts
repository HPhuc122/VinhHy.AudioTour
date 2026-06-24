import { useState } from 'react';

export type Lang = 'vi' | 'en' | 'zh' | 'ko' | 'ja' | 'fr';

const LANG_KEY = 'vh_lang';
const DEFAULT_LANG: Lang = 'vi';

export const LANG_LABELS: Record<Lang, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
};

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(() => resolveInitialLanguage());

  const setLang = (nextLanguage: Lang) => {
    localStorage.setItem(LANG_KEY, nextLanguage);
    setLangState(nextLanguage);
  };

  return { lang, setLang };
}

function normalizeLanguage(value: string | null): Lang {
  return value && value in LANG_LABELS ? value as Lang : DEFAULT_LANG;
}

function resolveInitialLanguage(): Lang {
  const savedLanguage = normalizeLanguage(localStorage.getItem(LANG_KEY));
  if (localStorage.getItem(LANG_KEY)) {
    return savedLanguage;
  }

  return detectDeviceLanguage();
}

function detectDeviceLanguage(): Lang {
  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeDeviceLanguage(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_LANG;
}

function normalizeDeviceLanguage(value?: string): Lang | null {
  const primary = value?.trim().toLowerCase().split('-')[0];
  return primary && primary in LANG_LABELS ? primary as Lang : null;
}
