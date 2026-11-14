import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Actions, Body, BottomSheet, Btn, Chip, GarmentTile, Icon, Progress, Screen, TopBar, garmentSrc } from '../components/ui';
import { garment, me, piece, seed } from '../seed';
import { pointsFor, priceFor } from '../rules';
import { euro, keysLabel } from '../format';
import { selDeckCount, selDeckDone, selHypedToday, useStore } from '../store';
import type { DeckCard, Fit } from '../types';

const cards = seed.deck.cards;
const FILTERS: { id: DeckCard['kind']; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'recut', label: 'Re-cut' },
];

function priceLine(card: DeckCard) {
  const p = card.piece ? piece(card.piece) : undefined;
  const price = p ? priceFor(p) : (card.price ?? 0);
  const keys = p ? p.keys : card.keys;
  return keys ? `${euro(price)} · ${keysLabel(keys)}` : euro(price);
}

function CardFace({ card, style, under, stamp, handlers }: {
  card: DeckCard;
  style?: CSSProperties;
  under?: boolean;
  stamp?: number;
  handlers?: Record<string, (e: PointerEvent<HTMLDivElement>) => void>;
}) {
  const g = garment(card.garment);
  return (
    <div className={`swipecard${under ? ' under' : ''}`} style={style} aria-hidden={under} {...handlers}>
      <img src={garmentSrc(g)} alt="" draggable={false} />
      <div className="top">
        <Chip tone="ink">{card.lane}</Chip>
        <Chip tone="lime">{card.grade}</Chip>
        <span className="sticker gold">{card.tag}</span>
      </div>
      {!under && (
        <>
          <span className="stamp hype" style={{ opacity: Math.max(0, stamp ?? 0) }}>
            HYPE
          </span>
          <span className="stamp pass" style={{ opacity: Math.max(0, -(stamp ?? 0)) }}>
            PASS
          </span>
        </>
      )}
      <div className="info">
        <h2>{g.name}</h2>
        <p>{card.meta}</p>
        <p className="gold" style={{ fontWeight: 800, marginTop: 4 }}>
          {priceLine(card)}
        </p>
      </div>
    </div>
  );
}

