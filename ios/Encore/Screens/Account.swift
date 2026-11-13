import SwiftUI

/// 6.1 · Keys wallet
struct KeysView: View {
    @Environment(Store.self) private var store

    var body: some View {
        let cap = store.rules.monthlyKeyCap
        let month = store.monthEarned
        let history = Array(store.demo.ledger.filter { $0.user == store.meID }.reversed())
        Screen("Archive Keys", showKeys: false) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Eyebrow("Archive Keys", color: Palette.brass)
                    Spacer()
                    Eyebrow("\(store.me.name) · \(store.demo.city)", color: Palette.brass)
                }
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    Image(systemName: "key.fill").font(.title).foregroundStyle(Palette.brass)
                    Text("\(store.keys)").font(.system(size: 72, weight: .regular, design: .serif)).monospacedDigit()
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(Fmt.keys(store.keys))
                Text("\(store.keysEarned) earned this season · \(store.dropsEntered) \(store.dropsEntered == 1 ? "drop" : "drops") entered")
                    .font(.footnote.weight(.semibold))
                Text("Never expire · no cash value · cannot be bought").font(.footnote).foregroundStyle(Palette.brass)
                ProgressLine(value: Double(month) / Double(cap), tint: Palette.brass)
                Text("\(month) of \(cap) earned in \(Dates.monthName(store.demo.now))").font(.footnote)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.brassFill)

            VStack(alignment: .leading, spacing: 0) {
                Eyebrow("History")
                Hairline().padding(.top, 10)
                ForEach(Array(history.enumerated()), id: \.offset) { _, entry in
                    HStack(alignment: .top, spacing: 14) {
                        GarmentImage(garment: garment(for: entry)).frame(width: 48)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(entry.note).font(.subheadline.weight(.semibold)).fixedSize(horizontal: false, vertical: true)
                            Text("\(Dates.dayMonth(entry.date)) · \(detail(entry))").font(.footnote).foregroundStyle(Palette.stone)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 6)
                        Text(entry.delta > 0 ? "+\(entry.delta)" : "−\(abs(entry.delta))")
                            .font(.subheadline.weight(.semibold)).monospacedDigit()
                            .foregroundStyle(entry.delta > 0 ? Palette.brass : Palette.stone)
                    }
                    .padding(.vertical, 12)
                    .accessibilityElement(children: .combine)
                    Hairline()
                }
            }

            NoteRow("checkmark.shield", "Keys are status, not money. They open drops; they never discount anything. \(month >= cap ? "You have reached this month’s cap." : "\(cap - month) more this month before the cap.")")
        } footer: {
            FooterBar {
                HStack(spacing: 10) {
                    Button("Earn one") { store.path = [.scan] }.buttonStyle(.encore)
                    Button("Profile") { store.go(.profile) }.buttonStyle(.encoreSecondary)
                }
            }
        }
    }

    private func garment(for entry: KeyEntry) -> Garment {
        let lot = store.demo.lots.first { $0.id == entry.lot }
        return store.seed.garment(lot?.garment ?? entry.garment ?? "g_skirt")
    }

    private func detail(_ entry: KeyEntry) -> String {
        let lot = store.demo.lots.first { $0.id == entry.lot }
        switch entry.reason {
        case .returned:
            guard let lot else { return "return" }
            let place = lot.droppedAt.replacingOccurrences(of: "Zara ", with: "").components(separatedBy: ",").first ?? ""
            return "\(place) · lot \(lot.id) · \(lot.grade.map { "graded \($0.rawValue)" } ?? "grade pending")"
        case .gradeBonus: return "lot \(entry.lot ?? "") · second key for grade A"
        case .tierBonus: return "tier bonus"
        case .drop:
            switch entry.lane {
            case .vintage: return "Archive Drop · vintage lane"
            case .recut: return "Archive Drop · re-cut edition"
            case .firstAccess: return "Archive Drop · first access, 24 h early"
            case .none: return "Archive Drop"
            }
        }
    }
}

/// 6.2 · Profile and badges
struct ProfileView: View {
    @Environment(Store.self) private var store

    private let badges: [(String, String, String)] = [
        ("first_return", "First Return", "arrow.uturn.backward"),
        ("fit_guru", "Fit Guru", "ruler"),
        ("lot_follower", "Lot Follower", "mappin"),
        ("battle_winner", "Battle Winner", "trophy"),
        ("archive_insider", "Archive Insider", "star"),
    ]

