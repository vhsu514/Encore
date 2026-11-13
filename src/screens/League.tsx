import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Actions, Avatar, Body, BottomSheet, Btn, Chip, Confetti, Icon, KeyCounter, Logo, Progress, Screen, TierTrack, TopBar } from '../components/ui';
import { ME, me, seed } from '../seed';
import { TIER_ORDER, hasPass, tierIndex } from '../rules';
import { clock, kg, weekday } from '../format';
import {
  selGarmentsBack,
  selHasPass,
  selKeysEarned,
  selKg,
  selLotsFollowed,
  selPoints,
  selRank,
  selStandings,
  useStore,
} from '../store';

const league = seed.league;
const R = seed.rules;

/** 4.1 · City League */
export function League() {
  const s = useStore();
  const [sheet, setSheet] = useState(false);
  const standings = selStandings(s);
  const rank = selRank(s);
  const points = selPoints(s);
  const ended = s.tierBeforeWeekEnd !== null;
  const leagueTier = s.tierBeforeWeekEnd ?? s.tier;
  const nextTier = TIER_ORDER[Math.min(TIER_ORDER.length - 1, tierIndex(leagueTier) + 1)];
  const above = rank > 1 ? standings[rank - 2] : null;
  const shown = standings.slice(0, Math.max(5, Math.min(rank + 1, 7)));
  const newPerks = seed.tiers.find((t) => t.id === s.tier)?.unlocks ?? [];

  const end = () => {
    s.endWeek();
    setSheet(true);
  };

  return (
    <Screen>
      <TopBar back="City League" backTo="/main" right={<KeyCounter />} />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title xl">{s.city}</h1>
          <p className="sub">
            {leagueTier} League · week {league.week} · {R.league.size} stylists · resets {R.league.resetDay} · top{' '}
            {R.league.promote} move up{nextTier !== leagueTier ? ` to ${nextTier}` : ''}
          </p>
        </div>
        <TierTrack tier={s.tier} />

        {!s.settings.leaderboards ? (
          <div className="card col">
            <b>Leaderboards are off</b>
            <p className="sub">
              Your rank and league are hidden. Your keys, badges and Circular Score all stay. Switch back on in one tap.
            </p>
            <Btn tone="ghost" sm to="/profile">
              Open the switches
            </Btn>
          </div>
        ) : (
          <>
            <div className="card card-lime col">
              <div className="row between">
                <span className="display" style={{ fontSize: 32, lineHeight: 1 }} aria-live="polite">
                  #{rank} <span style={{ fontSize: 15 }}>of {standings.length}</span>
                </span>
                {selHasPass(s) && (
                  <Link className="chip chip-gold" to="/pass">
                    pass earned <Icon name="check" size={13} />
                  </Link>
                )}
              </div>
              <b style={{ fontSize: 13 }}>
                {points} Circular Score · {ended ? `${s.tier} tier from Monday` : `${s.tier} tier`}
              </b>
              <div className="row">
                <div className="grow">
                  <Progress value={above ? points / (above.points + 1) : 1} tone="ink" />
                </div>
                <b style={{ fontSize: 12 }}>{above ? `${above.points - points + 1} pts to #${rank - 1}` : 'you lead'}</b>
              </div>
            </div>

            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} className="col" aria-label="League standings">
              {shown.map((r, i) => (
                <li key={r.id} className={`lb${r.id === ME ? ' me' : ''}`}>
                  <span className="rk">{i + 1}</span>
                  <Avatar initial={r.initial} i={i} />
                  <span>
                    {r.name}
                    {r.id === ME ? ' (you)' : ''}
                  </span>
                  <span className="pts">{r.points}</span>
                </li>
              ))}
              {rank > shown.length && (
                <li className="lb me">
                  <span className="rk">{rank}</span>
                  <Avatar initial={me().initial} />
                  <span>{me().name} (you)</span>
                  <span className="pts">{points}</span>
                </li>
              )}
            </ol>
            <p className="fine lime" style={{ fontWeight: 700 }}>
              <Icon name="up" size={13} /> promotion zone · top {R.league.promote} · bottom {R.league.relegate} move down
            </p>
          </>
        )}

        <p className="sub" style={{ fontSize: 12 }}>
          Points only from circular actions: bins +{R.points.return}, looks +{R.points.look}, fit notes +
          {R.points.fitNote}, repairs +{R.points.repair}, resales +{R.points.preOwnedSale}. Never from spending.{' '}
          <Link to="/profile" style={{ textDecoration: 'underline' }}>
            Leaderboards off in one tap.
          </Link>
        </p>
      </Body>
      <Actions row>
        {ended ? (
          <Btn tone="lilac" onClick={() => setSheet(true)}>
            Week ended · see result
          </Btn>
        ) : (
          <Btn tone="lilac" onClick={end} disabled={!s.settings.leaderboards}>
            <Icon name="play" size={14} fill /> End the week (demo)
          </Btn>
        )}
        <Btn tone="ghost" to="/wrapped">
          Season recap
        </Btn>
      </Actions>

      {sheet && ended && (
        <BottomSheet label="Sunday reset" onClose={() => setSheet(false)}>
          {s.promoted && <Confetti />}
          <span className="eyebrow">Sunday reset · week {league.week}</span>
          <h2>
            {s.promoted ? (
              <>
                You moved up to <span className="lime">{s.tier}.</span>
              </>
            ) : (
              <>You stay in {s.tier}.</>
            )}
          </h2>
          <p className="sub">
            You finished #{rank} of {standings.length}. The top {R.league.promote} move up
            {s.promoted
              ? `, and ${s.tier} also asks for 2 garments back this season. You have ${selGarmentsBack(s)}.`
              : '. Next week starts Monday.'}
          </p>
          {s.promoted && (
            <div className="col">
              {newPerks.map((perk) => (
                <div key={perk} className="card row" style={{ padding: 12 }}>
                  <span className="lime">
                    <Icon name="check" size={18} />
                  </span>
                  <b>{perk}</b>
                </div>
              ))}
            </div>
          )}
          <Btn to="/tiers">See what every tier unlocks</Btn>
          <Btn
            tone="ghost"
            onClick={() => {
              s.resetWeek();
              setSheet(false);
            }}
          >
            Undo (demo)
          </Btn>
        </BottomSheet>
      )}
    </Screen>
  );
}

