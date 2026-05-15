import { useEffect, useState } from 'react';

function diff(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    expired: ms === 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function CountdownTimer({ target, onExpire }) {
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => {
      const next = diff(target);
      setT(next);
      if (next.expired) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onExpire]);

  if (t.expired) return <span className="text-destructive font-medium">Closed</span>;
  const parts = [];
  if (t.d) parts.push(`${t.d}d`);
  if (t.d || t.h) parts.push(`${t.h}h`);
  parts.push(`${t.m}m`);
  parts.push(`${t.s}s`);
  return <span className="font-mono">{parts.join(' ')}</span>;
}
