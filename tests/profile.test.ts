import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyClear,
  applyWipe,
  EMPTY_PROFILE,
  liveStreak,
  loadProfile,
  normalizeProfile,
  previousDateKey,
  saveProfile,
  xpFor,
  type HistoryEntry,
  type Profile,
} from '../src/lib/profile.ts';

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: overrides.id ?? 'raid-1',
    choreId: overrides.choreId ?? 'dishes',
    minutes: overrides.minutes ?? 10,
    survivedMs: overrides.survivedMs ?? 600_000,
    outcome: overrides.outcome ?? 'clear',
    reason: overrides.reason ?? null,
    xp: overrides.xp ?? 150,
    combo: overrides.combo ?? 1,
    at: overrides.at ?? Date.parse('2026-10-05T12:00:00'),
  };
}

function withStorage() {
  const mem = new Map<string, string>();
  const bin: Storage = {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    getItem: (key) => mem.get(key) ?? null,
    key: (index) => [...mem.keys()][index] ?? null,
    removeItem: (key) => {
      mem.delete(key);
    },
    setItem: (key, value) => {
      mem.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: bin,
    configurable: true,
    writable: true,
  });
}

test('streak grows across days, holds on the same day, and resets after a gap', () => {
  const today = '2026-10-05';
  const first = applyClear(EMPTY_PROFILE, entry(), today);
  assert.equal(first.currentStreak, 1);
  assert.equal(first.totalClears, 1);

  const sameDay = applyClear(first, entry({ id: 'raid-2' }), today);
  assert.equal(sameDay.currentStreak, 1);
  assert.equal(sameDay.totalClears, 2);

  const held: Profile = { ...first, lastClearDate: '2026-10-04', currentStreak: 4 };
  const next = applyClear(held, entry({ id: 'raid-3' }), today);
  assert.equal(next.currentStreak, 5);

  const cold: Profile = { ...first, lastClearDate: '2026-10-01', currentStreak: 4 };
  assert.equal(applyClear(cold, entry({ id: 'raid-4' }), today).currentStreak, 1);
  assert.equal(previousDateKey('2026-10-01'), '2026-09-30');
});

test('a missed day shows no live streak until the next clear', () => {
  const profile: Profile = { ...EMPTY_PROFILE, currentStreak: 6, lastClearDate: '2026-10-01' };
  assert.equal(liveStreak(profile, '2026-10-05'), 0);
  assert.equal(liveStreak({ ...profile, lastClearDate: '2026-10-04' }, '2026-10-05'), 6);
});

test('best clear keeps the longer raid and a wipe does not change the streak', () => {
  const today = '2026-10-05';
  const ten = applyClear(EMPTY_PROFILE, entry({ minutes: 10, combo: 1 }), today);
  const still = applyClear(ten, entry({ id: 'short', minutes: 5, combo: 9 }), today);
  assert.equal(still.bestByChore.dishes?.minutes, 10);

  const tied = applyClear(ten, entry({ id: 'tie', minutes: 10, combo: 4 }), today);
  assert.equal(tied.bestByChore.dishes?.combo, 4);

  const longer = applyClear(tied, entry({ id: 'long', minutes: 25, combo: 0 }), today);
  assert.equal(longer.bestByChore.dishes?.minutes, 25);

  const wiped = applyWipe(longer, entry({ id: 'wipe', outcome: 'wipe', reason: 'misses', xp: 0 }));
  assert.equal(wiped.currentStreak, longer.currentStreak);
  assert.equal(wiped.totalClears, longer.totalClears);
  assert.equal(wiped.history[0]?.outcome, 'wipe');
});

test('xp, history cap, corrupt saves, and refresh round-trip', () => {
  assert.equal(xpFor(10, 2), 170);
  let profile = EMPTY_PROFILE;
  for (let index = 0; index < 45; index += 1) {
    profile = applyClear(profile, entry({ id: `raid-${index}` }), '2026-10-05');
  }
  assert.equal(profile.history.length, 40);
  assert.equal(profile.history[0]?.id, 'raid-44');

  const messy = normalizeProfile({
    currentStreak: 'nope',
    totalXp: -4,
    history: [{ id: 1 }, { id: 'ok', choreId: 'laundry', minutes: 15, outcome: 'clear', at: 10 }],
    bestByChore: { nope: { minutes: 10 }, dishes: { minutes: 25, combo: 2 } },
  });
  assert.equal(messy.currentStreak, 0);
  assert.equal(messy.totalXp, 0);
  assert.equal(messy.history.length, 1);
  assert.equal(messy.bestByChore.dishes?.minutes, 25);
  assert.equal(messy.bestByChore.laundry, undefined);

  withStorage();
  assert.equal(saveProfile(profile), true);
  const loaded = loadProfile();
  assert.equal(loaded.totalClears, 45);
  assert.equal(loaded.history.length, 40);
  assert.equal(loaded.currentStreak, 1);
});
