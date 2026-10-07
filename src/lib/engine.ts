export type ChallengeKind = 'tap' | 'hold' | 'swipe';
export type SwipeDirection = 'left' | 'right' | 'up';

export type Challenge =
  | { id: string; kind: 'tap'; x: number; y: number }
  | { id: string; kind: 'hold' }
  | { id: string; kind: 'swipe'; direction: SwipeDirection };

export type FailReason = 'misses' | 'away' | 'bail';

export type Phase = 'live' | 'challenge' | 'wipe' | 'clear';

export type Engine = {
  phase: Phase;
  elapsedMs: number;
  durationMs: number;
  combo: number;
  bestCombo: number;
  consecutiveMisses: number;
  challenge: Challenge | null;
  challengeStartedAt: number;
  nextChallengeAt: number;
  hitPulse: number;
  missPulse: number;
  failReason: FailReason | null;
  challengesHit: number;
  challengesFaced: number;
  lastKind: ChallengeKind | null;
  seq: number;
};

export type EngineConfig = {
  durationMs: number;
  challengeMinMs: number;
  challengeMaxMs: number;
  challengeWindowMs: number;
  minRemainingForChallengeMs: number;
};

export type Action =
  | { type: 'tick'; dt: number }
  | { type: 'success' }
  | { type: 'away' }
  | { type: 'bail' }
  | { type: 'finish' };

export type Rng = () => number;

const KINDS: ChallengeKind[] = ['tap', 'hold', 'swipe'];
const DIRECTIONS: SwipeDirection[] = ['left', 'right', 'up'];

function gap(config: EngineConfig, rng: Rng): number {
  const span = Math.max(0, config.challengeMaxMs - config.challengeMinMs);
  return config.challengeMinMs + rng() * span;
}

function makeChallenge(engine: Engine, rng: Rng): Challenge {
  const pool = KINDS.filter((kind) => kind !== engine.lastKind);
  const kind = pool[Math.floor(rng() * pool.length)] ?? 'tap';
  const id = `c${engine.seq}`;
  if (kind === 'hold') {
    return { id, kind: 'hold' };
  }
  if (kind === 'swipe') {
    const direction = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)] ?? 'right';
    return { id, kind: 'swipe', direction };
  }
  return {
    id,
    kind: 'tap',
    x: rng(),
    y: rng(),
  };
}

function arm(engine: Engine, config: EngineConfig, rng: Rng): Engine {
  return {
    ...engine,
    nextChallengeAt: engine.elapsedMs + gap(config, rng),
  };
}

function trySpawn(engine: Engine, config: EngineConfig, rng: Rng): Engine {
  const remaining = engine.durationMs - engine.elapsedMs;
  if (remaining < config.minRemainingForChallengeMs) {
    return { ...engine, nextChallengeAt: Number.POSITIVE_INFINITY };
  }
  const challenge = makeChallenge(engine, rng);
  return {
    ...engine,
    phase: 'challenge',
    challenge,
    challengeStartedAt: engine.elapsedMs,
    lastKind: challenge.kind,
    seq: engine.seq + 1,
  };
}

function miss(engine: Engine, config: EngineConfig, rng: Rng): Engine {
  const consecutiveMisses = engine.consecutiveMisses + 1;
  const base: Engine = {
    ...engine,
    phase: 'live',
    challenge: null,
    consecutiveMisses,
    combo: 0,
    challengesFaced: engine.challengesFaced + 1,
    missPulse: engine.missPulse + 1,
  };
  if (consecutiveMisses >= 2) {
    return { ...base, phase: 'wipe', failReason: 'misses' };
  }
  return arm(base, config, rng);
}

function succeed(engine: Engine, config: EngineConfig, rng: Rng): Engine {
  if (engine.phase !== 'challenge') return engine;
  const combo = engine.combo + 1;
  return arm(
    {
      ...engine,
      phase: 'live',
      challenge: null,
      combo,
      bestCombo: Math.max(engine.bestCombo, combo),
      consecutiveMisses: 0,
      challengesFaced: engine.challengesFaced + 1,
      challengesHit: engine.challengesHit + 1,
      hitPulse: engine.hitPulse + 1,
    },
    config,
    rng,
  );
}

function wipe(engine: Engine, reason: FailReason): Engine {
  if (engine.phase === 'wipe' || engine.phase === 'clear') return engine;
  return { ...engine, phase: 'wipe', failReason: reason, challenge: null };
}

function clear(engine: Engine): Engine {
  if (engine.phase === 'wipe' || engine.phase === 'clear') return engine;
  return {
    ...engine,
    phase: 'clear',
    elapsedMs: engine.durationMs,
    challenge: null,
  };
}

export function createEngine(config: EngineConfig, rng: Rng = Math.random): Engine {
  return {
    phase: 'live',
    elapsedMs: 0,
    durationMs: config.durationMs,
    combo: 0,
    bestCombo: 0,
    consecutiveMisses: 0,
    challenge: null,
    challengeStartedAt: 0,
    nextChallengeAt: gap(config, rng),
    hitPulse: 0,
    missPulse: 0,
    failReason: null,
    challengesHit: 0,
    challengesFaced: 0,
    lastKind: null,
    seq: 1,
  };
}

export function reduce(engine: Engine, action: Action, config: EngineConfig, rng: Rng = Math.random): Engine {
  if (action.type === 'away') return wipe(engine, 'away');
  if (action.type === 'bail') return wipe(engine, 'bail');
  if (action.type === 'finish') return clear(engine);
  if (action.type === 'success') return succeed(engine, config, rng);
  if (engine.phase === 'wipe' || engine.phase === 'clear') return engine;

  const step = Math.min(1000, Math.max(0, action.dt));
  let next: Engine = { ...engine, elapsedMs: engine.elapsedMs + step };
  if (next.elapsedMs >= next.durationMs) {
    return { ...next, elapsedMs: next.durationMs, phase: 'clear', challenge: null };
  }
  if (
    next.phase === 'challenge' &&
    next.elapsedMs - next.challengeStartedAt >= config.challengeWindowMs
  ) {
    next = miss(next, config, rng);
    if (next.phase === 'wipe') return next;
  }
  if (next.phase === 'live' && next.elapsedMs >= next.nextChallengeAt) {
    next = trySpawn(next, config, rng);
  }
  return next;
}

export function advance(engine: Engine, ms: number, config: EngineConfig, rng: Rng = () => 0): Engine {
  let next = engine;
  let left = ms;
  while (left > 0 && next.phase !== 'clear' && next.phase !== 'wipe') {
    const step = Math.min(500, left);
    next = reduce(next, { type: 'tick', dt: step }, config, rng);
    left -= step;
  }
  return next;
}
