const LANGUAGE_LABELS: Record<string, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
};

export const languageOptions = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function formatLanguageLabel(code?: string | null): string {
  const normalizedCode = code?.trim().toLowerCase();

  if (!normalizedCode) {
    return '-';
  }

  return LANGUAGE_LABELS[normalizedCode] ?? normalizedCode.toUpperCase();
}
