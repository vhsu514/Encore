/**
 * Encore business rules as pure functions. No state, no I/O.
 * Source of truth: docs/PRODUCT_SPEC.md. Decisions on open points: docs/OPEN_QUESTIONS.md.
 */
import type {
  Battle,
  Certificate,
  CityGoal,
  Grade,
  KeyEntry,
  LeagueRules,
  Milestone,
  Piece,
  PointAction,
  Rules,
  Standing,
  TierDef,
  TierId,
} from './types';
import { seed } from './seed';

const R: Rules = seed.rules;

export const TIER_ORDER: TierId[] = ['Thread', 'Stitch', 'Seam', 'Cut', 'Archive'];
export const tierIndex = (t: TierId) => TIER_ORDER.indexOf(t);

/* ---------- Keys ---------- */

/** Sum of every +/- in the ledger for one user. The balance is never stored. */
export function keyBalance(ledger: KeyEntry[], user: string): number {
  return ledger.filter((e) => e.user === user).reduce((n, e) => n + e.delta, 0);
}

/**
 * Keys earned from returns in a calendar month ("YYYY-MM").
 * Tier bonus keys do not count toward the cap (OPEN_QUESTIONS 5).
 */
export function keysEarnedInMonth(ledger: KeyEntry[], user: string, month: string): number {
  return ledger
    .filter(
      (e) =>
        e.user === user &&
        e.date.startsWith(month) &&
        (e.reason === 'return' || e.reason === 'grade_bonus'),
    )
    .reduce((n, e) => n + e.delta, 0);
}

/** Total keys ever earned (any positive entry). */
export function keysEarned(ledger: KeyEntry[], user: string): number {
  return ledger.filter((e) => e.user === user && e.delta > 0).reduce((n, e) => n + e.delta, 0);
}

/**
 * Keys granted for one returned Zara garment: 1, +1 if the hub grades it A,
 * never taking the month above the cap. Returns the keys actually granted.
 * Pass `undefined` for the grade while it is still pending at the hub.
 */
export function keysForReturn(
  grade: Grade | undefined,
  keysEarnedThisMonth: number,
  rules: Rules = R,
): number {
  const wanted = rules.keysPerReturn + (grade === 'A' ? rules.gradeABonusKeys : 0);
  const room = Math.max(0, rules.monthlyKeyCap - keysEarnedThisMonth);
  return Math.min(wanted, room);
}

/** The second key that lands later, when the hub grades the piece A. */
export function gradeBonusKeys(
  grade: Grade | undefined,
  keysEarnedThisMonth: number,
  rules: Rules = R,
): number {
  if (grade !== 'A') return 0;
  const room = Math.max(0, rules.monthlyKeyCap - keysEarnedThisMonth);
  return Math.min(rules.gradeABonusKeys, room);
}

/* ---------- Circular Score ---------- */

export interface PointContext {
  /** Hearts on a look (look action). */
  hearts?: number;
  /** Points already earned this week from the same capped action. */
  earnedThisWeek?: number;
}

/** Points for one circular action, respecting caps. Buying always earns 0. */
export function pointsFor(action: PointAction, ctx: PointContext = {}, rules: Rules = R): number {
  const p = rules.points;
  const capped = (value: number, weeklyCap: number) =>
    Math.max(0, Math.min(value, weeklyCap - (ctx.earnedThisWeek ?? 0)));
  switch (action) {
    case 'return':
      return p.return;
    case 'look':
      return Math.min(p.lookCap, p.look + Math.floor((ctx.hearts ?? 0) / 10) * p.heartsPer10);
    case 'fitNote':
      return capped(p.fitNote, p.fitNoteWeeklyCap);
    case 'repair':
      return p.repair;
    case 'preOwnedSale':
      return p.preOwnedSale;
    case 'deckComplete':
      return capped(p.deckComplete, p.deckWeeklyCap);
    case 'battleWin':
      return p.battleWin;
    case 'purchase':
      return 0;
  }
}

/* ---------- Tiers and leagues ---------- */

/** Standings sorted by points, highest first. Ties keep their incoming order. */
export function rankStandings<T extends { points: number }>(standings: T[]): T[] {
  return standings
    .map((s, i) => ({ s, i }))
    .sort((x, y) => y.s.points - x.s.points || x.i - y.i)
    .map((x) => x.s);
}

/** 1-based rank of one member, or 0 if absent. */
export function rankOf(standings: Standing[], id: string): number {
  return rankStandings(standings).findIndex((s) => s.id === id) + 1;
}

/** Sunday reset: the top N move up a tier, the bottom N move down. */
export function weeklyLeagueResult(
  standings: Standing[],
  league: LeagueRules = R.league,
): { ranked: Standing[]; promoted: string[]; relegated: string[] } {
  const ranked = rankStandings(standings);
  const promoted = ranked.slice(0, league.promote).map((s) => s.id);
  const relegated = ranked
    .slice(Math.max(league.promote, ranked.length - league.relegate))
    .map((s) => s.id);
  return { ranked, promoted, relegated };
}

export interface TierContext {
  /** Final rank in this week's league (1-based). */
  rank: number;
  leagueSize?: number;
  /** Consecutive weeks finished in the top 10, counting this one. */
  weeksInTop10?: number;
  returnsThisSeason?: number;
  /** True only at season end, when Archive is decided. */
  seasonEnd?: boolean;
  /** Share of the city ahead of you, 0 to 1 (0.05 = top 5%). */
  cityTopShare?: number;
}

