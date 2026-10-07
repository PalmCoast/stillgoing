import { previousDateKey, dateKey, type HistoryEntry } from './profile.ts';

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatWhen(at: number, today = dateKey()): string {
  const key = dateKey(new Date(at));
  if (key === today) return 'Today';
  if (key === previousDateKey(today)) return 'Yesterday';
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatCardDate(at: number): { day: string; year: string } {
  const date = new Date(at);
  return {
    day: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    year: String(date.getFullYear()),
  };
}

export function wipeCopy(reason: HistoryEntry['reason']): string {
  if (reason === 'away') {
    return 'The screen went quiet. Bring the phone back to the task and run it again.';
  }
  if (reason === 'bail') {
    return 'You stepped out. That ends the raid. The chore is still yours when you want it.';
  }
  return 'Two checks slipped past. No speech. Pick it up again.';
}

export function hpNow(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.ceil(Math.max(0, durationMs - elapsedMs) / 1000);
}

export function hpMax(durationMs: number): number {
  return Math.ceil(Math.max(0, durationMs) / 1000);
}

export function hpRatio(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.min(1, Math.max(0, (durationMs - elapsedMs) / durationMs));
}
