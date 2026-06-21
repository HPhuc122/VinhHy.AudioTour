import { useState } from 'react';

export type Lang = 'vi' | 'en' | 'zh' | 'ko' | 'ja' | 'fr';

const LANG_KEY = 'vh_lang';

export const LANG_LABELS: Record<Lang, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
};

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(() => normalizeLanguage(localStorage.getItem(LANG_KEY)));

  const setLang = (nextLanguage: Lang) => {
    localStorage.setItem(LANG_KEY, nextLanguage);
    setLangState(nextLanguage);
  };

  return { lang, setLang };
}

function normalizeLanguage(value: string | null): Lang {
  return value && value in LANG_LABELS ? value as Lang : 'vi';
}
