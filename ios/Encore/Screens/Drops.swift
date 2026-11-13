import SwiftUI

/// 5.1 · This Tuesday's drop (teaser)
struct DropHomeView: View {
    @Environment(Store.self) private var store

    var body: some View {
        let drop = store.seed.drop
        let pass = store.hasPass
        let door = Dates.clock(pass ? drop.passOpens : drop.opens)
        let hyped = store.hypedInDrop
        Screen("Lot \(drop.lot) · opens Tue \(Dates.clock(drop.opens))") {
            Heading("Tuesday’s drop\(pass ? ", early." : ".")",
                    sub: "\(Fmt.num(drop.totalPieces)) pieces across three lanes. Quantities stated. No restock. No countdown. \(pass ? "Your pass opens the door at \(door)." : "The door opens at \(door).")",
                    large: true)

            VStack(alignment: .leading, spacing: 0) {
                Hairline()
                ForEach(drop.lanes) { lane in
                    HStack(alignment: .top, spacing: 14) {
                        GarmentImage(garment: store.seed.garment(lane.garment)).frame(width: 64)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(lane.name).font(.displayS)
                            Text("\(Fmt.num(lane.pieces)) pieces · \(lane.detail)").font(.footnote).foregroundStyle(Palette.stone)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 6)
                        Tag(Fmt.keys(store.rules.lane(lane.id).keys), .brass)
                    }
                    .padding(.vertical, 14)
                    Hairline()
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Eyebrow("Pieces you hyped · \(hyped.count) in this drop")
                HStack(alignment: .top, spacing: 2) {
                    ForEach(hyped.prefix(4)) { piece in
                        Button { store.go(.piece(piece.id)) } label: {
                            GarmentImage(garment: store.seed.garment(piece.garment), ratio: 0.72)
                        }
                        .buttonStyle(.plain)
                    }
                }
                NoteRow("bell", store.demo.settings.dropReminder
                        ? "You’ll get a nudge Tuesday at \(Dates.clock(drop.reminder)). One nudge, not ten."
                        : "Drop notifications are off. No nudge on Tuesday.")
            }
        } footer: {
            FooterBar {
                if store.demo.dropLive {
                    Button("Enter the drop") { store.go(.dropLive) }.buttonStyle(.encore)
                } else {
                    Button("Jump to Tuesday \(door) (demo)") {
                        store.jumpToDrop()
                        store.go(.dropLive)
                    }
                    .buttonStyle(.encore)
                }
                Text("Keys open the door · money buys the piece · never marked down")
                    .font(.caption).foregroundStyle(Palette.stone)
            }
        }
    }
}

extension Store {
    func laneLabel(_ piece: Piece) -> String {
        let g = seed.garment(piece.garment)
        switch piece.lane {
        case .vintage: return "\(g.era.map(String.init) ?? "") · \(g.edit ?? "")"
        case .recut: return "Re-cut · \(piece.number.components(separatedBy: " ").suffix(2).joined(separator: " "))"
        case .firstAccess: return "\(g.season ?? "") · \(rules.lane(.firstAccess).earlyHours ?? 24) h early"
        }
    }

    func pieceLine(_ piece: Piece) -> String {
        switch piece.lane {
        case .vintage: return "\(piece.number) · graded \(piece.grade?.rawValue ?? "") · \(piece.size ?? "")"
        case .recut: return "\(piece.number) · from 2 returned · \(piece.size ?? "")"
        case .firstAccess: return "New · same price · \(piece.number)"
        }
    }
}

/// 5.2 · Drop live: three lanes
struct DropLiveView: View {
    @Environment(Store.self) private var store
    @State private var filter = "all"

    private let columns = [GridItem(.flexible(), spacing: 12, alignment: .top), GridItem(.flexible(), spacing: 12, alignment: .top)]

