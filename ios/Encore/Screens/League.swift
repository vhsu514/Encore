import SwiftUI

/// 4.1 · City League
struct LeagueView: View {
    @Environment(Store.self) private var store
    @State private var showResult = false

    var body: some View {
        let standings = store.standings
        let rank = store.rank
        let points = store.points
        let rules = store.rules
        let ended = store.demo.tierBeforeWeekEnd != nil
        let leagueTier = store.demo.tierBeforeWeekEnd ?? store.demo.tier
        let nextTier = Tier.allCases[min(Tier.allCases.count - 1, leagueTier.index + 1)]
        let above: Standing? = rank > 1 ? standings[rank - 2] : nil
        let shown = Array(standings.prefix(max(5, min(rank + 1, 7))))
        Screen("City League") {
            Heading(store.demo.city,
                    sub: "\(leagueTier.rawValue) League · week \(store.seed.league.week) · \(rules.league.size) stylists · resets \(rules.league.resetDay) · top \(rules.league.promote) move up\(nextTier != leagueTier ? " to \(nextTier.rawValue)" : "")",
                    large: true)

            Button { store.go(.tiers) } label: {
                HStack(spacing: 0) {
                    ForEach(Tier.allCases, id: \.self) { tier in
                        let now = tier == store.demo.tier
                        Text(tier.rawValue.uppercased())
                            .font(.caption2.weight(.semibold)).tracking(0.6)
                            .frame(maxWidth: .infinity, minHeight: 34)
                            .foregroundStyle(now ? Palette.paper : (tier < store.demo.tier ? Palette.ink : Palette.stone))
                            .background(now ? Palette.ink : Color.clear)
                    }
                }
                .overlay(Rectangle().stroke(Palette.rule, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Your tier is \(store.demo.tier.rawValue). See what every tier unlocks")

            if !store.demo.settings.leaderboards {
                Panel {
                    Text("Leaderboards are off").font(.subheadline.weight(.semibold))
                    Text("Your rank and league are hidden. Your keys, badges and Circular Score all stay. Switch back on in one tap.")
                        .font(.footnote).foregroundStyle(Palette.stone)
                    Button("Open the switches") { store.go(.profile) }.buttonStyle(.encoreSecondary)
                }
            } else {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("No. \(rank)").font(.figure)
                        Text("of \(standings.count)").font(.subheadline).foregroundStyle(Palette.stone)
                        Spacer()
                        if store.hasPass {
                            Button { store.go(.pass) } label: { Tag("Pass earned", .brass) }.buttonStyle(.plain)
                        }
                    }
                    ProgressLine(value: above.map { Double(points) / Double($0.points + 1) } ?? 1)
                    HStack {
                        Text("\(points) Circular Score · \(store.demo.tier.rawValue) tier\(ended ? " from Monday" : "")")
                        Spacer()
                        Text(above.map { "\($0.points - points + 1) pts to No. \(rank - 1)" } ?? "you lead")
                    }
                    .font(.footnote).foregroundStyle(Palette.stone)
                }

                VStack(alignment: .leading, spacing: 0) {
                    Hairline()
                    ForEach(Array(shown.enumerated()), id: \.element.id) { i, row in
                        standingRow(rank: i + 1, row: row)
                        Hairline()
                    }
                    if rank > shown.count, let mine = standings.first(where: { $0.id == store.meID }) {
                        standingRow(rank: rank, row: mine)
                        Hairline()
                    }
                    Text("Promotion zone: top \(rules.league.promote). Bottom \(rules.league.relegate) move down.")
                        .font(.caption).foregroundStyle(Palette.stone).padding(.top, 10)
                }
            }

            Text("Points only from circular actions: bins +\(rules.points.returned), looks +\(rules.points.look), fit notes +\(rules.points.fitNote), repairs +\(rules.points.repair), resales +\(rules.points.preOwnedSale). Never from spending. Leaderboards turn off in one tap, in Profile.")
                .font(.caption).foregroundStyle(Palette.stone)
        } footer: {
            FooterBar {
                HStack(spacing: 10) {
                    Button(ended ? "See the result" : "End the week (demo)") {
                        if !ended {
                            store.endWeek()
                            Haptics.success()
                        }
                        showResult = true
                    }
                    .buttonStyle(.encore)
                    .disabled(!store.demo.settings.leaderboards)
                    Button("Season recap") { store.go(.wrapped) }.buttonStyle(.encoreSecondary)
                }
            }
        }
        .sheet(isPresented: $showResult) { resultSheet(rank: rank, count: standings.count) }
    }

    private func standingRow(rank: Int, row: Standing) -> some View {
        let mine = row.id == store.meID
        return HStack(spacing: 14) {
            Text("\(rank)").font(.footnote.weight(.semibold)).monospacedDigit().frame(width: 22, alignment: .leading)
            Avatar(initial: row.initial, size: 30)
            Text(mine ? "\(row.name) (you)" : row.name).font(.subheadline.weight(mine ? .semibold : .regular))
            Spacer()
            Text("\(row.points)").font(.subheadline.weight(mine ? .semibold : .regular)).monospacedDigit()
        }
        .padding(.vertical, 10)
        .padding(.horizontal, mine ? 10 : 0)
        .background(mine ? Palette.tile : Color.clear)
        .accessibilityElement(children: .combine)
    }

    private func resultSheet(rank: Int, count: Int) -> some View {
        let promoted = store.demo.promoted
        let tier = store.demo.tier
        let perks = store.seed.tiers.first { $0.id == tier }?.unlocks ?? []
        return ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Eyebrow("Sunday reset · week \(store.seed.league.week)")
                Text(promoted ? "You moved up to \(tier.rawValue)." : "You stay in \(tier.rawValue).").font(.displayXL)
                Text("You finished No. \(rank) of \(count). The top \(store.rules.league.promote) move up\(promoted ? ", and \(tier.rawValue) also asks for 2 garments back this season. You have \(store.garmentsBack)." : ". Next week starts Monday.")")
                    .font(.subheadline).foregroundStyle(Palette.stone)
                if promoted {
                    VStack(alignment: .leading, spacing: 0) {
                        Hairline()
                        ForEach(perks, id: \.self) { perk in
                            HStack(spacing: 12) {
                                Image(systemName: "checkmark").font(.footnote).foregroundStyle(Palette.moss)
                                Text(perk).font(.subheadline.weight(.semibold))
                            }
                            .padding(.vertical, 13)
                            Hairline()
                        }
                    }
                }
                Button("See what every tier unlocks") {
                    showResult = false
                    store.go(.tiers)
                }
                .buttonStyle(.encore)
                Button("Undo (demo)") {
                    store.resetWeek()
                    showResult = false
                }
                .buttonStyle(.encoreSecondary)
            }
            .padding(20)
        }
        .background(Palette.paper)
        .presentationDetents([.medium, .large])
    }
}

