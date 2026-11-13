import SwiftUI
import UIKit

// Encore design system, v2 "editorial".
// Light paper, black type, square corners, hairline rules, serif headlines.
// Photography carries the screen; colour is used only where it means something:
// brass = Archive Keys, moss = earned or confirmed, clay = warnings.

enum Palette {
    static let paper = Color(red: 0.969, green: 0.961, blue: 0.945)
    static let surface = Color.white
    static let tile = Color(red: 0.925, green: 0.914, blue: 0.890)
    static let ink = Color(red: 0.067, green: 0.067, blue: 0.067)
    static let stone = Color(red: 0.400, green: 0.384, blue: 0.357)
    static let rule = Color(red: 0.835, green: 0.820, blue: 0.784)
    static let brass = Color(red: 0.522, green: 0.392, blue: 0.086)
    static let brassFill = Color(red: 0.918, green: 0.855, blue: 0.675)
    static let moss = Color(red: 0.176, green: 0.329, blue: 0.157)
    static let mossFill = Color(red: 0.867, green: 0.906, blue: 0.835)
    static let clay = Color(red: 0.639, green: 0.255, blue: 0.118)
}

extension Font {
    /// Serif headline, scales with Dynamic Type.
    static let displayXL = Font.system(.largeTitle, design: .serif)
    static let display = Font.system(.title, design: .serif)
    static let displayS = Font.system(.title3, design: .serif)
    static let figure = Font.system(size: 44, weight: .regular, design: .serif)
}

/// Small tracked uppercase label.
struct Eyebrow: View {
    let text: String
    var color: Color = Palette.stone
    init(_ text: String, color: Color = Palette.stone) {
        self.text = text
        self.color = color
    }
    var body: some View {
        Text(text.uppercased())
            .font(.caption2.weight(.semibold))
            .tracking(1.3)
            .foregroundStyle(color)
    }
}

struct Hairline: View {
    var body: some View { Rectangle().fill(Palette.rule).frame(height: 1) }
}

enum TagStyle { case outline, solid, brass, moss, clay }

/// Rectangular uppercase tag. Replaces the rounded pill.
struct Tag: View {
    let text: String
    var style: TagStyle = .outline
    init(_ text: String, _ style: TagStyle = .outline) {
        self.text = text
        self.style = style
    }
    var body: some View {
        Text(text.uppercased())
            .font(.caption2.weight(.semibold))
            .tracking(0.8)
            .lineLimit(1)
            .padding(.horizontal, 7)
            .padding(.vertical, 4)
            .foregroundStyle(foreground)
            .background(background)
            .overlay(Rectangle().stroke(border, lineWidth: 1))
    }
    private var foreground: Color {
        switch style {
        case .outline: return Palette.ink
        case .solid: return Palette.paper
        case .brass: return Palette.brass
        case .moss: return Palette.moss
        case .clay: return Palette.clay
        }
    }
    private var background: Color {
        switch style {
        case .outline: return .clear
        case .solid: return Palette.ink
        case .brass: return Palette.brassFill
        case .moss: return Palette.mossFill
        case .clay: return .clear
        }
    }
    private var border: Color {
        switch style {
        case .outline: return Palette.rule
        case .solid: return Palette.ink
        case .brass: return Palette.brassFill
        case .moss: return Palette.mossFill
        case .clay: return Palette.clay
        }
    }
}

enum ButtonKind { case primary, secondary, brass }

/// Full-width rectangular button, 52 pt tall.
struct EncoreButtonStyle: ButtonStyle {
    var kind: ButtonKind = .primary
    @Environment(\.isEnabled) private var enabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.footnote.weight(.semibold))
            .tracking(1.1)
            .textCase(.uppercase)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity, minHeight: 52)
            .padding(.horizontal, 12)
            .foregroundStyle(kind == .primary ? Palette.paper : Palette.ink)
            .background(kind == .primary ? Palette.ink : kind == .brass ? Palette.brassFill : Color.clear)
            .overlay(Rectangle().stroke(kind == .secondary ? Palette.ink : Color.clear, lineWidth: 1))
            .opacity(enabled ? (configuration.isPressed ? 0.7 : 1) : 0.35)
            .contentShape(Rectangle())
    }
}

extension ButtonStyle where Self == EncoreButtonStyle {
    static var encore: EncoreButtonStyle { EncoreButtonStyle() }
    static var encoreSecondary: EncoreButtonStyle { EncoreButtonStyle(kind: .secondary) }
    static var encoreBrass: EncoreButtonStyle { EncoreButtonStyle(kind: .brass) }
}

/// Thin progress line.
struct ProgressLine: View {
    let value: Double
    var tint: Color = Palette.ink
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Rectangle().fill(Palette.rule)
                Rectangle().fill(tint).frame(width: geo.size.width * min(1, max(0, value)))
            }
        }
        .frame(height: 3)
        .animation(.easeOut(duration: 0.5), value: value)
        .accessibilityElement()
        .accessibilityValue("\(Int(min(1, max(0, value)) * 100)) percent")
    }
}

struct StatCell: View {
    let value: String
    let label: String
    var tint: Color = Palette.ink
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value).font(.display).foregroundStyle(tint)
            Text(label).font(.caption).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

