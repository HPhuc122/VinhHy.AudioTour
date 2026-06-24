import { useEffect, useRef } from 'react';

const HEARTBEAT_INTERVAL_MS = 20_000; // ping every 20s
const LEAVE_URL = '/api/v1/public/presence/leave';
const HEARTBEAT_URL = '/api/v1/public/presence/heartbeat';

function getDeviceId(): string {
  const key = 'vinhhy_guest_device_id';
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

async function sendHeartbeat(poiId?: string | null) {
  try {
    await fetch(HEARTBEAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Device-Id': getDeviceId(),
      },
      body: JSON.stringify({ poiId: poiId ?? null }),
    });
  } catch {
    // silently ignore — network errors don't affect UX
  }
}

function sendLeaveBeacon() {
  // sendBeacon works even during page unload; falls back to fetch if unavailable.
  const deviceId = getDeviceId();
  const ok = navigator.sendBeacon
    ? navigator.sendBeacon(LEAVE_URL, new Blob([], { type: 'application/json' }))
    : false;

  if (!ok) {
    // Best-effort fallback (may be cut short on unload)
    fetch(LEAVE_URL, {
      method: 'POST',
      headers: { 'X-Guest-Device-Id': deviceId },
      keepalive: true,
    }).catch(() => undefined);
  }
}

/**
 * usePresenceHeartbeat
 *
 * Call this in any page component that should count toward the "online visitors" metric.
 * Pass the current POI id if the user is viewing a specific POI, otherwise omit.
 *
 * - Sends an immediate heartbeat on mount.
 * - Repeats every 20 seconds.
 * - Sends a leave beacon on unmount (route change) or window unload.
 */
export function usePresenceHeartbeat(poiId?: string | null) {
  const poiIdRef = useRef(poiId);
  poiIdRef.current = poiId;

  useEffect(() => {
    // immediate ping on mount
    void sendHeartbeat(poiIdRef.current);

    const interval = setInterval(() => {
      void sendHeartbeat(poiIdRef.current);
    }, HEARTBEAT_INTERVAL_MS);

    // clean up on route change (component unmount = user navigated away from this page)
    return () => {
      clearInterval(interval);
      sendLeaveBeacon();
    };
  }, []); // intentionally empty — poiId changes handled via ref

  // Also fire leave on hard close / refresh
  useEffect(() => {
    window.addEventListener('beforeunload', sendLeaveBeacon);
    return () => window.removeEventListener('beforeunload', sendLeaveBeacon);
  }, []);
}