/// 4.2 · Skip-the-line pass
struct PassView: View {
    @Environment(Store.self) private var store

    var body: some View {
        let drop = store.seed.drop
        let rules = store.rules
        Screen("Skip the line") {
            if store.hasPass {
                Heading("Skip the line", sub: "\(store.demo.tier.rawValue) tier. Enter Tuesday’s drop before every other key holder.")

                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Eyebrow("Skip-the-line pass", color: Palette.paper)
                        Spacer()
                        Eyebrow("No. 0046 · \(store.demo.city)", color: Palette.paper.opacity(0.7))
                    }
                    Text("\(Dates.weekdayName(drop.passOpens))\n\(Dates.clock(drop.passOpens))")
                        .font(.system(size: 50, weight: .regular, design: .serif))
                        .foregroundStyle(Palette.paper)
                    Text("Archive Drop · lot \(drop.lot) · \(rules.passEarlyMinutes) minutes before the \(Dates.clock(drop.opens)) door")
                        .font(.footnote).foregroundStyle(Palette.paper.opacity(0.8))
                    Rectangle().fill(Palette.paper.opacity(0.3)).frame(height: 1)
                    HStack(alignment: .bottom) {
                        VStack(alignment: .leading, spacing: 3) {
                            Eyebrow("Holder", color: Palette.paper.opacity(0.7))
                            Text("\(store.me.name) · \(store.demo.tier.rawValue) tier").font(.subheadline.weight(.semibold)).foregroundStyle(Palette.paper)
                        }
                        Spacer()
                        HStack(spacing: 2) {
                            ForEach(0..<26, id: \.self) { i in
                                Rectangle().fill(Palette.paper).frame(width: i % 3 == 0 ? 3 : 1.5, height: 34)
                            }
                        }
                        .accessibilityHidden(true)
                    }
                }
                .padding(18)
                .background(Palette.ink)

                VStack(alignment: .leading, spacing: 14) {
                    NoteRow("calendar", "How you earned it. Top \(rules.league.promote) of your Stitch league two weeks running, or win a Style Battle.")
                    NoteRow("key", "You still need keys. The pass opens the door early; a key opens the piece; money buys it, at full price.")
                    NoteRow("checkmark.shield", "It never expires or sells. One pass per drop. Unused passes carry to the next Tuesday, even if you move down a tier first.")
                }
            } else {
                Heading("Skip the line", sub: "The pass opens Tuesday’s drop \(rules.passEarlyMinutes) minutes early. You get it at the \(rules.passFromTier.rawValue) tier, or by winning a Style Battle. You are in \(store.demo.tier.rawValue).")
            }
        } footer: {
            FooterBar {
                if store.hasPass {
                    Button("Preview Tuesday’s drop") { store.path = [.dropHome] }.buttonStyle(.encore)
                    Button("Add to Wallet") { store.say("Added to your phone wallet (simulated).") }.buttonStyle(.encoreSecondary)
                } else {
                    Button("See how to reach \(rules.passFromTier.rawValue)") { store.go(.tiers) }.buttonStyle(.encore)
                }
            }
        }
    }
}

