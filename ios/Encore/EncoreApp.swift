import SwiftUI

@main
struct EncoreApp: App {
    @State private var store = Store()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .preferredColorScheme(.light)
                .tint(Palette.ink)
        }
    }
}

/// The host app's shell. Only the Encore tab belongs to this concept.
struct RootView: View {
    @Environment(Store.self) private var store
    @State private var tab = 2

    var body: some View {
        VStack(spacing: 0) {
            ConceptBar()
            TabView(selection: $tab) {
                HostTab(name: "Home").tabItem { Label("Home", systemImage: "house") }.tag(0)
                HostTab(name: "Search").tabItem { Label("Search", systemImage: "magnifyingglass") }.tag(1)
                EncoreTab().tabItem { Label("Encore", systemImage: "key") }.tag(2)
                HostTab(name: "Bag").tabItem { Label("Bag", systemImage: "bag") }.tag(3)
                HostTab(name: "Me").tabItem { Label("Me", systemImage: "person") }.tag(4)
            }
        }
        .background(Palette.paper)
        .overlay(alignment: .bottom) {
            if let notice = store.notice {
                Text(notice)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Palette.paper)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Palette.ink)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 64)
                    .transition(.opacity)
                    .accessibilityAddTraits(.isStaticText)
            }
        }
        .animation(.easeOut(duration: 0.2), value: store.notice)
        .fullScreenCover(isPresented: .constant(!store.demo.onboarded)) {
            OnboardingView().environment(store)
        }
    }
}

struct HostTab: View {
    let name: String
    var body: some View {
        VStack(spacing: 12) {
            Eyebrow(name)
            Text("This tab belongs to the host app.").font(.displayS)
            Text("The concept lives in the Encore tab.").font(.subheadline).foregroundStyle(Palette.stone)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Palette.paper)
    }
}

struct EncoreTab: View {
    @Environment(Store.self) private var store

    var body: some View {
        @Bindable var store = store
        NavigationStack(path: $store.path) {
            HomeView()
                .navigationDestination(for: Route.self) { route in
                    destination(route)
                }
        }
    }

    @ViewBuilder
    private func destination(_ route: Route) -> some View {
        switch route {
        case .scan: ScanView()
        case .confirm: ConfirmView()
        case .bin: BinView()
        case .keyLanding: KeyLandingView()
        case .lot(let id): LotTrackerView(lotID: id)
        case .swipe: SwipeView()
        case .deckDone: DeckDoneView()
        case .looks: LooksView()
        case .postLook: PostLookView()
        case .battle: BattleView()
        case .closet(let id): ClosetView(userID: id)
        case .cityGoal: CityGoalView()
        case .league: LeagueView()
        case .pass: PassView()
        case .wrapped: WrappedView()
        case .tiers: TiersView()
        case .dropHome: DropHomeView()
        case .dropLive: DropLiveView()
        case .piece(let id): PieceView(pieceID: id)
        case .youreIn: YoureInView()
        case .keys: KeysView()
        case .profile: ProfileView()
        }
    }
}
