import SwiftUI

/// Numbered editorial list row.
struct IndexRow: View {
    let index: String
    let title: String
    let sub: String
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 14) {
            Text(index).font(.caption.weight(.semibold)).monospacedDigit().foregroundStyle(Palette.stone).frame(width: 22, alignment: .leading)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.displayS).foregroundStyle(Palette.ink)
                Text(sub).font(.footnote).foregroundStyle(Palette.stone)
            }
            Spacer(minLength: 8)
            Image(systemName: "arrow.right").font(.footnote).foregroundStyle(Palette.ink)
        }
        .padding(.vertical, 14)
        .contentShape(Rectangle())
    }
}

/// 0.1 · Encore home
struct HomeView: View {
    @Environment(Store.self) private var store
    @State private var showStory = false

    var body: some View {
        let hyped = store.hypedInDrop
        let lot = store.latestLot
        let lotGarment = store.seed.garment(lot.garment)
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 10) {
                    if store.demo.settings.leaderboards {
                        Button { store.go(.league) } label: {
                            Eyebrow("\(store.demo.city) · No. \(store.rank) of \(store.standings.count) · \(store.demo.tier.rawValue) tier")
                        }
                        .buttonStyle(.plain)
                    } else {
                        Eyebrow("\(store.demo.city) · leaderboards off")
                    }
                    Text("Hey \(store.me.name), your closet has status.")
                        .font(.displayXL)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                    Text("Bring it back, swipe it, climb your city, unlock the drop.")
                        .font(.subheadline).foregroundStyle(Palette.stone)
                }

                Button { store.go(.dropHome) } label: {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 2) {
                            ForEach(hyped.prefix(3)) { piece in
                                GarmentImage(garment: store.seed.garment(piece.garment), ratio: 0.72)
                            }
                        }
                        HStack {
                            Eyebrow("Archive Drop", color: Palette.ink)
                            Spacer()
                            Eyebrow("Tue · \(Dates.clock(store.seed.drop.opens))", color: Palette.ink)
                        }
                        Text("\(hyped.count) \(hyped.count == 1 ? "piece" : "pieces") you hyped \(hyped.count == 1 ? "is" : "are") in")
                            .font(.display).foregroundStyle(Palette.ink)
                        Text("\(Fmt.num(store.seed.drop.totalPieces)) pieces · quantities stated · no restock")
                            .font(.footnote).foregroundStyle(Palette.stone)
                    }
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 0) {
                    Eyebrow("Your loop")
                    Hairline().padding(.top, 10)
                    Button { store.go(.scan) } label: {
                        IndexRow(index: "01", title: "Bring a piece back", sub: "Scan, drop, earn a key")
                    }
                    Hairline()
                    Button { store.go(store.deckDone ? .deckDone : .swipe) } label: {
                        IndexRow(index: "02", title: "Style Swipe",
                                 sub: store.deckDone ? "Deck complete today" : "\(store.deckCount) of \(store.seed.deck.perDay) today")
                    }
                    Hairline()
                    Button { store.go(.looks) } label: {
                        IndexRow(index: "03", title: "Looks and Battles",
                                 sub: store.demo.battleChoice == nil ? "Battle open today" : "You voted today")
                    }
                    Hairline()
                    Button { store.go(.league) } label: {
                        IndexRow(index: "04", title: "City League", sub: leagueLine)
                    }
                    Hairline()
                }
                .buttonStyle(.plain)

                Button { store.go(.lot(lot.id)) } label: {
                    HStack(spacing: 14) {
                        GarmentImage(garment: lotGarment).frame(width: 64)
                        VStack(alignment: .leading, spacing: 5) {
                            Eyebrow("Lot \(lot.id) · your \(lotGarment.shortName)")
                            Text(lotLine(lot)).font(.subheadline).foregroundStyle(Palette.ink)
                        }
                        Spacer(minLength: 8)
                        Image(systemName: "arrow.right").font(.footnote)
                    }
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 20)
            .padding(.top, 6)
            .padding(.bottom, 28)
        }
        .background(Palette.paper)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Text("Encore").font(.system(.title3, design: .serif).weight(.medium))
            }
            ToolbarItemGroup(placement: .topBarTrailing) {
                KeyPill()
                Menu {
                    Button("Demo story", systemImage: "list.number") { showStory = true }
                    Button("Profile and switches", systemImage: "person") { store.go(.profile) }
                    Button("Reset demo", systemImage: "arrow.counterclockwise", role: .destructive) { store.reset() }
                } label: {
                    Image(systemName: "ellipsis").accessibilityLabel("Demo controls")
                }
            }
        }
        .toolbarBackground(Palette.paper, for: .navigationBar)
        .sheet(isPresented: $showStory) {
            DemoStorySheet().environment(store).presentationDetents([.large])
        }
    }

    private var leagueLine: String {
        guard store.demo.settings.leaderboards else { return "Leaderboards off" }
        let rank = store.rank
        guard rank > 1 else { return "You lead · resets Sunday" }
        let gap = store.standings[rank - 2].points - store.points + 1
        return "\(gap) pts to No. \(rank - 1) · resets Sunday"
    }

    private func lotLine(_ lot: Lot) -> String {
        guard let grade = lot.grade else { return "Collected · grade pending" }
        let bonus = grade == .a && lot.keysAwarded > 1 ? " · second key landed" : ""
        return "Graded \(grade.rawValue)\(bonus)"
    }
}

