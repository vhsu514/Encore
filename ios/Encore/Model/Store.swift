import Foundation
import Observation

/// Every screen in the Encore tab.
enum Route: Hashable {
    case scan, confirm, bin, keyLanding
    case lot(String)
    case swipe, deckDone
    case looks, postLook, battle
    case closet(String)
    case cityGoal
    case league, pass, wrapped, tiers
    case dropHome, dropLive
    case piece(String)
    case youreIn
    case keys, profile
}

struct PointsEntry: Codable {
    let action: PointAction
    let points: Int
    let date: String
    let note: String
}

struct ReturnResult: Codable {
    let lot: String
    let garment: String
    let keys: Int
    let points: Int
    let rankBefore: Int
    let rankAfter: Int
    let time: String
}

/// Everything that changes during the demo. Saved to UserDefaults after each change.
struct Demo: Codable {
    var onboarded = false
    var city: String
    var age16plus: Bool
    var settings: Settings
    var tier: Tier
    var tierBeforeWeekEnd: Tier?
    var promoted = false
    /// Demo clock, "YYYY-MM-DDTHH:mm". Moves forward when you jump to the drop.
    var now: String
    var ledger: [KeyEntry]
    var lots: [Lot]
    var pointsLog: [PointsEntry] = []
    var condition: Condition = .likeNew
    var returnsDone = 0
    var lastReturn: ReturnResult?
    var deckIndex = 0
    var deckHyped: [String] = []
    var deckPassed: [String] = []
    var lastSwipeHype: Bool?
    var weeklyFitNote = 10
    var weeklyDeck = 5
    var fitNotes: [String: Fit] = [:]
    var hypedPieces: [String]
    var myLooks: [Look] = []
    var hearted: [String] = []
    var following: [String] = []
    var askedFit: [String] = []
    var followedLots: [String] = []
    var battleChoice: String?
    var dropLive = false
    var certificates: [Certificate] = []
    var lastPurchase: String?
    var cityAdded = 0

    init(seed: Seed) {
        let me = seed.meUser
        city = me.city
        age16plus = me.age16plus ?? false
        settings = me.settings ?? Settings(leaderboards: true, photos: false, dropReminder: true)
        tier = me.tier
        now = seed.clock.start
        ledger = seed.keyLedger
        lots = seed.lots
        hypedPieces = seed.deck.hypedPieces
    }
}

@Observable
final class Store {
    let seed: Seed
    var demo: Demo { didSet { save() } }
    /// Navigation inside the Encore tab. Not saved.
    var path: [Route] = []
    /// A short confirmation line shown at the bottom of the screen. Not saved.
    var notice: String?

    private let defaults: UserDefaults?
    private static let key = "encore-demo-v1"

    init(seed: Seed = SeedData.shared, defaults: UserDefaults? = .standard) {
        self.seed = seed
        self.defaults = defaults
        if let data = defaults?.data(forKey: Store.key), let saved = try? JSONDecoder().decode(Demo.self, from: data) {
            demo = saved
        } else {
            demo = Demo(seed: seed)
        }
    }

    private func save() {
        guard let defaults, let data = try? JSONEncoder().encode(demo) else { return }
        defaults.set(data, forKey: Store.key)
    }

    var rules: RuleSet { seed.rules }
    var meID: String { seed.me }
    var me: User { seed.meUser }

