import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Battle,
  Certificate,
  CityGoal,
  Condition,
  Fit,
  Grade,
  KeyEntry,
  Look,
  Lot,
  PointAction,
  Settings,
  Standing,
  TierId,
} from './types';
import { ME, garment, me, piece, seed, seedStandings } from './seed';
import {
  buy,
  canEnterDrop,
  gradeBonusKeys,
  hasPass,
  keyBalance,
  keysEarned,
  keysEarnedInMonth,
  keysForReturn,
  pointsFor,
  rankOf,
  rankStandings,
  tierFor,
  tierIndex,
  vote as voteRule,
  weeklyLeagueResult,
} from './rules';
import { addDays, cap } from './format';

export interface PointsEntry {
  action: PointAction;
  points: number;
  date: string;
  note: string;
}

export interface ReturnResult {
  lot: string;
  garment: string;
  keys: number;
  points: number;
  rankBefore: number;
  rankAfter: number;
  time: string;
}

interface Data {
  onboarded: boolean;
  city: string;
  age16plus: boolean;
  settings: Settings;
  tier: TierId;
  tierBeforeWeekEnd: TierId | null;
  promoted: boolean;
  /** Demo clock, "YYYY-MM-DDTHH:mm". Moves forward when you jump to the drop. */
  now: string;
  ledger: KeyEntry[];
  lots: Lot[];
  pointsLog: PointsEntry[];
  condition: Condition;
  returnsDone: number;
  lastReturn: ReturnResult | null;
  deck: { i: number; hyped: string[]; passed: string[]; last: 'hype' | 'pass' | null; lastCard: string | null };
  weekly: { fitNote: number; deck: number };
  fitNotes: Record<string, Fit>;
  hypedPieces: string[];
  myLooks: Look[];
  hearted: string[];
  following: string[];
  askedFit: string[];
  followedLots: string[];
  battleChoice: 'a' | 'b' | null;
  dropLive: boolean;
  certificates: Certificate[];
  lastPurchase: string | null;
  cityAdded: number;
  judge: boolean;
  toast: { id: number; text: string } | null;
}

interface Actions {
  finishOnboarding: (o: { city: string; photos: boolean; age16plus: boolean }) => void;
  setCondition: (c: Condition) => void;
  confirmReturn: () => ReturnResult;
  gradeLot: (lotId: string) => void;
  followLot: (lotId: string) => void;
  swipe: (kind: 'hype' | 'pass') => void;
  addFitNote: (garmentId: string, fit: Fit) => number;
  heart: (lookId: string) => void;
  postLook: (l: { garment: string; caption: string; tag: string; audience: Look['audience'] }) => number;
  follow: (userId: string) => void;
  askFit: (userId: string) => void;
  vote: (side: 'a' | 'b') => void;
  endWeek: () => void;
  resetWeek: () => void;
  jumpToDrop: () => void;
  buyPiece: (pieceId: string) => boolean;
  toggleSetting: (k: keyof Settings) => void;
  setJudge: (on: boolean) => void;
  say: (text: string) => void;
  clearToast: () => void;
  reset: () => void;
}

export type State = Data & Actions;

const initial = (): Data => ({
  onboarded: false,
  city: me().city,
  age16plus: me().age16plus ?? false,
  settings: { ...(me().settings as Settings) },
  tier: me().tier,
  tierBeforeWeekEnd: null,
  promoted: false,
  now: seed.clock.start,
  ledger: [...seed.keyLedger],
  lots: seed.lots.map((l) => ({ ...l, status: [...l.status] })),
  pointsLog: [],
  condition: 'like_new',
  returnsDone: 0,
  lastReturn: null,
  deck: { i: 0, hyped: [], passed: [], last: null, lastCard: null },
  weekly: { fitNote: 10, deck: 5 },
  fitNotes: {},
  hypedPieces: [...seed.deck.hypedPieces],
  myLooks: [],
  hearted: [],
  following: [],
  askedFit: [],
  followedLots: [],
  battleChoice: null,
  dropLive: false,
  certificates: [],
  lastPurchase: null,
  cityAdded: 0,
  judge: false,
  toast: null,
});