/// 4.3 · Encore Wrapped
struct WrappedView: View {
    @Environment(Store.self) private var store

    var body: some View {
        let w = store.seed.wrapped
        let best: String = store.demo.settings.leaderboards ? "No. \(min(w.bestWeeklyRank, store.rank))" : "Off"
        let stats: [(String, String)] = [
            ("\(store.garmentsBack)", "pieces brought back"),
            (Fmt.kg(store.kg), "kg given a second life"),
            ("\(store.keysEarned)", "keys earned"),
            ("\(store.lotsFollowed)", "lots followed"),
            (best, "best weekly rank"),
            (store.demo.tier.rawValue, "tier"),
        ]
        Screen("\(w.season) · so far") {
            Heading("Encore Wrapped", sub: "\(store.me.name) · \(store.demo.city) · \(w.season)", large: true)

            LazyVGrid(columns: [GridItem(.flexible(), alignment: .topLeading), GridItem(.flexible(), alignment: .topLeading)], alignment: .leading, spacing: 22) {
                ForEach(stats, id: \.1) { value, label in
                    StatCell(value: value, label: label)
                }
            }
            .padding(.vertical, 6)

            VStack(alignment: .leading, spacing: 10) {
                Hairline()
                Eyebrow("Signature era")
                Text(w.signatureEra).font(.display)
                ProgressLine(value: w.eraShare)
                Text("\(Int((w.eraShare * 100).rounded()))% of what you hyped this season").font(.footnote).foregroundStyle(Palette.stone)
                Hairline()
            }
            Text("No streaks, no guilt. Just the season’s score.").font(.footnote).foregroundStyle(Palette.stone)
        } footer: {
            FooterBar {
                HStack(spacing: 10) {
                    Button("Share as image") { store.say("Share card saved as an image (simulated).") }.buttonStyle(.encore)
                    Button("Profile") { store.go(.profile) }.buttonStyle(.encoreSecondary)
                }
            }
        }
    }
}

/// 4.4 · Tiers and what they unlock
struct TiersView: View {
    @Environment(Store.self) private var store

    var body: some View {
        let rules = store.rules
        Screen("City League tiers") {
            Heading("Climb your city, unlock more",
                    sub: "Weekly leagues of \(rules.league.size) · top \(rules.league.promote) move up, bottom \(rules.league.relegate) move down · \(rules.league.resetDay) reset · points never come from spending")

            VStack(alignment: .leading, spacing: 0) {
                Hairline()
                ForEach(store.seed.tiers) { t in
                    let now = t.id == store.demo.tier
                    let locked = t.id > store.demo.tier
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(t.id.rawValue).font(.display).foregroundStyle(locked ? Palette.stone : Palette.ink)
                            Spacer()
                            if now { Tag("\(store.me.name) is here", .solid) } else if locked { Tag("To climb") } else { Tag("Unlocked", .moss) }
                        }
                        Text(t.requirement).font(.footnote).foregroundStyle(Palette.stone)
                        ForEach(t.unlocks, id: \.self) { perk in
                            Text(perk).font(.subheadline.weight(.medium)).foregroundStyle(locked ? Palette.stone : Palette.ink)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        if t.id == rules.passFromTier && store.hasPass {
                            Button { store.go(.pass) } label: {
                                Text("See your pass").font(.footnote.weight(.semibold)).underline()
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 2)
                        }
                    }
                    .padding(.vertical, 16)
                    Hairline()
                }
            }
        }
    }
}
