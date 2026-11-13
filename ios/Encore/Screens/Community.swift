import SwiftUI

private struct LookCell: View {
    @Environment(Store.self) private var store
    let look: Look

    var body: some View {
        let u = store.seed.user(look.by)
        let mine = look.by == store.meID
        let hearted = store.demo.hearted.contains(look.id)
        let heartBonus = Rules.points(for: .look, hearts: look.hearts, rules: store.rules) - store.rules.points.look
        VStack(alignment: .leading, spacing: 8) {
            GarmentImage(garment: store.seed.garment(look.garment), ratio: 0.78)
                .overlay(alignment: .topLeading) {
                    Tag(look.tag, mine ? .solid : .outline).background(Palette.paper).padding(8)
                }
            HStack(spacing: 6) {
                if store.seed.closets[look.by] != nil && !mine {
                    Button { store.go(.closet(look.by)) } label: {
                        Text(u.name).font(.footnote.weight(.semibold)).underline()
                    }
                    .buttonStyle(.plain)
                } else {
                    Text(mine ? "\(u.name) (you)" : u.name).font(.footnote.weight(.semibold))
                }
                Spacer(minLength: 4)
                Button {
                    if mine { store.say("You can’t heart your own look.") } else {
                        store.heart(look.id)
                        Haptics.tap()
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: hearted ? "heart.fill" : "heart")
                        Text("\(look.hearts)").monospacedDigit()
                    }
                    .font(.footnote)
                    .foregroundStyle(hearted ? Palette.clay : Palette.ink)
                    .frame(minWidth: 44, minHeight: 32, alignment: .trailing)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("\(look.hearts) hearts. \(hearted ? "Remove your heart" : "Heart this look")")
            }
            Text(look.caption + (mine && heartBonus > 0 ? " · +\(heartBonus)" : ""))
                .font(.footnote).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
        }
    }
}

/// 3.1 · Looks feed
struct LooksView: View {
    @Environment(Store.self) private var store
    @State private var filter = "city"

    private let columns = [GridItem(.flexible(), spacing: 12, alignment: .top), GridItem(.flexible(), spacing: 12, alignment: .top)]

    var body: some View {
        let progress = Rules.cityGoalProgress(store.goal)
        let looks = store.looks.filter { look in
            switch filter {
            case "following": return store.demo.following.contains(look.by)
            case "recut": return look.recut ?? false
            default: return look.audience != .friends || look.by == store.meID
            }
        }
        Screen("Looks · \(store.demo.city)") {
            Picker("Feed", selection: $filter) {
                Text("City").tag("city")
                Text("Following").tag("following")
                Text("Re-cut").tag("recut")
            }
            .pickerStyle(.segmented)

            VStack(alignment: .leading, spacing: 0) {
                Hairline()
                Button { store.go(.cityGoal) } label: {
                    linkRow("\(store.demo.city)’s goal", "\(progress.percent)% of \(Fmt.num(store.goal.target)) garments back")
                }
                Hairline()
                Button { store.go(.battle) } label: {
                    linkRow("Style Battle", store.demo.battleChoice == nil ? "Open all day · one vote" : "You voted today")
                }
                Hairline()
            }
            .buttonStyle(.plain)

            if looks.isEmpty {
                Text(filter == "following"
                     ? "Nobody followed yet. Tap a name in the City feed to open a closet and follow."
                     : "No looks here yet.")
                    .font(.subheadline).foregroundStyle(Palette.stone)
            } else {
                LazyVGrid(columns: columns, spacing: 20) {
                    ForEach(looks) { look in LookCell(look: look) }
                }
            }

            if !store.demo.settings.photos {
                NoteRow("camera", "Photos are off, so your own looks are hidden from the feed. Switch them on in Profile, in one tap.")
            }
            NoteRow("checkmark.shield", "Photos are opt-in and moderated. 10 hearts give the poster +\(store.rules.points.heartsPer10), capped at \(store.rules.points.lookCap) a post. Your city is the one you declared.")
        } footer: {
            FooterBar {
                Button("Post a look · +\(store.rules.points.look)") { store.go(.postLook) }.buttonStyle(.encore)
            }
        }
    }

