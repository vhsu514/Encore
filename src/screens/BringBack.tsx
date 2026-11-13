import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Actions, Body, Btn, Chip, Confetti, GarmentTile, Icon, KeyCounter, Progress, Screen, Stat, TopBar, garmentSrc } from '../components/ui';
import { garment, seed } from '../seed';
import { keysForReturn } from '../rules';
import { addDays, clock, dayMonth, keysLabel, weekdayDate } from '../format';
import { selKeys, selLatestLot, selMonthEarned, selMyLots, selNextReturn, useStore } from '../store';
import type { Condition, Lot } from '../types';

const storeShort = seed.clock.store.replace('Zara ', '');

/** 1.1 · Scan the care label (camera simulated) */
export function Scan() {
  const s = useStore();
  const g = selNextReturn(s);
  const [read, setRead] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRead(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen>
      <TopBar back={`Store Mode · ${seed.clock.store}`} backTo="/main" right={<KeyCounter short />} />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">Scan the care label</h1>
          <p className="sub">The small label inside the garment. Any Zara piece, any condition, no receipt.</p>
        </div>
        <div className="scanwin" role="img" aria-label={`Camera view reading care label reference ${g.ref}`}>
          <span className="corner c1" />
          <span className="corner c2" />
          <span className="corner c3" />
          <span className="corner c4" />
          <div className="carelabel">
            <span>
              REF. {g.ref} · {g.line?.toUpperCase()}
            </span>
            <span style={{ fontWeight: 600 }}>
              {(g.short ?? g.name).toUpperCase()} · {g.color?.toUpperCase()}
            </span>
            <div className="codes">
              <span className="navilens" />
              <span className="barcode" />
            </div>
            <span style={{ fontWeight: 500, fontSize: 8, textAlign: 'right', letterSpacing: 0 }}>care label · NaviLens</span>
          </div>
          {!read && <span className="scanline" />}
          <span className="status" aria-live="polite">
            <Chip tone="lime">
              {read ? (
                <>
                  <Icon name="check" size={13} /> Code read
                </>
              ) : (
                'Reading the code…'
              )}
            </Chip>
          </span>
        </div>
        <div className="steps">
          <div className="step done">
            <span className="mk">1</span>
            <p style={{ paddingTop: 3 }}>
              <span className="b">Point at the inside label.</span> The reference code and the NaviLens code both work;
              new labels read from a metre away.
            </p>
          </div>
          <div className="step todo">
            <span className="mk">2</span>
            <p style={{ paddingTop: 3 }}>Confirm the piece and find the bin.</p>
          </div>
          <div className="step todo">
            <span className="mk">3</span>
            <p style={{ paddingTop: 3 }}>Drop it in. The key lands in your app.</p>
          </div>
        </div>
      </Body>
      <Actions>
        <Btn to="/confirm">Label read · continue</Btn>
      </Actions>
    </Screen>
  );
}

const CONDITIONS: { id: Condition; label: string; sub: string }[] = [
  { id: 'like_new', label: 'Like new', sub: 'worn a few times' },
  { id: 'loved', label: 'Loved', sub: 'signs of wear' },
  { id: 'worn_out', label: 'Worn out', sub: 're-cut or fiber' },
];

