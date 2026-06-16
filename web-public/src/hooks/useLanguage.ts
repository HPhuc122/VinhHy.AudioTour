import { useState } from 'react';

export type Lang = 'vi' | 'en' | 'zh' | 'ko' | 'ja' | 'fr';

const LANG_KEY = 'vh_lang';

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(LANG_KEY) as Lang) ?? 'vi',
  );

  const setLang = (l: Lang) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  };

  return { lang, setLang };
}

export const LANG_LABELS: Record<Lang, string> = {
  vi: '🇻🇳 Tiếng Việt',
  en: '🇬🇧 English',
  zh: '🇨🇳 中文',
  ko: '🇰🇷 한국어',
  ja: '🇯🇵 日本語',
  fr: '🇫🇷 Français',
};
