/**
 * Builds URLs for backend-protected media assets.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export function buildCmsMediaStreamUrl(mediaId: number): string {
  return `${BASE_URL}/api/v1/cms/media/images/${mediaId}/stream`;
}

export function buildCmsPoiAssetStreamUrl(poiId: number, relativePath: string): string {
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const params = new URLSearchParams({
    poiId: String(poiId),
    relativePath: normalizedPath,
  });
  return `${BASE_URL}/api/v1/cms/media/poi-assets/stream?${params.toString()}`;
}

export function buildAssetUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) {
    return null;
  }

  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  if (relativePath.includes('/api/v1/cms/media/') || relativePath.includes('/api/v1/public/media/')) {
    const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${BASE_URL}${normalizedPath}`;
  }

  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE_URL}${normalizedPath}`;
}

export function isCmsProtectedAssetUrl(url: string | null | undefined): boolean {
  return Boolean(url?.includes('/api/v1/cms/media/'));
}

export function buildPoiImageUrl(
  poiId: number,
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.includes('/api/v1/cms/media/') || imageUrl.includes('/api/v1/public/media/')) {
    return buildAssetUrl(imageUrl);
  }

  const pathOnly = imageUrl
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\//, '');

  if (pathOnly.startsWith('uploads/images/') || pathOnly.startsWith('uploads/pois/')) {
    return buildCmsPoiAssetStreamUrl(poiId, pathOnly);
  }

  return buildAssetUrl(imageUrl);
}

export const getAssetUrl = buildAssetUrl;

export default buildAssetUrl;
