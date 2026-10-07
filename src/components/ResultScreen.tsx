import { useEffect, useMemo, useState } from 'react';
import { getChore } from '../lib/chores.ts';
import { cardFilename } from '../lib/copy.ts';
import { renderClearCard, type CardData } from '../lib/clearCard.ts';
import { sfx } from '../lib/audio.ts';
import { formatClock, wipeCopy } from '../lib/format.ts';
import { liveStreak, type HistoryEntry, type Profile } from '../lib/profile.ts';
import type { Setup } from '../lib/runConfig.ts';
import { BossArt } from './BossArt.tsx';
import { Confetti } from './Confetti.tsx';
import { Button } from './ui/button.tsx';

type Props = {
  setup: Setup;
  entry: HistoryEntry;
  profile: Profile;
  saved: boolean;
  onAgain: () => void;
  onHome: () => void;
};

export function ResultScreen({ setup, entry, profile, saved, onAgain, onHome }: Props) {
  const chore = getChore(entry.choreId);
  const cleared = entry.outcome === 'clear';
  const streak = liveStreak(profile);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [shareNote, setShareNote] = useState('');
  const canShare = typeof navigator.share === 'function';

  const card = useMemo<CardData>(
    () => ({
      chore,
      minutes: entry.minutes,
      survivedMs: entry.survivedMs,
      streak,
      xp: entry.xp,
      at: entry.at,
      rehearsal: setup.rehearsal,
      combo: entry.combo,
    }),
    [chore, entry, setup.rehearsal, streak],
  );

  useEffect(() => {
    if (cleared) sfx.clear();
    else sfx.wipe();
  }, [cleared]);

  useEffect(() => {
    if (!cleared) return;
    let cancel = false;
    let url = '';
    renderClearCard(card)
      .then((next) => {
        if (cancel) return;
        url = URL.createObjectURL(next);
        setImageUrl(url);
        setBlob(next);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancel) setStatus('error');
      });
    return () => {
      cancel = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [card, cleared, attempt]);

  const filename = cardFilename(chore.id, entry.at);

  const save = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (!blob) return;
    const file = new File([blob], filename, { type: 'image/png' });
    const text = `I stayed with ${chore.label.toLowerCase()} and dropped the ${chore.boss} in Still Going.`;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'Still Going' });
        return;
      }
      await navigator.share({ text, title: 'Still Going' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareNote('Sharing did not go through. The PNG save still works.');
    }
  };

  return (
    <div className={cleared ? 'result is-clear' : 'result is-wipe'}>
      <Confetti active={cleared} />
      <div className="result-inner">
        <BossArt chore={chore.id} mood={cleared ? 'down' : 'smug'} className="result-boss" />
        <p className="eyebrow">{setup.rehearsal ? 'Rehearsal' : cleared ? 'Raid clear' : 'Raid over'}</p>
        <h1>{cleared ? 'Boss down' : 'Wiped'}</h1>
        <p className="result-line">{cleared ? chore.clear : wipeCopy(entry.reason)}</p>
        {!cleared && <p className="result-sub">You were in it for {formatClock(entry.survivedMs)}.</p>}

        {cleared && (
          <div className="rewards" aria-label="Rewards">
            <div>
              <strong>+{entry.xp}</strong>
              <span>XP</span>
            </div>
            <div>
              <strong>{streak}</strong>
              <span>streak</span>
            </div>
            <div>
              <strong>{formatClock(entry.survivedMs)}</strong>
              <span>on the chore</span>
            </div>
          </div>
        )}
        {cleared && entry.combo > 1 && <p className="combo-note">Best combo {entry.combo}</p>}
        {setup.rehearsal && (
          <p className="banner rehearsal">Practice clear. Your streak and XP stay as they were.</p>
        )}
        {!setup.rehearsal && !saved && (
          <p className="banner warn">This clear did not stick in local storage. The celebration still counts for you.</p>
        )}

        {cleared && (
          <div className="card-slot">
            {status === 'loading' && <p className="card-state">Drawing your clear card…</p>}
            {status === 'error' && (
              <div className="card-state">
                <p>Could not draw the card.</p>
                <Button
                  variant="quiet"
                  onClick={() => {
                    setStatus('loading');
                    setImageUrl(null);
                    setBlob(null);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Try the card again
                </Button>
              </div>
            )}
            {status === 'ready' && imageUrl && (
              <img src={imageUrl} alt={`Clear card for ${chore.boss}, ${formatClock(entry.survivedMs)}, streak ${streak}`} />
            )}
          </div>
        )}

        {shareNote && <p className="banner warn">{shareNote}</p>}

        <div className="result-actions">
          {cleared && status === 'ready' && (
            <Button size="lg" onClick={save}>
              Save card
            </Button>
          )}
          {cleared && status === 'ready' && canShare && (
            <Button size="lg" variant="quiet" onClick={() => void share()}>
              Share
            </Button>
          )}
          <Button size="lg" variant={cleared ? 'quiet' : 'default'} onClick={onAgain}>
            {cleared ? 'Run it back' : 'Try again'}
          </Button>
          <Button size="lg" variant="ghost" onClick={onHome}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
