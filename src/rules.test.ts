import { describe, expect, it } from 'vitest';
import {
  buy,
  canEnterDrop,
  cityGoalProgress,
  earnKeys,
  gradeBonusKeys,
  hasPass,
  keyBalance,
  keysEarnedInMonth,
  keysForReturn,
  pointsFor,
  priceFor,
  rankOf,
  scoreAction,
  tierFor,
  tierPerks,
  vote,
  weeklyLeagueResult,
} from './rules';
import { ME, me, piece, seed, seedStandings } from './seed';
import type { KeyEntry, Piece } from './types';

const drop = seed.drop;

describe('keys', () => {
  it('gives 1 key per garment and 2 if graded A', () => {
    expect(keysForReturn(undefined, 0)).toBe(1);
    expect(keysForReturn('B', 0)).toBe(1);
    expect(keysForReturn('C', 0)).toBe(1);
    expect(keysForReturn('A', 0)).toBe(2);
  });

  it('never takes a month above the cap of 10', () => {
    expect(keysForReturn('A', 9)).toBe(1);
    expect(keysForReturn('A', 10)).toBe(0);
    expect(keysForReturn(undefined, 10)).toBe(0);
    expect(keysForReturn('B', 12)).toBe(0);
  });

  it('lands the grade-A bonus later, inside the cap', () => {
    expect(gradeBonusKeys('A', 1)).toBe(1);
    expect(gradeBonusKeys('B', 1)).toBe(0);
    expect(gradeBonusKeys(undefined, 1)).toBe(0);
    expect(gradeBonusKeys('A', 10)).toBe(0);
  });

  it('sums the balance from the ledger', () => {
    const ledger: KeyEntry[] = [
      { user: 'x', delta: 2, reason: 'return', date: '2026-10-01', note: '' },
      { user: 'x', delta: -1, reason: 'drop', date: '2026-10-06', note: '' },
      { user: 'y', delta: 5, reason: 'return', date: '2026-10-01', note: '' },
    ];
    expect(keyBalance(ledger, 'x')).toBe(1);
  });

  it('counts only returns and grade bonuses toward the monthly cap', () => {
    const ledger: KeyEntry[] = [
      { user: 'x', delta: 1, reason: 'return', date: '2026-11-02', note: '' },
      { user: 'x', delta: 1, reason: 'grade_bonus', date: '2026-11-04', note: '' },
      { user: 'x', delta: 1, reason: 'tier_bonus', date: '2026-11-01', note: '' },
      { user: 'x', delta: -3, reason: 'drop', date: '2026-11-03', note: '' },
      { user: 'x', delta: 1, reason: 'return', date: '2026-10-30', note: '' },
    ];
    expect(keysEarnedInMonth(ledger, 'x', '2026-11')).toBe(2);
  });

  it('keeps the brief names as aliases', () => {
    expect(earnKeys).toBe(keysForReturn);
    expect(scoreAction).toBe(pointsFor);
  });
});

describe('Circular Score', () => {
  it('follows the points table', () => {
    expect(pointsFor('return')).toBe(50);
    expect(pointsFor('repair')).toBe(30);
    expect(pointsFor('preOwnedSale')).toBe(40);
    expect(pointsFor('battleWin')).toBe(20);
  });

  it('gives 0 for buying, whatever the context', () => {
    expect(pointsFor('purchase')).toBe(0);
    expect(pointsFor('purchase', { hearts: 999 })).toBe(0);
  });

  it('pays a look 15, +5 per 10 hearts, capped at 50 a post', () => {
    expect(pointsFor('look')).toBe(15);
    expect(pointsFor('look', { hearts: 9 })).toBe(15);
    expect(pointsFor('look', { hearts: 41 })).toBe(35);
    expect(pointsFor('look', { hearts: 212 })).toBe(50);
  });

  it('caps fit notes at 25 a week', () => {
    expect(pointsFor('fitNote', { earnedThisWeek: 0 })).toBe(5);
    expect(pointsFor('fitNote', { earnedThisWeek: 20 })).toBe(5);
    expect(pointsFor('fitNote', { earnedThisWeek: 25 })).toBe(0);
  });

  it('caps the daily deck at 35 a week', () => {
    expect(pointsFor('deckComplete', { earnedThisWeek: 30 })).toBe(5);
    expect(pointsFor('deckComplete', { earnedThisWeek: 35 })).toBe(0);
  });
});

