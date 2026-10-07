import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { getChore } from '../lib/chores.ts';
import { sfx } from '../lib/audio.ts';
import { formatClock, hpMax, hpNow, hpRatio } from '../lib/format.ts';
import type { Engine } from '../lib/engine.ts';
import { engineConfig, tuningFor, type Setup } from '../lib/runConfig.ts';
import { requestWakeLock } from '../lib/wake.ts';
import { useRaid } from '../hooks/useRaid.ts';
import { BossArt, type BossMood } from './BossArt.tsx';
import { ChallengeOverlay } from './ChallengeOverlay.tsx';
import { MuteButton } from './MuteButton.tsx';
import { Button } from './ui/button.tsx';

type Props = {
  setup: Setup;
  muted: boolean;
  onToggleMute: () => void;
  onEnd: (engine: Engine) => void;
};

export function RaidScreen({ setup, muted, onToggleMute, onEnd }: Props) {
  const chore = getChore(setup.choreId);
  const config = engineConfig(setup.minutes, setup.rehearsal);
  const tuning = tuningFor(setup.rehearsal);
  const { engine, succeed, bail, finish, setPaused } = useRaid(config, tuning.visibilityWipeMs, onEnd);
  const [confirm, setConfirm] = useState(false);
  const stayRef = useRef<HTMLButtonElement>(null);
  const liveNote = usePulseSound(engine);

  useEffect(() => {
    document.body.classList.add('lock');
    let release: (() => void) | null = null;
    const claim = () => {
      void requestWakeLock().then((next) => {
        release?.();
        release = next;
      });
    };
    claim();
    const onVisibility = () => {
      if (!document.hidden) claim();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.body.classList.remove('lock');
      document.removeEventListener('visibilitychange', onVisibility);
      release?.();
    };
  }, []);

  useEffect(() => {
    setPaused(confirm);
    if (!confirm) return;
    stayRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm, setPaused]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (event: KeyboardEvent) => {
      if (!event.shiftKey) return;
      if (event.key === 'C') finish();
      if (event.key === 'W') bail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bail, finish]);

  const ratio = hpRatio(engine.elapsedMs, engine.durationMs);
  const low = ratio > 0 && ratio < 0.2;
  const mood: BossMood = low ? 'low' : 'idle';
  const remaining = engine.durationMs - engine.elapsedMs;
  const raidClass = ['raid', engine.phase === 'challenge' ? 'is-challenge' : '', low ? 'is-low' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={raidClass} style={{ '--boss': chore.color } as CSSProperties}>
      <header className="raid-top">
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Bail
        </Button>
        <div className="raid-title">
          {setup.rehearsal && <span className="badge">Rehearsal</span>}
          <h1>{chore.boss}</h1>
        </div>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </header>

      <div className="hp-block">
        <div className="hp-row">
          <span>{low ? 'Finish it' : `${chore.boss} HP`}</span>
          <span>
            {hpNow(engine.elapsedMs, engine.durationMs)} / {hpMax(engine.durationMs)}
          </span>
        </div>
        <div
          className="hp"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={hpMax(engine.durationMs)}
          aria-valuenow={hpNow(engine.elapsedMs, engine.durationMs)}
          aria-label="Boss health. The clock is the health bar."
        >
          <div className={low ? 'hp-fill low' : 'hp-fill'} style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>

      <p className={low ? 'timer low' : 'timer'}>{formatClock(remaining)}</p>

      <div className="stage">
        <div className="glow" />
        <div key={engine.hitPulse} className={engine.hitPulse > 0 ? 'boss-wrap is-hit' : 'boss-wrap'}>
          <BossArt chore={chore.id} mood={mood} />
        </div>
        {engine.hitPulse > 0 && engine.phase !== 'challenge' && (
          <p className="hit-toast" key={`hit-${engine.hitPulse}`} aria-hidden="true">
            <strong>Still going</strong>
            <span>Combo ×{engine.combo}</span>
          </p>
        )}
      </div>

      <div className="hud">
        <p className="combo" key={engine.combo}>
          <span>Combo</span>
          <strong>{engine.combo > 0 ? engine.combo : '—'}</strong>
        </p>
        <p className="slips" aria-label={`Misses in a row: ${engine.consecutiveMisses} of 2`}>
          <span>Misses</span>
          <span className={engine.consecutiveMisses >= 1 ? 'pip on' : 'pip'} />
          <span className={engine.consecutiveMisses >= 2 ? 'pip on' : 'pip'} />
        </p>
      </div>

      {engine.phase !== 'challenge' && engine.consecutiveMisses === 1 && (
        <p className="slip-note" key={engine.missPulse}>
          One miss. One more wipes it.
        </p>
      )}
      {engine.phase !== 'challenge' && engine.consecutiveMisses === 0 && (
        <p className="stay">Phone stays here. You stay with the chore.</p>
      )}

      {engine.challenge && (
        <ChallengeOverlay
          key={engine.challenge.id}
          challenge={engine.challenge}
          windowMs={config.challengeWindowMs}
          ageMs={engine.elapsedMs - engine.challengeStartedAt}
          onSuccess={succeed}
        />
      )}

      <p className="sr" aria-live="polite">
        {liveNote}
      </p>

      {confirm && (
        <div className="confirm" role="alertdialog" aria-labelledby="bail-title" aria-describedby="bail-copy">
          <div className="confirm-card">
            <h2 id="bail-title">Leave this raid?</h2>
            <p id="bail-copy">Walking away counts as a wipe. The chore can wait. The boss will too.</p>
            <Button size="lg" ref={stayRef} onClick={() => setConfirm(false)}>
              Stay
            </Button>
            <Button variant="danger" size="lg" onClick={bail}>
              Leave
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function isFinalStretch(engine: Engine): boolean {
  const ratio = hpRatio(engine.elapsedMs, engine.durationMs);
  return ratio > 0 && ratio < 0.2;
}

function usePulseSound(engine: Engine): string {
  const previous = useRef(engine);
  const [note, setNote] = useState('');

  useEffect(() => {
    const prior = previous.current;
    if (engine.hitPulse !== prior.hitPulse && engine.hitPulse > 0) {
      sfx.hit();
      setNote('Still going. Combo up.');
    } else if (engine.missPulse !== prior.missPulse && engine.missPulse > 0 && engine.phase !== 'wipe') {
      sfx.miss();
      setNote('Missed a check. One more miss wipes the raid.');
    } else if (engine.phase === 'challenge' && prior.phase !== 'challenge') {
      sfx.alert();
      setNote('Still going? Answer the check.');
    } else if (isFinalStretch(engine) && !isFinalStretch(prior) && engine.phase !== 'clear' && engine.phase !== 'wipe') {
      sfx.stretch();
      setNote('Final stretch. Finish it.');
    }
    previous.current = engine;
  }, [engine]);

  return note;
}