/** 2.1 · Style Swipe deck: drag, tap or use the arrow keys */
export function Swipe() {
  const s = useStore();
  const swipe = s.swipe;
  const card = cards[s.deck.i];
  const next = cards[s.deck.i + 1];
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<'hype' | 'pass' | null>(null);
  const start = useRef({ x: 0, t: 0 });

  const commit = useCallback(
    (kind: 'hype' | 'pass') => {
      if (fly) return;
      setFly(kind);
      setTimeout(() => {
        swipe(kind);
        setFly(null);
        setX(0);
      }, 230);
    },
    [fly, swipe],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') commit('hype');
      if (e.key === 'ArrowLeft') commit('pass');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit]);

  if (selDeckDone(s) || !card) return <Navigate to="/deck-done" replace />;

  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { x: e.clientX, t: e.timeStamp };
      setDragging(true);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (dragging) setX(e.clientX - start.current.x);
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragging(false);
      const dx = e.clientX - start.current.x;
      const speed = Math.abs(dx) / Math.max(1, e.timeStamp - start.current.t);
      // Commit on distance or on a quick flick; otherwise spring back.
      if (Math.abs(dx) > 90 || (Math.abs(dx) > 40 && speed > 0.5)) commit(dx > 0 ? 'hype' : 'pass');
      else setX(0);
    },
    onPointerCancel: () => {
      setDragging(false);
      setX(0);
    },
  };

  const offset = fly ? (fly === 'hype' ? 460 : -460) : x;
  const style: CSSProperties = {
    transform: `translateX(${offset}px) rotate(${offset / 22}deg)`,
    transition: dragging ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
    opacity: fly ? 0.6 : 1,
  };
  const count = selDeckCount(s) + 1;
  const lastCard = cards.find((c) => c.id === s.deck.lastCard);

  return (
    <Screen>
      <TopBar
        back="Style Swipe"
        backTo="/main"
        right={
          <Chip tone="ghost">
            today’s deck · {count} / {seed.deck.perDay}
          </Chip>
        }
      />
      <Body style={{ overflow: 'hidden' }}>
        <Progress value={count / seed.deck.perDay} />
        <div className="filters" aria-hidden="true">
          {FILTERS.map((f) => (
            <span key={f.id} className={f.id === card.kind ? 'on' : ''}>
              {f.label}
            </span>
          ))}
        </div>

        <div className="deckwrap">
          {next && <CardFace key={next.id} card={next} under />}
          <CardFace key={card.id} card={card} style={style} stamp={Math.max(-1, Math.min(1, offset / 90))} handlers={handlers} />
        </div>
        <p className="sr" aria-live="polite">
          Card {count} of {seed.deck.perDay}: {garment(card.garment).name}, {card.lane}, {card.grade}, {priceLine(card)}
        </p>

        <div className="swipebtns">
          <button type="button" className="round" onClick={() => commit('pass')} aria-label="Pass on this piece">
            <Icon name="x" size={26} />
          </button>
          {card.owned && !s.fitNotes[card.garment] ? (
            <Link to={`/fit-note/${card.garment}`} className="col center" style={{ gap: 0, minWidth: 84, minHeight: 44, justifyContent: 'center' }}>
              <span className="sub">own it?</span>
              <b className="lime">fit note +{seed.rules.points.fitNote}</b>
            </Link>
          ) : (
            <span className="col center" style={{ gap: 0, minWidth: 84 }}>
              <span className="sub">drag or tap</span>
              <span className="sub">← pass · hype →</span>
            </span>
          )}
          <button type="button" className="round hype" onClick={() => commit('hype')} aria-label="Hype this piece">
            <Icon name="heart" size={26} fill />
          </button>
        </div>

        {s.deck.last && lastCard ? (
          <div className={`banner${s.deck.last === 'pass' ? ' coral' : ''}`} key={lastCard.id} role="status">
            {s.deck.last === 'hype' ? (
              <>
                <span>♥ Hyped. First word on Tuesday if it drops.</span>
                <small>+0 pts · taste only</small>
              </>
            ) : (
              <>
                <span>Passed. You’ll see fewer pieces like it.</span>
                <small>no streaks</small>
              </>
            )}
          </div>
        ) : (
          <div className="card note">
            <span className="gold">
              <Icon name="key" size={18} />
            </span>
            <p>
              <span className="b">{selHypedToday(s)} hyped</span> · hyped pieces in Tuesday’s drop get you first word ·
              your swipes tell Arteixo what to make
            </p>
          </div>
        )}
      </Body>
    </Screen>
  );
}

const FITS: { id: Fit; label: string }[] = [
  { id: 'true', label: 'True to size' },
  { id: 'small', label: 'Runs small' },
  { id: 'big', label: 'Runs big' },
];
const TAGS = ['boxy shoulders', 'long sleeves', 'cropped', 'softens with wear'];

