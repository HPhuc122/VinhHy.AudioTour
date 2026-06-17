import { useEffect, useState } from 'react';

interface AccessCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
}

export function AccessCountdown({ expiresAt, onExpired }: AccessCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(expiresAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextRemaining = getRemainingSeconds(expiresAt);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining <= 0) {
        onExpired?.();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt, onExpired]);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
      Access active: <span className="font-semibold">{formatRemaining(remainingSeconds)}</span>
    </div>
  );
}

function getRemainingSeconds(expiresAt: string): number {
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) {
    return 0;
  }

  return Math.max(0, Math.floor((expires - Date.now()) / 1000));
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
