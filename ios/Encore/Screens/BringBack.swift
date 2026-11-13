import SwiftUI

/// 1.1 · Scan the care label (camera simulated)
struct ScanView: View {
    @Environment(Store.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var sweep = false
    @State private var read = false

    var body: some View {
        let g = store.nextReturn
        Screen("Store mode · \(store.seed.clock.store)") {
            Heading("Scan the care label", sub: "The small label inside the garment. Any Zara piece, any condition, no receipt.")

            ZStack {
                Palette.ink
                VStack(alignment: .leading, spacing: 6) {
                    Text("REF. \(g.ref ?? "") · \((g.line ?? "").uppercased())").font(.system(size: 10, weight: .semibold)).tracking(0.8)
                    Text("\(g.shortName.uppercased()) · \((g.color ?? "").uppercased())").font(.system(size: 10)).tracking(0.8)
                    HStack(spacing: 2) {
                        ForEach(0..<34, id: \.self) { i in
                            Rectangle().fill(Palette.ink).frame(width: i % 3 == 0 ? 3 : 1.5, height: 30)
                        }
                    }
                    Text("care label · NaviLens").font(.system(size: 8)).foregroundStyle(Palette.stone)
                }
                .padding(14)
                .background(Color.white)
                .rotationEffect(.degrees(-4))
                Rectangle().fill(Palette.brassFill).frame(height: 2).offset(y: sweep ? 80 : -80).opacity(read ? 0 : 1)
            }
            .frame(height: 280)
            .overlay(alignment: .bottom) {
                Tag(read ? "Code read" : "Reading the code", read ? .moss : .brass).padding(.bottom, 14)
            }
            .accessibilityElement()
            .accessibilityLabel("Camera view reading care label reference \(g.ref ?? "")")

            VStack(alignment: .leading, spacing: 0) {
                Hairline()
                stepRow("01", "Point at the inside label. The reference code and the NaviLens code both work.", done: true)
                Hairline()
                stepRow("02", "Confirm the piece and find the bin.", done: false)
                Hairline()
                stepRow("03", "Drop it in. The key lands in your app.", done: false)
                Hairline()
            }
        } footer: {
            FooterBar {
                Button("Label read · continue") { store.go(.confirm) }.buttonStyle(.encore)
            }
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) { sweep = true }
        }
        .task {
            try? await Task.sleep(nanoseconds: 1_800_000_000)
            read = true
            Haptics.tap()
        }
    }

    private func stepRow(_ n: String, _ text: String, done: Bool) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 14) {
            Text(n).font(.caption.weight(.semibold)).monospacedDigit().foregroundStyle(Palette.stone).frame(width: 22, alignment: .leading)
            Text(text).font(.footnote).foregroundStyle(done ? Palette.ink : Palette.stone).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 12)
    }
}

/// 1.2 · Garment confirmed
struct ConfirmView: View {
    @Environment(Store.self) private var store

    private let conditions: [(Condition, String, String)] = [
        (.likeNew, "Like new", "worn a few times"),
        (.loved, "Loved", "signs of wear"),
        (.wornOut, "Worn out", "re-cut or fiber"),
    ]

