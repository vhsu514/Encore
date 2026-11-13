import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Actions, Avatar, Body, BottomSheet, Btn, Chip, GarmentTile, Icon, KeyCounter, Progress, Screen, Stat, TopBar, garmentSrc } from '../components/ui';
import { garment, piece, seed, user } from '../seed';
import { canEnterDrop, priceFor, tierIndex } from '../rules';
import { clock, dayMonth, euro, keysLabel, num, weekdayDate } from '../format';
import { selAvailable, selHasPass, selKeys, useStore } from '../store';
import type { LaneId, Piece as PieceT } from '../types';

const drop = seed.drop;
const lanes = seed.rules.lanes;

/** 5.1 · This Tuesday's drop (teaser) */
export function DropHome() {
  const s = useStore();
  const nav = useNavigate();
  const pass = selHasPass(s);
  const door = clock(pass ? drop.passOpens : drop.opens);
  const hyped = s.hypedPieces.map((id) => piece(id)).filter((p) => p !== undefined);

  return (
    <Screen>
      <TopBar back="Archive Drops" backTo="/main" right={<KeyCounter />} />
      <Body>
        <span className="sticker gold">
          lot {drop.lot} · opens Tue {clock(drop.opens)}
        </span>
        <h1 className="title xl">Tuesday’s drop{pass ? ', early.' : '.'}</h1>
        <p className="sub">
          {num(drop.totalPieces)} pieces across three lanes. Quantities stated. No restock. No countdown.{' '}
          {pass ? `Your pass opens the door at ${door}.` : `The door opens at ${door}.`}
        </p>

        <div className="col">
          {drop.lanes.map((l) => (
            <div key={l.id} className="card row" style={{ gap: 12 }}>
              <GarmentTile g={garment(l.garment)} size="sm" dark={l.id === 'recut'} />
              <div className="grow">
                <b style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{l.name}</b>
                <p className="sub" style={{ fontSize: 12 }}>
                  {num(l.pieces)} pieces · {l.detail}
                </p>
              </div>
              <Chip tone="gold">{keysLabel(lanes[l.id].keys)}</Chip>
            </div>
          ))}
        </div>

        <span className="label">
          Pieces you hyped · {hyped.length} in this drop
        </span>
        <div className="row">
          {hyped.slice(0, 5).map((p) => (
            <Link key={p.id} to={`/piece/${p.id}`} aria-label={garment(p.garment).name} style={{ width: 60, flex: 'none' }}>
              <GarmentTile g={garment(p.garment)}>
                <span className="bl lime">
                  <Icon name="heart" size={13} fill />
                </span>
              </GarmentTile>
            </Link>
          ))}
        </div>
        <div className="card note">
          <Icon name="calendar" size={18} />
          <p>
            {s.settings.dropReminder
              ? `You’ll get a nudge Tuesday at ${clock(drop.reminder)}. One nudge, not ten.`
              : 'Drop notifications are off. No nudge on Tuesday.'}
          </p>
        </div>
      </Body>
      <Actions>
        {s.dropLive ? (
          <Btn to="/drop-live">Enter the drop</Btn>
        ) : (
          <Btn
            onClick={() => {
              s.jumpToDrop();
              nav('/drop-live');
            }}
          >
            <Icon name="play" size={14} fill /> Jump to Tuesday {door} (demo)
          </Btn>
        )}
        <p className="fine">Keys open the door · money buys the piece · never marked down</p>
      </Actions>
    </Screen>
  );
}

const laneChip = (p: PieceT) => {
  const g = garment(p.garment);
  if (p.lane === 'vintage') return { tone: 'ink' as const, text: `${g.era} · ${g.edit}` };
  if (p.lane === 'recut') return { tone: 'gold' as const, text: `re-cut · ${p.number.split(' ').slice(-2).join(' ')}` };
  return { tone: 'teal' as const, text: `${g.season} · ${lanes.first_access.earlyHours} h early` };
};

const pieceLine = (p: PieceT) =>
  p.lane === 'vintage'
    ? `${p.number} · graded ${p.grade} · ${p.size}`
    : p.lane === 'recut'
      ? `${p.number} · from 2 returned · ${p.size}`
      : `new · same price · ${p.number}`;