/** 1.2 · Garment confirmed (the one light "catalogue" screen) */
export function Confirm() {
  const s = useStore();
  const g = selNextReturn(s);
  const keys = keysForReturn(undefined, selMonthEarned(s));

  return (
    <Screen tone="paper">
      <TopBar
        back="Back"
        backTo="/scan"
        right={
          <Chip tone="lime">
            <Icon name="check" size={13} /> label read
          </Chip>
        }
      />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">Yes, that’s yours</h1>
          <p className="sub">Pulled from the reference code, the same lookup Pre-Owned uses.</p>
        </div>
        <div className="card row" style={{ gap: 14 }}>
          <GarmentTile g={g} size="md" />
          <div className="col" style={{ gap: 3 }}>
            <b style={{ fontFamily: 'var(--display)', fontSize: 17, lineHeight: 1.15 }}>{g.name}</b>
            <span className="sub">
              Ref. {g.ref} · {g.line}
            </span>
            <span className="sub">
              {g.short} · {g.color}
            </span>
            <div className="row" style={{ marginTop: 4 }}>
              <Chip tone="ghost">{g.size}</Chip>
              <Chip tone="ghost">bought {g.bought}</Chip>
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 2 }}>
          <b id="cond">Condition, honestly</b>
          <p className="sub">It only changes the bonus: grade A at the hub earns a second key.</p>
        </div>
        <div className="grid3" role="group" aria-labelledby="cond">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="opt"
              aria-pressed={s.condition === c.id}
              onClick={() => s.setCondition(c.id)}
            >
              {c.label}
              <small>{c.sub}</small>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="map" role="img" aria-label="Store map: the Encore Bin is by the returns counter">
            <span className="zone" style={{ left: 22, top: 16 }}>
              WOMAN · floor 1
            </span>
            <span className="zone" style={{ right: 60, top: 34, padding: '14px 22px' }}>
              Returns counter
            </span>
            <span className="you" />
            <span className="bin">
              <Icon name="bin" size={18} />
            </span>
          </div>
          <div className="row between" style={{ padding: '10px 14px' }}>
            <div>
              <b>Encore Bin · by the returns counter</b>
              <p className="sub">about 40 steps from you · open now</p>
            </div>
            <Chip tone={keys ? 'lime' : 'ghost'}>{keys ? keysLabel(keys) : 'cap reached'}</Chip>
          </div>
        </div>
        {!keys && (
          <p className="sub">
            You have earned {seed.rules.monthlyKeyCap} keys this month, the cap. This return still earns +
            {seed.rules.points.return} points and counts for the city.
          </p>
        )}
      </Body>
      <Actions>
        <Btn tone="ink" to="/drop">
          Take it to the bin
        </Btn>
      </Actions>
    </Screen>
  );
}