    var body: some View {
        let drop = store.seed.drop
        let pass = store.hasPass
        let door = Dates.clock(pass ? drop.passOpens : drop.opens)
        if !store.demo.dropLive {
            Screen("Archive Drop") {
                Heading("The door is closed.",
                        sub: "Lot \(drop.lot) opens Tuesday at \(Dates.clock(drop.opens))\(pass ? ", and at \(door) with your pass" : ""). No countdown: it opens when it opens.",
                        large: true)
            } footer: {
                FooterBar {
                    Button("Jump to Tuesday \(door) (demo)") { store.jumpToDrop() }.buttonStyle(.encore)
                }
            }
        } else {
            let pieces = drop.pieces.filter { piece in
                switch filter {
                case "all": return true
                case "hyped": return store.demo.hypedPieces.contains(piece.id)
                default: return piece.lane.rawValue == filter
                }
            }
            Screen("Archive Drop · lot \(drop.lot)") {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("Live · \(Dates.clock(store.demo.now))").font(.displayXL)
                        Spacer()
                        if store.demo.now < drop.opens { Tag("You’re in early", .moss) }
                    }
                    Text("\(Fmt.num(drop.totalPieces)) pieces · \(Fmt.num(store.available)) still available · quantities stated, no restock")
                        .font(.subheadline).foregroundStyle(Palette.stone)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        filterButton("all", "All")
                        filterButton("vintage", "Vintage · \(Fmt.keys(store.rules.lane(.vintage).keys))")
                        filterButton("recut", "Re-cut · \(store.rules.lane(.recut).keys)")
                        filterButton("first_access", "First access · \(store.rules.lane(.firstAccess).keys)")
                        filterButton("hyped", "Hyped")
                    }
                }

                if pieces.isEmpty {
                    Text("Nothing in this filter. Hype pieces in the daily deck to see them here.")
                        .font(.subheadline).foregroundStyle(Palette.stone)
                } else {
                    LazyVGrid(columns: columns, spacing: 22) {
                        ForEach(pieces) { piece in
                            Button { store.go(.piece(piece.id)) } label: { cell(piece) }.buttonStyle(.plain)
                        }
                    }
                }

