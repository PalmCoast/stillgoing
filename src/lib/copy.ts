import type { Challenge } from './engine.ts';

export function challengeHint(challenge: Challenge): string {
  if (challenge.kind === 'tap') return 'Tap the mark.';
  if (challenge.kind === 'hold') return 'Hold for a moment. Let go early and you can try again.';
  if (challenge.direction === 'left') return 'Swipe left.';
  if (challenge.direction === 'right') return 'Swipe right.';
  return 'Swipe up.';
}

export function cardFilename(choreId: string, at: number): string {
  const date = new Date(at);
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `still-going-${choreId}-${day}.png`;
}
