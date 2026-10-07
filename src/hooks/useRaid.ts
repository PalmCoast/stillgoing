import { useCallback, useEffect, useRef, useState } from 'react';
import { createEngine, reduce, type Action, type Engine, type EngineConfig } from '../lib/engine.ts';

export function useRaid(config: EngineConfig, visibilityWipeMs: number, onEnd: (engine: Engine) => void) {
  const configRef = useRef(config);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const [engine, setEngine] = useState(() => createEngine(config));
  const engineRef = useRef(engine);
  const endedRef = useRef(false);
  const pausedRef = useRef(false);
  const dropRef = useRef(false);
  const throttleRef = useRef<number | null>(null);

  const commit = useCallback((current: Engine, next: Engine, immediate: boolean) => {
    engineRef.current = next;
    const ended = next.phase === 'clear' || next.phase === 'wipe';
    const hot = next.phase === 'challenge' || current.phase === 'challenge';
    const pulse = next.hitPulse !== current.hitPulse || next.missPulse !== current.missPulse;
    const phaseChanged = next.phase !== current.phase;
    if (immediate || ended || hot || pulse || phaseChanged) {
      if (throttleRef.current !== null) {
        window.clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      setEngine(next);
    } else if (throttleRef.current === null) {
      throttleRef.current = window.setTimeout(() => {
        throttleRef.current = null;
        setEngine(engineRef.current);
      }, 100);
    }
    if (ended && !endedRef.current) {
      endedRef.current = true;
      onEndRef.current(next);
    }
  }, []);

  const dispatch = useCallback(
    (action: Action) => {
      if (endedRef.current) return;
      const current = engineRef.current;
      const next = reduce(current, action, configRef.current);
      commit(current, next, action.type !== 'tick');
    },
    [commit],
  );

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
    if (!paused) dropRef.current = true;
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (dropRef.current || pausedRef.current || document.hidden) {
        dropRef.current = false;
        last = now;
        frame = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(1000, Math.max(0, now - last));
      last = now;
      if (dt > 0) dispatch({ type: 'tick', dt });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    let wipeTimer: number | undefined;
    const onVisibility = () => {
      window.clearTimeout(wipeTimer);
      if (document.hidden) {
        wipeTimer = window.setTimeout(() => dispatch({ type: 'away' }), visibilityWipeMs);
        return;
      }
      dropRef.current = true;
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(wipeTimer);
      if (throttleRef.current !== null) window.clearTimeout(throttleRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dispatch, visibilityWipeMs]);

  const succeed = useCallback(() => dispatch({ type: 'success' }), [dispatch]);
  const bail = useCallback(() => dispatch({ type: 'bail' }), [dispatch]);
  const finish = useCallback(() => dispatch({ type: 'finish' }), [dispatch]);

  return { engine, succeed, bail, finish, setPaused };
}
