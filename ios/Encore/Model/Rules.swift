import Foundation

/// Encore business rules as pure functions. No state, no I/O.
/// Source of truth: docs/PRODUCT_SPEC.md. Decisions on open points: docs/OPEN_QUESTIONS.md.
enum Rules {

    // MARK: Keys

    /// Sum of every +/- in the ledger for one user. The balance is never stored.
    static func keyBalance(_ ledger: [KeyEntry], user: String) -> Int {
        ledger.filter { $0.user == user }.reduce(0) { $0 + $1.delta }
    }

    /// Keys earned from returns in a calendar month ("YYYY-MM"). Tier bonus keys do not count toward the cap.
    static func keysEarnedInMonth(_ ledger: [KeyEntry], user: String, month: String) -> Int {
        ledger
            .filter { $0.user == user && $0.date.hasPrefix(month) && ($0.reason == .returned || $0.reason == .gradeBonus) }
            .reduce(0) { $0 + $1.delta }
    }

    /// Total keys ever earned (any positive entry).
    static func keysEarned(_ ledger: [KeyEntry], user: String) -> Int {
        ledger.filter { $0.user == user && $0.delta > 0 }.reduce(0) { $0 + $1.delta }
    }

    /// Keys granted for one returned garment: 1, +1 if graded A, never taking the month above the cap.
    /// Pass nil for the grade while it is still pending at the hub.
    static func keysForReturn(grade: Grade?, earnedThisMonth: Int, rules: RuleSet) -> Int {
        let wanted = rules.keysPerReturn + (grade == .a ? rules.gradeABonusKeys : 0)
        return min(wanted, max(0, rules.monthlyKeyCap - earnedThisMonth))
    }

    /// The second key that lands later, when the hub grades the piece A.
    static func gradeBonusKeys(grade: Grade?, earnedThisMonth: Int, rules: RuleSet) -> Int {
        guard grade == .a else { return 0 }
        return min(rules.gradeABonusKeys, max(0, rules.monthlyKeyCap - earnedThisMonth))
    }

    // MARK: Circular Score

    /// Points for one circular action, respecting caps. Buying always earns 0.
    static func points(for action: PointAction, hearts: Int = 0, earnedThisWeek: Int = 0, rules: RuleSet) -> Int {
        let p = rules.points
        func capped(_ value: Int, _ weeklyCap: Int) -> Int { max(0, min(value, weeklyCap - earnedThisWeek)) }
        switch action {
        case .returned: return p.returned
        case .look: return min(p.lookCap, p.look + (hearts / 10) * p.heartsPer10)
        case .fitNote: return capped(p.fitNote, p.fitNoteWeeklyCap)
        case .repair: return p.repair
        case .preOwnedSale: return p.preOwnedSale
        case .deckComplete: return capped(p.deckComplete, p.deckWeeklyCap)
        case .battleWin: return p.battleWin
        case .purchase: return 0
        }
    }

    // MARK: Leagues and tiers

    /// Standings sorted by points, highest first. Ties keep their incoming order.
    static func ranked(_ standings: [Standing]) -> [Standing] {
        standings.enumerated()
            .sorted { $0.element.points != $1.element.points ? $0.element.points > $1.element.points : $0.offset < $1.offset }
            .map { $0.element }
    }

    /// 1-based rank of one member, or 0 if absent.
    static func rank(of id: String, in standings: [Standing]) -> Int {
        (ranked(standings).firstIndex { $0.id == id } ?? -1) + 1
    }

    /// Sunday reset: the top N move up a tier, the bottom N move down.
    static func weeklyLeagueResult(_ standings: [Standing], league: LeagueRules) -> (promoted: [String], relegated: [String]) {
        let r = ranked(standings)
        let promoted = r.prefix(league.promote).map { $0.id }
        let relegated = r.suffix(min(league.relegate, max(0, r.count - league.promote))).map { $0.id }
        return (Array(promoted), Array(relegated))
    }

    /// The tier a member holds after the weekly reset.
    static func tier(after current: Tier, rank: Int, leagueSize: Int? = nil, weeksInTop10: Int = 1,
                     returnsThisSeason: Int = 0, seasonEnd: Bool = false, cityTopShare: Double = 1,
                     league: LeagueRules) -> Tier {
        let size = leagueSize ?? league.size
        let top = rank >= 1 && rank <= league.promote
        if rank > size - league.relegate { return Tier.allCases[max(0, current.index - 1)] }
        switch current {
        case .thread: return rank >= 1 && rank <= 20 ? .stitch : .thread
        case .stitch: return top && weeksInTop10 >= 2 ? .seam : .stitch
        case .seam: return top && returnsThisSeason >= 2 ? .cut : .seam
        case .cut: return seasonEnd && cityTopShare <= 0.05 ? .archive : .cut
        case .archive: return .archive
        }
    }