describe('leagues and tiers', () => {
  const standings = seedStandings();

  it('moves the top 10 up and the bottom 10 down', () => {
    const { promoted, relegated, ranked } = weeklyLeagueResult(standings);
    expect(ranked).toHaveLength(50);
    expect(promoted).toHaveLength(10);
    expect(relegated).toHaveLength(10);
    expect(promoted).toContain(ME);
    expect(promoted).not.toContain('u_nadia');
    expect(promoted.some((id) => relegated.includes(id))).toBe(false);
  });

  it('ranks by points', () => {
    expect(rankOf(standings, 'u_lucia')).toBe(1);
    expect(rankOf(standings, ME)).toBe(4);
  });

  it('applies each tier requirement', () => {
    expect(tierFor('Thread', { rank: 20 })).toBe('Stitch');
    expect(tierFor('Thread', { rank: 21 })).toBe('Thread');
    expect(tierFor('Stitch', { rank: 3, weeksInTop10: 1 })).toBe('Stitch');
    expect(tierFor('Stitch', { rank: 3, weeksInTop10: 2 })).toBe('Seam');
    expect(tierFor('Seam', { rank: 4, returnsThisSeason: 1 })).toBe('Seam');
    expect(tierFor('Seam', { rank: 4, returnsThisSeason: 2 })).toBe('Cut');
    expect(tierFor('Seam', { rank: 11, returnsThisSeason: 9 })).toBe('Seam');
    expect(tierFor('Cut', { rank: 1 })).toBe('Cut');
    expect(tierFor('Cut', { rank: 1, seasonEnd: true, cityTopShare: 0.04 })).toBe('Archive');
  });

  it('relegates the bottom 10 and never below Thread', () => {
    expect(tierFor('Seam', { rank: 41 })).toBe('Stitch');
    expect(tierFor('Seam', { rank: 40 })).toBe('Seam');
    expect(tierFor('Thread', { rank: 50 })).toBe('Thread');
  });

  it('stacks perks from the tiers below', () => {
    expect(tierPerks('Thread')).toEqual(['Daily deck', 'City Looks feed']);
    expect(tierPerks('Cut')).toContain('Skip-the-line pass: drops 10 minutes early');
    expect(tierPerks('Cut')).toContain('+1 bonus key a month');
    expect(tierPerks('Seam')).not.toContain('Style Battle entry');
  });

  it('gives the pass from Seam, or to a battle winner', () => {
    expect(hasPass('Stitch')).toBe(false);
    expect(hasPass('Seam')).toBe(true);
    expect(hasPass('Archive')).toBe(true);
    expect(hasPass('Thread', true)).toBe(true);
  });
});

describe('drops', () => {
  const lanes = seed.rules.lanes;

  it('charges 1, 5 and 3 keys by lane', () => {
    expect(lanes.vintage.keys).toBe(1);
    expect(lanes.recut.keys).toBe(5);
    expect(lanes.first_access.keys).toBe(3);
  });

  it('opens at 10:00, or 09:50 with a pass', () => {
    const seam = { keys: 8, tier: 'Seam' as const };
    const stitch = { keys: 8, tier: 'Stitch' as const };
    expect(drop.opens.slice(11)).toBe('10:00');
    expect(drop.passOpens.slice(11)).toBe('09:50');
    expect(canEnterDrop(seam, lanes.vintage, '2026-11-17T09:49').ok).toBe(false);
    expect(canEnterDrop(seam, lanes.vintage, '2026-11-17T09:50').ok).toBe(true);
    expect(canEnterDrop(stitch, lanes.vintage, '2026-11-17T09:50')).toMatchObject({ ok: false, reason: 'not_open' });
    expect(canEnterDrop(stitch, lanes.vintage, '2026-11-17T10:00').ok).toBe(true);
    expect(canEnterDrop({ ...stitch, battleWinner: true }, lanes.vintage, '2026-11-17T09:50').ok).toBe(true);
  });

  it('needs enough keys for the lane', () => {
    const user = { keys: 4, tier: 'Seam' as const };
    expect(canEnterDrop(user, lanes.first_access, drop.opens).ok).toBe(true);
    expect(canEnterDrop(user, lanes.recut, drop.opens)).toMatchObject({ ok: false, reason: 'not_enough_keys' });
  });

  it('prices grade A at the original and grade B at 70%', () => {
    expect(priceFor({ lane: 'vintage', grade: 'A', price: 0, original: 39.95 })).toBe(39.95);
    expect(priceFor({ lane: 'vintage', grade: 'B', price: 0, original: 39.95 })).toBe(27.97);
    expect(priceFor({ lane: 'vintage', grade: 'B', price: 0, original: 100 })).toBe(70);
  });

  it('sells re-cut at the atelier price and first access at the store price', () => {
    expect(priceFor({ lane: 'recut', price: 189 })).toBe(189);
    expect(priceFor({ lane: 'first_access', price: 149 })).toBe(149);
  });

  it('never prices a seeded piece below the rule', () => {
    for (const p of drop.pieces) expect(p.price).toBe(priceFor(p));
  });

  it('spends the keys, charges the price and awards 0 points', () => {
    const skirt = piece('p_0417') as Piece;
    const result = buy({ keys: 8 }, skirt, '2026-11-17');
    expect(result).toMatchObject({ ok: true, keysSpent: 1, keysLeft: 7, charge: 39.95, points: 0, notifyLot: '0388' });
    expect(result.certificate).toMatchObject({ piece: 'p_0417', number: 'No. 0417 of 2,400', grade: 'A', paid: 39.95 });
  });

  it('refuses a purchase without enough keys', () => {
    const biker = piece('p_r07') as Piece;
    expect(buy({ keys: 4 }, biker, '2026-11-17')).toMatchObject({ ok: false, keysSpent: 0, keysLeft: 4, charge: 0 });
  });
});

