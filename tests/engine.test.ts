import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advance, createEngine, reduce, type EngineConfig } from '../src/lib/engine.ts';
import { formatClock, hpMax, hpNow } from '../src/lib/format.ts';

const quiet: EngineConfig = {
  durationMs: 10_000,
  challengeMinMs: 100_000,
  challengeMaxMs: 100_000,
  challengeWindowMs: 1_000,
  minRemainingForChallengeMs: 0,
};

const checks: EngineConfig = {
  durationMs: 120_000,
  challengeMinMs: 1_000,
  challengeMaxMs: 1_000,
  challengeWindowMs: 1_000,
  minRemainingForChallengeMs: 0,
};

test('lasting the full duration clears the boss', () => {
  const engine = advance(createEngine(quiet, () => 0), 10_000, quiet);
  assert.equal(engine.phase, 'clear');
  assert.equal(engine.elapsedMs, 10_000);
  assert.equal(engine.challenge, null);
});

test('a check appears on the jitter window and a timeout is a miss', () => {
  let engine = advance(createEngine(checks, () => 0), 1_000, checks);
  assert.equal(engine.phase, 'challenge');
  engine = advance(engine, 1_000, checks);
  assert.equal(engine.phase, 'live');
  assert.equal(engine.consecutiveMisses, 1);
  assert.equal(engine.combo, 0);
});

test('two misses in a row wipe the raid', () => {
  let engine = advance(createEngine(checks, () => 0), 1_000, checks);
  engine = advance(engine, 1_000, checks);
  engine = advance(engine, 1_000, checks);
  assert.equal(engine.phase, 'challenge');
  engine = advance(engine, 1_000, checks);
  assert.equal(engine.phase, 'wipe');
  assert.equal(engine.failReason, 'misses');
});

test('a hit clears the miss streak', () => {
  let engine = advance(createEngine(checks, () => 0), 1_000, checks);
  engine = advance(engine, 1_000, checks);
  engine = advance(engine, 1_000, checks);
  engine = reduce(engine, { type: 'success' }, checks, () => 0);
  assert.equal(engine.phase, 'live');
  assert.equal(engine.combo, 1);
  assert.equal(engine.consecutiveMisses, 0);
  engine = advance(engine, 1_000, checks);
  engine = advance(engine, 1_000, checks);
  assert.equal(engine.phase, 'live');
  assert.equal(engine.consecutiveMisses, 1);
});

test('leaving or bailing wipes, and a late hit does not', () => {
  const engine = createEngine(quiet, () => 0);
  assert.equal(reduce(engine, { type: 'away' }, quiet).failReason, 'away');
  assert.equal(reduce(engine, { type: 'bail' }, quiet).failReason, 'bail');
  assert.equal(reduce(engine, { type: 'success' }, quiet).phase, 'live');
  assert.equal(reduce(engine, { type: 'finish' }, quiet).phase, 'clear');
});

test('no check is spawned when the raid is about to end', () => {
  const config: EngineConfig = {
    durationMs: 30_000,
    challengeMinMs: 10_000,
    challengeMaxMs: 10_000,
    challengeWindowMs: 1_000,
    minRemainingForChallengeMs: 25_000,
  };
  const engine = advance(createEngine(config, () => 0), 15_000, config);
  assert.equal(engine.phase, 'live');
  assert.equal(engine.challenge, null);
  assert.equal(engine.nextChallengeAt, Number.POSITIVE_INFINITY);
});

test('clock and health formatting', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(1), '0:01');
  assert.equal(formatClock(90_000), '1:30');
  assert.equal(hpMax(10 * 60_000), 600);
  assert.equal(hpNow(0, 10 * 60_000), 600);
  assert.equal(hpNow(10 * 60_000, 10 * 60_000), 0);
});
