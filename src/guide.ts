import { seed } from './seed';
import type { State } from './store';

export interface ScreenInfo {
  step: string;
  path: string;
  title: string;
  /** Short line under the title in the side panel. */
  guide: string;
}

export interface Chapter {
  n: string;
  name: string;
  screens: ScreenInfo[];
}

/** Every screen, in the order a new user meets it. Mirrors docs/SCREENS.md. */
export const CHAPTERS: Chapter[] = [
  {
    n: '00',
    name: 'Start here',
    screens: [
      { step: '0.1', path: '/main', title: 'The Encore home', guide: 'Your Archive Keys in gold and your league rank in lime sit at the top. Below: next Tuesday’s drop, the pieces you hyped and four actions. The loop is visible at a glance: bring back, swipe, climb, unlock.' },
      { step: '0.2', path: '/onboarding', title: 'First open', guide: 'One screen, three choices: declare your city (never tracked), opt in to photos later, and confirm you are 16 or over. “Not now” is as big as “Let’s go”. Keys never expire, so nothing is lost by waiting.' },
    ],
  },
  {
    n: '01',
    name: 'Bring it back',
    screens: [
      { step: '1.1', path: '/scan', title: 'Scan the care label', guide: 'In store, point the camera at the inside care label. The app reads the reference code, and the NaviLens code on new labels. Any Zara garment, any condition, no receipt. The camera is simulated here.' },
      { step: '1.2', path: '/confirm', title: 'Confirm the garment', guide: 'The catalogue photo, name and reference appear from the same lookup Pre-Owned uses. Rate the condition honestly: it only affects the grade-A bonus. The map shows the Encore Bin by the returns counter.' },
      { step: '1.3', path: '/drop', title: 'Drop it in the bin', guide: 'The bin weighs the garment and its reader confirms the RFID label on recent pieces. Older pieces are confirmed by scan plus weight. The screen shows the live read so you watch it count.' },
      { step: '1.4', path: '/key-landing', title: 'Your key lands', guide: '+1 Archive Key and +50 Circular Score, with a lot number. A second key arrives if the hub grades the piece A. Never a voucher, never a discount.' },
      { step: '1.5', path: '/lot-tracker', title: 'Follow your lot', guide: 'Every garment gets a lot you can follow: collected, graded at the hub, then the vintage lane, a re-cut edition or fiber. When it sells, you are told it found its encore.' },
    ],
  },
  {
    n: '02',
    name: 'Style Swipe',
    screens: [
      { step: '2.1', path: '/swipe', title: 'Swipe the daily deck', guide: '20 cards a day. Drag right or tap the heart to hype, drag left or tap the cross to pass. A hyped piece gets you first word on Tuesday. No streaks: skip a day and nothing is lost.' },
      { step: '2.2', path: '/fit-note', title: 'Leave a fit note', guide: 'If you own a piece in the deck, say how it fits in one tap. +5 points, capped at 25 a week. Owners’ notes then show on vintage listings for buyers with the same kept size.' },
      { step: '2.3', path: '/deck-done', title: 'Deck complete', guide: '+5 points and your taste profile: which edits you hype most. Points are visible, small, and only for actions.' },
    ],
  },
  {
    n: '03',
    name: 'Community',
    screens: [
      { step: '3.1', path: '/looks', title: 'The Looks feed', guide: 'A city feed of people wearing secondhand and re-cut pieces, tagged with the lot. 10 hearts give the poster +5. Photos are opt-in and moderated; the city is the one you declared.' },
      { step: '3.2', path: '/post-look', title: 'Post a look', guide: 'Pick a photo, tag the Encore piece in it, add one line, post. +15 points. The tag links to the lot, so a look is also proof the garment got a second life.' },
      { step: '3.3', path: '/battle', title: 'Style Battle', guide: 'Two looks go head to head for a city vote. Tap a side and watch the bar move. One vote per battle, open all day, no countdown. The winner takes +20 and the store screens.' },
      { step: '3.4', path: '/closet', title: 'A stylist’s closet', guide: 'Every user has a closet: the pieces they brought back and where those are now. Follow, ask about fit, shop their edit. Curators earn status from taste and returns, never from spending.' },
      { step: '3.5', path: '/city-goal', title: 'Your city’s goal', guide: 'Every garment anyone in the city brings back counts toward one season goal. Each milestone unlocks something done for the city, stated as an action with a number, never as an offset.' },
    ],
  },
  {
    n: '04',
    name: 'City League',
    screens: [
      { step: '4.1', path: '/league', title: 'Your City League', guide: 'Leagues of 50 in your city, reset every Sunday. Top 10 move up, bottom 10 move down. Points come only from circular actions, never from spending. Tap “End the week” to see the promotion moment.' },
      { step: '4.2', path: '/pass', title: 'Your early-entry pass', guide: 'Reach Seam, or win a battle, and a ticket appears: enter Tuesday’s drop ten minutes before other key holders. You still need keys, and you still pay the full price.' },
      { step: '4.3', path: '/wrapped', title: 'Encore Wrapped', guide: 'A season recap: garments returned, kilograms, keys earned, lots followed, your best rank and your signature era. One tap shares it. No streaks, no guilt.' },
      { step: '4.4', path: '/tiers', title: 'Tiers and what they unlock', guide: 'Thread, Stitch, Seam, Cut, Archive. Each tier states how you get there and what it opens. None of it can be bought.' },
    ],
  },
  {
    n: '05',
    name: 'Archive Drops',
    screens: [
      { step: '5.1', path: '/drop-home', title: 'This Tuesday’s drop', guide: 'The teaser: three lanes, how many pieces in each, which keys they take, and the pieces you hyped. Quantities are stated. No countdown and no restock.' },
      { step: '5.2', path: '/drop-live', title: 'The drop is live', guide: 'Vintage takes 1 key, re-cut editions 5, first access 3. Grade A sells at the original price and grade B at 70%. Nothing is ever marked down. Tap a piece to see its story.' },
      { step: '5.3', path: '/piece', title: 'Buy a piece', guide: 'Each piece shows its number, grade, era edit, fit notes from owners your size, and its story in facts. The key opens the door; money buys the piece.' },
      { step: '5.4', path: '/youre-in', title: 'You’re in', guide: 'The key is spent, the piece is yours and a certificate joins your profile. Buying earns 0 points. The person who brought the garment back is told it found its encore.' },
    ],
  },
  {
    n: '06',
    name: 'Keys and profile',
    screens: [
      { step: '6.1', path: '/keys', title: 'Your keys wallet', guide: 'Every key earned and spent, with the garment or drop behind it. Keys never expire, carry no cash value and cannot be bought or transferred. The cap of 10 a month is shown plainly.' },
      { step: '6.2', path: '/profile', title: 'Profile and badges', guide: 'Badges are for actions. Leaderboards, photos and notifications each have a one-tap switch, and turning them off never costs you keys.' },
    ],
  },
];

