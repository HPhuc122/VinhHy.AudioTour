const LOCAL_BACKEND_HOSTS = new Set(['localhost', '127.0.0.1', '192.168.1.14']);

export function toPublicAssetUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (LOCAL_BACKEND_HOSTS.has(url.hostname) && (url.port === '5082' || url.port === '5000')) {
      return url.pathname + url.search + url.hash;
    }

    return value;
  } catch {
    return value.startsWith('/') ? value : `/${value}`;
  }
}

export function toPublicAssetUrls(values?: string[] | null): string[] {
  return values?.map(toPublicAssetUrl).filter((url): url is string => Boolean(url)) ?? [];
}
