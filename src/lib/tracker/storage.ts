// Local persistence for returning users: sessions and case-study details are
// kept in localStorage so a practitioner tracking a client across multiple
// days finds their history waiting on the next visit. Everything stays on the
// device — same privacy story as the tracking itself.

import type { Session, StudyInfo } from './types';

const KEY = 'kneetracker.v1';

interface Persisted {
  sessions: Session[];
  study: StudyInfo;
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
    dev: s.dev.map((p) => [round(p[0], 3), round(p[1], 3)] as [number, number]),
  };
}

export function saveState(sessions: Session[], study: StudyInfo): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const payload: Persisted = { sessions: sessions.map(compact), study };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
    return null;
  } catch {
    return (
      'Could not save your history locally (storage is full or blocked). ' +
      'Export sessions as CSV so they are not lost when you close the page.'
    );
  }
}

export function loadState(): Persisted | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Persisted>;
    if (!data || !Array.isArray(data.sessions)) return null;
    const sessions = data.sessions.filter(
      (s): s is Session =>
        !!s &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        Array.isArray(s.t) &&
        Array.isArray(s.dev),
    );
    // Older saves may predate the date field.
    for (const s of sessions) {
      if (!s.date) s.date = new Date().toISOString().slice(0, 10);
    }
    const study: StudyInfo = {
      client: '',
      date: new Date().toISOString().slice(0, 10),
      assessor: '',
      movement: '',
      side: 'n/a',
      notes: '',
      ...(data.study ?? {}),
    };
    return { sessions, study };
  } catch {
    return null;
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
