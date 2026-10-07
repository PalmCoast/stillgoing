import { useEffect, useState } from 'react';
import { CrashBoundary } from './components/CrashBoundary.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { RaidScreen } from './components/RaidScreen.tsx';
import { ResultScreen } from './components/ResultScreen.tsx';
import { sfx } from './lib/audio.ts';
import { getChore } from './lib/chores.ts';
import type { Engine } from './lib/engine.ts';
import {
  applyClear,
  applyWipe,
  dateKey,
  loadMuted,
  loadProfile,
  saveMuted,
  saveProfile,
  storageAvailable,
  xpFor,
  type HistoryEntry,
  type Profile,
} from './lib/profile.ts';
import { readRehearsal, type Setup } from './lib/runConfig.ts';

type Screen =
  | { type: 'home' }
  | { type: 'raid'; setup: Setup }
  | { type: 'result'; setup: Setup; entry: HistoryEntry; profile: Profile; saved: boolean };

function raidId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `raid-${Date.now()}`;
}

function toEntry(setup: Setup, engine: Engine): HistoryEntry {
  const cleared = engine.phase === 'clear';
  return {
    id: setup.id,
    choreId: setup.choreId,
    minutes: setup.minutes,
    survivedMs: engine.elapsedMs,
    outcome: cleared ? 'clear' : 'wipe',
    reason: cleared ? null : engine.failReason,
    xp: cleared ? xpFor(setup.minutes, engine.bestCombo) : 0,
    combo: engine.bestCombo,
    at: Date.now(),
  };
}

export default function App() {
  const [rehearsal] = useState(readRehearsal);
  const [profile, setProfile] = useState(loadProfile);
  const [savesOn] = useState(storageAvailable);
  const [muted, setMuted] = useState(() => {
    const initial = loadMuted();
    sfx.setMuted(initial);
    return initial;
  });
  const [screen, setScreen] = useState<Screen>({ type: 'home' });

  useEffect(() => {
    if (screen.type === 'home') {
      document.title = 'Still Going';
      return;
    }
    const boss = getChore(screen.setup.choreId).boss;
    document.title = screen.type === 'raid' ? `${boss} · Still Going` : `Clear · ${boss}`;
  }, [screen]);

  const toggleMute = () => {
    setMuted((current) => {
      const next = !current;
      sfx.setMuted(next);
      saveMuted(next);
      sfx.unlock();
      if (!next) sfx.tap();
      return next;
    });
  };

  const finishRaid = (setup: Setup, engine: Engine) => {
    const entry = toEntry(setup, engine);
    if (setup.rehearsal) {
      setScreen({ type: 'result', setup, entry, profile, saved: true });
      return;
    }
    const next = entry.outcome === 'clear' ? applyClear(profile, entry, dateKey()) : applyWipe(profile, entry);
    const saved = saveProfile(next);
    setProfile(next);
    setScreen({ type: 'result', setup, entry, profile: next, saved });
  };

  return (
    <CrashBoundary>
      {screen.type === 'home' && (
        <HomeScreen
          profile={profile}
          muted={muted}
          savesOn={savesOn}
          rehearsal={rehearsal}
          onToggleMute={toggleMute}
          onStart={(choreId, minutes) => {
            sfx.unlock();
            sfx.tap();
            setScreen({
              type: 'raid',
              setup: { id: raidId(), choreId, minutes, rehearsal },
            });
          }}
        />
      )}
      {screen.type === 'raid' && (
        <RaidScreen
          key={screen.setup.id}
          setup={screen.setup}
          muted={muted}
          onToggleMute={toggleMute}
          onEnd={(engine) => finishRaid(screen.setup, engine)}
        />
      )}
      {screen.type === 'result' && (
        <ResultScreen
          setup={screen.setup}
          entry={screen.entry}
          profile={screen.profile}
          saved={screen.saved}
          onAgain={() =>
            setScreen({
              type: 'raid',
              setup: { ...screen.setup, id: raidId() },
            })
          }
          onHome={() => setScreen({ type: 'home' })}
        />
      )}
    </CrashBoundary>
  );
}
