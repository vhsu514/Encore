import SwiftUI

extension Store {
    func priceLine(_ card: DeckCard) -> String {
        let piece = card.piece.flatMap { seed.piece($0) }
        let amount = piece.map { price($0) } ?? card.price ?? 0
        let keys = piece?.keys ?? card.keys
        if let keys { return "\(Fmt.euro(amount)) · \(Fmt.keys(keys))" }
        return Fmt.euro(amount)
    }
}

private struct DeckCardView: View {
    @Environment(Store.self) private var store
    let card: DeckCard

    var body: some View {
        let g = store.seed.garment(card.garment)
        VStack(alignment: .leading, spacing: 0) {
            GarmentImage(garment: g, ratio: 0.86)
                .overlay(alignment: .topLeading) {
                    HStack(spacing: 6) {
                        Tag(card.lane, .solid)
                        Tag(card.grade)
                    }
                    .padding(10)
                }
                .overlay(alignment: .topTrailing) {
                    Tag(card.tag, .brass).padding(10)
                }
            VStack(alignment: .leading, spacing: 4) {
                Text(g.name).font(.display).lineLimit(2)
                Text(card.meta).font(.footnote).foregroundStyle(Palette.stone)
                Text(store.priceLine(card)).font(.footnote.weight(.semibold)).foregroundStyle(Palette.brass)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.surface)
        .overlay(Rectangle().stroke(Palette.rule, lineWidth: 1))
    }
}

/// 2.1 · Style Swipe deck: drag the card or use the buttons
struct SwipeView: View {
    @Environment(Store.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var offset: CGFloat = 0
    @State private var leaving = false
    @State private var fitGarment: Garment?

    var body: some View {
        if let card = store.currentCard {
            deck(card)
        } else {
            DeckDoneView()
        }
    }

    private func deck(_ card: DeckCard) -> some View {
        let count = store.deckCount + 1
        let total = store.seed.deck.perDay
        let owned = (card.owned ?? false) && store.demo.fitNotes[card.garment] == nil
        return VStack(spacing: 14) {
            VStack(spacing: 8) {
                ProgressLine(value: Double(count) / Double(total))
                HStack {
                    Eyebrow("Today’s deck")
                    Spacer()
                    Eyebrow("\(count) / \(total)", color: Palette.ink)
                }
            }

            ZStack {
                if store.demo.deckIndex + 1 < store.seed.deck.cards.count {
                    DeckCardView(card: store.seed.deck.cards[store.demo.deckIndex + 1])
                        .scaleEffect(0.96)
                        .opacity(0.5)
                        .accessibilityHidden(true)
                }
                DeckCardView(card: card)
                    .overlay(alignment: .top) {
                        Text(offset > 0 ? "HYPE" : "PASS")
                            .font(.system(.title2, design: .serif).weight(.semibold))
                            .tracking(2)
                            .padding(.horizontal, 14).padding(.vertical, 6)
                            .foregroundStyle(offset > 0 ? Palette.moss : Palette.clay)
                            .background(Palette.paper)
                            .overlay(Rectangle().stroke(offset > 0 ? Palette.moss : Palette.clay, lineWidth: 2))
                            .opacity(min(1, Double(abs(offset)) / 90))
                            .padding(.top, 90)
                    }
                    .offset(x: offset)
                    .rotationEffect(.degrees(Double(offset) / 24))
                    .gesture(
                        DragGesture()
                            .onChanged { value in if !leaving { offset = value.translation.width } }
                            .onEnded { value in
                                let flick = value.predictedEndTranslation.width
                                if abs(value.translation.width) > 90 || abs(flick) > 220 {
                                    commit(hype: value.translation.width > 0)
                                } else {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { offset = 0 }
                                }
                            }
                    )
                    .id(card.id)
                    .accessibilityElement(children: .combine)
                    .accessibilityAction(named: "Hype") { commit(hype: true) }
                    .accessibilityAction(named: "Pass") { commit(hype: false) }
            }
            .frame(maxHeight: .infinity)

            HStack(spacing: 10) {
                Button { commit(hype: false) } label: { Label("Pass", systemImage: "xmark") }
                    .buttonStyle(.encoreSecondary)
                Button { commit(hype: true) } label: { Label("Hype", systemImage: "heart.fill") }
                    .buttonStyle(.encore)
            }

            Group {
                if owned {
                    Button {
                        fitGarment = store.seed.garment(card.garment)
                    } label: {
                        Text("You own this. Add a fit note, +\(store.rules.points.fitNote)")
                            .font(.footnote.weight(.semibold)).underline()
                    }
                    .buttonStyle(.plain)
                } else if let last = store.demo.lastSwipeHype {
                    Text(last ? "Hyped. First word on Tuesday if it drops. +0 points, taste only."
                              : "Passed. You’ll see fewer pieces like it. No streaks.")
                        .font(.footnote).foregroundStyle(Palette.stone)
                } else {
                    Text("\(store.hypedToday) hyped · your swipes tell Arteixo what to make")
                        .font(.footnote).foregroundStyle(Palette.stone)
                }
            }
            .frame(minHeight: 22)
            .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .background(Palette.paper)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) { Eyebrow("Style Swipe", color: Palette.ink) }
            ToolbarItem(placement: .topBarTrailing) { KeyPill() }
        }
        .toolbarBackground(Palette.paper, for: .navigationBar)
        .sheet(item: $fitGarment) { g in
            FitNoteSheet(garment: g).environment(store).presentationDetents([.medium, .large])
        }
    }