const GRADE_FOR: Record<Condition, Grade> = { like_new: 'A', loved: 'B', worn_out: 'C' };

/* ---------- Selectors: every number on screen comes from here ---------- */

export const selKeys = (s: Data) => keyBalance(s.ledger, ME);
export const selKeysEarned = (s: Data) => keysEarned(s.ledger, ME);
export const selDropsEntered = (s: Data) => s.ledger.filter((e) => e.user === ME && e.reason === 'drop').length;
export const selMonthEarned = (s: Data) => keysEarnedInMonth(s.ledger, ME, s.now.slice(0, 7));
export const selPoints = (s: Data) => me().points + s.pointsLog.reduce((n, e) => n + e.points, 0);
export const selStandings = (s: Data): Standing[] =>
  rankStandings(seedStandings().map((r) => (r.id === ME ? { ...r, points: selPoints(s) } : r)));
export const selRank = (s: Data) => rankOf(selStandings(s), ME);
export const selGarmentsBack = (s: Data) => (me().garmentsBack ?? 0) + s.returnsDone;
export const selKg = (s: Data) =>
  (me().kgDisplaced ?? 0) +
  s.lots.slice(seed.lots.length).reduce((n, l) => n + (l.weightKg ?? 0), 0);
export const selLotsFollowed = (s: Data) => (me().lotsFollowed ?? 0) + s.followedLots.length;
export const selMyLots = (s: Data) => s.lots.filter((l) => l.owner === ME);
export const selLatestLot = (s: Data) => selMyLots(s).at(-1)!;
export const selNextReturn = (s: Data) => {
  const q = me().returnQueue ?? ['g_trench'];
  return garment(q[s.returnsDone % q.length]);
};
export const selDeckCount = (s: Data) => seed.deck.swipedToday + s.deck.i;
export const selDeckDone = (s: Data) => s.deck.i >= seed.deck.cards.length;
export const selHypedToday = (s: Data) => seed.deck.hypedPieces.length + s.deck.hyped.length;
export const selAvailable = (s: Data) => seed.drop.available - s.certificates.length;
export const selHasPass = (s: Data) => hasPass(s.tier);
export const selBattle = (s: Data): Battle =>
  s.battleChoice ? voteRule(seed.battle, s.battleChoice).battle : seed.battle;
export const selGoal = (s: Data): CityGoal => ({
  ...seed.cityGoal,
  current: seed.cityGoal.current + s.cityAdded,
  mine: seed.cityGoal.mine + s.cityAdded,
});
/** The feed. Your own looks only show while photos are switched on. */
export const selLooks = (s: Data): Look[] =>
  [...s.myLooks, ...seed.looks]
    .filter((l) => l.by !== ME || s.settings.photos)
    .map((l) => ({ ...l, hearts: l.hearts + (s.hearted.includes(l.id) ? 1 : 0) }));
export const selBadges = (s: Data): string[] => {
  const b = new Set(me().badges ?? []);
  if (tierIndex(s.tier) >= tierIndex('Archive')) b.add('archive_insider');
  return [...b];
};

