import { Button } from './ui/button.tsx';

function Speaker({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 10h3l5-4v12l-5-4H4z" fill="currentColor" />
      {off ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path
          d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a6.5 6.5 0 0 1 0 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      onClick={onToggle}
    >
      <Speaker off={muted} />
    </Button>
  );
}
