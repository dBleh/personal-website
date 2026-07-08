// Local persistence: sessions are kept in localStorage so tracked data is
// still there on the next visit. Everything stays on the device — same
// privacy story as the tracking itself.

import type { Session } from './types';

const KEY = 'motiontracker.v2';
const LEGACY_KEY = 'kneetracker.v1';

interface Persisted {
  sessions: Session[];
}

const round = (v: number, dp: number) => {
  const m = Math.pow(10, dp);
  return Math.round(v * m) / m;
};

/** Trim float noise so a multi-session history fits comfortably in localStorage. */
function compact(s: Session): Session {
  return {
    ...s,
    t: s.t.map((v) => round(v, 4)),
    values: s.values.map((v) => round(v, 3)),
    values2: s.values2?.map((v) => round(v, 3)),
  };
}

export function saveState(sessions: Session[]): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const payload: Persisted = { sessions: sessions.map(compact) };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
    return null;
  } catch {
    return (
      'Could not save your sessions locally (storage is full or blocked). ' +
      'Export them as CSV so they are not lost when you close the page.'
    );
  }
}

export function loadState(): Persisted | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<Persisted>;
      if (data && Array.isArray(data.sessions)) {
        return { sessions: data.sessions.filter(isSession) };
      }
    }
    return migrateLegacy();
  } catch {
    return null;
  }
}

function isSession(s: unknown): s is Session {
  const o = s as Session;
  return (
    !!o &&
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    Array.isArray(o.t) &&
    Array.isArray(o.values)
  );
}

// Saves from the knee-tracker era stored Nx2 deviation arrays; convert them to
// single-point sessions once so old histories survive the upgrade.
function migrateLegacy(): Persisted | null {
  interface OldSession {
    id: string;
    name: string;
    unit: string;
    t: number[];
    dev: [number, number][];
    source: 'tracked' | 'csv';
    calibNote: string;
  }
  const raw = window.localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw) as { sessions?: OldSession[] };
  if (!data || !Array.isArray(data.sessions)) return null;
  const sessions: Session[] = data.sessions
    .filter((s) => s && Array.isArray(s.t) && Array.isArray(s.dev))
    .map((s) => ({
      id: s.id,
      name: s.name,
      measure: 'point',
      unit: s.unit === 'mm' ? 'mm' : 'px',
      t: s.t,
      values: s.dev.map((p) => p[0]),
      values2: s.dev.map((p) => p[1]),
      source: s.source ?? 'csv',
      calibNote: s.calibNote ?? '',
    }));
  return sessions.length ? { sessions } : null;
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* nothing to do */
  }
}
