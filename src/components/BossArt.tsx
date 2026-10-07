import type { ChoreId } from '../lib/chores.ts';

export type BossMood = 'idle' | 'low' | 'down' | 'smug';

type Props = {
  chore: ChoreId;
  mood?: BossMood;
  className?: string;
};

const ink = '#1a0c12';
const line = {
  stroke: ink,
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

function Eyes({
  x,
  y,
  gap = 26,
  r = 12,
  mood,
}: {
  x: number;
  y: number;
  gap?: number;
  r?: number;
  mood: BossMood;
}) {
  if (mood === 'down') {
    return (
      <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
        <path d={`M${x - gap - 7} ${y - 4} l14 10 M${x - gap + 7} ${y - 4} l-14 10`} />
        <path d={`M${x + gap - 7} ${y - 4} l14 10 M${x + gap + 7} ${y - 4} l-14 10`} />
      </g>
    );
  }
  const look = mood === 'smug' ? -2 : 2;
  return (
    <g>
      <circle cx={x - gap} cy={y} r={r} fill="#fff6ea" stroke={ink} strokeWidth="3" />
      <circle cx={x + gap} cy={y} r={r} fill="#fff6ea" stroke={ink} strokeWidth="3" />
      <circle className="pupil" cx={x - gap + look} cy={y + 2} r="4.5" fill={ink} />
      <circle className="pupil" cx={x + gap + look} cy={y + 1} r="4.5" fill={ink} />
    </g>
  );
}

function Mouth({ x, y, mood }: { x: number; y: number; mood: BossMood }) {
  const d =
    mood === 'down'
      ? `M${x - 16} ${y + 8} Q ${x} ${y - 8} ${x + 16} ${y + 8}`
      : mood === 'smug'
        ? `M${x - 20} ${y} Q ${x} ${y + 18} ${x + 20} ${y}`
        : `M${x - 14} ${y} Q ${x} ${y + 12} ${x + 14} ${y}`;
  return <path d={d} fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />;
}

function SinkBeast({ mood }: { mood: BossMood }) {
  return (
    <g>
      <circle cx="62" cy="78" r="14" fill="#e9fbff" opacity="0.85" />
      <circle cx="184" cy="64" r="10" fill="#e9fbff" opacity="0.8" />
      <circle cx="168" cy="96" r="7" fill="#ffffff" opacity="0.8" />
      <ellipse cx="120" cy="132" rx="74" ry="54" fill="#79e7ff" {...line} />
      <ellipse cx="120" cy="146" rx="46" ry="32" fill="#bff4ff" />
      <path d="M104 46 h32 a8 8 0 0 1 8 8 v10 h-48 v-10 a8 8 0 0 1 8 -8z" fill="#d5dde6" {...line} />
      <path d="M112 46 q8 -18 16 0" fill="none" stroke="#d5dde6" strokeWidth="6" strokeLinecap="round" />
      <path d="M120 64 v16" stroke="#9fd0ea" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="120" cy="86" rx="5" ry="7" fill="#e7fbff" />
      <Eyes x={120} y={124} mood={mood} />
      <Mouth x={120} y={150} mood={mood} />
      <circle cx="78" cy="146" r="7" fill="#ff8ab8" opacity="0.45" />
      <circle cx="162" cy="146" r="7" fill="#ff8ab8" opacity="0.45" />
    </g>
  );
}

function LaundryDrake({ mood }: { mood: BossMood }) {
  return (
    <g>
      <path d="M78 150 q-28 -10 -18 -48 q8 -20 28 -8" fill="#ffd0df" {...line} />
      <path d="M168 146 q30 -6 22 -46 q-8 -18 -28 -6" fill="#ffd0df" {...line} />
      <ellipse cx="120" cy="138" rx="58" ry="46" fill="#ff6d9a" {...line} />
      <circle cx="120" cy="132" r="22" fill="#2a1230" {...line} />
      <circle cx="120" cy="132" r="12" fill="#79e7ff" />
      <path d="M112 150 q10 16 22 -2 q-16 4 -22 2z" fill="#f6f1e7" {...line} />
      <ellipse cx="120" cy="78" rx="28" ry="24" fill="#ff8eb3" {...line} />
      <path d="M98 70 l-10 -18 l12 8 M142 70 l10 -18 l-12 8" fill="#f6f1e7" {...line} />
      <Eyes x={120} y={76} gap={12} r={7} mood={mood} />
      <Mouth x={120} y={90} mood={mood} />
    </g>
  );
}

function BinWraith({ mood }: { mood: BossMood }) {
  return (
    <g>
      <path d="M86 70 q-10 -36 18 -28 q8 -22 22 -6 q16 -24 24 2 q28 -10 16 32z" fill="#f6f1e7" opacity="0.85" />
      <path d="M78 108 h84 l-8 62 h-68z" fill="#c6f135" {...line} />
      <path d="M92 108 v62 M120 108 v62 M148 108 v62" stroke={ink} strokeWidth="3" opacity="0.35" />
      <ellipse cx="120" cy="104" rx="50" ry="12" fill="#d9f56a" {...line} />
      <path d="M74 96 h92" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="150" cy="92" rx="28" ry="8" fill="#eaff9a" {...line} transform="rotate(-18 150 92)" />
      <Eyes x={118} y={136} gap={18} r={9} mood={mood} />
      <path d="M156 156 q18 10 8 22 q-16 2 -22 -8 q8 -2 14 -14z" fill="#ffe56a" {...line} />
    </g>
  );
}

function DustHydra({ mood }: { mood: BossMood }) {
  return (
    <g>
      <rect x="86" y="118" width="68" height="52" rx="16" fill="#c49bff" {...line} />
      <rect x="98" y="130" width="44" height="22" rx="8" fill="#2a1238" />
      <path d="M104 118 C 70 90, 70 70, 92 58" fill="none" stroke="#c49bff" strokeWidth="14" strokeLinecap="round" />
      <path d="M120 118 C 120 70, 120 62, 120 48" fill="none" stroke="#d7c0ff" strokeWidth="14" strokeLinecap="round" />
      <path d="M136 118 C 170 92, 176 74, 156 54" fill="none" stroke="#c49bff" strokeWidth="14" strokeLinecap="round" />
      <circle cx="92" cy="52" r="16" fill="#e6d8ff" {...line} />
      <circle cx="120" cy="40" r="16" fill="#e6d8ff" {...line} />
      <circle cx="156" cy="50" r="16" fill="#e6d8ff" {...line} />
      <Eyes x={92} y={52} gap={6} r={4} mood={mood} />
      <Eyes x={120} y={40} gap={6} r={4} mood={mood} />
      <Eyes x={156} y={50} gap={6} r={4} mood={mood} />
      <circle cx="70" cy="150" r="10" fill="#efe6ff" opacity="0.7" />
      <circle cx="176" cy="142" r="14" fill="#efe6ff" opacity="0.55" />
    </g>
  );
}

function ClutterGolem({ mood }: { mood: BossMood }) {
  return (
    <g>
      <rect x="70" y="132" width="108" height="28" rx="6" fill="#8ec5ff" {...line} transform="rotate(-3 120 146)" />
      <rect x="64" y="108" width="112" height="28" rx="6" fill="#f6f1e7" {...line} transform="rotate(2 120 122)" />
      <rect x="76" y="86" width="96" height="26" rx="6" fill="#ffc14d" {...line} />
      <rect x="98" y="48" width="52" height="40" rx="8" fill="#fff6ea" {...line} />
      <path d="M150 58 h16 a12 12 0 0 1 0 24 h-16" fill="none" {...line} />
      <ellipse cx="124" cy="62" rx="16" ry="6" fill="#6b3a22" />
      <rect x="58" y="96" width="28" height="24" rx="3" fill="#ffe56a" {...line} transform="rotate(-8 72 108)" />
      <path d="M64 104 h16 M64 110 h12" stroke={ink} strokeWidth="2" />
      <Eyes x={124} y={78} gap={10} r={5} mood={mood} />
      <Mouth x={124} y={92} mood={mood} />
    </g>
  );
}

function InboxWyrm({ mood }: { mood: BossMood }) {
  return (
    <g>
      <rect x="46" y="132" width="54" height="36" rx="6" fill="#d5e4ff" {...line} transform="rotate(-12 73 150)" />
      <path d="M48 136 l24 16 l24 -16" fill="none" stroke={ink} strokeWidth="3" transform="rotate(-12 73 150)" />
      <rect x="92" y="112" width="58" height="40" rx="6" fill="#8eb6ff" {...line} />
      <path d="M94 116 l28 18 l28 -18" fill="none" stroke={ink} strokeWidth="3" />
      <rect x="128" y="70" width="70" height="48" rx="8" fill="#b9d0ff" {...line} />
      <path d="M132 76 l32 20 l32 -20" fill="none" stroke={ink} strokeWidth="3" />
      <Eyes x={164} y={96} gap={12} r={6} mood={mood} />
      <path d="M188 148 l18 8 l-4 16 l-20 -6z" fill="#ffc14d" {...line} />
      <circle cx="196" cy="156" r="4" fill={ink} />
    </g>
  );
}

function CouchTitan({ mood }: { mood: BossMood }) {
  return (
    <g>
      <rect x="78" y="78" width="84" height="70" rx="16" fill="#ff7a45" {...line} />
      <rect x="70" y="124" width="100" height="40" rx="16" fill="#ff9a6a" {...line} />
      <circle cx="62" cy="108" r="24" fill="#ff8b58" {...line} />
      <circle cx="178" cy="100" r="26" fill="#ff8b58" {...line} />
      <rect x="86" y="164" width="14" height="16" rx="3" fill="#e7c39a" {...line} />
      <rect x="140" y="164" width="14" height="16" rx="3" fill="#e7c39a" {...line} />
      <Eyes x={120} y={104} mood={mood} />
      <Mouth x={120} y={128} mood={mood} />
      <path d="M168 118 h22 v8 h-22z" fill="#2a1230" {...line} />
      <path d="M174 118 v-8" stroke={ink} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

const CREATURES = {
  dishes: SinkBeast,
  laundry: LaundryDrake,
  trash: BinWraith,
  vacuum: DustHydra,
  desk: ClutterGolem,
  inbox: InboxWyrm,
  workout: CouchTitan,
} as const;

export function BossArt({ chore, mood = 'idle', className }: Props) {
  const Creature = CREATURES[chore];
  return (
    <svg className={className} viewBox="0 0 240 200" role="img" aria-hidden="true">
      <ellipse cx="120" cy="184" rx="68" ry="10" fill="#000" opacity="0.28" />
      <Creature mood={mood} />
    </svg>
  );
}
