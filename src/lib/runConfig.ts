import type { ChoreId, DurationMin } from './chores.ts';
import type { EngineConfig } from './engine.ts';

export type Setup = {
  id: string;
  choreId: ChoreId;
  minutes: DurationMin;
  rehearsal: boolean;
};

export type RunTuning = {
  rehearsal: boolean;
  challengeMinMs: number;
  challengeMaxMs: number;
  challengeWindowMs: number;
  visibilityWipeMs: number;
  minRemainingForChallengeMs: number;
  durationScale: number;
};

export function tuningFor(rehearsal: boolean): RunTuning {
  if (rehearsal) {
    return {
      rehearsal: true,
      challengeMinMs: 4500,
      challengeMaxMs: 6000,
      challengeWindowMs: 3200,
      visibilityWipeMs: 4000,
      minRemainingForChallengeMs: 3000,
      durationScale: 24 / 300,
    };
  }
  return {
    rehearsal: false,
    challengeMinMs: 40_000,
    challengeMaxMs: 50_000,
    challengeWindowMs: 7_000,
    visibilityWipeMs: 12_000,
    minRemainingForChallengeMs: 12_000,
    durationScale: 1,
  };
}

export function raidDurationMs(minutes: number, rehearsal: boolean): number {
  return Math.round(minutes * 60_000 * tuningFor(rehearsal).durationScale);
}

export function engineConfig(minutes: number, rehearsal: boolean): EngineConfig {
  const tuning = tuningFor(rehearsal);
  return {
    durationMs: raidDurationMs(minutes, rehearsal),
    challengeMinMs: tuning.challengeMinMs,
    challengeMaxMs: tuning.challengeMaxMs,
    challengeWindowMs: tuning.challengeWindowMs,
    minRemainingForChallengeMs: tuning.minRemainingForChallengeMs,
  };
}

export function readRehearsal(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('rehearsal');
}
