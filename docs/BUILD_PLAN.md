# Build plan

Goal: a polished, clickable, mobile-first web app of the Encore tab that a judge can open on a phone, with real state (keys, points, ranks change as you act) driven by `data/seed.json`. No real backend, payments, camera or RFID: simulate them.

## Recommended stack

- **Vite + React + TypeScript**, React Router (one route per screen, see `design/screens.json` for suggested routes).
- **Tailwind CSS** with the theme from `design/tokens.json` (or port `design/encore.css` as CSS modules). Fonts: Inter and Space Grotesk from Google Fonts.
- **Zustand** (or React context) store seeded from `data/seed.json`, persisted to `localStorage` with a "Reset demo" button.
- **Vitest** for the rule functions in `docs/DATA_MODEL.md`.
- Deploy as a static site (Vercel, Netlify or GitHub Pages). Optional: PWA manifest so it installs to a home screen.
- Alternative if a native feel matters: Expo (React Native). Keep the same store and rule functions.

Layout: 390-px-wide phone column. On desktop, center it in a phone frame with the step list on the left and the designer's guide text on the right (see `prototype/encore-prototype.html` for this pattern).

## Milestones and acceptance criteria

**M0 · Skeleton (half a day)**
- Repo, theme tokens, fonts, app shell with the Zara-style tab bar (Encore tab active) and a visible "Design concept · not affiliated with Zara or Inditex" notice.
- Routes for all 25 screens rendering placeholder titles.

**M1 · Static fidelity (1-2 days)**
- Every screen matches its screenshot in `design/screenshots/` at 390×844 (visual diff by eye; same copy, colors, spacing, order).
- Shared components built once: TopBar, KeyCounter, Chip, Card, Button, Progress, LeaderboardRow, TierTrack, LotTimeline, BottomSheet, Ticket, SwipeCard, GarmentTile, Stat, Badge, TabBar.
- All links from `screens.json` `links_to` work.

**M2 · State and rules (1-2 days)**
- Store seeded from `seed.json`; key counter, points, rank and tier read from it everywhere (no hard-coded "7 keys").
- Rule functions implemented and unit-tested (cap of 10 keys/month, grade-A bonus, purchase = 0 points, lane key costs, grade B = 70%, pass = 09:50).
- Return flow updates state: Scan → Confirm (choose condition) → Drop (animated checks) → Key lands (+1 key, +50 points, new lot) → Lot tracker.
- Buy flow: Drop live → Piece → "Use 1 key · buy" → You're in (keys −1, certificate added, 0 points).

**M3 · Interactions (1-2 days)**
- Swipe deck: hype/pass with gesture (drag) and buttons, counter to 20, "deck complete" with taste profile; no streak UI anywhere.
- Fit note sheet (+5, weekly cap). Post a look (pick placeholder photo, tag pieces, +15).
- Closet: follow/unfollow (count updates), ask about fit, shop edit.
- Battle: one vote, animated split bar. League: "End the week (demo)" promotion sheet. Tiers screen from data.
- City goal: progress from data; "Bring a piece back" increments city and personal counts.
- Profile switches actually toggle (leaderboards off hides ranks but keeps keys).

**M4 · Polish (1 day)**
- Motion from `DESIGN_SYSTEM.md` (scan line, drop-in, key pop, confetti), with `prefers-reduced-motion` respected.
- Accessibility: real buttons and links, labels on icon buttons, 4.5:1 text contrast, 44 px touch targets.
- "Reset demo" and a guided "Judge mode" that walks the story: return a trench → swipe → follow Lucía → vote → end week → buy the skirt.
- Lighthouse mobile ≥ 90 performance and accessibility.

## Out of scope (simulate)

Camera and NaviLens scanning (use a "Label read" button), RFID and scale (animated checks), payments (confirm sheet), push notifications, moderation, real Zara catalogue (placeholder SVGs; keep `image` URLs swappable for real product photos later).

## Definition of done

The whole demo story can be completed on a phone in under three minutes, every number on every screen stays consistent with the store, the rules in `docs/PRODUCT_SPEC.md` hold (tests pass), and no screen contains a countdown, streak, spend-based reward or "sustainable" claim.