/** 2.2 · Fit note: one tap, +5, capped at 25 a week */
export function FitNote() {
  const s = useStore();
  const nav = useNavigate();
  const { id } = useParams();
  const g = garment(id ?? 'g_denim') ?? garment('g_denim');
  const [fit, setFit] = useState<Fit | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const done = Boolean(s.fitNotes[g.id]);
  const worth = pointsFor('fitNote', { earnedThisWeek: s.weekly.fitNote });
  const back = selDeckDone(s) ? '/deck-done' : '/swipe';

  const save = () => {
    if (!fit) return;
    const points = s.addFitNote(g.id, fit);
    s.say(points ? `Fit note saved · +${points} Circular Score` : 'Fit note saved · weekly cap reached, +0');
    nav(back);
  };

  return (
    <Screen>
      <TopBar back="Style Swipe" backTo={back} right={<Chip tone="ghost">fit note</Chip>} />
      <Body>
        <GarmentTile g={g} tall />
      </Body>
      <BottomSheet label="Add a fit note" onClose={() => nav(back)}>
        <div className="row" style={{ gap: 12 }}>
          <GarmentTile g={g} size="sm" />
          <div>
            <h2>You own this. How does it fit?</h2>
          </div>
        </div>
        <p className="sub">
          {g.name} · you brought one back in lot 0391. Owners with the same kept size ({me().size}) see your
          note on vintage listings.
        </p>
        {done ? (
          <>
            <div className="card note">
              <Icon name="check" size={18} />
              <p>You already left a fit note on this piece. One note per piece.</p>
            </div>
            <Btn to={back}>Back to the deck</Btn>
          </>
        ) : (
          <>
            <div className="grid3" role="radiogroup" aria-label="How it fits">
              {FITS.map((f) => (
                <button key={f.id} type="button" role="radio" className="opt" aria-checked={fit === f.id} onClick={() => setFit(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="row wrap">
              {TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${on ? 'chip-lilac' : 'chip-ghost'}`}
                    aria-pressed={on}
                    onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <Btn onClick={save} disabled={!fit}>
              Save fit note · +{worth}
            </Btn>
            <p className="fine">
              +{seed.rules.points.fitNote} each, capped at {seed.rules.points.fitNoteWeeklyCap} a week · {s.weekly.fitNote} earned
              this week
            </p>
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}

/** 2.3 · Deck complete: +5 and a taste profile built from what you hyped */
export function DeckDone() {
  const s = useStore();
  if (!selDeckDone(s)) {
    return (
      <Screen>
        <TopBar back="Encore" backTo="/main" />
        <Body>
          <h1 className="title">
            {cards.length - s.deck.i} cards left in today’s deck
          </h1>
          <p className="sub">Finish the deck to see your taste profile. Or don’t: there are no streaks.</p>
        </Body>
        <Actions>
          <Btn to="/swipe">Keep swiping</Btn>
        </Actions>
      </Screen>
    );
  }

  const bonus = s.pointsLog.filter((e) => e.action === 'deckComplete').at(-1)?.points ?? 0;
  const edits = [
    ...seed.deck.hypedPieces.map((id) => garment(piece(id)!.garment)),
    ...s.deck.hyped.map((id) => garment(cards.find((c) => c.id === id)!.garment)),
  ].map((g) => g.edit ?? 'New in store');
  const taste = [...new Set(edits)]
    .map((label) => ({ label, share: edits.filter((e) => e === label).length / edits.length }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 4);
  const inDrop = s.hypedPieces.length;

  return (
    <Screen>
      <TopBar back="Encore" backTo="/main" right={<Chip tone="lime">+{bonus} Circular Score</Chip>} />
      <Body>
        <h1 className="title xl">
          Deck <em>complete.</em>
        </h1>
        <p className="sub">
          {seed.deck.perDay} of {seed.deck.perDay} today · {selHypedToday(s)} hyped · {s.weekly.deck} of{' '}
          {seed.rules.points.deckWeeklyCap} deck points this week
        </p>

        <div className="card col" style={{ gap: 12 }}>
          <span className="label">Your taste, from what you hyped</span>
          {taste.map((t, i) => (
            <div key={t.label} className="col" style={{ gap: 5 }}>
              <div className="row between">
                <b>{t.label}</b>
                <span className="sub">{Math.round(t.share * 100)}%</span>
              </div>
              <Progress value={t.share} tone={i ? 'lilac' : undefined} />
            </div>
          ))}
          <p className="sub">Your swipes tell Arteixo what to make. They never earn points on their own.</p>
        </div>

        <Link className="card card-lime tap" to="/drop-home">
          <b style={{ fontFamily: 'var(--display)', fontSize: 18 }}>
            You hyped {inDrop} {inDrop === 1 ? 'piece' : 'pieces'} in Tuesday’s drop
          </b>
          <div className="row" style={{ marginTop: 10 }}>
            {s.hypedPieces.slice(0, 5).map((id) => (
              <GarmentTile key={id} g={garment(piece(id)!.garment)} size="sm" />
            ))}
          </div>
        </Link>

        <div className="card note">
          <Icon name="shield" size={18} />
          <p>No streaks. Skip tomorrow and nothing is lost.</p>
        </div>
      </Body>
      <Actions>
        <Btn to="/drop-home">See Tuesday’s drop</Btn>
        <Btn tone="ghost" to="/looks">
          See what {s.city} is wearing
        </Btn>
      </Actions>
    </Screen>
  );
}