/** 1.3 · Drop it in the Encore Bin (scale and RFID simulated) */
export function Drop() {
  const s = useStore();
  const nav = useNavigate();
  const g = selNextReturn(s);
  const rfid = (g.bought ?? 0) >= 2022;
  const [passed, setPassed] = useState(0);
  useEffect(() => {
    const timers = [1300, 2200, 3000].map((ms, i) => setTimeout(() => setPassed(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const checks = [
    { label: 'Weight', value: `${g.weightKg?.toFixed(2)} kg` },
    { label: 'RFID label', value: rfid ? 'confirmed in 0.9 s' : 'too old to read · scan + weight' },
    { label: 'Matches your scan', value: `Ref. ${g.ref}` },
  ];
  const claim = () => {
    s.confirmReturn();
    nav('/key-landing');
  };

  return (
    <Screen>
      <TopBar
        back="Back"
        backTo="/confirm"
        right={
          <Chip tone="teal">
            {seed.clock.bin} · {storeShort}
          </Chip>
        }
      />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">Drop it in</h1>
          <p className="sub">The bin weighs the piece and reads its label. Watch it count.</p>
        </div>
        <div className="binscene" aria-hidden="true">
          <img className="falling" src={garmentSrc(g)} alt="" />
          <span className="lid" />
          <div className="box">
            <b>ENCORE BIN</b>
            <small>ANY ZARA · ANY CONDITION</small>
          </div>
        </div>
        <div className="col" aria-live="polite">
          {checks.map((c, i) => (
            <div key={c.label} className={`check${passed > i ? ' ok' : ''}`}>
              <div className="row between">
                <span>{c.label}</span>
                <span className="v row" style={{ gap: 4 }}>
                  {passed > i ? (
                    <>
                      {c.value} <Icon name="check" size={14} />
                    </>
                  ) : (
                    'reading…'
                  )}
                </span>
              </div>
              <Progress value={passed > i ? 1 : passed === i ? 0.35 : 0} />
            </div>
          ))}
        </div>
        <p className="fine">Older pieces whose label no longer reads are confirmed by the scan plus the weight.</p>
      </Body>
      <Actions>
        <Btn onClick={claim} disabled={passed < 3}>
          {passed < 3 ? 'Reading the bin…' : 'Done · claim my key'}
        </Btn>
      </Actions>
    </Screen>
  );
}

/** 1.4 · Key landing */
export function KeyLanding() {
  const s = useStore();
  const nav = useNavigate();
  const r = s.lastReturn;
  if (!r) return <Navigate to="/scan" replace />;
  const g = garment(r.garment);
  const moved = r.rankBefore - r.rankAfter;

  return (
    <Screen>
      <TopBar
        right={
          <Link className="back" to="/main" style={{ margin: 0 }}>
            close <Icon name="x" size={14} />
          </Link>
        }
      />
      <Body style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="keyhero">
          <Confetti />
          <div className="keytile">
            <Icon name="key" size={84} />
          </div>
        </div>
        <span className="sticker" style={{ alignSelf: 'center' }}>
          lot {r.lot} · collected {r.time}
        </span>
        <h1 className="title xl" aria-live="polite">
          {r.keys ? `+${r.keys} Archive Key` : 'Monthly cap reached'}
        </h1>
        <p className="sub" style={{ maxWidth: 300 }}>
          {r.keys ? (
            <>
              A second key lands if the hub grades your {g.short} <span className="b">A</span>. You’ll see where it goes.
            </>
          ) : (
            <>No key this time: you already earned {seed.rules.monthlyKeyCap} this month. The points and the city count still land.</>
          )}
        </p>
        <div className="grid3" style={{ width: '100%' }}>
          <Stat n={selKeys(s)} l="keys now" tone="gold" />
          <Stat n={`+${r.points}`} l="Circular Score" tone="lime" />
          {s.settings.leaderboards ? (
            <Stat n={`#${r.rankAfter}`} l={`${s.city}${moved > 0 ? ` · up ${moved}` : ''}`} tone="lilac" />
          ) : (
            <Stat n="off" l="leaderboards" />
          )}
        </div>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <Chip tone="ghost">never expires</Chip>
          <Chip tone="ghost">no cash value</Chip>
          <Chip tone="ghost">cannot be bought</Chip>
        </div>
        <Link className="chip chip-lime" to="/city-goal">
          +1 to {s.city}’s goal
        </Link>
      </Body>
      <Actions>
        <Btn
          tone="gold"
          onClick={() => {
            s.followLot(r.lot);
            nav(`/lot-tracker/${r.lot}`);
          }}
        >
          Follow my lot
        </Btn>
        <Btn tone="ghost" to="/drop-home">
          See Tuesday’s drop
        </Btn>
      </Actions>
    </Screen>
  );
}

const destination = (lot: Lot) =>
  lot.status.includes('fiber') ? 'fiber' : lot.status.includes('recut') ? 'recut' : lot.status.includes('vintage_lane') ? 'vintage' : null;

/** 1.5 · Where your garment went */
export function LotTracker() {
  const s = useStore();
  const { id } = useParams();
  const lots = selMyLots(s);
  const lot = lots.find((l) => l.id === id) ?? selLatestLot(s);
  const g = garment(lot.garment);
  const day = lot.droppedOn.slice(0, 10);
  const graded = Boolean(lot.grade);
  const dest = destination(lot);
  const sold = lot.status.includes('sold');
  const bonus = lot.grade === 'A' && lot.keysAwarded > 1;

  return (
    <Screen>
      <TopBar back="Your lots" backTo="/main" right={<Chip tone="gold">Lot {lot.id}</Chip>} />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">Where your {g.short ?? 'garment'} went</h1>
          <p className="sub">Status is earned on a record, not a promise. Every lot is logged.</p>
        </div>
        <div className="card row" style={{ gap: 12 }}>
          <GarmentTile g={g} size="md" />
          <div className="col" style={{ gap: 4 }}>
            <b>{g.name}</b>
            <span className="sub">
              Dropped at {lot.droppedAt.replace('Zara ', '').split(',')[0]} · {dayMonth(day)}
              {lot.droppedOn.length > 10 ? `, ${clock(lot.droppedOn)}` : ''}
            </span>
            <div className="row wrap">
              {graded ? <Chip tone="lime">Graded {lot.grade}</Chip> : <Chip tone="ghost">grade pending</Chip>}
              {bonus && <Chip tone="gold">+1 bonus key</Chip>}
            </div>
          </div>
        </div>

        <div className="card steps" style={{ paddingBottom: 0 }}>
          <div className="step done">
            <span className="mk">
              <Icon name="check" size={15} />
            </span>
            <div>
              <h3>Collected</h3>
              <p>{weekdayDate(day)} · bag 7 · on the Tuesday return run to the DC</p>
            </div>
          </div>
          <div className={`step ${graded ? 'done' : 'cur'}`}>
            <span className="mk">{graded ? <Icon name="check" size={15} /> : 2}</span>
            <div>
              <h3>Graded at the hub</h3>
              <p>
                {graded
                  ? `${weekdayDate(addDays(day, 2))} · Cáritas Moda re- · grade ${lot.grade}${lot.grade === 'C' ? ', unwearable as is' : ', cleaned, photographed'}`
                  : 'Usually two days after collection. Grade A earns a second key.'}
              </p>
            </div>
          </div>
          <div className={`step ${dest ? (sold ? 'done' : 'cur') : 'todo'}`}>
            <span className="mk">{sold ? <Icon name="check" size={15} /> : 3}</span>
            <div>
              <h3>{dest === 'vintage' ? 'Vintage lane' : dest === 'recut' ? 'Re-cut edition' : dest === 'fiber' ? 'Fiber' : 'Its destination'}</h3>
              <p>
                {dest === 'vintage'
                  ? `Listed as “${lot.listing ?? g.listing ?? g.name}” for a Tuesday drop`
                  : dest === 'recut'
                    ? 'With a partner atelier in the Arteixo cluster, to be re-cut into a numbered edition'
                    : dest === 'fiber'
                      ? 'Recycled into fiber. Weight reported per lot.'
                      : 'Vintage lane, a re-cut edition or fiber, decided by the grade'}
              </p>
            </div>
          </div>
          <div className={`step ${sold ? 'done' : 'todo'}`}>
            <span className="mk">{sold ? <Icon name="check" size={15} /> : 4}</span>
            <div>
              <h3>Its encore</h3>
              <p>
                {sold
                  ? 'Sold in a Tuesday drop. It found its encore.'
                  : 'You’ll be told when it sells and who gave it a second life (first name only, if they opt in).'}
              </p>
            </div>
          </div>
        </div>

        {!graded && (
          <Btn tone="ghost" sm onClick={() => s.gradeLot(lot.id)}>
            <Icon name="play" size={14} fill /> Fast-forward: the hub grades it (demo)
          </Btn>
        )}

        <div className="card card-lilac">
          <div className="row between">
            <b>Your other lots</b>
            <Chip tone="ink">{lots.length} logged</Chip>
          </div>
          <div className="row wrap" style={{ marginTop: 8 }}>
            {lots
              .filter((l) => l.id !== lot.id)
              .slice(-4)
              .reverse()
              .map((l) => (
                <Link key={l.id} className="chip chip-ink" to={`/lot-tracker/${l.id}`}>
                  {l.id} {garment(l.garment).short}
                </Link>
              ))}
          </div>
        </div>
      </Body>
      <Actions>
        <Btn to="/swipe">Next: swipe today’s deck</Btn>
      </Actions>
    </Screen>
  );
}