    private func commit(hype: Bool) {
        guard !leaving else { return }
        leaving = true
        Haptics.tap()
        let finish = {
            store.swipe(hype: hype)
            offset = 0
            leaving = false
        }
        if reduceMotion {
            finish()
        } else {
            withAnimation(.easeOut(duration: 0.2)) { offset = hype ? 520 : -520 }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { finish() }
        }
    }
}

/// 2.2 · Fit note: one tap, +5, capped at 25 a week
struct FitNoteSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    let garment: Garment
    @State private var fit: Fit?
    @State private var tags: Set<String> = []

    private let labels: [(Fit, String)] = [(.trueToSize, "True to size"), (.small, "Runs small"), (.big, "Runs big")]
    private let tagOptions = ["boxy shoulders", "long sleeves", "cropped", "softens with wear"]

    var body: some View {
        let worth = Rules.points(for: .fitNote, earnedThisWeek: store.demo.weeklyFitNote, rules: store.rules)
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top, spacing: 14) {
                    GarmentImage(garment: garment).frame(width: 64)
                    VStack(alignment: .leading, spacing: 6) {
                        Eyebrow("Fit note")
                        Text("You own this. How does it fit?").font(.display).fixedSize(horizontal: false, vertical: true)
                    }
                }
                Text("\(garment.name). Owners with the same kept size (\(store.me.size ?? "M")) see your note on vintage listings.")
                    .font(.footnote).foregroundStyle(Palette.stone)

