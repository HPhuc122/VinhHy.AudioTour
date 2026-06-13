/**
 * Utility for building URLs to backend static assets
 * 
 * The backend serves static files from wwwroot/uploads/*
 * This utility prepends the backend base URL to relative paths
 * so they can be accessed from the frontend running on a different port.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

/**
 * Builds a complete URL for a backend static asset
 * @param relativePath - The relative path from wwwroot (e.g., "/uploads/pois/guid-name.jpg")
 * @returns Full URL to the asset (e.g., "http://localhost:5000/uploads/pois/guid-name.jpg")
 */
export const buildAssetUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) {
    return null;
  }

  // If the path already includes the full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Ensure path starts with /
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  return `${BASE_URL}${normalizedPath}`;
};

/**
 * Alternative name for the same function (common naming convention)
 */
export const getAssetUrl = buildAssetUrl;

export default buildAssetUrl;