/// Icon plus a line of supporting copy.
struct NoteRow: View {
    let symbol: String
    let text: Text
    init(_ symbol: String, _ text: Text) {
        self.symbol = symbol
        self.text = text
    }
    init(_ symbol: String, _ string: String) {
        self.symbol = symbol
        self.text = Text(string)
    }
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Image(systemName: symbol).font(.footnote).foregroundStyle(Palette.ink).frame(width: 18)
            text.font(.footnote).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct Avatar: View {
    let initial: String
    var size: CGFloat = 32
    var body: some View {
        Text(initial)
            .font(.system(size: size * 0.42, weight: .medium, design: .serif))
            .foregroundStyle(Palette.ink)
            .frame(width: size, height: size)
            .background(Palette.tile)
            .clipShape(Circle())
            .accessibilityHidden(true)
    }
}

/// A garment on a neutral tile. Shows a product photo when one is supplied:
/// add `<garment id>.jpg` (for example g_trench.jpg) to ios/Encore/Photos,
/// or set the garment's `image` in seed.json to an https URL.
struct GarmentImage: View {
    let garment: Garment
    var ratio: CGFloat = 0.8

    private static var cache: [String: UIImage?] = [:]

    static func photo(for garment: Garment) -> UIImage? {
        if let hit = cache[garment.id] { return hit }
        let found = ["", ".jpg", ".jpeg", ".png"].lazy.compactMap { UIImage(named: garment.id + $0) }.first
        cache[garment.id] = found
        return found
    }

    private var assetName: String {
        let file = garment.image.split(separator: "/").last.map(String.init) ?? garment.image
        return file.split(separator: ".").first.map(String.init) ?? file
    }

    var body: some View {
        Palette.tile
            .aspectRatio(ratio, contentMode: .fit)
            .overlay {
                if let photo = GarmentImage.photo(for: garment) {
                    Image(uiImage: photo).resizable().scaledToFill()
                } else if garment.image.hasPrefix("http"), let url = URL(string: garment.image) {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable().scaledToFill()
                        } else {
                            illustration
                        }
                    }
                } else {
                    illustration
                }
            }
            .clipped()
            .accessibilityElement()
            .accessibilityLabel(garment.name)
    }

    private var illustration: some View {
        Image(assetName).resizable().scaledToFit().padding(.vertical, 10).padding(.horizontal, 6)
    }
}

/// Live key balance. Always links to the wallet.
struct KeyPill: View {
    @Environment(Store.self) private var store
    var body: some View {
        Button {
            store.go(.keys)
        } label: {
            HStack(spacing: 5) {
                Image(systemName: "key.fill").font(.caption2)
                Text("\(store.keys)").font(.footnote.weight(.semibold)).monospacedDigit()
            }
            .foregroundStyle(Palette.brass)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(Palette.brassFill)
        }
        .accessibilityLabel("\(Fmt.keys(store.keys)). Open the keys wallet")
    }
}

struct ConceptBar: View {
    var body: some View {
        Text("DESIGN CONCEPT · NOT AFFILIATED WITH ZARA OR INDITEX")
            .font(.system(size: 9, weight: .semibold))
            .tracking(0.9)
            .foregroundStyle(Palette.stone)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 5)
            .background(Palette.paper)
            .overlay(alignment: .bottom) { Hairline() }
    }
}

/// Bottom action area for a screen.
struct FooterBar<Content: View>: View {
    @ViewBuilder var content: () -> Content
    var body: some View {
        VStack(spacing: 10) { content() }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)
            .background(Palette.paper)
            .overlay(alignment: .top) { Hairline() }
    }
}

/// Standard screen: scrolling content, optional pinned footer, small tracked title, key balance.
struct Screen<Content: View, Footer: View>: View {
    let title: String
    var showKeys: Bool
    let content: () -> Content
    let footer: () -> Footer

    init(_ title: String, showKeys: Bool = true, @ViewBuilder content: @escaping () -> Content,
         @ViewBuilder footer: @escaping () -> Footer) {
        self.title = title
        self.showKeys = showKeys
        self.content = content
        self.footer = footer
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) { content() }
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 28)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Palette.paper)
        .safeAreaInset(edge: .bottom, spacing: 0) { footer() }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) { Eyebrow(title, color: Palette.ink) }
            if showKeys {
                ToolbarItem(placement: .topBarTrailing) { KeyPill() }
            }
        }
        .toolbarBackground(Palette.paper, for: .navigationBar)
    }
}

extension Screen where Footer == EmptyView {
    init(_ title: String, showKeys: Bool = true, @ViewBuilder content: @escaping () -> Content) {
        self.init(title, showKeys: showKeys, content: content, footer: { EmptyView() })
    }
}

/// Headline with an optional supporting line.
struct Heading: View {
    let title: String
    var sub: String?
    var large = false
    init(_ title: String, sub: String? = nil, large: Bool = false) {
        self.title = title
        self.sub = sub
        self.large = large
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(large ? .displayXL : .display).foregroundStyle(Palette.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            if let sub {
                Text(sub).font(.subheadline).foregroundStyle(Palette.stone).fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// A bordered block. Square, hairline, no shadow.
struct Panel<Content: View>: View {
    var fill: Color = Palette.surface
    @ViewBuilder var content: () -> Content
    var body: some View {
        VStack(alignment: .leading, spacing: 12) { content() }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(fill)
            .overlay(Rectangle().stroke(Palette.rule, lineWidth: 1))
    }
}

enum Haptics {
    static func tap() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
}
