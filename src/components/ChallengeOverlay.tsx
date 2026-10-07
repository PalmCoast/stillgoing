import { useEffect, useRef, useState } from 'react';
import { challengeHint } from '../lib/copy.ts';
import { HOLD_MS, SWIPE_PX } from '../lib/constants.ts';
import type { Challenge, SwipeDirection } from '../lib/engine.ts';

const RING = 2 * Math.PI * 52;

type Props = {
  challenge: Challenge;
  windowMs: number;
  ageMs: number;
  onSuccess: () => void;
};

export function ChallengeOverlay({ challenge, windowMs, ageMs, onSuccess }: Props) {
  const ratio = Math.max(0, Math.min(1, 1 - ageMs / windowMs));
  return (
    <section className="challenge" aria-labelledby="challenge-title">
      <div className="timebar" aria-hidden="true">
        <span style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <p className="challenge-kicker">Check</p>
      <h2 id="challenge-title">Still going?</h2>
      <p className="challenge-hint">{challengeHint(challenge)}</p>
      {challenge.kind === 'tap' && <TapMark x={challenge.x} y={challenge.y} onSuccess={onSuccess} />}
      {challenge.kind === 'hold' && <HoldMark onSuccess={onSuccess} />}
      {challenge.kind === 'swipe' && <SwipeMark direction={challenge.direction} onSuccess={onSuccess} />}
    </section>
  );
}

function TapMark({ x, y, onSuccess }: { x: number; y: number; onSuccess: () => void }) {
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="arena">
      <button
        ref={ref}
        type="button"
        className="mark"
        style={{ left: `calc(${x} * (100% - 118px))`, top: `calc(${y} * (100% - 118px))` }}
        onClick={() => {
          if (done) return;
          setDone(true);
          onSuccess();
        }}
      >
        <span className="sr">Tap the mark</span>
      </button>
    </div>
  );
}

function HoldMark({ onSuccess }: { onSuccess: () => void }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const doneRef = useRef(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const stop = (complete: boolean) => {
    cancelAnimationFrame(frameRef.current);
    startRef.current = null;
    if (doneRef.current) return;
    if (complete) {
      doneRef.current = true;
      setProgress(1);
      onSuccess();
      return;
    }
    setProgress(0);
  };

  const frame = (now: number) => {
    if (startRef.current === null) return;
    const next = Math.min(1, (now - startRef.current) / HOLD_MS);
    setProgress(next);
    if (next >= 1) {
      stop(true);
      return;
    }
    frameRef.current = requestAnimationFrame(frame);
  };

  const start = () => {
    if (doneRef.current || startRef.current !== null) return;
    startRef.current = performance.now();
    frameRef.current = requestAnimationFrame(frame);
  };

  return (
    <button
      ref={ref}
      type="button"
      className="hold"
      aria-label="Hold to confirm you are still going"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus({ preventScroll: true });
        start();
      }}
      onPointerUp={() => stop(false)}
      onPointerCancel={() => stop(false)}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.repeat) return;
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          stop(false);
        }
      }}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" className="ring-bg" />
        <circle
          cx="60"
          cy="60"
          r="52"
          className="ring-fg"
          style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - progress) }}
        />
      </svg>
      <span>{progress >= 1 ? 'Locked' : 'Hold'}</span>
      <span className="sr" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        Hold progress {Math.round(progress * 100)} percent
      </span>
    </button>
  );
}

function SwipeMark({ direction, onSuccess }: { direction: SwipeDirection; onSuccess: () => void }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const origin = useRef<{ x: number; y: number } | null>(null);
  const doneRef = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const finish = (dx: number, dy: number) => {
    if (doneRef.current) return;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const ok =
      (direction === 'left' && horizontal && dx <= -SWIPE_PX) ||
      (direction === 'right' && horizontal && dx >= SWIPE_PX) ||
      (direction === 'up' && !horizontal && dy <= -SWIPE_PX);
    if (!ok) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    doneRef.current = true;
    onSuccess();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const matched =
        (direction === 'left' && event.key === 'ArrowLeft') ||
        (direction === 'right' && event.key === 'ArrowRight') ||
        (direction === 'up' && event.key === 'ArrowUp');
      if (!matched || doneRef.current) return;
      event.preventDefault();
      doneRef.current = true;
      onSuccess();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [direction, onSuccess]);

  const label =
    direction === 'left' ? 'Swipe left' : direction === 'right' ? 'Swipe right' : 'Swipe up';

  return (
    <div
      ref={ref}
      className={`swipe dir-${direction}`}
      role="button"
      tabIndex={0}
      aria-label={`${label}. Arrow keys work too.`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!origin.current) return;
        setOffset({ x: event.clientX - origin.current.x, y: event.clientY - origin.current.y });
      }}
      onPointerUp={(event) => {
        if (!origin.current) return;
        const dx = event.clientX - origin.current.x;
        const dy = event.clientY - origin.current.y;
        origin.current = null;
        finish(dx, dy);
      }}
      onPointerCancel={() => {
        origin.current = null;
        setOffset({ x: 0, y: 0 });
      }}
    >
      <span className="chevron" aria-hidden="true" />
      <span
        className="knob"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        aria-hidden="true"
      />
      <span className="swipe-label">{label}</span>
    </div>
  );
}
