export const DURATIONS = [5, 10, 15, 25] as const;

export type DurationMin = (typeof DURATIONS)[number];

export const CHORES = [
  {
    id: 'dishes',
    label: 'Dishes',
    boss: 'Sink Beast',
    blurb: 'Suds, plates, the long rinse.',
    clear: 'The sink is empty. So is the beast.',
    color: '#79e7ff',
  },
  {
    id: 'laundry',
    label: 'Laundry',
    boss: 'Laundry Drake',
    blurb: 'Loads, folds, the missing sock.',
    clear: 'Folded. The drake is down.',
    color: '#ff6d9a',
  },
  {
    id: 'trash',
    label: 'Trash',
    boss: 'Bin Wraith',
    blurb: 'Bags out. Lid down.',
    clear: 'Taken out. The wraith went with it.',
    color: '#c6f135',
  },
  {
    id: 'vacuum',
    label: 'Vacuum',
    boss: 'Dust Hydra',
    blurb: 'Every room, the edges too.',
    clear: 'The floor won. The hydra did not.',
    color: '#c49bff',
  },
  {
    id: 'desk',
    label: 'Desk',
    boss: 'Clutter Golem',
    blurb: 'Papers, mugs, the mystery pile.',
    clear: 'Clear desk. Fallen golem.',
    color: '#ffc14d',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    boss: 'Inbox Wyrm',
    blurb: 'The pile you keep stepping over.',
    clear: 'You faced the pile. The wyrm folded.',
    color: '#8eb6ff',
  },
  {
    id: 'workout',
    label: 'Workout',
    boss: 'Couch Titan',
    blurb: 'Move. That is the whole fight.',
    clear: 'You moved. The couch lost.',
    color: '#ff7a45',
  },
] as const;

export type Chore = (typeof CHORES)[number];
export type ChoreId = Chore['id'];

export function isChoreId(id: string): id is ChoreId {
  return CHORES.some((chore) => chore.id === id);
}

export function isDuration(value: number): value is DurationMin {
  return (DURATIONS as readonly number[]).includes(value);
}

export function getChore(id: ChoreId): Chore {
  const chore = CHORES.find((item) => item.id === id);
  if (!chore) {
    throw new Error(`Unknown chore: ${id}`);
  }
  return chore;
}
