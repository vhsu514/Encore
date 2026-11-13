import XCTest
@testable import Encore

final class RulesTests: XCTestCase {
    private let seed = SeedData.shared
    private var rules: RuleSet { seed.rules }

    // MARK: Keys

    func testOneKeyPerGarmentTwoIfGradedA() {
        XCTAssertEqual(Rules.keysForReturn(grade: nil, earnedThisMonth: 0, rules: rules), 1)
        XCTAssertEqual(Rules.keysForReturn(grade: .b, earnedThisMonth: 0, rules: rules), 1)
        XCTAssertEqual(Rules.keysForReturn(grade: .c, earnedThisMonth: 0, rules: rules), 1)
        XCTAssertEqual(Rules.keysForReturn(grade: .a, earnedThisMonth: 0, rules: rules), 2)
    }

    func testMonthlyCapOfTen() {
        XCTAssertEqual(Rules.keysForReturn(grade: .a, earnedThisMonth: 9, rules: rules), 1)
        XCTAssertEqual(Rules.keysForReturn(grade: .a, earnedThisMonth: 10, rules: rules), 0)
        XCTAssertEqual(Rules.keysForReturn(grade: nil, earnedThisMonth: 12, rules: rules), 0)
        XCTAssertEqual(Rules.gradeBonusKeys(grade: .a, earnedThisMonth: 1, rules: rules), 1)
        XCTAssertEqual(Rules.gradeBonusKeys(grade: .b, earnedThisMonth: 1, rules: rules), 0)
        XCTAssertEqual(Rules.gradeBonusKeys(grade: .a, earnedThisMonth: 10, rules: rules), 0)
    }

    func testTierBonusKeysDoNotCountTowardTheCap() {
        let ledger = [
            KeyEntry(user: "x", delta: 1, reason: .returned, date: "2026-11-02", note: ""),
            KeyEntry(user: "x", delta: 1, reason: .gradeBonus, date: "2026-11-04", note: ""),
            KeyEntry(user: "x", delta: 1, reason: .tierBonus, date: "2026-11-01", note: ""),
            KeyEntry(user: "x", delta: -3, reason: .drop, date: "2026-11-03", note: ""),
            KeyEntry(user: "x", delta: 1, reason: .returned, date: "2026-10-30", note: ""),
        ]
        XCTAssertEqual(Rules.keysEarnedInMonth(ledger, user: "x", month: "2026-11"), 2)
        XCTAssertEqual(Rules.keyBalance(ledger, user: "x"), 1)
    }

    // MARK: Circular Score

    func testPointsTable() {
        XCTAssertEqual(Rules.points(for: .returned, rules: rules), 50)
        XCTAssertEqual(Rules.points(for: .repair, rules: rules), 30)
        XCTAssertEqual(Rules.points(for: .preOwnedSale, rules: rules), 40)
        XCTAssertEqual(Rules.points(for: .battleWin, rules: rules), 20)
    }

    func testBuyingEarnsZero() {
        XCTAssertEqual(Rules.points(for: .purchase, rules: rules), 0)
        XCTAssertEqual(Rules.points(for: .purchase, hearts: 999, rules: rules), 0)
    }

    func testLookPointsAndCaps() {
        XCTAssertEqual(Rules.points(for: .look, rules: rules), 15)
        XCTAssertEqual(Rules.points(for: .look, hearts: 41, rules: rules), 35)
        XCTAssertEqual(Rules.points(for: .look, hearts: 212, rules: rules), 50)
        XCTAssertEqual(Rules.points(for: .fitNote, earnedThisWeek: 20, rules: rules), 5)
        XCTAssertEqual(Rules.points(for: .fitNote, earnedThisWeek: 25, rules: rules), 0)
        XCTAssertEqual(Rules.points(for: .deckComplete, earnedThisWeek: 35, rules: rules), 0)
    }

    // MARK: Leagues and tiers

    func testTopTenUpBottomTenDown() {
        let result = Rules.weeklyLeagueResult(seed.standings, league: rules.league)
        XCTAssertEqual(result.promoted.count, 10)
        XCTAssertEqual(result.relegated.count, 10)
        XCTAssertTrue(result.promoted.contains(seed.me))
        XCTAssertFalse(result.promoted.contains("u_nadia"))
        XCTAssertTrue(Set(result.promoted).isDisjoint(with: result.relegated))
    }

    func testTierRequirements() {
        let league = rules.league
        XCTAssertEqual(Rules.tier(after: .thread, rank: 20, league: league), .stitch)
        XCTAssertEqual(Rules.tier(after: .thread, rank: 21, league: league), .thread)
        XCTAssertEqual(Rules.tier(after: .stitch, rank: 3, weeksInTop10: 1, league: league), .stitch)
        XCTAssertEqual(Rules.tier(after: .stitch, rank: 3, weeksInTop10: 2, league: league), .seam)
        XCTAssertEqual(Rules.tier(after: .seam, rank: 4, returnsThisSeason: 1, league: league), .seam)
        XCTAssertEqual(Rules.tier(after: .seam, rank: 4, returnsThisSeason: 2, league: league), .cut)
        XCTAssertEqual(Rules.tier(after: .seam, rank: 41, league: league), .stitch)
        XCTAssertEqual(Rules.tier(after: .thread, rank: 50, league: league), .thread)
        XCTAssertEqual(Rules.tier(after: .cut, rank: 1, seasonEnd: true, cityTopShare: 0.04, league: league), .archive)
    }

