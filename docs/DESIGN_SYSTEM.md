# Encore design system

> This page describes the first design language (dark "ink" with lime), which the web app uses. The iOS app uses the second, "editorial" language described at the end of this page.

Tokens are in `design/tokens.json`. The working stylesheet the screens use is `design/encore.css`; port it to your styling system (Tailwind theme, CSS variables or styled components) rather than inventing new values.

## Look

A dark "ink" interface inside the Zara app, with color carrying meaning:

- **Ink** `#0B0C10` background, **ink2** `#15171D` cards, **line** `#2A2E36` borders.
- **Lime** `#D4FF3F`: anything you earn (points, rank, progress, primary buttons).
- **Gold** `#F5C542`: Archive Keys and key prices.
- **Lilac** `#C9B8FF`: community (looks, closets, follows, battles).
- **Teal** `#2CD4BD`: the physical Encore Bin.
- **Coral** `#FF6B6B`: passes and warnings, used sparingly.
- **Paper** `#F4F1EA`: only the garment-confirmed screen (a "catalogue" moment) uses a light background.

Type: **Space Grotesk** 700 for display (titles, big numbers, logo "Encore." with a lime period), **Inter** 400-800 for everything else.

No emoji as icons (simple stroke SVGs instead). No countdowns, gradient washes or decorative stripes.

## Components (classes in `encore.css`)

| Component | Class | Notes |
|---|---|---|
| Screen | `.screen.ink` / `.screen.paper` | 390×844, overflow hidden |
| Top bar | `.topbar` | 58 px top padding (status bar area), back link `.back` on the left, chip or key counter on the right |
| Key counter | `.keys` | Gold pill with key icon and count; links to the wallet |
| Chips | `.chip` + `-lime` `-lilac` `-gold` `-teal` `-coral` `-ghost` `-ink` | 11.5 px bold pills |
| Sticker | `.sticker` | Rotated label, e.g. "new · for Madrid" |
| Cards | `.card`, `.card-lime`, `.card-lilac`, `.card-gold` | Radius 20, 1 px line border on ink |
| Buttons | `.btn` + `-lime` `-ink` `-ghost` `-lilac` `-gold`, `.btn-sm` | 52 px tall, radius 16, weight 800; primary action pinned 28 px from the bottom |
| Progress | `.progress > i` | Thin bar; width = percent |
| Leaderboard row | `.lb` (`.lb.me` = you, lime) | rank, avatar initial, name, points |
| Tier track | `.tiers > .tier(.done/.now)` | Five equal segments; links to the tiers screen |
| Lot timeline | `.lotline` `.node` `.dot.done` `.seg.done` | Collected → Graded → destination |
| Bottom sheet | `.scrim` + `.sheet` + `.handle` | Fit note, promotion moment |
| Ticket | `.ticket` with notches | Skip-the-line pass |
| Tab bar | `.tabbar > .tab(.on)` | Zara app tabs: Home, Search, **Encore**, Bag, Me |
| Swipe card | `.swipecard` | 420 px tall garment card with lane, grade and tag chips |
| Garment tile | `.garment` + bg color | Holds a garment image; keep `object-fit: contain` |
| Stat | `.stat > .n + .l` | Big number plus label |
| Badge | `.badge(.on)` | Round icon badge for profile |

## Motion (small, purposeful)

- `scanline`: lime line sweeping the scan window.
- `dropin`: garment falls into the bin (2.4 s).
- `pop`, `confetti`, `floaty`: the key landing and promotion moments.
- `pulse`: bin location dot on the store map.
- Respect `prefers-reduced-motion`.

## Garment imagery

`design/assets/*.svg` are placeholder flat illustrations, each shown on a soft tinted tile (lilac `#E4DBFF` skirt, sand `#EFE3CF` trench/knit, lime-tint `#EAF7B8` denim, grey `#D9DCE3` biker/coat). Model images as `garment.image` URLs so real product photos can replace them without layout changes.

## Version 2: editorial (iOS app)

The first design read as a generic dark-mode app. The second borrows from how fashion retail apps actually look: the interface is a quiet frame and the clothes carry the screen.

- **Paper** `#F7F5F1` background, **ink** `#111111` type, **stone** `#66625B` secondary text, **rule** `#D5D1C8` hairlines, **tile** `#ECE9E3` behind garments.
- Colour only where it means something: **brass** `#85640F` on `#EADAAC` for Archive Keys, **moss** `#2D5428` for earned or confirmed, **clay** `#A3411E` for warnings.
- **Square corners, no shadows, no gradients, no glow.** Hierarchy comes from white space, hairline rules and type size.
- **Type:** the system serif for headlines and figures, the system sans for everything else, both scaling with Dynamic Type. Small tracked uppercase labels for section names and tags.
- **Components:** full-width rectangular buttons (filled, outlined, brass); rectangular tags instead of pills; numbered list rows (`01`, `02`) instead of icon cards; thin progress lines; a brass block for the keys wallet and an ink block for the pass.
- **Native behaviour:** the system tab bar, navigation stack with the standard back swipe, sheets with detents, segmented controls, system switches, SF Symbols, haptics on confirm, and Reduce Motion respected.
- **Photography:** garment tiles are 4:5 and fill with a product photo when one is supplied (see `ios/Encore/Photos/`).

Tokens live in `ios/Encore/Design/Theme.swift`.