/** 4.2 · Skip-the-line pass */
export function Pass() {
  const s = useStore();
  const drop = seed.drop;
  const day = weekday(drop.passOpens) === 'Tue' ? 'Tuesday' : weekday(drop.passOpens);

  if (!selHasPass(s)) {
    return (
      <Screen>
        <TopBar back="City League" backTo="/league" right={<Chip tone="ghost">passes · 0 active</Chip>} />
        <Body>
          <h1 className="title">Skip the line</h1>
          <p className="sub">
            The pass opens Tuesday’s drop {R.passEarlyMinutes} minutes early. You get it at the {R.passFromTier} tier,
            or by winning a Style Battle. You are in {s.tier}.
          </p>
        </Body>
        <Actions>
          <Btn to="/tiers">See how to reach {R.passFromTier}</Btn>
        </Actions>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar back="City League" backTo="/league" right={<Chip tone="ghost">passes · 1 active</Chip>} />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">Skip the line</h1>
          <p className="sub">
            {s.tier} tier{s.tier === R.passFromTier ? ', two weeks running' : ''}. Enter Tuesday’s drop before every
            other key holder.
          </p>
        </div>
        <div className="ticket">
          <div className="row between">
            <Chip tone="ink">SKIP-THE-LINE PASS</Chip>
            <b style={{ fontSize: 12 }}>No. 0046 · {s.city}</b>
          </div>
          <div className="display" style={{ fontSize: 46, lineHeight: 1 }}>
            {day}
            <br />
            {clock(drop.passOpens)}
          </div>
          <b style={{ fontSize: 13 }}>
            Archive Drop · lot {drop.lot} · {R.passEarlyMinutes === 10 ? 'ten' : R.passEarlyMinutes} minutes before the{' '}
            {clock(drop.opens)} door
          </b>
          <div className="tear" />
          <div className="row between">
            <div>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em' }}>HOLDER</span>
              <br />
              <b>
                {me().name} · {s.tier} tier
              </b>
            </div>
            <span className="barcode" aria-hidden="true" />
          </div>
        </div>
        <div className="card note">
          <Icon name="calendar" size={18} />
          <p>
            <span className="b">How you earned it.</span> Top {R.league.promote} of your Stitch league two weeks running,
            or win a Style Battle.
          </p>
        </div>
        <div className="card note">
          <span className="gold">
            <Icon name="key" size={18} />
          </span>
          <p>
            <span className="b">You still need keys.</span> The pass opens the door early; a key opens the piece; money
            buys it, at full price.
          </p>
        </div>
        <div className="card note">
          <Icon name="shield" size={18} />
          <p>
            <span className="b">It never expires or sells.</span> One pass per drop. Unused passes carry to the next
            Tuesday, even if you move down a tier first.
          </p>
        </div>
      </Body>
      <Actions>
        <Btn to="/drop-home">Preview Tuesday’s drop</Btn>
        <Btn tone="ghost" onClick={() => s.say('Added to your phone wallet (simulated).')}>
          Add to wallet
        </Btn>
      </Actions>
    </Screen>
  );
}

/** 4.3 · Encore Wrapped */
export function Wrapped() {
  const s = useStore();
  const w = seed.wrapped;
  const best = s.settings.leaderboards ? Math.min(w.bestWeeklyRank, selRank(s)) : null;
  const stats: [string | number, string][] = [
    [selGarmentsBack(s), 'pieces brought back'],
    [kg(selKg(s)), 'kg given a second life'],
    [selKeysEarned(s), 'keys earned'],
    [selLotsFollowed(s), 'lots followed'],
    [best ? `#${best}` : 'off', 'best weekly rank'],
    [s.tier, 'tier'],
  ];

  return (
    <Screen>
      <TopBar back="City League" backTo="/league" right={<Chip tone="ghost">{w.season} · so far</Chip>} />
      <Body>
        <h1 className="title">Encore Wrapped</h1>
        <div className="wrapped">
          <div className="row between">
            <span className="logo" style={{ color: 'var(--ink)' }}>
              Encore<i style={{ color: 'var(--ink)' }}>.</i>
            </span>
            <b style={{ fontSize: 12.5 }}>
              {me().name} · {s.city} · {w.season}
            </b>
          </div>
          <div className="grid2" style={{ rowGap: 14 }}>
            {stats.map(([n, l]) => (
              <div key={l}>
                <div className="n">{n}</div>
                <div className="l">{l}</div>
              </div>
            ))}
          </div>
          <div className="col" style={{ gap: 6 }}>
            <span className="l">signature era</span>
            <span className="display" style={{ fontSize: 22 }}>
              {w.signatureEra}
            </span>
            <Progress value={w.eraShare} tone="ink" />
            <span className="l">{Math.round(w.eraShare * 100)}% of what you hyped this season</span>
          </div>
        </div>
        <p className="fine">No streaks, no guilt. Just the season’s score.</p>
      </Body>
      <Actions row>
        <Btn onClick={() => s.say('Share card saved as an image (simulated).')}>
          <Icon name="share" size={16} /> Share as image
        </Btn>
        <Btn tone="ghost" to="/profile">
          Profile
        </Btn>
      </Actions>
    </Screen>
  );
}

/** 4.4 · Tiers and what they unlock */
export function Tiers() {
  const s = useStore();
  return (
    <Screen>
      <TopBar back="City League" backTo="/league" right={<Logo />} />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">Climb your city, unlock more</h1>
          <p className="sub">
            Weekly leagues of {R.league.size} · top {R.league.promote} move up, bottom {R.league.relegate} move down ·{' '}
            {R.league.resetDay} reset · points never come from spending
          </p>
        </div>
        {seed.tiers.map((t) => {
          const now = t.id === s.tier;
          const locked = tierIndex(t.id) > tierIndex(s.tier);
          return (
            <section key={t.id} className={`tiercard${now ? ' now' : locked ? ' locked' : ''}`} aria-current={now ? 'step' : undefined}>
              <div className="row between">
                <h3>{t.id}</h3>
                {now ? (
                  <Chip tone="ink">{me().name} is here</Chip>
                ) : locked ? (
                  <Chip tone="ghost">to climb</Chip>
                ) : (
                  <Chip tone="ghost">
                    unlocked <Icon name="check" size={13} />
                  </Chip>
                )}
              </div>
              <p className="sub">{t.requirement}</p>
              <ul>
                {t.unlocks.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              {t.id === R.passFromTier && hasPass(s.tier) && (
                <Link to="/pass" className="b" style={{ textDecoration: 'underline', fontSize: 13, minHeight: 32, display: 'inline-flex', alignItems: 'center' }}>
                  See your pass
                </Link>
              )}
            </section>
          );
        })}
      </Body>
      <Actions>
        <Btn tone="ghost" to="/league">
          Back to my league
        </Btn>
      </Actions>
    </Screen>
  );
}
