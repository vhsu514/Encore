import Foundation

// Entities mirror data/seed.json. See docs/DATA_MODEL.md.

enum Tier: String, Codable, CaseIterable, Comparable {
    case thread = "Thread", stitch = "Stitch", seam = "Seam", cut = "Cut", archive = "Archive"
    var index: Int { Tier.allCases.firstIndex(of: self) ?? 0 }
    static func < (a: Tier, b: Tier) -> Bool { a.index < b.index }
}

enum LaneID: String, Codable, CaseIterable {
    case vintage, recut
    case firstAccess = "first_access"
}

enum Grade: String, Codable { case a = "A", b = "B", c = "C" }

enum Condition: String, Codable, CaseIterable {
    case likeNew = "like_new", loved
    case wornOut = "worn_out"
}

enum LotStatus: String, Codable {
    case collected, graded, recut, fiber, sold
    case vintageLane = "vintage_lane"
}

enum Fit: String, Codable, CaseIterable {
    case trueToSize = "true", small, big
}

enum KeyReason: String, Codable {
    case returned = "return"
    case gradeBonus = "grade_bonus"
    case tierBonus = "tier_bonus"
    case drop
}

enum Audience: String, Codable { case city, friends, battle }

struct Settings: Codable, Equatable {
    var leaderboards: Bool
    var photos: Bool
    var dropReminder: Bool
}

struct User: Codable, Identifiable {
    let id: String
    let name: String
    var handle: String?
    let initial: String
    let city: String
    let tier: Tier
    let points: Int
    let leagueRank: Int
    var keys: Int?
    var size: String?
    var garmentsBack: Int?
    var kgDisplaced: Double?
    var lotsFollowed: Int?
    var since: String?
    var followers: Int?
    var curator: Bool?
    var heartsThisWeek: Int?
    var looksCount: Int?
    var fitNotesCount: Int?
    var aesthetics: [String]?
    var fit: String?
    var badges: [String]?
    var settings: Settings?
    var age16plus: Bool?
    var returnQueue: [String]?

    var firstName: String { name.split(separator: " ").first.map(String.init) ?? name }
}

struct Garment: Codable, Identifiable {
    let id: String
    let name: String
    var short: String?
    var ref: String?
    var line: String?
    var era: Int?
    var edit: String?
    var season: String?
    var color: String?
    var size: String?
    var bought: Int?
    var weightKg: Double?
    var listing: String?
    /// Illustration path, or an https URL to a product photo.
    let image: String
    let tile: String

    var shortName: String { short ?? name }
}

struct Lot: Codable, Identifiable {
    let id: String
    let owner: String
    let garment: String
    let droppedAt: String
    let droppedOn: String
    var weightKg: Double?
    var rfidConfirmed: Bool?
    var status: [LotStatus]
    var grade: Grade?
    var keysAwarded: Int
    var listing: String?
    var condition: Condition?
}

struct KeyEntry: Codable {
    let user: String
    let delta: Int
    let reason: KeyReason
    var lot: String?
    var lane: LaneID?
    var garment: String?
    let date: String
    let note: String
}

struct FitNoteEntry: Codable {
    let by: String
    let size: String
    var fit: Fit?
    let text: String
}

struct Piece: Codable, Identifiable {
    let id: String
    let garment: String
    let lane: LaneID
    let number: String
    var grade: Grade?
    var size: String?
    let price: Double
    var original: Double?
    let keys: Int
    var fromLot: String?
    var story: String?
    var fitNotes: [FitNoteEntry]?

    /// "No. 0417 of 2,400" → "No. 0417"
    var shortNumber: String { number.components(separatedBy: " of ").first ?? number }
}

struct Lane: Codable, Identifiable {
    let id: LaneID
    let name: String
    let pieces: Int
    let detail: String
    let garment: String
}

struct Drop: Codable {
    let lot: String
    let opens: String
    let passOpens: String
    let reminder: String
    let totalPieces: Int
    let available: Int
    let lanes: [Lane]
    let pieces: [Piece]
}

struct DeckCard: Codable, Identifiable {
    let id: String
    let garment: String
    let kind: String
    let lane: String
    let grade: String
    let tag: String
    let meta: String
    var piece: String?
    var price: Double?
    var keys: Int?
    var owned: Bool?
}

struct Deck: Codable {
    let perDay: Int
    let swipedToday: Int
    let hypedPieces: [String]
    let cards: [DeckCard]
}

struct Look: Codable, Identifiable {
    let id: String
    let by: String
    let garment: String
    let tag: String
    let caption: String
    var hearts: Int
    var recut: Bool?
    var audience: Audience?
}

struct BattleSide: Codable {
    let look: String
    var votes: Int
}

struct Battle: Codable {
    let id: String
    let title: String
    var a: BattleSide
    var b: BattleSide
    let prize: String
}

struct Milestone: Codable, Identifiable {
    let at: Int
    let reward: String
    var reached: Bool
    var id: Int { at }
}