describe('city goal', () => {
  it('reports progress and the next milestone', () => {
    const p = cityGoalProgress(seed.cityGoal);
    expect(p.percent).toBe(61);
    expect(p.reached.map((m) => m.at)).toEqual([25000, 50000]);
    expect(p.next?.at).toBe(75000);
    expect(p.toNext).toBe(13760);
  });

  it('reaches a milestone from the count, not the stored flag', () => {
    const p = cityGoalProgress({ ...seed.cityGoal, current: 75000 });
    expect(p.reached).toHaveLength(3);
    expect(p.next?.at).toBe(100000);
    expect(cityGoalProgress({ ...seed.cityGoal, current: 120000 }).ratio).toBe(1);
  });
});

describe('style battle', () => {
  it('counts one vote and moves the split', () => {
    const r = vote(seed.battle, 'b');
    expect(r.counted).toBe(true);
    expect(r.battle.b.votes).toBe(seed.battle.b.votes + 1);
    expect(r.battle.a.votes).toBe(seed.battle.a.votes);
    expect(r.shareA + r.shareB).toBe(100);
  });

  it('ignores a second vote', () => {
    const once = vote(seed.battle, 'b');
    const twice = vote(once.battle, 'a', once.choice);
    expect(twice.counted).toBe(false);
    expect(twice.choice).toBe('b');
    expect(twice.battle).toEqual(once.battle);
  });
});

describe('seed consistency', () => {
  it("matches Maya's key balance to her ledger", () => {
    expect(keyBalance(seed.keyLedger, ME)).toBe(me().keys);
  });

  it('never exceeds the cap in any seeded month', () => {
    for (const month of ['2026-09', '2026-10', '2026-11']) {
      expect(keysEarnedInMonth(seed.keyLedger, ME, month)).toBeLessThanOrEqual(seed.rules.monthlyKeyCap);
    }
  });

  it('matches league ranks and points to the user records', () => {
    const standings = seedStandings();
    expect(standings).toHaveLength(seed.rules.league.size);
    for (const u of seed.users) {
      expect(rankOf(standings, u.id)).toBe(u.leagueRank);
      expect(standings.find((s) => s.id === u.id)?.points).toBe(u.points);
    }
  });

  it('has one lot per garment Maya brought back', () => {
    expect(seed.lots.filter((l) => l.owner === ME)).toHaveLength(me().garmentsBack ?? 0);
    expect(seed.cityGoal.mine).toBe(me().garmentsBack);
  });

  it('opens the drop on a Tuesday at 10:00', () => {
    const [y, m, d] = drop.opens.slice(0, 10).split('-').map(Number);
    expect(new Date(Date.UTC(y, m - 1, d)).getUTCDay()).toBe(2);
  });

  it('points every reference at something that exists', () => {
    const garments = new Set(seed.garments.map((g) => g.id));
    const pieces = new Set(drop.pieces.map((p) => p.id));
    const lots = new Set(seed.lots.map((l) => l.id));
    for (const p of drop.pieces) {
      expect(garments.has(p.garment)).toBe(true);
      if (p.fromLot) expect(lots.has(p.fromLot)).toBe(true);
      expect(p.keys).toBe(seed.rules.lanes[p.lane].keys);
    }
    for (const c of seed.deck.cards) {
      expect(garments.has(c.garment)).toBe(true);
      if (c.piece) expect(pieces.has(c.piece)).toBe(true);
    }
    for (const id of seed.deck.hypedPieces) expect(pieces.has(id)).toBe(true);
    expect(seed.deck.swipedToday + seed.deck.cards.length).toBe(seed.deck.perDay);
  });
});