/** 5.2 · Drop live: three lanes */
export function DropLive() {
  const s = useStore();
  const nav = useNavigate();
  const [filter, setFilter] = useState<'all' | 'hyped' | LaneId>('all');
  const pass = selHasPass(s);

  if (!s.dropLive) {
    const door = clock(pass ? drop.passOpens : drop.opens);
    return (
      <Screen tone="paper">
        <TopBar back="Archive Drop" backTo="/drop-home" right={<KeyCounter />} />
        <Body>
          <h1 className="title xl">The door is closed.</h1>
          <p className="sub">
            Lot {drop.lot} opens Tuesday at {clock(drop.opens)}
            {pass ? `, and at ${door} with your pass` : ''}. No countdown: it opens when it opens.
          </p>
        </Body>
        <Actions>
          <Btn
            tone="ink"
            onClick={() => {
              s.jumpToDrop();
              nav('/drop-live', { replace: true });
            }}
          >
            <Icon name="play" size={14} fill /> Jump to Tuesday {door} (demo)
          </Btn>
        </Actions>
      </Screen>
    );
  }

  const early = s.now < drop.opens;
  const pieces = drop.pieces.filter((p) => filter === 'all' || (filter === 'hyped' ? s.hypedPieces.includes(p.id) : p.lane === filter));
  const filters: { id: typeof filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'vintage', label: `Vintage · ${keysLabel(lanes.vintage.keys)}` },
    { id: 'recut', label: `Re-cut · ${lanes.recut.keys}` },
    { id: 'first_access', label: `First access · ${lanes.first_access.keys}` },
    { id: 'hyped', label: 'hyped ♥' },
  ];

  return (
    <Screen tone="paper">
      <TopBar back="Archive Drop" backTo="/drop-home" right={<KeyCounter />} />
      <Body>
        <div className="row between">
          <h1 className="title xl">Live · {clock(s.now)}</h1>
          {early && (
            <Chip tone="lime">
              <span aria-hidden="true">●</span> you’re in early
            </Chip>
          )}
        </div>
        <p className="sub" aria-live="polite">
          Lot {drop.lot} · {num(drop.totalPieces)} pieces · {num(selAvailable(s))} still available · quantities stated,
          no restock
        </p>
        <div className="row wrap">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip ${filter === f.id ? 'chip-ink' : 'chip-ghost'}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid2">
          {pieces.map((p) => {
            const g = garment(p.garment);
            const chip = laneChip(p);
            const owned = s.certificates.some((c) => c.piece === p.id);
            return (
              <Link key={p.id} to={`/piece/${p.id}`} className={`tile-card${p.lane === 'recut' ? ' dark' : ''}`}>
                <GarmentTile g={g} dark={p.lane === 'recut'}>
                  <span className="tl">
                    <Chip tone={chip.tone}>{chip.text}</Chip>
                  </span>
                  {owned ? (
                    <span className="br">
                      <Chip tone="lime">
                        yours <Icon name="check" size={13} />
                      </Chip>
                    </span>
                  ) : (
                    s.hypedPieces.includes(p.id) && (
                      <span className="br">
                        <Chip tone="lime">♥ hyped</Chip>
                      </span>
                    )
                  )}
                </GarmentTile>
                <span className="meta">
                  <b>{g.name}</b>
                  <span>{pieceLine(p)}</span>
                  <span className="spacer" />
                  <span className="row between" style={{ marginTop: 4 }}>
                    <span className="price">{euro(priceFor(p))}</span>
                    <Chip tone="gold">{keysLabel(p.keys)}</Chip>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        {pieces.length === 0 && <p className="sub">Nothing in this filter. Hype pieces in the daily deck to see them here.</p>}

        <div className="card note" style={{ background: 'var(--ink)', color: '#c9cdd6', borderColor: 'var(--ink)' }}>
          <Icon name="shield" size={18} />
          <p style={{ color: '#c9cdd6' }}>
            Nothing here counts down or says “only 3 left”. The number you see is the number there is.
          </p>
        </div>
      </Body>
    </Screen>
  );
}

/** 5.3 · Piece detail */
export function Piece() {
  const s = useStore();
  const nav = useNavigate();
  const { id } = useParams();
  const p = piece(id ?? 'p_0417') ?? piece('p_0417')!;
  const g = garment(p.garment);
  const [confirm, setConfirm] = useState(false);
  const keys = selKeys(s);
  const price = priceFor(p);
  const owned = s.certificates.some((c) => c.piece === p.id);
  const entry = canEnterDrop({ keys, tier: s.tier }, { keys: p.keys }, s.now);
  const notes = p.fitNotes ?? [];
  const trueCount = notes.filter((n) => n.fit === 'true').length;
  const canSeeNotes = tierIndex(s.tier) >= tierIndex('Stitch');
  const facts =
    p.lane === 'vintage'
      ? [`pre-worn · graded ${p.grade}`, 'cleaned at the hub', `from lot ${p.fromLot ?? 'on file'}`]
      : p.lane === 'recut'
        ? ['hand re-cut', 'made from returned garments', 'numbered edition']
        : ['new', 'same price as in store', `${lanes.first_access.earlyHours} h before the public`];

  const pay = () => {
    if (s.buyPiece(p.id)) nav('/youre-in');
    else setConfirm(false);
  };

  return (
    <Screen tone="paper">
      <TopBar back="Drop" backTo={s.dropLive ? '/drop-live' : '/drop-home'} right={<KeyCounter short />} />
      <Body>
        <div className="piecehero" style={{ background: p.lane === 'recut' ? '#0f1116' : g.tile }}>
          <img src={garmentSrc(g)} alt={g.name} />
          <span className="sticker ink">{p.number}</span>
          <Chip tone="lime">
            {p.lane === 'vintage' ? `Verified · graded ${p.grade}` : p.lane === 'recut' ? 'Re-cut edition' : `First access · ${g.season}`}
          </Chip>
        </div>

        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="col" style={{ gap: 4 }}>
            <h1 className="display" style={{ fontSize: 24, lineHeight: 1.1 }}>
              {g.name}
            </h1>
            <p className="sub">
              {[g.era ? `Zara ${g.era}` : g.season ? `Zara ${g.season}` : 'Zara', g.edit && g.era ? `${g.edit} edit` : null, g.color, p.size ? `size ${p.size}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <div className="display" style={{ fontSize: 24, lineHeight: 1.1 }}>
              {euro(price)}
            </div>
            {p.original != null && <span className="sub" style={{ fontSize: 11.5 }}>original {euro(p.original)}</span>}
          </div>
        </div>
        <div className="row wrap">
          <Chip tone="gold">{keysLabel(p.keys)}</Chip>
          {facts.map((f) => (
            <Chip key={f} tone="ghost">
              {f}
            </Chip>
          ))}
        </div>
        {p.grade === 'B' && (
          <p className="sub">Grade B sells at {Math.round((lanes.vintage.gradeBShare ?? 0.7) * 100)}% of the original price. That is the rule, not a markdown.</p>
        )}

        {notes.length > 0 &&
          (canSeeNotes ? (
            <div className="card col">
              <div className="row between">
                <b>Fit notes · owners with your kept size</b>
                <Chip tone="lilac">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </Chip>
              </div>
              <div className="row">
                <div className="grow">
                  <Progress value={trueCount / notes.length} tone="ink" />
                </div>
                <b style={{ fontSize: 12 }}>
                  true to size · {trueCount} of {notes.length}
                </b>
              </div>
              {notes.map((n) => (
                <p key={n.by} className="sub">
                  “{n.text}” · {user(n.by).name.split(' ')[0]}, {n.size}
                </p>
              ))}
            </div>
          ) : (
            <div className="card note">
              <Icon name="ruler" size={18} />
              <p>Fit notes from owners in your size unlock at the Stitch tier.</p>
            </div>
          ))}

        <div className="card col" style={{ gap: 4 }}>
          <b>Its story, in facts</b>
          <p className="sub">{p.story}</p>
          <p className="sub">No claims about the planet: a number, a grade and a date.</p>
        </div>
      </Body>
      <Actions>
        {owned ? (
          <Btn tone="ghost" to="/profile">
            Yours · see the certificate
          </Btn>
        ) : entry.ok ? (
          <Btn tone="ink" onClick={() => setConfirm(true)}>
            Use {keysLabel(p.keys)} · buy for {euro(price)}
          </Btn>
        ) : entry.reason === 'not_open' ? (
          <Btn tone="ink" to="/drop-home">
            Opens {weekdayDate(entry.opensAt)}, {clock(entry.opensAt)} · see the drop
          </Btn>
        ) : (
          <Btn tone="ink" to="/scan">
            Needs {keysLabel(p.keys)}, you have {keys} · earn one
          </Btn>
        )}
        <p className="fine">
          Pick up at Gran Vía or ship with Tuesday’s delivery · free returns to the bin, with a key
        </p>
      </Actions>

      {confirm && (
        <BottomSheet label="Confirm your purchase" onClose={() => setConfirm(false)}>
          <h2>The key opens the door. Money buys the piece.</h2>
          <div className="grid2">
            <Stat n={`−${p.keys}`} l={`${p.keys === 1 ? 'key' : 'keys'} · ${keys - p.keys} left`} tone="gold" />
            <Stat n={euro(price)} l={p.lane === 'vintage' ? `grade ${p.grade} price` : p.lane === 'recut' ? 'atelier price' : 'store price'} />
          </div>
          <p className="sub">
            {g.name} · {p.number}. Buying earns 0 Circular Score: status is never bought. Payment is simulated in this
            demo.
          </p>
          <Btn onClick={pay}>
            Pay {euro(price)} · use {keysLabel(p.keys)}
          </Btn>
          <Btn tone="ghost" onClick={() => setConfirm(false)}>
            Not now
          </Btn>
        </BottomSheet>
      )}
    </Screen>
  );
}

/** 5.4 · You're in */
export function YoureIn() {
  const s = useStore();
  const cert = s.certificates.find((c) => c.piece === s.lastPurchase);
  if (!cert) return <Navigate to="/drop-home" replace />;
  const p = piece(cert.piece)!;
  const g = garment(cert.garment);
  const keys = selKeys(s);
  const lot = p.fromLot ? s.lots.find((l) => l.id === p.fromLot) : undefined;
  const owner = lot ? user(lot.owner) : undefined;
  const no = cert.number.split(' of ')[0];

  return (
    <Screen>
      <TopBar
        left={
          <Chip tone="lime">
            <Icon name="check" size={13} /> {cert.keys === 1 ? 'key' : `${cert.keys} keys`} used · {keys} left
          </Chip>
        }
        right={
          <Link className="back" to="/main" style={{ margin: 0 }}>
            done <Icon name="x" size={14} />
          </Link>
        }
      />
      <Body>
        <h1 className="title xl">
          You’re in.
          <br />
          <em>{no}</em>
          <br />
          is yours.
        </h1>

        <div className="ticket paper-t" style={{ ['--notch' as string]: '66%' }}>
          <div className="row" style={{ gap: 12 }}>
            <GarmentTile g={g} size="md" />
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', color: '#5b5f68' }}>ARCHIVE CERTIFICATE</span>
              <b style={{ fontFamily: 'var(--display)', fontSize: 16, lineHeight: 1.15 }}>
                {g.name}
                {g.era ? ` · ${g.era}` : ''}
              </b>
              <span style={{ fontSize: 11.5, color: '#5b5f68' }}>
                {cert.number}
                {cert.grade ? ` · graded ${cert.grade}` : ''} · lot {cert.dropLot}
                <br />
                Encore · {s.city} · {weekdayDate(cert.date)} {cert.date.slice(0, 4)}
              </span>
            </div>
          </div>
          <div className="tear" />
          <div className="row between">
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              Paid {euro(cert.paid)} · pick up Gran Vía from Wed
            </span>
            <span className="barcode" aria-hidden="true" />
          </div>
        </div>

        {owner && lot && (
          <div className="card card-lilac row" style={{ gap: 12 }}>
            <Avatar initial={owner.initial} i={3} />
            <p style={{ fontSize: 13 }}>
              <span className="b">
                {owner.name.split(' ')[0]} brought this {g.short} back on {dayMonth(lot.droppedOn)}.
              </span>{' '}
              She just got a note that it found its encore. That’s the loop.
            </p>
          </div>
        )}

        <div className="grid2">
          <Stat n="+0" l="points for buying · by design" tone="lime" />
          <Stat n={keys} l="keys left · never expire" tone="gold" />
        </div>
      </Body>
      <Actions>
        <Btn to="/scan">Bring the next piece back</Btn>
        <Btn tone="ghost" to="/post-look">
          Post it when it arrives · +{seed.rules.points.look}
        </Btn>
      </Actions>
    </Screen>
  );
}