    func testPassFromSeamOrBattleWin() {
        XCTAssertFalse(Rules.hasPass(tier: .stitch, rules: rules))
        XCTAssertTrue(Rules.hasPass(tier: .seam, rules: rules))
        XCTAssertTrue(Rules.hasPass(tier: .thread, battleWinner: true, rules: rules))
    }

    // MARK: Drops

    func testDoorOpensAtTenOrNineFiftyWithAPass() {
        let drop = seed.drop
        XCTAssertFalse(Rules.canEnterDrop(keys: 8, tier: .seam, laneKeys: 1, now: "2026-11-17T09:49", drop: drop, rules: rules).ok)
        XCTAssertTrue(Rules.canEnterDrop(keys: 8, tier: .seam, laneKeys: 1, now: "2026-11-17T09:50", drop: drop, rules: rules).ok)
        XCTAssertFalse(Rules.canEnterDrop(keys: 8, tier: .stitch, laneKeys: 1, now: "2026-11-17T09:50", drop: drop, rules: rules).ok)
        XCTAssertTrue(Rules.canEnterDrop(keys: 8, tier: .stitch, laneKeys: 1, now: "2026-11-17T10:00", drop: drop, rules: rules).ok)
        XCTAssertEqual(Rules.canEnterDrop(keys: 4, tier: .seam, laneKeys: 5, now: drop.opens, drop: drop, rules: rules).blocked, .notEnoughKeys)
    }

    func testLaneKeyCosts() {
        XCTAssertEqual(rules.lane(.vintage).keys, 1)
        XCTAssertEqual(rules.lane(.recut).keys, 5)
        XCTAssertEqual(rules.lane(.firstAccess).keys, 3)
    }

    func testGradeBIsSeventyPercentAndNothingIsMarkedDown() {
        for piece in seed.drop.pieces {
            XCTAssertEqual(Rules.price(for: piece, rules: rules), piece.price, accuracy: 0.001)
            XCTAssertEqual(piece.keys, rules.lane(piece.lane).keys)
        }
        let cargo = seed.piece("p_0260")!
        XCTAssertEqual(Rules.price(for: cargo, rules: rules), 27.97, accuracy: 0.001)
    }

    func testBuyingSpendsKeysChargesPriceAwardsNoPoints() {
        let skirt = seed.piece("p_0417")!
        let result = Rules.buy(keys: 8, piece: skirt, date: "2026-11-17", dropLot: seed.drop.lot, rules: rules)
        XCTAssertTrue(result.ok)
        XCTAssertEqual(result.keysLeft, 7)
        XCTAssertEqual(result.charge, 39.95, accuracy: 0.001)
        XCTAssertEqual(result.points, 0)
        XCTAssertEqual(result.notifyLot, "0388")
        XCTAssertFalse(Rules.buy(keys: 4, piece: seed.piece("p_r07")!, date: "2026-11-17", dropLot: seed.drop.lot, rules: rules).ok)
    }

    // MARK: City goal and battle

    func testCityGoalProgress() {
        let p = Rules.cityGoalProgress(seed.cityGoal)
        XCTAssertEqual(p.percent, 61)
        XCTAssertEqual(p.next?.at, 75_000)
        XCTAssertEqual(p.toNext, 13_760)
    }

    func testOneVotePerBattle() {
        let once = Rules.vote(seed.battle, side: "b", previous: nil)
        XCTAssertTrue(once.counted)
        XCTAssertEqual(once.battle.b.votes, seed.battle.b.votes + 1)
        let twice = Rules.vote(once.battle, side: "a", previous: "b")
        XCTAssertFalse(twice.counted)
        XCTAssertEqual(twice.battle.a.votes, once.battle.a.votes)
    }

    // MARK: Seed consistency and the demo story

    func testSeedIsConsistent() {
        XCTAssertEqual(Rules.keyBalance(seed.keyLedger, user: seed.me), seed.meUser.keys)
        XCTAssertEqual(seed.standings.count, rules.league.size)
        XCTAssertEqual(Rules.rank(of: seed.me, in: seed.standings), seed.meUser.leagueRank)
        XCTAssertEqual(Dates.weekday(seed.drop.opens), 3, "the drop opens on a Tuesday")
        XCTAssertEqual(seed.deck.swipedToday + seed.deck.cards.count, seed.deck.perDay)
    }

    func testDemoStorySevenEightSeven() {
        let store = Store(seed: seed, defaults: nil)
        XCTAssertEqual(store.keys, 7)
        store.confirmReturn()
        XCTAssertEqual(store.keys, 8)
        XCTAssertEqual(store.points, seed.meUser.points + 50)
        XCTAssertEqual(store.rank, 3)
        store.endWeek()
        XCTAssertEqual(store.demo.tier, .cut)
        XCTAssertFalse(store.buy("p_0417"), "the door is still closed")
        store.jumpToDrop()
        let before = store.points
        XCTAssertTrue(store.buy("p_0417"))
        XCTAssertEqual(store.keys, 7)
        XCTAssertEqual(store.points, before, "buying earns 0 points")
        XCTAssertFalse(store.buy("p_0417"), "one of each piece")
    }
}