/// 0.2 · First open: consent and city
struct OnboardingView: View {
    @Environment(Store.self) private var store
    @State private var city = SeedData.shared.cityGoal.city
    @State private var photos = false
    @State private var age = true

    var body: some View {
        VStack(spacing: 0) {
            ConceptBar()
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("Encore").font(.system(.title3, design: .serif).weight(.medium))
                    Eyebrow("New · for \(city)")
                    Text("Your old Zara gets you into the new drop.")
                        .font(.displayXL).fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                    Text("Bring a garment back, earn an Archive Key. Keys cannot be bought. They open Tuesday drops: vintage by era, re-cut editions, first access.")
                        .font(.subheadline).foregroundStyle(Palette.stone)

                    VStack(alignment: .leading, spacing: 0) {
                        Hairline()
                        HStack(alignment: .center, spacing: 12) {
                            consentText("Your city", "For your league. You choose it; we never track it.")
                            Spacer(minLength: 8)
                            Menu {
                                ForEach(store.seed.cityGoal.race) { entry in
                                    let live = entry.city == store.seed.cityGoal.city
                                    Button(live ? entry.city : "\(entry.city) (not in this demo)") { city = entry.city }
                                        .disabled(!live)
                                }
                            } label: {
                                HStack(spacing: 6) {
                                    Text(city).font(.footnote.weight(.semibold))
                                    Image(systemName: "chevron.down").font(.caption2)
                                }
                                .padding(.horizontal, 10).padding(.vertical, 8)
                                .overlay(Rectangle().stroke(Palette.ink, lineWidth: 1))
                            }
                        }
                        .padding(.vertical, 14)
                        Hairline()
                        Toggle(isOn: $photos) {
                            consentText("Looks and photos", "Opt in later, only when you post. Off by default.")
                        }
                        .padding(.vertical, 14)
                        Hairline()
                        Toggle(isOn: $age) {
                            consentText("I am 16 or over", "Leagues and battles are 16+. One tap turns them off, any time.")
                        }
                        .padding(.vertical, 14)
                        Hairline()
                    }
                    .tint(Palette.ink)
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 24)
            }
            FooterBar {
                HStack(spacing: 10) {
                    Button("Not now") { store.finishOnboarding(city: city, photos: false, age16plus: false) }
                        .buttonStyle(.encoreSecondary)
                    Button("Let’s go") { store.finishOnboarding(city: city, photos: photos, age16plus: age) }
                        .buttonStyle(.encore)
                }
                Text("No streaks. No countdowns. Keys never expire, so nothing is lost by waiting.")
                    .font(.caption).foregroundStyle(Palette.stone).multilineTextAlignment(.center)
            }
        }
        .background(Palette.paper)
        .interactiveDismissDisabled()
    }

    private func consentText(_ title: String, _ sub: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
            Text(sub).font(.footnote).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
        }
    }
}

/// The demo story: seven moves, each ticked from real state.
struct DemoStorySheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        let steps = store.story
        let current = steps.first { !$0.done }?.id
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Eyebrow("Demo story")
                Text("The whole loop in seven moves.").font(.display)
                Text("Under three minutes. Each step ticks when it has really happened.")
                    .font(.subheadline).foregroundStyle(Palette.stone)
                VStack(alignment: .leading, spacing: 0) {
                    Hairline()
                    ForEach(steps) { step in
                        Button {
                            dismiss()
                            if let route = step.route {
                                store.home()
                                store.go(route)
                            }
                        } label: {
                            HStack(alignment: .firstTextBaseline, spacing: 14) {
                                Group {
                                    if step.done {
                                        Image(systemName: "checkmark").foregroundStyle(Palette.moss)
                                    } else {
                                        Text(String(format: "%02d", step.id)).monospacedDigit().foregroundStyle(Palette.stone)
                                    }
                                }
                                .font(.caption.weight(.semibold))
                                .frame(width: 22, alignment: .leading)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(step.title).font(.displayS)
                                        .foregroundStyle(step.done ? Palette.stone : Palette.ink)
                                    Text(step.hint).font(.footnote).foregroundStyle(Palette.stone)
                                }
                                Spacer(minLength: 8)
                                if step.id == current { Tag("Next", .solid) }
                            }
                            .padding(.vertical, 13)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        Hairline()
                    }
                }
                Button("Reset demo") {
                    store.reset()
                    dismiss()
                }
                .buttonStyle(.encoreSecondary)
                Text("Camera, bin, payment and notifications are simulated. Encore is a student design concept, not affiliated with or endorsed by Zara or Inditex.")
                    .font(.caption).foregroundStyle(Palette.stone)
            }
            .padding(20)
        }
        .background(Palette.paper)
    }
}
