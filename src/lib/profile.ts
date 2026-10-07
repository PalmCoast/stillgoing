import { HISTORY_LIMIT } from './constants.ts';
import { isChoreId, isDuration, type ChoreId, type DurationMin } from './chores.ts';
import type { FailReason } from './engine.ts';

export type RaidOutcome = 'clear' | 'wipe';

export type HistoryEntry = {
  id: string;
  choreId: ChoreId;
  minutes: DurationMin;
  survivedMs: number;
  outcome: RaidOutcome;
  reason: FailReason | null;
  xp: number;
  combo: number;
  at: number;
};

export type BestClear = {
  minutes: number;
  combo: number;
};

export type Profile = {
  currentStreak: number;
  lastClearDate: string | null;
  totalClears: number;
  totalXp: number;
  totalMinutes: number;
  bestByChore: Partial<Record<ChoreId, BestClear>>;
  history: HistoryEntry[];
};

export const STORAGE_KEY = 'still-going-v1';
export const MUTE_KEY = 'still-going-muted';

export const EMPTY_PROFILE: Profile = {
  currentStreak: 0,
  lastClearDate: null,
  totalClears: 0,
  totalXp: 0,
  totalMinutes: 0,
  bestByChore: {},
  history: [],
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function whole(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function dateKeyOf(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function readEntry(value: unknown): HistoryEntry | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || typeof raw.choreId !== 'string' || !isChoreId(raw.choreId)) return null;
  const minutes = whole(raw.minutes);
  if (!isDuration(minutes)) return null;
  const outcome = raw.outcome === 'clear' || raw.outcome === 'wipe' ? raw.outcome : null;
  if (!outcome) return null;
  const reason =
    raw.reason === 'misses' || raw.reason === 'away' || raw.reason === 'bail' ? raw.reason : null;
  return {
    id: raw.id,
    choreId: raw.choreId,
    minutes,
    survivedMs: whole(raw.survivedMs),
    outcome,
    reason: outcome === 'wipe' ? reason : null,
    xp: whole(raw.xp),
    combo: whole(raw.combo),
    at: whole(raw.at),
  };
}

export function normalizeProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') return { ...EMPTY_PROFILE, bestByChore: {}, history: [] };
  const raw = value as Record<string, unknown>;
  const bestByChore: Profile['bestByChore'] = {};
  if (raw.bestByChore && typeof raw.bestByChore === 'object') {
    for (const [key, entry] of Object.entries(raw.bestByChore as Record<string, unknown>)) {
      if (!isChoreId(key) || !entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const minutes = whole(record.minutes);
      if (!isDuration(minutes)) continue;
      bestByChore[key] = { minutes, combo: whole(record.combo) };
    }
  }
  const history = Array.isArray(raw.history)
    ? raw.history.map(readEntry).filter((entry): entry is HistoryEntry => entry !== null).slice(0, HISTORY_LIMIT)
    : [];
  return {
    currentStreak: whole(raw.currentStreak),
    lastClearDate: dateKeyOf(raw.lastClearDate),
    totalClears: whole(raw.totalClears),
    totalXp: whole(raw.totalXp),
    totalMinutes: whole(raw.totalMinutes),
    bestByChore,
    history,
  };
}

export function storageAvailable(): boolean {
  const bin = storage();
  if (!bin) return false;
  const probe = `${STORAGE_KEY}-probe`;
  try {
    bin.setItem(probe, '1');
    bin.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function loadProfile(): Profile {
  const bin = storage();
  if (!bin) return { ...EMPTY_PROFILE, bestByChore: {}, history: [] };
  try {
    const raw = bin.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROFILE, bestByChore: {}, history: [] };
    return normalizeProfile(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_PROFILE, bestByChore: {}, history: [] };
  }
}

export function saveProfile(profile: Profile): boolean {
  const bin = storage();
  if (!bin) return false;
  try {
    bin.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function loadMuted(): boolean {
  const bin = storage();
  if (!bin) return false;
  try {
    return bin.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  const bin = storage();
  if (!bin) return;
  try {
    bin.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // The raid still runs if this browser refuses storage.
  }
}

export function dateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function previousDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

export function xpFor(minutes: number, bestCombo: number): number {
  return minutes * 15 + bestCombo * 10;
}

export function liveStreak(profile: Profile, today = dateKey()): number {
  if (!profile.lastClearDate || profile.currentStreak <= 0) return 0;
  if (profile.lastClearDate === today || profile.lastClearDate === previousDateKey(today)) {
    return profile.currentStreak;
  }
  return 0;
}

export type StreakStatus = 'checked' | 'at-risk' | 'none';

export function streakStatus(profile: Profile, today = dateKey()): StreakStatus {
  const streak = liveStreak(profile, today);
  if (streak <= 0) return 'none';
  if (profile.lastClearDate === today) return 'checked';
  return 'at-risk';
}

export function rankFor(xp: number): string {
  if (xp >= 2000) return 'House legend';
  if (xp >= 800) return 'Closer';
  if (xp >= 300) return 'On a roll';
  if (xp >= 80) return 'In it';
  return 'Warming up';
}

function rememberBest(profile: Profile, entry: HistoryEntry): Profile['bestByChore'] {
  const bestByChore = { ...profile.bestByChore };
  const previous = bestByChore[entry.choreId];
  if (
    !previous ||
    entry.minutes > previous.minutes ||
    (entry.minutes === previous.minutes && entry.combo > previous.combo)
  ) {
    bestByChore[entry.choreId] = { minutes: entry.minutes, combo: entry.combo };
  }
  return bestByChore;
}

export function applyClear(profile: Profile, entry: HistoryEntry, today = dateKey()): Profile {
  const yesterday = previousDateKey(today);
  let currentStreak = profile.currentStreak;
  if (profile.lastClearDate === today) {
    currentStreak = Math.max(currentStreak, 1);
  } else if (profile.lastClearDate === yesterday) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }
  return {
    currentStreak,
    lastClearDate: today,
    totalClears: profile.totalClears + 1,
    totalXp: profile.totalXp + entry.xp,
    totalMinutes: profile.totalMinutes + entry.minutes,
    bestByChore: rememberBest(profile, entry),
    history: [entry, ...profile.history].slice(0, HISTORY_LIMIT),
  };
}

export function applyWipe(profile: Profile, entry: HistoryEntry): Profile {
  return {
    ...profile,
    bestByChore: { ...profile.bestByChore },
    history: [entry, ...profile.history].slice(0, HISTORY_LIMIT),
  };
}
