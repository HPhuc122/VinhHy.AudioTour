import { useEffect, useRef, createContext, useContext, useState, useCallback } from 'react';

// ─── Presence Context ──────────────────────────────────────────────────────────
// Pages that want to tag their session with a POI call setPresencePoiId(code).
// MainLayout owns the single heartbeat loop and reads from here.

interface PresenceContextValue {
  poiId: string | null;
  setPresencePoiId: (id: string | null) => void;
}

export const PresenceContext = createContext<PresenceContextValue>({
  poiId: null,
  setPresencePoiId: () => undefined,
});

export function usePresenceContext() {
  return useContext(PresenceContext);
}

// ─── Internal HTTP helpers ─────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL_MS = 20_000;
const HEARTBEAT_URL = '/api/v1/public/presence/heartbeat';
const LEAVE_URL = '/api/v1/public/presence/leave';

function getDeviceId(): string {
  const key = 'vinhhy_guest_device_id';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

async function sendHeartbeat(poiId: string | null) {
  try {
    await fetch(HEARTBEAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Device-Id': getDeviceId(),
      },
      body: JSON.stringify({ poiId }),
    });
  } catch {
    // silent — network errors don't affect UX
  }
}

function sendLeaveBeacon() {
  const deviceId = getDeviceId();
  // sendBeacon can't set custom headers; use keepalive fetch instead
  fetch(LEAVE_URL, {
    method: 'POST',
    headers: { 'X-Guest-Device-Id': deviceId },
    keepalive: true,
  }).catch(() => undefined);
}

// ─── Main hook (used ONCE in MainLayout) ──────────────────────────────────────

/**
 * usePresenceHeartbeat — call ONCE at the layout level.
 * Reads poiId from PresenceContext so individual pages can tag the session
 * without creating a second heartbeat loop.
 */
export function usePresenceHeartbeat() {
  const { poiId } = usePresenceContext();
  const poiIdRef = useRef(poiId);
  poiIdRef.current = poiId;

  useEffect(() => {
    void sendHeartbeat(poiIdRef.current);

    const interval = setInterval(() => {
      void sendHeartbeat(poiIdRef.current);
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      sendLeaveBeacon();
    };
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', sendLeaveBeacon);
    return () => window.removeEventListener('beforeunload', sendLeaveBeacon);
  }, []);
}

// ─── Page-level hook (used in PoiDetailPage) ─────────────────────────────────

/**
 * useSetPresencePoi — call in a POI detail page to tag the current session.
 * Clears the tag when the component unmounts (user leaves the POI page).
 */
export function useSetPresencePoi(poiCode: string | null | undefined) {
  const { setPresencePoiId } = usePresenceContext();

  useEffect(() => {
    if (poiCode) {
      setPresencePoiId(poiCode);
    }
    return () => {
      setPresencePoiId(null);
    };
  }, [poiCode, setPresencePoiId]);
}

// ─── Context provider state (used in App.tsx) ────────────────────────────────

export function usePresenceProviderState(): PresenceContextValue {
  const [poiId, setPoiId] = useState<string | null>(null);
  const setPresencePoiId = useCallback((id: string | null) => setPoiId(id), []);
  return { poiId, setPresencePoiId };
}