    var body: some View {
        let g = store.nextReturn
        let keys = Rules.keysForReturn(grade: nil, earnedThisMonth: store.monthEarned, rules: store.rules)
        Screen("Label read") {
            Heading("Yes, that’s yours", sub: "Pulled from the reference code, the same lookup Pre-Owned uses.")

            HStack(alignment: .top, spacing: 16) {
                GarmentImage(garment: g).frame(width: 120)
                VStack(alignment: .leading, spacing: 6) {
                    Text(g.name).font(.displayS).fixedSize(horizontal: false, vertical: true)
                    Text("Ref. \(g.ref ?? "") · \(g.line ?? "")").font(.footnote).foregroundStyle(Palette.stone)
                    Text("\(g.shortName.capitalizedFirst) · \(g.color ?? "")").font(.footnote).foregroundStyle(Palette.stone)
                    HStack(spacing: 6) {
                        Tag(g.size ?? "")
                        Tag("bought \(g.bought.map(String.init) ?? "")")
                    }
                    .padding(.top, 2)
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Eyebrow("Condition, honestly")
                Text("It only changes the bonus: grade A at the hub earns a second key.")
                    .font(.footnote).foregroundStyle(Palette.stone)
                HStack(spacing: 8) {
                    ForEach(conditions, id: \.0) { item in
                        let on = store.demo.condition == item.0
                        Button {
                            store.demo.condition = item.0
                            Haptics.tap()
                        } label: {
                            VStack(spacing: 3) {
                                Text(item.1).font(.footnote.weight(.semibold))
                                Text(item.2).font(.caption2)
                            }
                            .frame(maxWidth: .infinity, minHeight: 58)
                            .foregroundStyle(on ? Palette.paper : Palette.ink)
                            .background(on ? Palette.ink : Color.clear)
                            .overlay(Rectangle().stroke(on ? Palette.ink : Palette.rule, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
            }

            Panel {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Eyebrow("Where")
                        Text("Encore Bin · by the returns counter").font(.subheadline.weight(.semibold))
                        Text("About 40 steps from you · open now").font(.footnote).foregroundStyle(Palette.stone)
                    }
                    Spacer(minLength: 8)
                    Tag(keys > 0 ? Fmt.keys(keys) : "cap reached", keys > 0 ? .brass : .outline)
                }
                if keys == 0 {
                    Text("You have earned \(store.rules.monthlyKeyCap) keys this month, the cap. This return still earns +\(store.rules.points.returned) points and counts for the city.")
                        .font(.footnote).foregroundStyle(Palette.stone)
                }
            }
        } footer: {
            FooterBar {
                Button("Take it to the bin") { store.go(.bin) }.buttonStyle(.encore)
            }
        }
    }
}

/// 1.3 · Drop it in the Encore Bin (scale and RFID simulated)
struct BinView: View {
    @Environment(Store.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var passed = 0
    @State private var dropped = false
    /// The garment being returned, fixed when the screen opens.
    @State private var garment: Garment?

    var body: some View {
        let g = garment ?? store.nextReturn
        let rfid = (g.bought ?? 0) >= 2022
        let checks: [(String, String)] = [
            ("Weight", String(format: "%.2f kg", g.weightKg ?? 0)),
            ("RFID label", rfid ? "confirmed in 0.9 s" : "too old to read · scan + weight"),
            ("Matches your scan", "Ref. \(g.ref ?? "")"),
        ]
        Screen("\(store.seed.clock.bin) · \(store.seed.clock.store.replacingOccurrences(of: "Zara ", with: ""))") {
            Heading("Drop it in", sub: "The bin weighs the piece and reads its label. Watch it count.")

            ZStack(alignment: .bottom) {
                Palette.tile
                Image(assetName(g)).resizable().scaledToFit().frame(height: 120)
                    .offset(y: dropped ? 30 : -110)
                    .opacity(dropped ? 0 : 1)
                VStack(spacing: 4) {
                    Rectangle().fill(Palette.ink).frame(width: 150, height: 8)
                    VStack(spacing: 3) {
                        Text("ENCORE BIN").font(.system(.headline, design: .serif)).foregroundStyle(Palette.paper)
                        Text("ANY ZARA · ANY CONDITION").font(.system(size: 9, weight: .semibold)).tracking(1.2)
                            .foregroundStyle(Palette.paper.opacity(0.7))
                    }
                    .frame(width: 210, height: 96)
                    .background(Palette.ink)
                }
            }
            .frame(height: 240)
            .clipped()
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 0) {
                Hairline()
                ForEach(Array(checks.enumerated()), id: \.offset) { i, check in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(check.0).font(.footnote.weight(.semibold))
                            Spacer()
                            if passed > i {
                                Label(check.1, systemImage: "checkmark").font(.footnote).foregroundStyle(Palette.moss)
                                    .labelStyle(.titleAndIcon)
                            } else {
                                Text("reading").font(.footnote).foregroundStyle(Palette.stone)
                            }
                        }
                        ProgressLine(value: passed > i ? 1 : (passed == i ? 0.35 : 0), tint: passed > i ? Palette.moss : Palette.ink)
                    }
                    .padding(.vertical, 12)
                    Hairline()
                }
            }
            Text("Older pieces whose label no longer reads are confirmed by the scan plus the weight.")
                .font(.caption).foregroundStyle(Palette.stone)
        } footer: {
            FooterBar {
                Button(passed < 3 ? "Reading the bin" : "Done · claim my key") {
                    store.confirmReturn()
                    Haptics.success()
                    store.path = [.keyLanding]
                }
                .buttonStyle(.encore)
                .disabled(passed < 3)
            }
        }
        .onAppear { if garment == nil { garment = store.nextReturn } }
        .task {
            if reduceMotion { dropped = true } else {
                withAnimation(.easeIn(duration: 1.1)) { dropped = true }
            }
            for i in 1...3 {
                try? await Task.sleep(nanoseconds: 850_000_000)
                passed = i
                Haptics.tap()
            }
        }
    }

    private func assetName(_ g: Garment) -> String {
        let file = g.image.split(separator: "/").last.map(String.init) ?? g.image
        return file.split(separator: ".").first.map(String.init) ?? file
    }
}

/// 1.4 · Key landing
struct KeyLandingView: View {
    @Environment(Store.self) private var store

    var body: some View {
        if let r = store.demo.lastReturn {
            let g = store.seed.garment(r.garment)
            let moved = r.rankBefore - r.rankAfter
            Screen("Lot \(r.lot) · collected \(r.time)", showKeys: false) {
                Image(systemName: "key.fill")
                    .font(.system(size: 54))
                    .foregroundStyle(Palette.brass)
                    .frame(maxWidth: .infinity, minHeight: 190)
                    .background(Palette.brassFill)
                    .accessibilityHidden(true)

                Heading(r.keys > 0 ? "+\(r.keys) Archive Key" : "Monthly cap reached",
                        sub: r.keys > 0
                            ? "A second key lands if the hub grades your \(g.shortName) A. You’ll see where it goes."
                            : "No key this time: you already earned \(store.rules.monthlyKeyCap) this month. The points and the city count still land.",
                        large: true)

                HStack(alignment: .top, spacing: 12) {
                    StatCell(value: "\(store.keys)", label: "keys now", tint: Palette.brass)
                    StatCell(value: "+\(r.points)", label: "Circular Score", tint: Palette.moss)
                    if store.demo.settings.leaderboards {
                        StatCell(value: "No. \(r.rankAfter)", label: "\(store.demo.city)\(moved > 0 ? " · up \(moved)" : "")")
                    } else {
                        StatCell(value: "Off", label: "leaderboards")
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    Hairline()
                    Text("Never expires · no cash value · cannot be bought").font(.footnote).foregroundStyle(Palette.stone)
                    Button { store.go(.cityGoal) } label: {
                        HStack {
                            Text("+1 to \(store.demo.city)’s goal").font(.footnote.weight(.semibold))
                            Image(systemName: "arrow.right").font(.caption)
                        }
                    }
                    .buttonStyle(.plain)
                }
            } footer: {
                FooterBar {
                    Button("Follow my lot") {
                        store.followLot(r.lot)
                        store.path = [.lot(r.lot)]
                    }
                    .buttonStyle(.encore)
                    Button("See Tuesday’s drop") { store.path = [.dropHome] }.buttonStyle(.encoreSecondary)
                }
            }
            .navigationBarBackButtonHidden(true)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { store.home() }.font(.footnote.weight(.semibold))
                }
            }
        } else {
            Screen("Bring it back") {
                Heading("No return yet", sub: "Scan a care label to start.")
            } footer: {
                FooterBar { Button("Scan a label") { store.path = [.scan] }.buttonStyle(.encore) }
            }
        }
    }
}

/// One step on the lot's record.
private struct LotStep: View {
    enum Phase { case done, current, todo }
    let state: Phase
    let n: Int
    let title: String
    let detail: String
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 14) {
            Group {
                if state == .done {
                    Image(systemName: "checkmark").foregroundStyle(Palette.moss)
                } else {
                    Text(String(format: "%02d", n)).monospacedDigit()
                        .foregroundStyle(state == .current ? Palette.ink : Palette.stone)
                }
            }
            .font(.caption.weight(.semibold))
            .frame(width: 22, alignment: .leading)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.displayS).foregroundStyle(state == .todo ? Palette.stone : Palette.ink)
                Text(detail).font(.footnote).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, 13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

/// 1.5 · Where your garment went
struct LotTrackerView: View {
    @Environment(Store.self) private var store
    let lotID: String