    /// Everything unlocked at a tier: its own perks plus those of every tier below.
    static func perks(for tier: Tier, tiers: [TierDef]) -> [String] {
        tiers.filter { $0.id <= tier }.flatMap { $0.unlocks }
    }

    /// Skip-the-line pass: Seam and above, or a Style Battle winner.
    static func hasPass(tier: Tier, battleWinner: Bool = false, rules: RuleSet) -> Bool {
        battleWinner || tier >= rules.passFromTier
    }

    // MARK: Drops

    enum EntryBlock { case notOpen, notEnoughKeys }

    struct Entry {
        let ok: Bool
        let blocked: EntryBlock?
        /// When the door opens for this user ("YYYY-MM-DDTHH:mm").
        let opensAt: String
    }

    /// Needs enough keys, and the door must be open: 10:00 for everyone, 09:50 with a pass.
    /// Times are local "YYYY-MM-DDTHH:mm" strings, so plain string comparison orders them.
    static func canEnterDrop(keys: Int, tier: Tier, battleWinner: Bool = false, laneKeys: Int,
                             now: String, drop: Drop, rules: RuleSet) -> Entry {
        let opensAt = hasPass(tier: tier, battleWinner: battleWinner, rules: rules) ? drop.passOpens : drop.opens
        if now < opensAt { return Entry(ok: false, blocked: .notOpen, opensAt: opensAt) }
        if keys < laneKeys { return Entry(ok: false, blocked: .notEnoughKeys, opensAt: opensAt) }
        return Entry(ok: true, blocked: nil, opensAt: opensAt)
    }

    private static func cents(_ n: Double) -> Double { (n * 100).rounded() / 100 }

    /// Vintage: grade A at the original price, grade B at 70% of it.
    /// Re-cut: the atelier price. First access: the store price. Nothing is marked down.
    static func price(for piece: Piece, rules: RuleSet) -> Double {
        if piece.lane == .vintage, let original = piece.original {
            let share = piece.grade == .b ? (rules.lane(.vintage).gradeBShare ?? 0.7) : 1
            return cents(original * share)
        }
        return cents(piece.price)
    }

    struct Purchase {
        let ok: Bool
        let keysSpent: Int
        let keysLeft: Int
        let charge: Double
        /// Always 0: status is never bought.
        let points: Int
        let certificate: Certificate?
        /// The lot whose original owner is told their garment found its encore.
        let notifyLot: String?
    }

    /// Spend the lane's keys, charge the price, add a certificate, award 0 points.
    static func buy(keys: Int, piece: Piece, date: String, dropLot: String, rules: RuleSet) -> Purchase {
        guard keys >= piece.keys else {
            return Purchase(ok: false, keysSpent: 0, keysLeft: keys, charge: 0, points: 0, certificate: nil, notifyLot: nil)
        }
        let charge = price(for: piece, rules: rules)
        let cert = Certificate(piece: piece.id, garment: piece.garment, number: piece.number, grade: piece.grade,
                               paid: charge, keys: piece.keys, date: date, dropLot: dropLot)
        return Purchase(ok: true, keysSpent: piece.keys, keysLeft: keys - piece.keys, charge: charge, points: 0,
                        certificate: cert, notifyLot: piece.fromLot)
    }

    // MARK: City goal

    struct GoalProgress {
        let ratio: Double
        let percent: Int
        let milestones: [Milestone]
        let next: Milestone?
        let toNext: Int
    }

    /// A milestone is reached when `current` passes it, whatever the stored flag says.
    static func cityGoalProgress(_ goal: CityGoal) -> GoalProgress {
        let milestones = goal.milestones.map { Milestone(at: $0.at, reward: $0.reward, reached: goal.current >= $0.at) }
        let next = milestones.first { !$0.reached }
        let ratio = min(1, Double(goal.current) / Double(goal.target))
        return GoalProgress(ratio: ratio, percent: Int(ratio * 100), milestones: milestones, next: next,
                            toNext: next.map { $0.at - goal.current } ?? 0)
    }

    // MARK: Style Battle

    /// One vote per user per battle. A second vote changes nothing.
    static func vote(_ battle: Battle, side: String, previous: String?) -> (battle: Battle, counted: Bool, shareA: Int) {
        var next = battle
        let counted = previous == nil
        if counted {
            if side == "a" { next.a.votes += 1 } else { next.b.votes += 1 }
        }
        let total = next.a.votes + next.b.votes
        let shareA = total > 0 ? Int((Double(next.a.votes) / Double(total) * 100).rounded()) : 50
        return (next, counted, shareA)
    }
}
