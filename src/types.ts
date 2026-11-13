export type TierId = 'Thread' | 'Stitch' | 'Seam' | 'Cut' | 'Archive';
export type LaneId = 'vintage' | 'recut' | 'first_access';
export type Grade = 'A' | 'B' | 'C';
export type Condition = 'like_new' | 'loved' | 'worn_out';
export type LotStatus = 'collected' | 'graded' | 'vintage_lane' | 'recut' | 'fiber' | 'sold';
export type Fit = 'true' | 'small' | 'big';

export interface Settings {
  leaderboards: boolean;
  photos: boolean;
  dropReminder: boolean;
}

export interface User {
  id: string;
  name: string;
  handle?: string;
  initial: string;
  city: string;
  tier: TierId;
  points: number;
  leagueRank: number;
  keys?: number;
  size?: string;
  garmentsBack?: number;
  kgDisplaced?: number;
  lotsFollowed?: number;
  since?: string;
  followers?: number;
  curator?: boolean;
  heartsThisWeek?: number;
  looksCount?: number;
  fitNotesCount?: number;
  aesthetics?: string[];
  fit?: string;
  badges?: string[];
  settings?: Settings;
  age16plus?: boolean;
  returnQueue?: string[];
}

export interface Garment {
  id: string;
  name: string;
  short?: string;
  ref?: string;
  line?: string;
  era?: number;
  edit?: string;
  season?: string;
  color?: string;
  size?: string;
  bought?: number;
  weightKg?: number;
  listing?: string;
  /** Path under public/ or an absolute URL. Swap for a real product photo at any time. */
  image: string;
  tile: string;
}

export interface Lot {
  id: string;
  owner: string;
  garment: string;
  droppedAt: string;
  droppedOn: string;
  weightKg?: number;
  rfidConfirmed?: boolean;
  status: LotStatus[];
  grade?: Grade;
  keysAwarded: number;
  listing?: string;
  condition?: Condition;
}

export interface KeyEntry {
  user: string;
  delta: number;
  reason: 'return' | 'grade_bonus' | 'tier_bonus' | 'drop';
  lot?: string;
  lane?: LaneId;
  garment?: string;
  date: string;
  note: string;
}

export interface FitNote {
  by: string;
  size: string;
  fit?: Fit;
  text: string;
}

export interface Piece {
  id: string;
  garment: string;
  lane: LaneId;
  number: string;
  grade?: Grade;
  size?: string;
  price: number;
  original?: number;
  keys: number;
  fromLot?: string;
  story?: string;
  fitNotes?: FitNote[];
}

export interface Lane {
  id: LaneId;
  name: string;
  pieces: number;
  detail: string;
  garment: string;
}

export interface Drop {
  lot: string;
  opens: string;
  passOpens: string;
  reminder: string;
  totalPieces: number;
  available: number;
  lanes: Lane[];
  pieces: Piece[];
}

export interface DeckCard {
  id: string;
  garment: string;
  kind: 'new' | 'upcoming' | 'vintage' | 'recut';
  lane: string;
  grade: string;
  tag: string;
  meta: string;
  piece?: string;
  price?: number;
  keys?: number;
  owned?: boolean;
}

export interface Look {
  id: string;
  by: string;
  garment: string;
  tag: string;
  caption: string;
  hearts: number;
  recut?: boolean;
  audience?: 'city' | 'friends' | 'battle';
}

export interface Battle {
  id: string;
  title: string;
  a: { look: string; votes: number };
  b: { look: string; votes: number };
  prize: string;
}

export interface Milestone {
  at: number;
  reward: string;
  reached: boolean;
}

export interface CityGoal {
  season: string;
  city: string;
  target: number;
  current: number;
  mine: number;
  milestones: Milestone[];
  race: { city: string; share: number }[];
}

export interface TierDef {
  id: TierId;
  requirement: string;
  unlocks: string[];
}

export interface PointRules {
  return: number;
  look: number;
  heartsPer10: number;
  lookCap: number;
  fitNote: number;
  fitNoteWeeklyCap: number;
  repair: number;
  preOwnedSale: number;
  deckComplete: number;
  deckWeeklyCap: number;
  battleWin: number;
  purchase: number;
}

export interface LeagueRules {
  size: number;
  promote: number;
  relegate: number;
  resetDay: string;
}

export interface Rules {
  keysPerReturn: number;
  gradeABonusKeys: number;
  monthlyKeyCap: number;
  points: PointRules;
  league: LeagueRules;
  lanes: Record<LaneId, { keys: number; price: string; gradeBShare?: number; earlyHours?: number }>;
  dropTime: string;
  passEarlyMinutes: number;
  reminderMinutesBefore: number;
  passFromTier: TierId;
}

export interface ClosetItem {
  garment: string;
  label: string;
  status: string;
  piece?: string;
  preOwned?: boolean;
}

export interface Seed {
  me: string;
  clock: { start: string; store: string; bin: string };
  users: User[];
  league: { week: number; tier: TierId; city: string; members: [string, number][] };
  garments: Garment[];
  lots: Lot[];
  keyLedger: KeyEntry[];
  rules: Rules;
  tiers: TierDef[];
  deck: { perDay: number; swipedToday: number; hypedPieces: string[]; cards: DeckCard[] };
  drop: Drop;
  looks: Look[];
  battle: Battle;
  closets: Record<string, ClosetItem[]>;
  cityGoal: CityGoal;
  wrapped: { season: string; bestWeeklyRank: number; signatureEra: string; eraShare: number };
}

export interface Standing {
  id: string;
  name: string;
  initial: string;
  points: number;
}

export interface Certificate {
  piece: string;
  garment: string;
  number: string;
  grade?: Grade;
  paid: number;
  keys: number;
  date: string;
  dropLot: string;
}

export type PointAction =
  | 'return'
  | 'look'
  | 'fitNote'
  | 'repair'
  | 'preOwnedSale'
  | 'deckComplete'
  | 'battleWin'
  | 'purchase';
