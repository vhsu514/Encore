# Encore design system

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