export const SCREENS: ScreenInfo[] = CHAPTERS.flatMap((c) => c.screens);

/** The screen a path belongs to ("/piece/p_0417" → the /piece entry). */
export function screenFor(pathname: string): ScreenInfo & { chapter: Chapter } {
  const chapter = CHAPTERS.find((c) => c.screens.some((s) => pathname === s.path || pathname.startsWith(s.path + '/'))) ?? CHAPTERS[0];
  const screen = chapter.screens.find((s) => pathname === s.path || pathname.startsWith(s.path + '/')) ?? chapter.screens[0];
  return { ...screen, chapter };
}

export interface JudgeStep {
  title: string;
  hint: string;
  to: string;
  done: (s: State) => boolean;
}

/** Judge mode: the demo story in seven moves, each checked against real state. */
export const JUDGE_STEPS: JudgeStep[] = [
  { title: 'Set up', hint: 'Declare a city, confirm 16+', to: '/onboarding', done: (s) => s.onboarded },
  { title: 'Return a trench', hint: 'Scan, confirm, drop it in the bin', to: '/scan', done: (s) => s.returnsDone > 0 },
  { title: 'Swipe the deck', hint: 'Hype the 2012 skirt, finish the cards', to: '/swipe', done: (s) => s.deck.i >= seed.deck.cards.length },
  { title: 'Follow Lucía', hint: 'Open her closet, tap Follow', to: '/closet', done: (s) => s.following.includes('u_lucia') },
  { title: 'Vote in the battle', hint: 'Tap a look, one vote', to: '/battle', done: (s) => s.battleChoice !== null },
  { title: 'End the week', hint: 'See the promotion to Cut', to: '/league', done: (s) => s.tierBeforeWeekEnd !== null },
  { title: 'Buy the skirt', hint: 'Jump to Tuesday, use 1 key', to: '/drop-home', done: (s) => s.certificates.some((c) => c.piece === 'p_0417') },
];