                NoteRow("checkmark.shield", "Nothing here counts down or says “only 3 left”. The number you see is the number there is.")
            }
        }
    }

    private func filterButton(_ id: String, _ label: String) -> some View {
        let on = filter == id
        return Button { filter = id } label: {
            Text(label.uppercased())
                .font(.caption2.weight(.semibold)).tracking(0.8)
                .padding(.horizontal, 12)
                .frame(minHeight: 36)
                .foregroundStyle(on ? Palette.paper : Palette.ink)
                .background(on ? Palette.ink : Color.clear)
                .overlay(Rectangle().stroke(on ? Palette.ink : Palette.rule, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private func cell(_ piece: Piece) -> some View {
        let g = store.seed.garment(piece.garment)
        return VStack(alignment: .leading, spacing: 6) {
            GarmentImage(garment: g, ratio: 0.75)
                .overlay(alignment: .topLeading) { Tag(store.laneLabel(piece)).background(Palette.paper).padding(8) }
                .overlay(alignment: .bottomTrailing) {
                    if store.owns(piece.id) {
                        Tag("Yours", .moss).padding(8)
                    } else if store.demo.hypedPieces.contains(piece.id) {
                        Tag("Hyped", .solid).padding(8)
                    }
                }
            Text(g.name).font(.footnote.weight(.semibold)).fixedSize(horizontal: false, vertical: true)
            Text(store.pieceLine(piece)).font(.caption).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
            HStack {
                Text(Fmt.euro(store.price(piece))).font(.subheadline.weight(.semibold)).monospacedDigit()
                Spacer()
                Tag(Fmt.keys(piece.keys), .brass)
            }
        }
    }
}

/// 5.3 · Piece detail
struct PieceView: View {
    @Environment(Store.self) private var store
    let pieceID: String
    @State private var confirming = false

    var body: some View {
        if let piece = store.seed.piece(pieceID) ?? store.seed.drop.pieces.first {
            content(piece)
        }
    }

    private func facts(_ piece: Piece) -> [String] {
        switch piece.lane {
        case .vintage: return ["Pre-worn · graded \(piece.grade?.rawValue ?? "")", "Cleaned at the hub", "From lot \(piece.fromLot ?? "on file")"]
        case .recut: return ["Hand re-cut", "Made from returned garments", "Numbered edition"]
        case .firstAccess: return ["New", "Same price as in store", "\(store.rules.lane(.firstAccess).earlyHours ?? 24) h before the public"]
        }
    }

    private func content(_ piece: Piece) -> some View {
        let g = store.seed.garment(piece.garment)
        let price = store.price(piece)
        let keys = store.keys
        let owned = store.owns(piece.id)
        let entry = store.entry(for: piece)
        let notes = piece.fitNotes ?? []
        let trueCount = notes.filter { $0.fit == .trueToSize }.count
        let parts: [String?] = [
            g.era.map { "Zara \($0)" } ?? g.season.map { "Zara \($0)" } ?? "Zara",
            g.era != nil ? g.edit.map { "\($0) edit" } : nil,
            g.color,
            piece.size.map { "size \($0)" },
        ]
        let descriptor = parts.compactMap { $0 }.joined(separator: " · ")
        return Screen(piece.shortNumber) {
            GarmentImage(garment: g, ratio: 0.9)
                .padding(.horizontal, -20)
                .overlay(alignment: .bottomLeading) { Tag(piece.number, .solid).padding(.bottom, 12) }

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(g.name).font(.display).fixedSize(horizontal: false, vertical: true)
                    Text(descriptor).font(.footnote).foregroundStyle(Palette.stone)
                }
                Spacer(minLength: 12)
                VStack(alignment: .trailing, spacing: 3) {
                    Text(Fmt.euro(price)).font(.display).monospacedDigit()
                    if let original = piece.original {
                        Text("original \(Fmt.euro(original))").font(.caption).foregroundStyle(Palette.stone)
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Tag(Fmt.keys(piece.keys), .brass)
                    Tag(piece.lane == .vintage ? "Verified" : piece.lane == .recut ? "Re-cut edition" : "First access", .moss)
                }
                Text(facts(piece).joined(separator: " · ")).font(.footnote).foregroundStyle(Palette.stone)
                if piece.grade == .b {
                    Text("Grade B sells at \(Int(((store.rules.lane(.vintage).gradeBShare ?? 0.7) * 100).rounded()))% of the original price. That is the rule, not a markdown.")
                        .font(.footnote).foregroundStyle(Palette.stone)
                }
            }

            if !notes.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Hairline()
                    if store.demo.tier >= .stitch {
                        HStack {
                            Eyebrow("Fit notes · owners with your kept size")
                            Spacer()
                            Eyebrow("\(notes.count) \(notes.count == 1 ? "note" : "notes")", color: Palette.ink)
                        }
                        ProgressLine(value: Double(trueCount) / Double(notes.count))
                        Text("True to size · \(trueCount) of \(notes.count)").font(.footnote.weight(.semibold))
                        ForEach(notes, id: \.by) { note in
                            Text("“\(note.text)” · \(store.seed.user(note.by).firstName), \(note.size)")
                                .font(.footnote).foregroundStyle(Palette.stone)
                        }
                    } else {
                        NoteRow("ruler", "Fit notes from owners in your size unlock at the Stitch tier.")
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Hairline()
                Eyebrow("Its story, in facts")
                Text(piece.story ?? "").font(.subheadline).fixedSize(horizontal: false, vertical: true)
                Text("No claims about the planet: a number, a grade and a date.").font(.footnote).foregroundStyle(Palette.stone)
            }
        } footer: {
            FooterBar {
                if owned {
                    Button("Yours · see the certificate") { store.path = [.profile] }.buttonStyle(.encoreSecondary)
                } else if entry.ok {
                    Button("Use \(Fmt.keys(piece.keys)) · buy for \(Fmt.euro(price))") { confirming = true }.buttonStyle(.encore)
                } else if entry.blocked == .notOpen {
                    Button("Opens \(Dates.weekdayDate(entry.opensAt)), \(Dates.clock(entry.opensAt)) · see the drop") { store.path = [.dropHome] }
                        .buttonStyle(.encore)
                } else {
                    Button("Needs \(Fmt.keys(piece.keys)), you have \(keys) · earn one") { store.path = [.scan] }.buttonStyle(.encore)
                }
                Text("Pick up at Gran Vía or ship with Tuesday’s delivery · free returns to the bin, with a key")
                    .font(.caption).foregroundStyle(Palette.stone).multilineTextAlignment(.center)
            }
        }
        .sheet(isPresented: $confirming) {
            VStack(alignment: .leading, spacing: 18) {
                Eyebrow("Confirm")
                Text("The key opens the door. Money buys the piece.").font(.display).fixedSize(horizontal: false, vertical: true)
                HStack(alignment: .top, spacing: 12) {
                    StatCell(value: "−\(piece.keys)", label: "\(piece.keys == 1 ? "key" : "keys") · \(keys - piece.keys) left", tint: Palette.brass)
                    StatCell(value: Fmt.euro(price), label: piece.lane == .vintage ? "grade \(piece.grade?.rawValue ?? "") price" : piece.lane == .recut ? "atelier price" : "store price")
                }
                Text("\(g.name) · \(piece.number). Buying earns 0 Circular Score: status is never bought. Payment is simulated in this demo.")
                    .font(.footnote).foregroundStyle(Palette.stone)
                Button("Pay \(Fmt.euro(price)) · use \(Fmt.keys(piece.keys))") {
                    confirming = false
                    if store.buy(piece.id) {
                        Haptics.success()
                        store.path = [.youreIn]
                    }
                }
                .buttonStyle(.encore)
                Button("Not now") { confirming = false }.buttonStyle(.encoreSecondary)
                Spacer(minLength: 0)
            }
            .padding(20)
            .background(Palette.paper)
            .presentationDetents([.medium, .large])
        }
    }
}

/// 5.4 · You're in
struct YoureInView: View {
    @Environment(Store.self) private var store

    var body: some View {
        if let cert = store.demo.certificates.first(where: { $0.piece == store.demo.lastPurchase }),
           let piece = store.seed.piece(cert.piece) {
            let g = store.seed.garment(cert.garment)
            let lot = piece.fromLot.flatMap { id in store.demo.lots.first { $0.id == id } }
            Screen("\(cert.keys == 1 ? "Key" : "\(cert.keys) keys") used · \(store.keys) left", showKeys: false) {
                Heading("You’re in. \(piece.shortNumber) is yours.", large: true)

                VStack(alignment: .leading, spacing: 14) {
                    HStack(alignment: .top, spacing: 14) {
                        GarmentImage(garment: g).frame(width: 84)
                        VStack(alignment: .leading, spacing: 5) {
                            Eyebrow("Archive certificate")
                            Text("\(g.name)\(g.era.map { " · \($0)" } ?? "")").font(.displayS).fixedSize(horizontal: false, vertical: true)
                            Text("\(cert.number)\(cert.grade.map { " · graded \($0.rawValue)" } ?? "") · lot \(cert.dropLot)")
                                .font(.footnote).foregroundStyle(Palette.stone)
                            Text("Encore · \(store.demo.city) · \(Dates.weekdayDate(cert.date)) \(String(cert.date.prefix(4)))")
                                .font(.footnote).foregroundStyle(Palette.stone)
                        }
                    }
                    Hairline()
                    Text("Paid \(Fmt.euro(cert.paid)) · pick up Gran Vía from Wednesday").font(.footnote.weight(.semibold))
                }
                .padding(16)
                .background(Palette.surface)
                .overlay(Rectangle().stroke(Palette.ink, lineWidth: 1))

                if let lot {
                    let owner = store.seed.user(lot.owner)
                    HStack(alignment: .top, spacing: 12) {
                        Avatar(initial: owner.initial, size: 34)
                        Text("\(owner.firstName) brought this \(g.shortName) back on \(Dates.dayMonth(lot.droppedOn)). She just got a note that it found its encore. That’s the loop.")
                            .font(.subheadline).fixedSize(horizontal: false, vertical: true)
                    }
                }

                HStack(alignment: .top, spacing: 12) {
                    StatCell(value: "+0", label: "points for buying · by design")
                    StatCell(value: "\(store.keys)", label: "keys left · never expire", tint: Palette.brass)
                }
            } footer: {
                FooterBar {
                    Button("Bring the next piece back") { store.path = [.scan] }.buttonStyle(.encore)
                    Button("Post it when it arrives · +\(store.rules.points.look)") { store.path = [.postLook] }.buttonStyle(.encoreSecondary)
                }
            }
            .navigationBarBackButtonHidden(true)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { store.home() }.font(.footnote.weight(.semibold))
                }
            }
        } else {
            Screen("Archive Drop") {
                Heading("Nothing bought yet", sub: "Open Tuesday’s drop to use a key.")
            } footer: {
                FooterBar { Button("See the drop") { store.path = [.dropHome] }.buttonStyle(.encore) }
            }
        }
    }
}
