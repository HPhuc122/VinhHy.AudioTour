const APP_CACHE = 'vinhhy-app-v1';
const MAP_CACHE = 'vinhhy-map-tiles-v1';
const DATA_CACHE = 'vinhhy-public-map-data-v1';
const OFFLINE_TILE_URL = '/offline-map-tile.svg';
const MAX_MAP_TILES = 800;
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/app-icon.svg',
  '/favicon.svg',
  OFFLINE_TILE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  const activeCaches = new Set([APP_CACHE, MAP_CACHE, DATA_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('vinhhy-') && !activeCaches.has(key))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isOpenStreetMapTile(url)) {
    event.respondWith(cacheFirstMapTile(request));
    return;
  }

  if (isPublicMapData(url)) {
    event.respondWith(networkFirstPublicData(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (
    url.origin === self.location.origin
    && ['script', 'style', 'font', 'image', 'manifest'].includes(request.destination)
  ) {
    event.respondWith(cacheFirstStatic(request));
  }
});

async function precacheAppShell() {
  const cache = await caches.open(APP_CACHE);
  await cache.addAll(APP_SHELL);

  try {
    const response = await fetch('/index.html', { cache: 'reload' });
    if (!response.ok) return;

    const html = await response.clone().text();
    await cache.put('/index.html', response.clone());
    await cache.put('/', response.clone());

    const assetUrls = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)]
      .map((match) => match[1]);
    await Promise.all(assetUrls.map(async (assetUrl) => {
      try {
        const assetResponse = await fetch(assetUrl, { cache: 'reload' });
        if (assetResponse.ok) await cache.put(assetUrl, assetResponse);
      } catch {
        // Runtime caching will retry an asset when it is requested later.
      }
    }));
  } catch {
    // The basic shell above is still useful if refreshing index.html failed.
  }
}

function isOpenStreetMapTile(url) {
  return /(^|\.)tile\.openstreetmap\.org$/i.test(url.hostname)
    && /^\/\d+\/\d+\/\d+\.png$/i.test(url.pathname);
}

function isPublicMapData(url) {
  return /\/api\/v1\/public\/(pois|tours)(?:\/|$)/i.test(url.pathname);
}

async function cacheFirstMapTile(request) {
  const cache = await caches.open(MAP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone());
      await trimCache(cache, MAX_MAP_TILES);
      return response;
    }
  } catch {
    // Fall through to the local offline tile.
  }

  return (await caches.match(OFFLINE_TILE_URL))
    || new Response('', { status: 503, statusText: 'Offline map tile unavailable' });
}

async function networkFirstPublicData(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put('/index.html', response.clone());
    return response;
  } catch {
    return (await cache.match('/index.html'))
      || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;
  if (excess <= 0) return;
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}
