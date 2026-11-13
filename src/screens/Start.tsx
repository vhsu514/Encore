import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Actions, Avatar, Body, Btn, Chip, GarmentTile, Icon, KeyCounter, Logo, LotTimeline, Screen, TabBar, TopBar } from '../components/ui';
import { garment, me, piece, seed } from '../seed';
import { num } from '../format';
import {
  selDeckCount,
  selDeckDone,
  selLatestLot,
  selPoints,
  selRank,
  selStandings,
  useStore,
} from '../store';

/** 0.1 · Encore home */
export function Main() {
  const s = useStore();
  const rank = selRank(s);
  const standings = selStandings(s);
  const lot = selLatestLot(s);
  const lotGarment = garment(lot.garment);
  const hyped = s.hypedPieces.map((id) => piece(id)).filter((p) => p !== undefined);
  const gap = rank > 1 ? standings[rank - 2].points - selPoints(s) + 1 : 0;
  const user = me();

  return (
    <Screen>
      <TopBar
        left={<Logo />}
        right={
          <div className="row">
            {s.settings.leaderboards && (
              <Link className="chip chip-lime" to="/league" aria-label={`Rank ${rank} in ${s.city}. Open your league`}>
                #{rank} · {s.city}
              </Link>
            )}
            <KeyCounter />
            <Link to="/profile" aria-label="Open your profile" style={{ display: 'grid', placeItems: 'center', minHeight: 44 }}>
              <Avatar initial={user.initial} i={4} />
            </Link>
          </div>
        }
      />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">
            Hey {user.name},
            <br />
            your closet has <em>status.</em>
          </h1>
          <p className="sub">Bring it back, swipe it, climb your city, unlock the drop.</p>
        </div>

        <Link className="hero-drop" to="/drop-home">
          <div className="row between">
            <Chip tone="ink">ARCHIVE DROP</Chip>
            <b>Tue · {seed.drop.opens.slice(11)}</b>
          </div>
          <h2>
            {hyped.length} {hyped.length === 1 ? 'piece' : 'pieces'} you hyped {hyped.length === 1 ? 'is' : 'are'} in
          </h2>
          <div className="row">
            {hyped.slice(0, 4).map((p) => (
              <GarmentTile key={p.id} g={garment(p.garment)} size="sm" />
            ))}
            <p className="grow" style={{ fontSize: 12.5, fontWeight: 600, paddingLeft: 4 }}>
              {num(seed.drop.totalPieces)} pieces · quantities stated · no restock
            </p>
          </div>
        </Link>

        <span className="label">Your loop</span>
        <div className="grid2">
          <Link className="action primary" to="/scan">
            <Icon name="bin" size={24} />
            <b>Bring a piece back</b>
            <small>Scan, drop, earn a key</small>
          </Link>
          <Link className="action" to={selDeckDone(s) ? '/deck-done' : '/swipe'}>
            <Icon name="cards" size={24} />
            <b>Style Swipe</b>
            <small>{selDeckDone(s) ? 'Deck complete today' : `${selDeckCount(s)} of ${seed.deck.perDay} today`}</small>
          </Link>
          <Link className="action" to="/looks">
            <Icon name="camera" size={24} />
            <b>Looks &amp; Battles</b>
            <small>{s.battleChoice ? 'You voted today' : 'Battle open today'}</small>
          </Link>
          <Link className="action" to="/league">
            <Icon name="trophy" size={24} />
            <b>City League</b>
            <small>
              {!s.settings.leaderboards
                ? 'Leaderboards off'
                : rank > 1
                  ? `${gap} pts to #${rank - 1} · resets Sun`
                  : 'You lead · resets Sun'}
            </small>
          </Link>
        </div>

        <Link className="card tap" to={`/lot-tracker/${lot.id}`}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <span className="sub">
              Lot {lot.id} · your {lotGarment.short ?? lotGarment.name}
            </span>
            {lot.grade ? (
              <Chip tone="gold">
                Graded {lot.grade}
                {lot.grade === 'A' && lot.keysAwarded > 1 ? ' · +1 key' : ''}
              </Chip>
            ) : (
              <Chip tone="ghost">grade pending</Chip>
            )}
          </div>
          <LotTimeline lot={lot} />
        </Link>
      </Body>
      <TabBar />
    </Screen>
  );
}

/** 0.2 · First open: consent and city */
export function Onboarding() {
  const s = useStore();
  const nav = useNavigate();
  const [city, setCity] = useState(s.city);
  const [photos, setPhotos] = useState(false);
  const [age, setAge] = useState(true);

  const go = (accept: boolean) => {
    s.finishOnboarding(accept ? { city, photos, age16plus: age } : { city, photos: false, age16plus: false });
    nav('/main');
  };

  return (
    <Screen>
      <TopBar left={<Logo />} right={<Chip tone="ghost">design concept</Chip>} />
      <Body>
        <span className="sticker">new · for {city}</span>
        <h1 className="title xl">
          Your old Zara gets you into the <em>new drop.</em>
        </h1>
        <p className="sub">
          Bring a garment back, earn an Archive Key. Keys cannot be bought. They open Tuesday drops: vintage by era,
          re-cut editions, first access.
        </p>

        <div className="col">
          <div className="card setrow">
            <div className="grow">
              <b>Your city</b>
              <p>For your league. You choose it; we never track it.</p>
            </div>
            <label className="sr" htmlFor="city">
              Your city
            </label>
            <select id="city" className="pick" value={city} onChange={(e) => setCity(e.target.value)}>
              {seed.cityGoal.race.map((r) => (
                <option key={r.city} value={r.city} disabled={r.city !== seed.cityGoal.city}>
                  {r.city}
                  {r.city !== seed.cityGoal.city ? ' (not in this demo)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="card setrow">
            <div className="grow">
              <b>Looks and photos</b>
              <p>Opt in later, only when you post. Off by default.</p>
            </div>
            <button
              type="button"
              className={`chip ${photos ? 'chip-lime' : 'chip-ghost'}`}
              aria-pressed={photos}
              onClick={() => setPhotos(!photos)}
            >
              {photos ? 'on' : 'later'}
            </button>
          </div>
          <div className="card setrow">
            <div className="grow">
              <b>I am 16 or over</b>
              <p>Leagues and battles are 16+. One tap turns them off, any time.</p>
            </div>
            <button
              type="button"
              className={`chip ${age ? 'chip-lime' : 'chip-ghost'}`}
              aria-pressed={age}
              onClick={() => setAge(!age)}
            >
              {age ? (
                <>
                  <Icon name="check" size={13} /> yes
                </>
              ) : (
                'confirm'
              )}
            </button>
          </div>
        </div>
      </Body>
      <Actions>
        <Btn onClick={() => go(true)}>Let’s go</Btn>
        <Btn tone="ghost" onClick={() => go(false)}>
          Not now
        </Btn>
        <p className="fine">No streaks. No countdowns. Keys never expire, so nothing is lost by waiting.</p>
      </Actions>
    </Screen>
  );
}