/** The tier a member holds after the weekly reset. */
export function tierFor(current: TierId, ctx: TierContext, league: LeagueRules = R.league): TierId {
  const size = ctx.leagueSize ?? league.size;
  const i = tierIndex(current);
  const top = ctx.rank >= 1 && ctx.rank <= league.promote;
  const bottom = ctx.rank > size - league.relegate;

  if (bottom) return TIER_ORDER[Math.max(0, i - 1)];
  switch (current) {
    case 'Thread':
      return ctx.rank >= 1 && ctx.rank <= 20 ? 'Stitch' : 'Thread';
    case 'Stitch':
      return top && (ctx.weeksInTop10 ?? 1) >= 2 ? 'Seam' : 'Stitch';
    case 'Seam':
      return top && (ctx.returnsThisSeason ?? 0) >= 2 ? 'Cut' : 'Seam';
    case 'Cut':
      return ctx.seasonEnd && (ctx.cityTopShare ?? 1) <= 0.05 ? 'Archive' : 'Cut';
    case 'Archive':
      return 'Archive';
  }
}

/** Everything unlocked at a tier: its own perks plus those of every tier below. */
export function tierPerks(tier: TierId, tiers: TierDef[] = seed.tiers): string[] {
  return tiers.filter((t) => tierIndex(t.id) <= tierIndex(tier)).flatMap((t) => t.unlocks);
}

/** Skip-the-line pass: Seam and above, or a Style Battle winner. */
export function hasPass(tier: TierId, battleWinner = false, rules: Rules = R): boolean {
  return battleWinner || tierIndex(tier) >= tierIndex(rules.passFromTier);
}

/* ---------- Drops ---------- */

export interface EntryCheck {
  ok: boolean;
  reason?: 'not_open' | 'not_enough_keys';
  /** When the door opens for this user ("YYYY-MM-DDTHH:mm"). */
  opensAt: string;
}

/**
 * Can this user enter a lane right now? Needs enough keys, and the door must be open:
 * 10:00 for everyone, 09:50 with a pass. Times are local "YYYY-MM-DDTHH:mm" strings.
 */
export function canEnterDrop(
  user: { keys: number; tier: TierId; battleWinner?: boolean },
  lane: { keys: number },
  now: string,
  drop: { opens: string; passOpens: string } = seed.drop,
): EntryCheck {
  const opensAt = hasPass(user.tier, user.battleWinner) ? drop.passOpens : drop.opens;
  if (now < opensAt) return { ok: false, reason: 'not_open', opensAt };
  if (user.keys < lane.keys) return { ok: false, reason: 'not_enough_keys', opensAt };
  return { ok: true, opensAt };
}

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Vintage: grade A at the original price, grade B at 70% of it.
 * Re-cut: the atelier price. First access: the store price. Nothing is marked down.
 */
export function priceFor(piece: Pick<Piece, 'lane' | 'grade' | 'price' | 'original'>, rules: Rules = R): number {
  if (piece.lane === 'vintage' && piece.original != null) {
    const share = piece.grade === 'B' ? (rules.lanes.vintage.gradeBShare ?? 0.7) : 1;
    return cents(piece.original * share);
  }
  return cents(piece.price);
}

export interface Purchase {
  ok: boolean;
  keysSpent: number;
  keysLeft: number;
  charge: number;
  /** Always 0: status is never bought. */
  points: 0;
  certificate?: Certificate;
  /** The lot whose original owner is told their garment found its encore. */
  notifyLot?: string;
}

/** Spend the lane's keys, charge the price, add a certificate, award 0 points. */
export function buy(
  user: { keys: number },
  piece: Piece,
  date: string,
  dropLot: string = seed.drop.lot,
): Purchase {
  if (user.keys < piece.keys) {
    return { ok: false, keysSpent: 0, keysLeft: user.keys, charge: 0, points: 0 };
  }
  const charge = priceFor(piece);
  return {
    ok: true,
    keysSpent: piece.keys,
    keysLeft: user.keys - piece.keys,
    charge,
    points: 0,
    certificate: {
      piece: piece.id,
      garment: piece.garment,
      number: piece.number,
      grade: piece.grade,
      paid: charge,
      keys: piece.keys,
      date,
      dropLot,
    },
    notifyLot: piece.fromLot,
  };
}

/* ---------- City goal ---------- */

export interface GoalProgress {
  ratio: number;
  percent: number;
  reached: Milestone[];
  next?: Milestone;
  toNext: number;
  milestones: Milestone[];
}

/** Shared season goal. A milestone is reached when `current` passes it, whatever the stored flag says. */
export function cityGoalProgress(goal: Pick<CityGoal, 'current' | 'target' | 'milestones'>): GoalProgress {
  const milestones = goal.milestones.map((m) => ({ ...m, reached: goal.current >= m.at }));
  const next = milestones.find((m) => !m.reached);
  const ratio = Math.min(1, goal.current / goal.target);
  return {
    ratio,
    percent: Math.floor(ratio * 100),
    reached: milestones.filter((m) => m.reached),
    next,
    toNext: next ? next.at - goal.current : 0,
    milestones,
  };
}

/* ---------- Style Battle ---------- */

export interface VoteResult {
  battle: Battle;
  choice: 'a' | 'b';
  counted: boolean;
  shareA: number;
  shareB: number;
}

/** One vote per user per battle. A second vote changes nothing. */
export function vote(battle: Battle, side: 'a' | 'b', previous: 'a' | 'b' | null = null): VoteResult {
  const counted = previous === null;
  const next: Battle = counted
    ? { ...battle, [side]: { ...battle[side], votes: battle[side].votes + 1 } }
    : battle;
  const total = next.a.votes + next.b.votes;
  const shareA = total ? Math.round((next.a.votes / total) * 100) : 50;
  return { battle: next, choice: previous ?? side, counted, shareA, shareB: 100 - shareA };
}

/* Names used in the project brief. */
export const earnKeys = keysForReturn;
export const scoreAction = pointsFor;
