# Data model

Demo data lives in `data/seed.json`. These are the entities and the pure functions the app needs. Types are TypeScript-flavoured.

```ts
type TierId = "Thread" | "Stitch" | "Seam" | "Cut" | "Archive";
type LaneId = "vintage" | "recut" | "first_access";

interface User { id; name; handle?; initial; city; tier: TierId; points: number; leagueRank: number;
  keys: number; garmentsBack?; kgDisplaced?; lotsFollowed?; followers?; curator?: boolean;
  aesthetics?: string[]; badges?: string[]; settings?: { leaderboards; photos; dropReminder }; age16plus?: boolean }

interface Garment { id; name; ref?; era?: number; edit?: string; season?; color?; size?; image: string; tile: string }

interface Lot { id; owner; garment; droppedAt; droppedOn; weightKg?; rfidConfirmed?;
  status: ("collected" | "graded" | "vintage_lane" | "recut" | "fiber" | "sold")[]; grade?: "A" | "B" | "C"; keysAwarded }

interface KeyEntry { user; delta: number; reason: "return" | "grade_bonus" | "tier_bonus" | "drop"; lot?; lane?: LaneId; date; note }

interface Drop { lot; opens; passOpens; totalPieces; available; lanes: Lane[]; pieces: Piece[] }
interface Piece { id; garment; lane: LaneId; number; grade?; size?; price: number; original?: number; keys: number;
  hyped?; fromLot?; story?; fitNotes?: { by; size; text }[] }

interface Look { id; by; garment; tag; caption; hearts }
interface Battle { id; title; a: { look; votes }; b: { look; votes }; prize }
interface CityGoal { season; city; target; current; mine; milestones: { at; reward; reached }[]; race: { city; share }[] }
```

## Business-rule functions (unit-test these)

| Function | Rule |
|---|---|
| `keysForReturn(grade, keysEarnedThisMonth)` | 1 key, +1 if grade A; never exceed `monthlyKeyCap` (10). Returns keys actually granted. |
| `pointsFor(action, context)` | Table in `rules.points`; respect caps (look 50 per post, fit notes 25/week, deck 35/week). `purchase` always 0. |
| `canEnterDrop(user, lane, now)` | `user.keys >= lane.keys`; entry from 10:00, or 09:50 with a skip-the-line pass (Seam and above, or battle winner). |
| `priceFor(piece)` | vintage: grade A = original, grade B = 70% of original; recut = atelier price; first access = store price. Never discounted below these. |
| `buy(user, piece)` | Spend `piece.keys`, charge `price`, add certificate, notify the original owner of `fromLot`, award 0 points. |
| `weeklyLeagueResult(standings)` | Top 10 move up a tier, bottom 10 move down (tier rules in `tiers`; Cut also needs 2 returns this season; Archive = top 5% of city at season end). |
| `tierPerks(tier)` | From `tiers[].unlocks`. Cut: +1 key/month; Archive: +2 keys/season (both still subject to the monthly cap? See OPEN_QUESTIONS). |
| `cityGoalProgress(goal)` | `current / target`, next milestone, reached milestones; every return anywhere in the city increments `current`. |
| `vote(battle, side)` | One vote per user per battle; update split; no countdown. |

## Suggested API (mock first)

`GET /me` · `GET /me/keys` · `POST /returns` (scan → confirm → bin confirm) · `GET /lots/:id` · `GET /deck/today` · `POST /deck/:card/hype|pass` · `POST /fit-notes` · `GET /looks?filter=city|following|recut` · `POST /looks` · `GET /users/:id/closet` · `POST /users/:id/follow` · `GET /battles/current` · `POST /battles/:id/vote` · `GET /league` · `GET /tiers` · `GET /drops/next` · `GET /drops/:id/pieces/:pid` · `POST /drops/:id/pieces/:pid/buy` · `GET /city-goal` · `GET /wrapped`.