    func say(_ text: String) {
        notice = text
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 2_600_000_000)
            if self.notice == text { self.notice = nil }
        }
    }

    // MARK: Navigation

    func go(_ route: Route) { path.append(route) }
    func home() { path.removeAll() }
    func replaceTop(with route: Route) {
        if !path.isEmpty { path.removeLast() }
        path.append(route)
    }

    // MARK: Derived values. Every number on screen comes from here.

    var keys: Int { Rules.keyBalance(demo.ledger, user: meID) }
    var keysEarned: Int { Rules.keysEarned(demo.ledger, user: meID) }
    var dropsEntered: Int { demo.ledger.filter { $0.user == meID && $0.reason == .drop }.count }
    var monthEarned: Int { Rules.keysEarnedInMonth(demo.ledger, user: meID, month: String(demo.now.prefix(7))) }
    var points: Int { me.points + demo.pointsLog.reduce(0) { $0 + $1.points } }
    var standings: [Standing] {
        Rules.ranked(seed.standings.map { $0.id == meID ? Standing(id: $0.id, name: $0.name, initial: $0.initial, points: points) : $0 })
    }
    var rank: Int { Rules.rank(of: meID, in: standings) }
    var garmentsBack: Int { (me.garmentsBack ?? 0) + demo.returnsDone }
    var kg: Double {
        (me.kgDisplaced ?? 0) + demo.lots.dropFirst(seed.lots.count).reduce(0.0) { $0 + ($1.weightKg ?? 0) }
    }
    var lotsFollowed: Int { (me.lotsFollowed ?? 0) + demo.followedLots.count }
    var myLots: [Lot] { demo.lots.filter { $0.owner == meID } }
    var latestLot: Lot { myLots.last ?? demo.lots[0] }
    var nextReturn: Garment {
        let queue = me.returnQueue ?? ["g_trench"]
        return seed.garment(queue[demo.returnsDone % queue.count])
    }
    var deckCount: Int { seed.deck.swipedToday + demo.deckIndex }
    var deckDone: Bool { demo.deckIndex >= seed.deck.cards.count }
    var currentCard: DeckCard? { deckDone ? nil : seed.deck.cards[demo.deckIndex] }
    var hypedToday: Int { seed.deck.hypedPieces.count + demo.deckHyped.count }
    var hypedInDrop: [Piece] { demo.hypedPieces.compactMap { seed.piece($0) } }
    var available: Int { seed.drop.available - demo.certificates.count }
    var hasPass: Bool { Rules.hasPass(tier: demo.tier, rules: rules) }
    var battle: Battle {
        guard let choice = demo.battleChoice else { return seed.battle }
        return Rules.vote(seed.battle, side: choice, previous: nil).battle
    }
    var goal: CityGoal {
        var g = seed.cityGoal
        g.current += demo.cityAdded
        g.mine += demo.cityAdded
        return g
    }
    /// The feed. Your own looks only show while photos are switched on.
    var looks: [Look] {
        (demo.myLooks + seed.looks)
            .filter { $0.by != meID || demo.settings.photos }
            .map { look in
                var l = look
                if demo.hearted.contains(l.id) { l.hearts += 1 }
                return l
            }
    }
    var badges: [String] {
        var b = me.badges ?? []
        if demo.tier >= .archive { b.append("archive_insider") }
        return b
    }
    func owns(_ pieceID: String) -> Bool { demo.certificates.contains { $0.piece == pieceID } }
    func price(_ piece: Piece) -> Double { Rules.price(for: piece, rules: rules) }
    func entry(for piece: Piece) -> Rules.Entry {
        Rules.canEnterDrop(keys: keys, tier: demo.tier, laneKeys: piece.keys, now: demo.now, drop: seed.drop, rules: rules)
    }

    // MARK: Actions

    func finishOnboarding(city: String, photos: Bool, age16plus: Bool) {
        demo.onboarded = true
        demo.city = city
        demo.age16plus = age16plus
        demo.settings.photos = photos
        // Leagues and battles are 16+ only.
        demo.settings.leaderboards = age16plus
    }

    @discardableResult
    func confirmReturn() -> ReturnResult {
        let g = nextReturn
        let date = String(demo.now.prefix(10))
        let keysGranted = Rules.keysForReturn(grade: nil, earnedThisMonth: monthEarned, rules: rules)
        let pts = Rules.points(for: .returned, rules: rules)
        let lotID = String(format: "%04d", (Int(seed.drop.lot) ?? 417) + demo.returnsDone * 14)
        let before = rank
        var d = demo
        d.lots.append(Lot(id: lotID, owner: meID, garment: g.id, droppedAt: "\(seed.clock.store), \(seed.clock.bin)",
                          droppedOn: demo.now, weightKg: g.weightKg, rfidConfirmed: (g.bought ?? 0) >= 2022,
                          status: [.collected], grade: nil, keysAwarded: keysGranted, listing: g.listing, condition: demo.condition))
        if keysGranted > 0 {
            d.ledger.append(KeyEntry(user: meID, delta: keysGranted, reason: .returned, lot: lotID, lane: nil, garment: nil,
                                     date: date, note: "\(g.shortName.capitalizedFirst) brought back"))
        }
        d.pointsLog.append(PointsEntry(action: .returned, points: pts, date: date, note: "Lot \(lotID)"))
        d.returnsDone += 1
        d.cityAdded += 1
        demo = d
        let result = ReturnResult(lot: lotID, garment: g.id, keys: keysGranted, points: pts, rankBefore: before,
                                  rankAfter: rank, time: String(demo.now.suffix(5)))
        demo.lastReturn = result
        return result
    }

    /// Demo fast-forward for what the hub does two days later.
    func gradeLot(_ lotID: String) {
        guard let i = demo.lots.firstIndex(where: { $0.id == lotID }), demo.lots[i].grade == nil else { return }
        let grade: Grade
        switch demo.lots[i].condition ?? .loved {
        case .likeNew: grade = .a
        case .loved: grade = .b
        case .wornOut: grade = .c
        }
        let bonus = Rules.gradeBonusKeys(grade: grade, earnedThisMonth: monthEarned, rules: rules)
        let g = seed.garment(demo.lots[i].garment)
        let date = Dates.addDays(String(demo.lots[i].droppedOn.prefix(10)), 2)
        var d = demo
        d.lots[i].grade = grade
        d.lots[i].keysAwarded += bonus
        d.lots[i].status = [.collected, .graded, grade == .c ? .recut : .vintageLane]
        if bonus > 0 {
            d.ledger.append(KeyEntry(user: meID, delta: bonus, reason: .gradeBonus, lot: lotID, lane: nil, garment: nil,
                                     date: date, note: "\(g.shortName.capitalizedFirst) graded A at the hub"))
        }
        demo = d
    }

    func followLot(_ lotID: String) {
        if !demo.followedLots.contains(lotID) { demo.followedLots.append(lotID) }
    }

    func swipe(hype: Bool) {
        guard let card = currentCard else { return }
        var d = demo
        d.deckIndex += 1
        d.lastSwipeHype = hype
        if hype {
            d.deckHyped.append(card.id)
            if let p = card.piece, !d.hypedPieces.contains(p) { d.hypedPieces.append(p) }
        } else {
            d.deckPassed.append(card.id)
        }
        if d.deckIndex >= seed.deck.cards.count {
            let bonus = Rules.points(for: .deckComplete, earnedThisWeek: d.weeklyDeck, rules: rules)
            d.weeklyDeck += bonus
            if bonus > 0 {
                d.pointsLog.append(PointsEntry(action: .deckComplete, points: bonus, date: String(d.now.prefix(10)), note: "Daily deck finished"))
            }
        }
        demo = d
    }

    @discardableResult
    func addFitNote(garment: String, fit: Fit) -> Int {
        guard demo.fitNotes[garment] == nil else { return 0 }
        let pts = Rules.points(for: .fitNote, earnedThisWeek: demo.weeklyFitNote, rules: rules)
        var d = demo
        d.fitNotes[garment] = fit
        d.weeklyFitNote += pts
        if pts > 0 {
            d.pointsLog.append(PointsEntry(action: .fitNote, points: pts, date: String(d.now.prefix(10)), note: seed.garment(garment).name))
        }
        demo = d
        return pts
    }

    func heart(_ lookID: String) {
        if let i = demo.hearted.firstIndex(of: lookID) { demo.hearted.remove(at: i) } else { demo.hearted.append(lookID) }
    }

    @discardableResult
    func postLook(garment: String, caption: String, tag: String, audience: Audience) -> Int {
        guard demo.settings.photos else { return 0 }
        let pts = Rules.points(for: .look, rules: rules)
        var d = demo
        d.myLooks.insert(Look(id: "my\(d.myLooks.count + 1)", by: meID, garment: garment, tag: tag, caption: caption,
                              hearts: 0, recut: nil, audience: audience), at: 0)
        d.pointsLog.append(PointsEntry(action: .look, points: pts, date: String(d.now.prefix(10)), note: caption))
        demo = d
        return pts
    }

    func toggleFollow(_ userID: String) {
        if let i = demo.following.firstIndex(of: userID) { demo.following.remove(at: i) } else { demo.following.append(userID) }
    }

    func askFit(_ userID: String) { demo.askedFit.append(userID) }

    func vote(_ side: String) {
        guard demo.battleChoice == nil, demo.age16plus else { return }
        demo.battleChoice = side
    }

    func endWeek() {
        guard demo.tierBeforeWeekEnd == nil else { return }
        let result = Rules.weeklyLeagueResult(standings, league: rules.league)
        let next = Rules.tier(after: demo.tier, rank: rank, leagueSize: standings.count, weeksInTop10: 2,
                              returnsThisSeason: garmentsBack, league: rules.league)
        var d = demo
        d.tierBeforeWeekEnd = d.tier
        d.promoted = result.promoted.contains(meID) && next > d.tier
        d.tier = next
        demo = d
    }

    func resetWeek() {
        guard let before = demo.tierBeforeWeekEnd else { return }
        var d = demo
        d.tier = before
        d.tierBeforeWeekEnd = nil
        d.promoted = false
        demo = d
    }

    func jumpToDrop() {
        var d = demo
        d.dropLive = true
        d.now = hasPass ? seed.drop.passOpens : seed.drop.opens
        demo = d
    }

    @discardableResult
    func buy(_ pieceID: String) -> Bool {
        guard let piece = seed.piece(pieceID), !owns(pieceID), entry(for: piece).ok else { return false }
        let date = String(demo.now.prefix(10))
        let result = Rules.buy(keys: keys, piece: piece, date: date, dropLot: seed.drop.lot, rules: rules)
        guard result.ok, let cert = result.certificate else { return false }
        let g = seed.garment(piece.garment)
        var d = demo
        d.ledger.append(KeyEntry(user: meID, delta: -result.keysSpent, reason: .drop, lot: nil, lane: piece.lane,
                                 garment: piece.garment, date: date, note: "\(g.name), \(piece.shortNumber)"))
        d.certificates.append(cert)
        d.lastPurchase = pieceID
        // result.points is 0 by rule: nothing is added to the points log.
        demo = d
        return true
    }

    func toggle(_ setting: WritableKeyPath<Settings, Bool>) {
        var d = demo
        d.settings[keyPath: setting].toggle()
        // Switching leagues on is also the 16+ confirmation (stated on the switch).
        if setting == \Settings.leaderboards, d.settings.leaderboards { d.age16plus = true }
        demo = d
    }

    func reset() {
        path.removeAll()
        demo = Demo(seed: seed)
    }

    // MARK: Demo story

    struct StoryStep: Identifiable {
        let id: Int
        let title: String
        let hint: String
        let route: Route?
        let done: Bool
    }

    /// The demo story in seven moves, each ticked from real state.
    var story: [StoryStep] {
        [
            StoryStep(id: 1, title: "Set up", hint: "Declare a city, confirm 16+", route: nil, done: demo.onboarded),
            StoryStep(id: 2, title: "Return a trench", hint: "Scan, confirm, drop it in the bin", route: .scan, done: demo.returnsDone > 0),
            StoryStep(id: 3, title: "Swipe the deck", hint: "Hype the 2012 skirt, finish the cards", route: .swipe, done: deckDone),
            StoryStep(id: 4, title: "Follow Lucía", hint: "Open her closet, tap Follow", route: .closet("u_lucia"), done: demo.following.contains("u_lucia")),
            StoryStep(id: 5, title: "Vote in the battle", hint: "Tap a look, one vote", route: .battle, done: demo.battleChoice != nil),
            StoryStep(id: 6, title: "End the week", hint: "See the promotion to Cut", route: .league, done: demo.tierBeforeWeekEnd != nil),
            StoryStep(id: 7, title: "Buy the skirt", hint: "Jump to Tuesday, use 1 key", route: .dropHome, done: owns("p_0417")),
        ]
    }
}