    private func linkRow(_ title: String, _ sub: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(sub).font(.footnote).foregroundStyle(Palette.stone)
            }
            Spacer()
            Image(systemName: "arrow.right").font(.footnote)
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

/// 3.2 · Post a look (photo is a placeholder)
struct PostLookView: View {
    @Environment(Store.self) private var store
    @State private var pick = 0
    @State private var caption = ""
    @State private var audience: Audience = .city

    private struct Option: Identifiable {
        let id: Int
        let garment: Garment
        let tag: String
    }

    private var options: [Option] {
        let seed = store.seed
        let bought = store.demo.certificates.map { (seed.garment($0.garment), "you · \($0.number.components(separatedBy: " of ").first ?? $0.number)") }
        let returned = store.myLots.suffix(3).reversed().map { (seed.garment($0.garment), "you · lot \($0.id)") }
        return Array((bought + returned).prefix(3)).enumerated().map { Option(id: $0.offset, garment: $0.element.0, tag: $0.element.1) }
    }

    var body: some View {
        let options = self.options
        let canBattle = store.demo.tier >= .cut
        let worth = Rules.points(for: .look, rules: store.rules)
        Screen("Post a look") {
            Heading("Post a look", sub: "Tag the Encore piece you’re wearing. The tag links to its lot, so a look is proof it got a second life.")

            if !store.demo.settings.photos {
                Panel {
                    Toggle(isOn: Binding(get: { store.demo.settings.photos }, set: { _ in store.toggle(\.photos) })) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Photos are off").font(.subheadline.weight(.semibold))
                            Text("Posting needs your opt-in. One tap, and one tap to undo it in Profile.")
                                .font(.footnote).foregroundStyle(Palette.stone)
                        }
                    }
                    .tint(Palette.ink)
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Eyebrow("Tag a piece from your lots and drops")
                HStack(alignment: .top, spacing: 8) {
                    ForEach(options) { option in
                        let on = pick == option.id
                        Button { pick = option.id } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                GarmentImage(garment: option.garment)
                                    .overlay(Rectangle().stroke(on ? Palette.ink : Color.clear, lineWidth: 2))
                                Text(option.tag.replacingOccurrences(of: "you · ", with: "")).font(.caption.weight(.semibold))
                                Text(option.garment.shortName).font(.caption).foregroundStyle(Palette.stone)
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
                NoteRow("camera", "Placeholder photo: the camera is simulated in this demo.")
            }

            VStack(alignment: .leading, spacing: 8) {
                Eyebrow("One line")
                TextField("trench weather, finally", text: $caption)
                    .font(.body)
                    .padding(.vertical, 12)
                    .overlay(alignment: .bottom) { Rectangle().fill(Palette.ink).frame(height: 1) }
                    .onChange(of: caption) { _, new in if new.count > 60 { caption = String(new.prefix(60)) } }
            }

            VStack(alignment: .leading, spacing: 8) {
                Eyebrow("Who sees it")
                Picker("Who sees it", selection: $audience) {
                    Text("\(store.demo.city) feed").tag(Audience.city)
                    Text("Friends only").tag(Audience.friends)
                    if canBattle { Text("Next battle").tag(Audience.battle) }
                }
                .pickerStyle(.segmented)
                if !canBattle {
                    Text("Entering a Style Battle unlocks at the Cut tier.").font(.footnote).foregroundStyle(Palette.stone)
                }
            }
        } footer: {
            FooterBar {
                Button("Post · +\(worth)") {
                    guard options.indices.contains(pick) else { return }
                    let option = options[pick]
                    let pts = store.postLook(garment: option.garment.id, caption: caption.trimmingCharacters(in: .whitespaces), tag: option.tag, audience: audience)
                    store.say("Look posted · +\(pts) Circular Score")
                    Haptics.success()
                    store.path = [.looks]
                }
                .buttonStyle(.encore)
                .disabled(!store.demo.settings.photos || caption.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }
}

/// 3.3 · Style Battle: one vote, live split, no countdown
struct BattleView: View {
    @Environment(Store.self) private var store

    var body: some View {
        let battle = store.battle
        let total = battle.a.votes + battle.b.votes
        let shareA = total > 0 ? Int((Double(battle.a.votes) / Double(total) * 100).rounded()) : 50
        let sides: [(String, Look?)] = [("a", store.seed.look(battle.a.look)), ("b", store.seed.look(battle.b.look))]
        let canEnter = store.demo.tier >= .cut
        Screen("Style Battle · \(store.demo.city)") {
            Heading(battle.title, sub: "\(Fmt.num(total)) votes · open all day · no countdown · winner takes +\(store.rules.points.battleWin) and the store screens")

            HStack(alignment: .top, spacing: 12) {
                ForEach(sides, id: \.0) { side, look in
                    if let look {
                        let chosen = store.demo.battleChoice == side
                        Button {
                            if !store.demo.age16plus {
                                store.say("Battles are 16+. Confirm your age in Profile to vote.")
                            } else if store.demo.battleChoice != nil {
                                store.say("One vote per battle. Yours is already counted.")
                            } else {
                                store.vote(side)
                                Haptics.success()
                            }
                        } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                GarmentImage(garment: store.seed.garment(look.garment), ratio: 0.72)
                                    .overlay(Rectangle().stroke(chosen ? Palette.ink : Color.clear, lineWidth: 2))
                                    .overlay(alignment: .topLeading) { Tag(look.tag).background(Palette.paper).padding(8) }
                                Text(store.seed.user(look.by).name).font(.subheadline.weight(.semibold))
                                Text(look.caption).font(.footnote).foregroundStyle(Palette.stone)
                                    .fixedSize(horizontal: false, vertical: true)
                                if chosen { Tag("Your vote", .solid) }
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Vote for \(store.seed.user(look.by).name): \(look.caption)")
                        .accessibilityAddTraits(chosen ? .isSelected : [])
                    }
                }
            }

            VStack(spacing: 8) {
                HStack {
                    Text("\(firstName(sides[0].1)) · \(shareA)%")
                    Spacer()
                    Text("\(firstName(sides[1].1)) · \(100 - shareA)%")
                }
                .font(.footnote.weight(.semibold)).monospacedDigit()
                GeometryReader { geo in
                    HStack(spacing: 3) {
                        Rectangle().fill(Palette.ink).frame(width: max(0, geo.size.width * Double(shareA) / 100 - 1.5))
                        Rectangle().fill(Palette.rule)
                    }
                }
                .frame(height: 6)
                .animation(.easeOut(duration: 0.6), value: shareA)
                .accessibilityHidden(true)
            }

            if let choice = store.demo.battleChoice, let look = sides.first(where: { $0.0 == choice })?.1 {
                NoteRow("checkmark", "Vote counted. You voted for \(firstName(look))’s \(store.seed.garment(look.garment).shortName). Come back tonight for the result\(canEnter ? ", or enter your own look." : ", or enter your own look from the Cut tier.")")
            } else {
                NoteRow("hand.tap", "Tap a look to vote. One vote per battle. Looks are from your city; the winner’s look goes up on the Gran Vía store screens tomorrow.")
            }
        } footer: {
            FooterBar {
                if canEnter {
                    Button("Enter your own look") { store.go(.postLook) }.buttonStyle(.encore)
                }
                Button("See my city league") { store.path = [.league] }.buttonStyle(.encoreSecondary)
            }
        }
    }

    private func firstName(_ look: Look?) -> String {
        look.map { store.seed.user($0.by).firstName } ?? ""
    }
}

/// 3.4 · A stylist's closet
struct ClosetView: View {
    @Environment(Store.self) private var store
    let userID: String
    @State private var tab = 0
    @State private var asking = false
    @State private var question = "True to size?"

    private let questions = ["True to size?", "How long is it on you?", "Any stretch in the waist?"]
    private let columns = [GridItem(.flexible(), spacing: 12, alignment: .top), GridItem(.flexible(), spacing: 12, alignment: .top)]

    var body: some View {
        let who = store.seed.closets[userID] != nil ? userID : "u_lucia"
        let u = store.seed.user(who)
        let items = store.seed.closets[who] ?? []
        let following = store.demo.following.contains(who)
        let herLooks = store.looks.filter { $0.by == who }
        Screen("Closet") {
            HStack(alignment: .top, spacing: 14) {
                Avatar(initial: u.initial, size: 60)
                VStack(alignment: .leading, spacing: 5) {
                    Text(u.name).font(.display)
                    Text("@\(u.handle ?? "") · \(u.city) · \(u.tier.rawValue) tier").font(.footnote).foregroundStyle(Palette.stone)
                    if u.curator ?? false { Tag("Encore Curator", .solid) }
                }
            }

            HStack(alignment: .top, spacing: 12) {
                StatCell(value: Fmt.num((u.followers ?? 0) + (following ? 1 : 0)), label: "followers")
                StatCell(value: "\(u.garmentsBack ?? 0)", label: "garments back")
                StatCell(value: "\(u.heartsThisWeek ?? 0)", label: "hearts this week")
            }

            Text(((u.aesthetics ?? []) + [u.fit ?? ""]).filter { !$0.isEmpty }.joined(separator: " · "))
                .font(.footnote).foregroundStyle(Palette.stone)

            Button(following ? "Following" : "Follow") {
                store.toggleFollow(who)
                Haptics.tap()
            }
            .buttonStyle(EncoreButtonStyle(kind: following ? .secondary : .primary))
            .accessibilityAddTraits(following ? .isSelected : [])

            Picker("Section", selection: $tab) {
                Text("Her closet").tag(0)
                Text("Looks · \(u.looksCount ?? herLooks.count)").tag(1)
                Text("Fit notes · \(u.fitNotesCount ?? 0)").tag(2)
            }
            .pickerStyle(.segmented)

            if tab == 0 {
                LazyVGrid(columns: columns, spacing: 20) {
                    ForEach(items) { item in
                        Button {
                            if let piece = item.piece { store.go(.piece(piece)) } else {
                                store.say("This opens Zara Pre-Owned. Encore only shows the listing.")
                            }
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                GarmentImage(garment: store.seed.garment(item.garment))
                                Text(item.label).font(.footnote.weight(.semibold))
                                Text(item.status).font(.footnote).foregroundStyle(Palette.stone)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            } else if tab == 1 {
                LazyVGrid(columns: columns, spacing: 20) {
                    ForEach(herLooks) { look in LookCell(look: look) }
                }
                Text("Showing her latest. The others are not in this demo.").font(.footnote).foregroundStyle(Palette.stone)
            } else {
                VStack(alignment: .leading, spacing: 0) {
                    Hairline()
                    ForEach(store.seed.drop.pieces) { piece in
                        ForEach((piece.fitNotes ?? []).filter { $0.by == who }, id: \.text) { note in
                            VStack(alignment: .leading, spacing: 3) {
                                Text("\(store.seed.garment(piece.garment).name) · \(note.size)").font(.footnote.weight(.semibold))
                                Text("“\(note.text)”").font(.footnote).foregroundStyle(Palette.stone)
                            }
                            .padding(.vertical, 12)
                            Hairline()
                        }
                    }
                }
                if store.demo.askedFit.contains(who) {
                    NoteRow("ruler", "Your question is with \(u.firstName). Her answer will be added here as a fit note.")
                }
            }

            NoteRow("star", "How she earns. Sells from her closet on Zara Pre-Owned (+\(store.rules.points.preOwnedSale) points a sale), styles looks people heart, and every piece she brings back earns a key. Never from spending.")
        } footer: {
            FooterBar {
                HStack(spacing: 10) {
                    Button("Ask about fit") { asking = true }.buttonStyle(.encoreSecondary)
                    Button("Shop her edit · \(items.count)") {
                        if let piece = items.first?.piece { store.go(.piece(piece)) } else { store.path = [.dropHome] }
                    }
                    .buttonStyle(.encore)
                }
            }
        }
        .sheet(isPresented: $asking) {
            VStack(alignment: .leading, spacing: 16) {
                Eyebrow("Ask about fit")
                Text("Ask \(u.firstName) about fit").font(.display)
                Text("One structured question. Her answer becomes a fit note that everyone with your kept size can read.")
                    .font(.footnote).foregroundStyle(Palette.stone)
                VStack(alignment: .leading, spacing: 0) {
                    Hairline()
                    ForEach(questions, id: \.self) { q in
                        Button { question = q } label: {
                            HStack {
                                Text(q).font(.subheadline)
                                Spacer()
                                if question == q { Image(systemName: "checkmark").font(.footnote) }
                            }
                            .padding(.vertical, 13)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(question == q ? .isSelected : [])
                        Hairline()
                    }
                }
                Button("Send question") {
                    store.askFit(who)
                    asking = false
                    tab = 2
                    store.say("Sent to \(u.firstName): “\(question)”")
                }
                .buttonStyle(.encore)
                Spacer(minLength: 0)
            }
            .padding(20)
            .background(Palette.paper)
            .presentationDetents([.medium])
        }
    }
}

/// 3.5 · City goal
struct CityGoalView: View {
    @Environment(Store.self) private var store

    var body: some View {
        let goal = store.goal
        let p = Rules.cityGoalProgress(goal)
        Screen("\(goal.season) season") {
            Heading("\(goal.city)’s goal", sub: "Every garment anyone in \(goal.city) brings back counts. Each milestone unlocks something Zara does for the city.", large: true)

            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    Text(Fmt.num(goal.current)).font(.figure).monospacedDigit()
                    Spacer()
                    Text("of \(Fmt.num(goal.target))").font(.subheadline).foregroundStyle(Palette.stone)
                }
                ProgressLine(value: p.ratio)
                Text("garments back this season · \(goal.mine) of them yours").font(.footnote).foregroundStyle(Palette.stone)
            }

            VStack(alignment: .leading, spacing: 0) {
                Hairline()
                ForEach(p.milestones) { m in
                    HStack(alignment: .firstTextBaseline, spacing: 14) {
                        Text("\(m.at / 1000)k").font(.footnote.weight(.semibold)).monospacedDigit()
                            .foregroundStyle(m.reached ? Palette.moss : Palette.ink).frame(width: 40, alignment: .leading)
                        Text(m.reward).font(.footnote).foregroundStyle(m.reached ? Palette.stone : Palette.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 6)
                        if m.reached {
                            Image(systemName: "checkmark").font(.footnote).foregroundStyle(Palette.moss).accessibilityLabel("reached")
                        } else if m.at == p.next?.at {
                            Tag("Next", .solid)
                        }
                    }
                    .padding(.vertical, 13)
                    Hairline()
                }
                if let next = p.next {
                    Text("\(Fmt.num(p.toNext)) garments to the \(next.at / 1000)k milestone.")
                        .font(.footnote).foregroundStyle(Palette.stone).padding(.top, 10)
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Eyebrow("City race · share of goal")
                ForEach(goal.race) { entry in
                    let share = entry.city == goal.city ? p.ratio : entry.share
                    HStack(spacing: 12) {
                        Text(entry.city).font(.footnote.weight(entry.city == goal.city ? .semibold : .regular)).frame(width: 84, alignment: .leading)
                        ProgressLine(value: share, tint: entry.city == goal.city ? Palette.ink : Palette.stone)
                        Text("\(Int(share * 100))%").font(.footnote).monospacedDigit().frame(width: 40, alignment: .trailing)
                    }
                }
                Text("Figures are illustrative. Rewards are stated as actions with numbers, never as offsets or “carbon neutral”.")
                    .font(.caption).foregroundStyle(Palette.stone)
            }
        } footer: {
            FooterBar {
                Button("Bring a piece back · +1 for \(goal.city)") { store.path = [.scan] }.buttonStyle(.encore)
            }
        }
    }
}