/* ---------- Store ---------- */

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),

      finishOnboarding: ({ city, photos, age16plus }) =>
        set((s) => ({
          onboarded: true,
          city,
          age16plus,
          // Leagues and battles are 16+ only.
          settings: { ...s.settings, photos, leaderboards: age16plus },
        })),

      setCondition: (condition) => set({ condition }),

      confirmReturn: () => {
        const s = get();
        const g = selNextReturn(s);
        const date = s.now.slice(0, 10);
        const keys = keysForReturn(undefined, selMonthEarned(s));
        const points = pointsFor('return');
        const lotId = String(Number(seed.drop.lot) + s.returnsDone * 14).padStart(4, '0');
        const rankBefore = selRank(s);
        const lot: Lot = {
          id: lotId,
          owner: ME,
          garment: g.id,
          droppedAt: `${seed.clock.store}, ${seed.clock.bin}`,
          droppedOn: s.now,
          weightKg: g.weightKg,
          rfidConfirmed: (g.bought ?? 0) >= 2022,
          status: ['collected'],
          keysAwarded: keys,
          listing: g.listing,
          condition: s.condition,
        };
        const ledger: KeyEntry[] = keys
          ? [...s.ledger, { user: ME, delta: keys, reason: 'return', lot: lotId, date, note: `${cap(g.short ?? g.name)} brought back` }]
          : s.ledger;
        const pointsLog: PointsEntry[] = [
          ...s.pointsLog,
          { action: 'return', points, date, note: `Lot ${lotId}` },
        ];
        set({ ledger, pointsLog, lots: [...s.lots, lot], returnsDone: s.returnsDone + 1, cityAdded: s.cityAdded + 1 });
        const result: ReturnResult = {
          lot: lotId,
          garment: g.id,
          keys,
          points,
          rankBefore,
          rankAfter: selRank(get()),
          time: s.now.slice(11),
        };
        set({ lastReturn: result });
        return result;
      },

      // Demo fast-forward for what the hub does two days later.
      gradeLot: (lotId) => {
        const s = get();
        const lot = s.lots.find((l) => l.id === lotId);
        if (!lot || lot.grade) return;
        const grade = GRADE_FOR[lot.condition ?? 'loved'];
        const bonus = gradeBonusKeys(grade, selMonthEarned(s));
        const g = garment(lot.garment);
        const date = addDays(lot.droppedOn.slice(0, 10), 2);
        set({
          lots: s.lots.map((l) =>
            l.id === lotId
              ? {
                  ...l,
                  grade,
                  keysAwarded: l.keysAwarded + bonus,
                  status: ['collected', 'graded', grade === 'C' ? 'recut' : 'vintage_lane'],
                }
              : l,
          ),
          ledger: bonus
            ? [...s.ledger, { user: ME, delta: bonus, reason: 'grade_bonus', lot: lotId, date, note: `${cap(g.short ?? g.name)} graded A at the hub` }]
            : s.ledger,
        });
      },

      followLot: (lotId) =>
        set((s) => (s.followedLots.includes(lotId) ? s : { followedLots: [...s.followedLots, lotId] })),

      swipe: (kind) => {
        const s = get();
        const card = seed.deck.cards[s.deck.i];
        if (!card) return;
        const i = s.deck.i + 1;
        const done = i >= seed.deck.cards.length;
        const bonus = done ? pointsFor('deckComplete', { earnedThisWeek: s.weekly.deck }) : 0;
        set({
          deck: {
            i,
            hyped: kind === 'hype' ? [...s.deck.hyped, card.id] : s.deck.hyped,
            passed: kind === 'pass' ? [...s.deck.passed, card.id] : s.deck.passed,
            last: kind,
            lastCard: card.id,
          },
          hypedPieces:
            kind === 'hype' && card.piece && !s.hypedPieces.includes(card.piece)
              ? [...s.hypedPieces, card.piece]
              : s.hypedPieces,
          weekly: done ? { ...s.weekly, deck: s.weekly.deck + bonus } : s.weekly,
          pointsLog: bonus
            ? [...s.pointsLog, { action: 'deckComplete', points: bonus, date: s.now.slice(0, 10), note: 'Daily deck finished' }]
            : s.pointsLog,
        });
      },

      addFitNote: (garmentId, fit) => {
        const s = get();
        if (s.fitNotes[garmentId]) return 0;
        const points = pointsFor('fitNote', { earnedThisWeek: s.weekly.fitNote });
        set({
          fitNotes: { ...s.fitNotes, [garmentId]: fit },
          weekly: { ...s.weekly, fitNote: s.weekly.fitNote + points },
          pointsLog: points
            ? [...s.pointsLog, { action: 'fitNote', points, date: s.now.slice(0, 10), note: garment(garmentId).name }]
            : s.pointsLog,
        });
        return points;
      },

      heart: (lookId) =>
        set((s) => ({
          hearted: s.hearted.includes(lookId) ? s.hearted.filter((x) => x !== lookId) : [...s.hearted, lookId],
        })),

      postLook: ({ garment: g, caption, tag, audience }) => {
        const s = get();
        if (!s.settings.photos) return 0;
        const points = pointsFor('look', { hearts: 0 });
        set({
          myLooks: [{ id: `my${s.myLooks.length + 1}`, by: ME, garment: g, caption, tag, hearts: 0, audience }, ...s.myLooks],
          pointsLog: [...s.pointsLog, { action: 'look', points, date: s.now.slice(0, 10), note: caption }],
        });
        return points;
      },

      follow: (userId) =>
        set((s) => ({
          following: s.following.includes(userId) ? s.following.filter((x) => x !== userId) : [...s.following, userId],
        })),

      askFit: (userId) => set((s) => ({ askedFit: [...s.askedFit, userId] })),

      vote: (side) => set((s) => (s.battleChoice || !s.age16plus ? s : { battleChoice: side })),

      endWeek: () => {
        const s = get();
        if (s.tierBeforeWeekEnd) return;
        const standings = selStandings(s);
        const { promoted } = weeklyLeagueResult(standings);
        const next = tierFor(s.tier, {
          rank: rankOf(standings, ME),
          leagueSize: standings.length,
          weeksInTop10: 2,
          returnsThisSeason: selGarmentsBack(s),
        });
        set({
          tierBeforeWeekEnd: s.tier,
          tier: next,
          promoted: promoted.includes(ME) && tierIndex(next) > tierIndex(s.tier),
        });
      },

      resetWeek: () =>
        set((s) => (s.tierBeforeWeekEnd ? { tier: s.tierBeforeWeekEnd, tierBeforeWeekEnd: null, promoted: false } : s)),

      jumpToDrop: () =>
        set((s) => ({ dropLive: true, now: selHasPass(s) ? seed.drop.passOpens : seed.drop.opens })),

      buyPiece: (pieceId) => {
        const s = get();
        const p = piece(pieceId);
        if (!p || s.certificates.some((c) => c.piece === pieceId)) return false;
        const keys = selKeys(s);
        const entry = canEnterDrop({ keys, tier: s.tier }, { keys: p.keys }, s.now);
        if (!entry.ok) return false;
        const date = s.now.slice(0, 10);
        const result = buy({ keys }, p, date);
        if (!result.ok || !result.certificate) return false;
        const g = garment(p.garment);
        set({
          ledger: [
            ...s.ledger,
            { user: ME, delta: -result.keysSpent, reason: 'drop', lane: p.lane, garment: p.garment, date, note: `${g.name}, ${p.number.split(' of ')[0]}` },
          ],
          certificates: [...s.certificates, result.certificate],
          lastPurchase: pieceId,
          // result.points is 0 by rule: nothing is added to the points log.
        });
        return true;
      },

      toggleSetting: (k) =>
        set((s) => {
          const on = !s.settings[k];
          return {
            settings: { ...s.settings, [k]: on },
            // Switching leagues on is also the 16+ confirmation (stated on the switch).
            age16plus: k === 'leaderboards' && on ? true : s.age16plus,
          };
        }),

      setJudge: (judge) => set({ judge }),
      say: (text) => set({ toast: { id: Date.now(), text } }),
      clearToast: () => set({ toast: null }),
      reset: () => set({ ...initial(), judge: get().judge }),
    }),
    {
      name: 'encore-demo-v1',
      partialize: (s) => {
        const { toast: _toast, ...rest } = s;
        return rest;
      },
    },
  ),
);