struct RaceEntry: Codable, Identifiable {
    let city: String
    let share: Double
    var id: String { city }
}

struct CityGoal: Codable {
    let season: String
    let city: String
    let target: Int
    var current: Int
    var mine: Int
    let milestones: [Milestone]
    let race: [RaceEntry]
}

struct TierDef: Codable, Identifiable {
    let id: Tier
    let requirement: String
    let unlocks: [String]
}

struct PointRules: Codable {
    let returned: Int
    let look: Int
    let heartsPer10: Int
    let lookCap: Int
    let fitNote: Int
    let fitNoteWeeklyCap: Int
    let repair: Int
    let preOwnedSale: Int
    let deckComplete: Int
    let deckWeeklyCap: Int
    let battleWin: Int
    let purchase: Int

    enum CodingKeys: String, CodingKey {
        case returned = "return"
        case look, heartsPer10, lookCap, fitNote, fitNoteWeeklyCap, repair, preOwnedSale, deckComplete, deckWeeklyCap, battleWin, purchase
    }
}

struct LeagueRules: Codable {
    let size: Int
    let promote: Int
    let relegate: Int
    let resetDay: String
}

struct LaneRule: Codable {
    let keys: Int
    let price: String
    var gradeBShare: Double?
    var earlyHours: Int?
}

struct RuleSet: Codable {
    let keysPerReturn: Int
    let gradeABonusKeys: Int
    let monthlyKeyCap: Int
    let points: PointRules
    let league: LeagueRules
    let lanes: [String: LaneRule]
    let dropTime: String
    let passEarlyMinutes: Int
    let reminderMinutesBefore: Int
    let passFromTier: Tier

    func lane(_ id: LaneID) -> LaneRule { lanes[id.rawValue] ?? LaneRule(keys: 1, price: "") }
}

struct ClosetItem: Codable, Identifiable {
    let garment: String
    let label: String
    let status: String
    var piece: String?
    var preOwned: Bool?
    var id: String { label }
}

/// One league row in the seed: ["u_maya", 310] or ["Carmen S.", 281].
struct LeagueMember: Codable {
    let who: String
    let points: Int

    init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        who = try c.decode(String.self)
        points = try c.decode(Int.self)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(who)
        try c.encode(points)
    }
}

struct LeagueSeed: Codable {
    let week: Int
    let tier: Tier
    let city: String
    let members: [LeagueMember]
}

struct ClockSeed: Codable {
    let start: String
    let store: String
    let bin: String
}

struct WrappedSeed: Codable {
    let season: String
    let bestWeeklyRank: Int
    let signatureEra: String
    let eraShare: Double
}

struct Seed: Codable {
    let me: String
    let clock: ClockSeed
    let users: [User]
    let league: LeagueSeed
    let garments: [Garment]
    let lots: [Lot]
    let keyLedger: [KeyEntry]
    let rules: RuleSet
    let tiers: [TierDef]
    let deck: Deck
    let drop: Drop
    let looks: [Look]
    let battle: Battle
    let closets: [String: [ClosetItem]]
    let cityGoal: CityGoal
    let wrapped: WrappedSeed
}

struct Standing: Identifiable, Equatable {
    let id: String
    let name: String
    let initial: String
    var points: Int
}

struct Certificate: Codable, Identifiable {
    let piece: String
    let garment: String
    let number: String
    var grade: Grade?
    let paid: Double
    let keys: Int
    let date: String
    let dropLot: String
    var id: String { piece }
}

enum PointAction: String, Codable {
    case returned, look, fitNote, repair, preOwnedSale, deckComplete, battleWin, purchase
}

/// The one place demo data enters the app: Resources/seed.json, a copy of data/seed.json.
enum SeedData {
    static let shared: Seed = load()

    static func load(bundle: Bundle = .main) -> Seed {
        guard let url = bundle.url(forResource: "seed", withExtension: "json"),
              let data = try? Data(contentsOf: url) else {
            fatalError("seed.json is missing from the app bundle")
        }
        do {
            return try JSONDecoder().decode(Seed.self, from: data)
        } catch {
            fatalError("seed.json could not be read: \(error)")
        }
    }
}

extension Seed {
    var meUser: User { user(me) }
    func user(_ id: String) -> User { users.first { $0.id == id } ?? users[0] }
    func garment(_ id: String) -> Garment { garments.first { $0.id == id } ?? garments[0] }
    func piece(_ id: String) -> Piece? { drop.pieces.first { $0.id == id } }
    func look(_ id: String) -> Look? { looks.first { $0.id == id } }

    /// League rows: known users by id, everyone else by display name.
    var standings: [Standing] {
        league.members.map { m in
            if let u = users.first(where: { $0.id == m.who }) {
                return Standing(id: u.id, name: u.name, initial: u.initial, points: m.points)
            }
            return Standing(id: m.who, name: m.who, initial: String(m.who.prefix(1)), points: m.points)
        }
    }
}