                HStack(spacing: 8) {
                    ForEach(labels, id: \.0) { item in
                        let on = fit == item.0
                        Button {
                            fit = item.0
                            Haptics.tap()
                        } label: {
                            Text(item.1).font(.footnote.weight(.semibold))
                                .frame(maxWidth: .infinity, minHeight: 52)
                                .foregroundStyle(on ? Palette.paper : Palette.ink)
                                .background(on ? Palette.ink : Color.clear)
                                .overlay(Rectangle().stroke(on ? Palette.ink : Palette.rule, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    ForEach(tagOptions, id: \.self) { tag in
                        let on = tags.contains(tag)
                        Button {
                            if on { tags.remove(tag) } else { tags.insert(tag) }
                        } label: {
                            HStack {
                                Image(systemName: on ? "checkmark.square.fill" : "square")
                                Text(tag).font(.footnote)
                                Spacer()
                            }
                            .frame(minHeight: 32)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }

                Button("Save fit note · +\(worth)") {
                    guard let fit else { return }
                    let pts = store.addFitNote(garment: garment.id, fit: fit)
                    store.say(pts > 0 ? "Fit note saved · +\(pts) Circular Score" : "Fit note saved · weekly cap reached, +0")
                    Haptics.success()
                    dismiss()
                }
                .buttonStyle(.encore)
                .disabled(fit == nil)

                Text("+\(store.rules.points.fitNote) each, capped at \(store.rules.points.fitNoteWeeklyCap) a week · \(store.demo.weeklyFitNote) earned this week")
                    .font(.caption).foregroundStyle(Palette.stone)
            }
            .padding(20)
        }
        .background(Palette.paper)
    }
}

extension Garment: Hashable {
    static func == (a: Garment, b: Garment) -> Bool { a.id == b.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

/// 2.3 · Deck complete: +5 and a taste profile built from what you hyped
struct DeckDoneView: View {
    @Environment(Store.self) private var store

    private var taste: [(label: String, share: Double)] {
        let seed = store.seed
        let fromDrop = seed.deck.hypedPieces.compactMap { seed.piece($0) }.map { seed.garment($0.garment) }
        let fromDeck = store.demo.deckHyped.compactMap { id in seed.deck.cards.first { $0.id == id } }.map { seed.garment($0.garment) }
        let edits = (fromDrop + fromDeck).map { $0.edit ?? "New in store" }
        guard !edits.isEmpty else { return [] }
        var counts: [String: Int] = [:]
        var order: [String] = []
        for e in edits {
            if counts[e] == nil { order.append(e) }
            counts[e, default: 0] += 1
        }
        return order
            .map { (label: $0, share: Double(counts[$0] ?? 0) / Double(edits.count)) }
            .sorted { $0.share > $1.share }
            .prefix(4)
            .map { $0 }
    }

    var body: some View {
        let bonus = store.demo.pointsLog.last { $0.action == .deckComplete }?.points ?? 0
        let inDrop = store.hypedInDrop
        Screen("Style Swipe") {
            if store.deckDone {
                VStack(alignment: .leading, spacing: 10) {
                    Tag("+\(bonus) Circular Score", .moss)
                    Heading("Deck complete.",
                            sub: "\(store.seed.deck.perDay) of \(store.seed.deck.perDay) today · \(store.hypedToday) hyped · \(store.demo.weeklyDeck) of \(store.rules.points.deckWeeklyCap) deck points this week",
                            large: true)
                }

                VStack(alignment: .leading, spacing: 14) {
                    Eyebrow("Your taste, from what you hyped")
                    ForEach(taste, id: \.label) { item in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(item.label).font(.subheadline.weight(.semibold))
                                Spacer()
                                Text("\(Int((item.share * 100).rounded()))%").font(.footnote).foregroundStyle(Palette.stone).monospacedDigit()
                            }
                            ProgressLine(value: item.share)
                        }
                    }
                    Text("Your swipes tell Arteixo what to make. They never earn points on their own.")
                        .font(.footnote).foregroundStyle(Palette.stone)
                }

                Button { store.path = [.dropHome] } label: {
                    VStack(alignment: .leading, spacing: 12) {
                        Hairline()
                        Text("You hyped \(inDrop.count) \(inDrop.count == 1 ? "piece" : "pieces") in Tuesday’s drop").font(.displayS)
                        HStack(spacing: 2) {
                            ForEach(inDrop.prefix(4)) { piece in
                                GarmentImage(garment: store.seed.garment(piece.garment), ratio: 0.72)
                            }
                        }
                        Hairline()
                    }
                }
                .buttonStyle(.plain)

                NoteRow("checkmark.shield", "No streaks. Skip tomorrow and nothing is lost.")
            } else {
                Heading("\(store.seed.deck.cards.count - store.demo.deckIndex) cards left in today’s deck",
                        sub: "Finish the deck to see your taste profile. Or don’t: there are no streaks.")
            }
        } footer: {
            FooterBar {
                if store.deckDone {
                    Button("See Tuesday’s drop") { store.path = [.dropHome] }.buttonStyle(.encore)
                    Button("See what \(store.demo.city) is wearing") { store.path = [.looks] }.buttonStyle(.encoreSecondary)
                } else {
                    Button("Keep swiping") { store.path = [.swipe] }.buttonStyle(.encore)
                }
            }
        }
    }
}