    var body: some View {
        let u = store.me
        let earned = store.badges
        Screen("Profile") {
            HStack(alignment: .top, spacing: 14) {
                Avatar(initial: u.initial, size: 60)
                VStack(alignment: .leading, spacing: 4) {
                    Text(u.name).font(.display)
                    Text("@\(u.handle ?? "") · \(store.demo.city) · \(store.demo.tier.rawValue) tier").font(.footnote).foregroundStyle(Palette.stone)
                    Text("In Encore since \(Dates.monthYear(u.since ?? "2026-09"))").font(.footnote).foregroundStyle(Palette.stone)
                }
            }

            HStack(alignment: .top, spacing: 12) {
                StatCell(value: "\(store.garmentsBack)", label: "garments back")
                StatCell(value: Fmt.kg(store.kg), label: "kg given a second life")
                StatCell(value: "\(store.lotsFollowed)", label: "lots followed")
            }

            VStack(alignment: .leading, spacing: 0) {
                Eyebrow("Badges · for actions only")
                Hairline().padding(.top, 10)
                ForEach(badges, id: \.0) { id, label, symbol in
                    let on = earned.contains(id)
                    HStack(spacing: 14) {
                        Image(systemName: symbol).font(.footnote).frame(width: 22)
                            .foregroundStyle(on ? Palette.ink : Palette.stone)
                        Text(label).font(.subheadline.weight(on ? .semibold : .regular))
                            .foregroundStyle(on ? Palette.ink : Palette.stone)
                        Spacer()
                        Text(on ? "Earned" : "Not yet").font(.footnote).foregroundStyle(on ? Palette.moss : Palette.stone)
                    }
                    .padding(.vertical, 11)
                    .accessibilityElement(children: .combine)
                    Hairline()
                }
            }

            VStack(alignment: .leading, spacing: 0) {
                Eyebrow("Certificates")
                Hairline().padding(.top, 10)
                if store.demo.certificates.isEmpty {
                    Text("Pieces you buy in a drop show up here, each with its number and grade.")
                        .font(.footnote).foregroundStyle(Palette.stone).padding(.vertical, 12)
                    Hairline()
                }
                ForEach(store.demo.certificates) { cert in
                    Button { store.go(.piece(cert.piece)) } label: {
                        HStack(alignment: .top, spacing: 14) {
                            GarmentImage(garment: store.seed.garment(cert.garment)).frame(width: 48)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(store.seed.garment(cert.garment).name).font(.subheadline.weight(.semibold))
                                Text("\(cert.number)\(cert.grade.map { " · graded \($0.rawValue)" } ?? "") · \(Dates.dayMonth(cert.date)) · \(Fmt.euro(cert.paid))")
                                    .font(.footnote).foregroundStyle(Palette.stone)
                            }
                            Spacer(minLength: 6)
                        }
                        .padding(.vertical, 12)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    Hairline()
                }
            }

            VStack(alignment: .leading, spacing: 0) {
                Eyebrow("One-tap switches")
                Hairline().padding(.top, 10)
                switchRow("City leaderboards", "Hides your rank and league. Keys and badges stay. Switching on confirms you are 16 or over.", \.leaderboards)
                Hairline()
                switchRow("Photos in feed", "Off by default. Your looks only show while this is on.", \.photos)
                Hairline()
                switchRow("Drop notifications", "One reminder per drop, 15 minutes before. Never more.", \.dropReminder)
                Hairline()
            }
            .tint(Palette.ink)

            Text("Encore is a student design concept for the BIC × Zara case competition by Victor Hsu, Juliet Dong, Sophie Hsu and Kaitlyn Lavichant. Not affiliated with or endorsed by Zara or Inditex. All people, numbers and lots are illustrative.")
                .font(.caption).foregroundStyle(Palette.stone)
        } footer: {
            FooterBar {
                HStack(spacing: 10) {
                    Button("Keys wallet") { store.go(.keys) }.buttonStyle(.encoreSecondary)
                    Button("Reset demo") { store.reset() }.buttonStyle(.encoreSecondary)
                }
            }
        }
    }

    private func switchRow(_ title: String, _ sub: String, _ keyPath: WritableKeyPath<Settings, Bool>) -> some View {
        Toggle(isOn: Binding(get: { store.demo.settings[keyPath: keyPath] }, set: { _ in store.toggle(keyPath) })) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(sub).font(.footnote).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, 12)
    }
}