    var body: some View {
        let lots = store.myLots
        let lot = lots.first { $0.id == lotID } ?? store.latestLot
        let g = store.seed.garment(lot.garment)
        let day = String(lot.droppedOn.prefix(10))
        let graded = lot.grade != nil
        let sold = lot.status.contains(.sold)
        let place = lot.droppedAt.replacingOccurrences(of: "Zara ", with: "").components(separatedBy: ",").first ?? lot.droppedAt
        Screen("Lot \(lot.id)") {
            Heading("Where your \(g.shortName) went", sub: "Status is earned on a record, not a promise. Every lot is logged.")

            HStack(alignment: .top, spacing: 16) {
                GarmentImage(garment: g).frame(width: 96)
                VStack(alignment: .leading, spacing: 6) {
                    Text(g.name).font(.displayS).fixedSize(horizontal: false, vertical: true)
                    Text("Dropped at \(place) · \(Dates.dayMonth(day))\(lot.droppedOn.count > 10 ? ", \(Dates.clock(lot.droppedOn))" : "")")
                        .font(.footnote).foregroundStyle(Palette.stone)
                    HStack(spacing: 6) {
                        if let grade = lot.grade {
                            Tag("Graded \(grade.rawValue)", .moss)
                            if grade == .a && lot.keysAwarded > 1 { Tag("+1 bonus key", .brass) }
                        } else {
                            Tag("Grade pending")
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 0) {
                Hairline()
                LotStep(state: .done, n: 1, title: "Collected",
                        detail: "\(Dates.weekdayDate(day)) · bag 7 · on the Tuesday return run to the DC")
                Hairline()
                LotStep(state: graded ? .done : .current, n: 2, title: "Graded at the hub",
                        detail: gradedLine(lot, day: day))
                Hairline()
                LotStep(state: destinationTitle(lot) == nil ? .todo : (sold ? .done : .current), n: 3,
                        title: destinationTitle(lot) ?? "Its destination", detail: destinationLine(lot, garment: g))
                Hairline()
                LotStep(state: sold ? .done : .todo, n: 4, title: "Its encore",
                        detail: sold ? "Sold in a Tuesday drop. It found its encore."
                            : "You’ll be told when it sells and who gave it a second life (first name only, if they opt in).")
                Hairline()
            }

            if !graded {
                Button("Fast-forward: the hub grades it (demo)") {
                    store.gradeLot(lot.id)
                    Haptics.success()
                }
                .buttonStyle(.encoreSecondary)
            }

            VStack(alignment: .leading, spacing: 0) {
                Eyebrow("Your other lots · \(lots.count) logged")
                Hairline().padding(.top, 10)
                ForEach(Array(lots.filter { $0.id != lot.id }.suffix(4).reversed())) { other in
                    Button { store.replaceTop(with: .lot(other.id)) } label: {
                        HStack {
                            Text(other.id).font(.footnote.weight(.semibold)).monospacedDigit()
                            Text(store.seed.garment(other.garment).shortName).font(.footnote).foregroundStyle(Palette.stone)
                            Spacer()
                            Text(other.grade.map { "Graded \($0.rawValue)" } ?? "Pending").font(.footnote).foregroundStyle(Palette.stone)
                        }
                        .padding(.vertical, 12)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    Hairline()
                }
            }
        } footer: {
            FooterBar {
                Button("Next: swipe today’s deck") { store.path = [store.deckDone ? .deckDone : .swipe] }.buttonStyle(.encore)
            }
        }
    }

    private func gradedLine(_ lot: Lot, day: String) -> String {
        guard let grade = lot.grade else { return "Usually two days after collection. Grade A earns a second key." }
        let state = grade == .c ? "unwearable as is" : "cleaned, photographed"
        return "\(Dates.weekdayDate(Dates.addDays(day, 2))) · Cáritas Moda re- · grade \(grade.rawValue), \(state)"
    }

    private func destinationTitle(_ lot: Lot) -> String? {
        if lot.status.contains(.fiber) { return "Fiber" }
        if lot.status.contains(.recut) { return "Re-cut edition" }
        if lot.status.contains(.vintageLane) { return "Vintage lane" }
        return nil
    }

    private func destinationLine(_ lot: Lot, garment: Garment) -> String {
        if lot.status.contains(.fiber) { return "Recycled into fiber. Weight reported per lot." }
        if lot.status.contains(.recut) { return "With a partner atelier in the Arteixo cluster, to be re-cut into a numbered edition." }
        if lot.status.contains(.vintageLane) { return "Listed as “\(lot.listing ?? garment.listing ?? garment.name)” for a Tuesday drop." }
        return "Vintage lane, a re-cut edition or fiber, decided by the grade."
    }
}
