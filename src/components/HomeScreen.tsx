import { useState, type CSSProperties } from 'react';
import {
  CHORES,
  DURATIONS,
  getChore,
  type ChoreId,
  type DurationMin,
} from '../lib/chores.ts';
import { formatClock, formatHours, formatWhen } from '../lib/format.ts';
import { liveStreak, rankFor, streakStatus, type Profile } from '../lib/profile.ts';
import { tuningFor } from '../lib/runConfig.ts';
import { useOnline } from '../hooks/useOnline.ts';
import { BossArt } from './BossArt.tsx';
import { MuteButton } from './MuteButton.tsx';
import { Button } from './ui/button.tsx';

type Props = {
  profile: Profile;
  muted: boolean;
  savesOn: boolean;
  rehearsal: boolean;
  onToggleMute: () => void;
  onStart: (choreId: ChoreId, minutes: DurationMin) => void;
};

export function HomeScreen({ profile, muted, savesOn, rehearsal, onToggleMute, onStart }: Props) {
  const [choreId, setChoreId] = useState<ChoreId>('dishes');
  const [minutes, setMinutes] = useState<DurationMin>(10);
  const online = useOnline();
  const chore = getChore(choreId);
  const streak = liveStreak(profile);
  const status = streakStatus(profile);
  const firstRun = profile.totalClears === 0;
  const away = tuningFor(false).visibilityWipeMs / 1000;

  const moveChore = (delta: number) => {
    const index = CHORES.findIndex((item) => item.id === choreId);
    const next = CHORES[(index + delta + CHORES.length) % CHORES.length];
    if (!next) return;
    setChoreId(next.id);
    document.getElementById(`chore-${next.id}`)?.focus();
  };

  const moveDuration = (delta: number) => {
    const index = DURATIONS.indexOf(minutes);
    const next = DURATIONS[(index + delta + DURATIONS.length) % DURATIONS.length];
    if (!next) return;
    setMinutes(next);
    document.getElementById(`dur-${next}`)?.focus();
  };

  return (
    <div className="home">
      <div className="home-wrap">
        <header className="topbar">
          <div className="topbar-row">
            <div>
              <p className="eyebrow">HackYard · a chore raid</p>
                <h1 className="wordmark">
                Still
                <br />
                <span>Going</span>
              </h1>
            </div>
            <MuteButton muted={muted} onToggle={onToggleMute} />
          </div>
          <p className="tagline">The game you play while you finish the chore.</p>
        </header>

        <section className="marquee" aria-label="Your record">
          <div>
            <span>Streak</span>
            <strong>{streak}</strong>
            <em>{streak === 1 ? 'day' : 'days'}</em>
          </div>
          <div>
            <span>Clears</span>
            <strong>{profile.totalClears}</strong>
            <em>{profile.totalClears === 1 ? 'raid' : 'raids'}</em>
          </div>
          <div>
            <span>XP</span>
            <strong>{profile.totalXp}</strong>
            <em>{profile.totalXp > 0 ? rankFor(profile.totalXp) : 'unranked'}</em>
          </div>
        </section>
        <p className="streak-note">
          {status === 'checked' && 'Checked in today.'}
          {status === 'at-risk' && 'Clear today to keep the streak.'}
          {status === 'none' && 'A clear starts the streak. A wipe does not break a day you already won.'}
          {profile.totalMinutes > 0 && ` ${formatHours(profile.totalMinutes)} of real chores.`}
        </p>

        {!online && <p className="banner offline">Offline. Raids still save on this phone.</p>}
        {!savesOn && (
          <p className="banner warn">This browser is not keeping saves. You can still play the raid.</p>
        )}
        {rehearsal && (
          <p className="banner rehearsal">
            Rehearsal is on. A 5 minute raid plays in about 24 seconds and does not touch your streak.
          </p>
        )}

        {firstRun && (
          <aside className="tip">
            <p className="tip-kicker">Before you hit start</p>
            <p>Start the raid when you start the chore. Keep the phone nearby. Stay with it.</p>
          </aside>
        )}

        <section className="block">
          <h2 id="chore-label">Pick a chore</h2>
          <div
            className="chore-grid"
            role="radiogroup"
            aria-labelledby="chore-label"
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                moveChore(1);
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveChore(-1);
              }
            }}
          >
            {CHORES.map((item) => {
              const best = profile.bestByChore[item.id];
              const selected = item.id === choreId;
              return (
                <button
                  key={item.id}
                  id={`chore-${item.id}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? 'chore-card is-on' : 'chore-card'}
                  style={{ '--boss': item.color } as CSSProperties}
                  onClick={() => setChoreId(item.id)}
                >
                  <BossArt chore={item.id} />
                  <span className="chore-label">{item.label}</span>
                  <span className="boss-name">{item.boss}</span>
                  <span className="best">{best ? `Best ${best.minutes}m` : 'Unfought'}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="block">
          <h2 id="time-label">How long</h2>
          <div
            className="duration-row"
            role="radiogroup"
            aria-labelledby="time-label"
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                moveDuration(1);
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveDuration(-1);
              }
            }}
          >
            {DURATIONS.map((value) => (
              <button
                key={value}
                id={`dur-${value}`}
                type="button"
                role="radio"
                aria-checked={value === minutes}
                className={value === minutes ? 'duration is-on' : 'duration'}
                onClick={() => setMinutes(value)}
              >
                <strong>{value}</strong>
                <span>min</span>
              </button>
            ))}
          </div>
          <p className="fine">The clock is the boss HP. {minutes * 60} HP for this raid.</p>
        </section>

        <section className="rules">
          <h2>How a raid works</h2>
          <p>
            A check lands every 40–50 seconds. Tap, hold, or swipe. Miss two in a row, or leave this
            screen for {away} seconds, and the raid wipes. Last the whole timer and the boss goes down,
            because the chore did.
          </p>
        </section>

        <section className="history">
          <h2>Recent raids</h2>
          {profile.history.length === 0 ? (
            <div className="empty">
              <p>No raids yet.</p>
              <p>Your streak starts with the first clear.</p>
            </div>
          ) : (
            <ul>
              {profile.history.map((entry) => {
                const item = getChore(entry.choreId);
                return (
                  <li key={entry.id} className={entry.outcome}>
                    <span className="when">{formatWhen(entry.at)}</span>
                    <span className="what">
                      {item.label}
                      <small>{item.boss}</small>
                    </span>
                    <span className="detail">
                      {entry.outcome === 'clear'
                        ? `Cleared · ${entry.minutes} min · +${entry.xp} XP`
                        : `Wiped · ${formatClock(entry.survivedMs)} in`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="colophon">
          {rehearsal ? (
            <a href="/">Exit rehearsal</a>
          ) : (
            <a href="?rehearsal=1">Rehearsal mode for a short demo</a>
          )}
          <span>Saves stay on this device. No account.</span>
          <span className="credit">
            Built during <a href="https://hackyard.tech" target="_blank" rel="noreferrer">HackYard Yard #4</a> by First Deploy{' '}
            <a href="https://x.com/firstdeployai" target="_blank" rel="noreferrer">@firstdeployai</a>
          </span>
        </footer>
      </div>

      <div className="dock">
        <div className="dock-inner">
          <p className="dock-label" aria-live="polite">
            <strong>{chore.boss}</strong>
            <span>
              {chore.blurb} {minutes} min · {minutes * 60} HP
            </span>
          </p>
          <Button size="lg" onClick={() => onStart(choreId, minutes)}>
            Start raid
          </Button>
        </div>
      </div>
    </div>
  );
}
