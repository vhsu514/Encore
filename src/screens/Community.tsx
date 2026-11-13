import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Actions, Avatar, Body, BottomSheet, Btn, Chip, GarmentTile, Icon, Note, Progress, Screen, Stat, Switch, TabBar, TopBar } from '../components/ui';
import { ME, garment, seed, user } from '../seed';
import { cityGoalProgress, pointsFor, tierIndex, vote as voteRule } from '../rules';
import { num } from '../format';
import { selBattle, selGoal, selLooks, selMyLots, useStore } from '../store';
import type { Look } from '../types';

const closetOf = (id: string) => (seed.closets[id] ? `/closet/${id}` : id === ME ? '/profile' : null);
const userIndex = (id: string) => seed.users.findIndex((u) => u.id === id);

/** 3.1 · Looks feed */
export function Looks() {
  const s = useStore();
  const [filter, setFilter] = useState<'city' | 'following' | 'recut'>('city');
  const all = selLooks(s);
  const looks = all.filter((l) =>
    filter === 'following' ? s.following.includes(l.by) : filter === 'recut' ? l.recut : l.audience !== 'friends' || l.by === ME,
  );
  const goal = cityGoalProgress(selGoal(s));

  return (
    <Screen>
      <TopBar
        left={
          <h1 className="display" style={{ fontSize: 22 }}>
            Looks · <span className="lilac">{s.city}</span>
          </h1>
        }
        right={
          <Link className="chip chip-lilac" to="/post-look">
            + post a look · +{seed.rules.points.look}
          </Link>
        }
      />
      <Body>
        <div className="row wrap">
          {(['city', 'following', 'recut'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? 'chip-lilac' : 'chip-ghost'}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === 'city' ? 'City' : f === 'following' ? 'Following' : 'Re-cut'}
            </button>
          ))}
          <Link className="chip chip-lime" to="/city-goal">
            {s.city} goal · {goal.percent}%
          </Link>
          <Link className="chip chip-coral" to="/battle">
            <Icon name="bolt" size={13} fill /> Battle open
          </Link>
        </div>

        {looks.length === 0 ? (
          <div className="card note">
            <Icon name="user" size={18} />
            <p>
              {filter === 'following'
                ? 'Nobody followed yet. Tap a name in the City feed to open a closet and follow.'
                : 'No looks here yet.'}
            </p>
          </div>
        ) : (
          <div className="grid2">
            {looks.map((l) => (
              <LookCard key={l.id} look={l} />
            ))}
          </div>
        )}

        {!s.settings.photos && (
          <div className="card note">
            <Icon name="camera" size={18} />
            <p>
              Photos are off, so your own looks are hidden from the feed. <Link to="/profile" className="b" style={{ textDecoration: 'underline' }}>Switch them on</Link> in one tap.
            </p>
          </div>
        )}
        <Note>
          Photos are opt-in and moderated. 10 hearts give the poster +{seed.rules.points.heartsPer10}, capped at{' '}
          {seed.rules.points.lookCap} a post. Your city is the one you declared.
        </Note>
      </Body>
      <TabBar />
    </Screen>
  );
}

function LookCard({ look }: { look: Look }) {
  const s = useStore();
  const u = user(look.by);
  const mine = look.by === ME;
  const to = closetOf(look.by);
  const hearted = s.hearted.includes(look.id);
  const heartBonus = pointsFor('look', { hearts: look.hearts }) - seed.rules.points.look;
  return (
    <article className={`look${mine ? ' mine' : ''}`}>
      <GarmentTile g={garment(look.garment)}>
        <span className="tl">
          <Chip tone={mine ? 'lime' : look.recut ? 'gold' : 'ink'}>{look.tag}</Chip>
        </span>
      </GarmentTile>
      <div className="meta">
        <div className="who">
          <Avatar initial={u.initial} i={userIndex(look.by)} size="xs" />
          {to && !mine ? <Link to={to}>{u.name}</Link> : <span>{mine ? `${u.name} (you)` : u.name}</span>}
          <button
            type="button"
            className="heartbtn"
            aria-pressed={hearted}
            aria-label={`${look.hearts} hearts. ${hearted ? 'Remove your heart' : 'Heart this look'}`}
            onClick={() => (mine ? s.say('You can’t heart your own look.') : s.heart(look.id))}
          >
            <Icon name="heart" size={14} fill /> {look.hearts}
          </button>
        </div>
        <p className="cap">
          {look.caption}
          {mine && heartBonus > 0 && <span className="lime b"> · +{heartBonus}</span>}
        </p>
      </div>
    </article>
  );
}

/** 3.2 · Post a look (photo is a placeholder) */
export function PostLook() {
  const s = useStore();
  const nav = useNavigate();
  const options = [
    ...s.certificates.map((c) => ({ id: c.piece, garment: c.garment, tag: `you · ${c.number.split(' of ')[0]}`, label: garment(c.garment).short ?? '' })),
    ...selMyLots(s)
      .slice(-3)
      .reverse()
      .map((l) => ({ id: l.id, garment: l.garment, tag: `you · lot ${l.id}`, label: garment(l.garment).short ?? '' })),
  ].slice(0, 3);
  const [pick, setPick] = useState(options[0].id);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<Look['audience']>('city');
  const chosen = options.find((o) => o.id === pick) ?? options[0];
  const canBattle = tierIndex(s.tier) >= tierIndex('Cut');
  const worth = pointsFor('look');

  const post = () => {
    const points = s.postLook({ garment: chosen.garment, caption: caption.trim(), tag: chosen.tag, audience });
    s.say(`Look posted · +${points} Circular Score`);
    nav('/looks');
  };

  return (
    <Screen>
      <TopBar back="Looks" backTo="/looks" right={<Chip tone="lilac">+{worth} points</Chip>} />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">Post a look</h1>
          <p className="sub">Tag the Encore piece you’re wearing. The tag links to its lot, so a look is proof it got a second life.</p>
        </div>

        {!s.settings.photos && (
          <div className="card setrow hl">
            <div className="grow">
              <b>Photos are off</b>
              <p>Posting needs your opt-in. One tap, and one tap to undo it in Profile.</p>
            </div>
            <Switch on={s.settings.photos} onChange={() => s.toggleSetting('photos')} label="Photos in feed" />
          </div>
        )}

        <span className="label" id="tagpiece">
          Tag a piece from your lots and drops
        </span>
        <div className="grid3" role="radiogroup" aria-labelledby="tagpiece">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={pick === o.id}
              onClick={() => setPick(o.id)}
              className="look"
              style={{ borderColor: pick === o.id ? 'var(--lilac)' : undefined, borderWidth: 2 }}
            >
              <GarmentTile g={garment(o.garment)} />
              <span className="meta" style={{ fontSize: 11.5, fontWeight: 700, textAlign: 'left' }}>
                {o.tag.replace('you · ', '')}
                <span className="sub" style={{ fontSize: 11 }}>{o.label}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="sub row" style={{ gap: 6 }}>
          <Icon name="camera" size={16} /> Placeholder photo: the camera is simulated in this demo.
        </p>

        <label className="col" style={{ gap: 6 }}>
          <span className="label">One line</span>
          <input
            className="line"
            value={caption}
            maxLength={60}
            placeholder="trench weather, finally"
            onChange={(e) => setCaption(e.target.value)}
          />
        </label>

        <span className="label" id="aud">
          Who sees it
        </span>
        <div className="grid3" role="radiogroup" aria-labelledby="aud">
          <button type="button" role="radio" className="opt" aria-checked={audience === 'city'} onClick={() => setAudience('city')}>
            {s.city} feed
          </button>
          <button type="button" role="radio" className="opt" aria-checked={audience === 'friends'} onClick={() => setAudience('friends')}>
            Friends only
          </button>
          <button
            type="button"
            role="radio"
            className="opt"
            aria-checked={audience === 'battle'}
            aria-disabled={!canBattle}
            style={{ opacity: canBattle ? 1 : 0.55 }}
            onClick={() => (canBattle ? setAudience('battle') : s.say('Entering a Style Battle unlocks at the Cut tier.'))}
          >
            Next battle
            <small>{canBattle ? 'Cut perk' : 'needs Cut tier'}</small>
          </button>
        </div>
      </Body>
      <Actions>
        <Btn tone="lilac" onClick={post} disabled={!s.settings.photos || !caption.trim()}>
          Post · +{worth}
        </Btn>
      </Actions>
    </Screen>
  );
}

/** 3.3 · Style Battle: one vote, live split, no countdown */
export function Battle() {
  const s = useStore();
  const battle = selBattle(s);
  const looks = { a: seed.looks.find((l) => l.id === battle.a.look)!, b: seed.looks.find((l) => l.id === battle.b.look)! };
  const total = battle.a.votes + battle.b.votes;
  const { shareA, shareB } = voteRule(battle, 'a', s.battleChoice ?? 'a');
  const first = (id: string) => user(id).name.split(' ')[0];
  const chosen = s.battleChoice ? looks[s.battleChoice] : null;
  const canEnter = tierIndex(s.tier) >= tierIndex('Cut');

  return (
    <Screen>
      <TopBar
        back="Looks"
        backTo="/looks"
        right={
          <Chip tone="coral">
            <Icon name="bolt" size={13} fill /> Style Battle · {s.city}
          </Chip>
        }
      />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title">{battle.title}</h1>
          <p className="sub">
            {num(total)} votes · open all day · no countdown · winner takes +{seed.rules.points.battleWin} and the store
            screens
          </p>
        </div>
        <div className="grid2">
          {(['a', 'b'] as const).map((side) => {
            const l = looks[side];
            return (
              <button
                key={side}
                type="button"
                className="side-pick"
                aria-pressed={s.battleChoice === side}
                aria-label={`Vote for ${user(l.by).name}: ${l.caption}`}
                onClick={() =>
                  !s.age16plus
                    ? s.say('Battles are 16+. Confirm your age in Profile to vote.')
                    : s.battleChoice
                      ? s.say('One vote per battle. Yours is already counted.')
                      : s.vote(side)
                }
              >
                <GarmentTile g={garment(l.garment)}>
                  <span className="tl">
                    <Chip tone={l.recut ? 'gold' : 'ink'}>{l.tag}</Chip>
                  </span>
                </GarmentTile>
                <span className="meta">
                  <b className="b" style={{ fontSize: 13.5, display: 'block' }}>
                    {user(l.by).name}
                  </b>
                  {l.caption}
                </span>
              </button>
            );
          })}
        </div>
        <div className="row between" style={{ fontSize: 12.5, fontWeight: 700 }} aria-live="polite">
          <span className="gold">
            {first(looks.a.by)} · {shareA}%
          </span>
          <span className="lilac">
            {first(looks.b.by)} · {shareB}%
          </span>
        </div>
        <div className="splitbar" aria-hidden="true">
          <i className="a" style={{ flexBasis: `${shareA}%` }} />
          <i className="b2" />
        </div>

        {chosen ? (
          <div className="card card-lime note" role="status">
            <Icon name="check" size={18} />
            <p>
              <span className="b">Vote counted.</span> You voted for {first(chosen.by)}’s {garment(chosen.garment).short}.
              Come back tonight for the result{canEnter ? ', or enter your own look.' : ', or enter your own look from the Cut tier.'}
            </p>
          </div>
        ) : (
          <div className="card note">
            <Icon name="heart" size={18} />
            <p>
              <span className="b">Tap a look to vote.</span> One vote per battle. Looks are from your city; the winner’s
              look goes up on the Gran Vía store screens tomorrow.
            </p>
          </div>
        )}
        {canEnter && (
          <Btn tone="lilac" sm to="/post-look">
            Enter your own look
          </Btn>
        )}
      </Body>
      <Actions>
        <Btn tone="ghost" to="/league">
          See my city league
        </Btn>
      </Actions>
    </Screen>
  );
}

const QUESTIONS = ['True to size?', 'How long is it on you?', 'Any stretch in the waist?'];

/** 3.4 · A stylist's closet */
export function Closet() {
  const s = useStore();
  const { id } = useParams();
  const who = id && seed.closets[id] ? id : 'u_lucia';
  const u = user(who);
  const items = seed.closets[who];
  const following = s.following.includes(who);
  const [tab, setTab] = useState<'closet' | 'looks' | 'notes'>('closet');
  const [asking, setAsking] = useState(false);
  const [q, setQ] = useState(QUESTIONS[0]);
  const first = u.name.split(' ')[0];
  const herLooks = selLooks(s).filter((l) => l.by === who);
  const herNotes = seed.drop.pieces.flatMap((p) => (p.fitNotes ?? []).filter((n) => n.by === who).map((n) => ({ p, n })));

  return (
    <Screen>
      <TopBar
        back="Looks"
        backTo="/looks"
        right={
          <button
            type="button"
            className={`chip ${following ? 'chip-ghost' : 'chip-lilac'}`}
            aria-pressed={following}
            onClick={() => s.follow(who)}
          >
            {following ? (
              <>
                Following <Icon name="check" size={13} />
              </>
            ) : (
              '+ Follow'
            )}
          </button>
        }
      />
      <Body>
        <div className="row" style={{ gap: 14 }}>
          <Avatar initial={u.initial} i={userIndex(who)} size="lg" />
          <div className="col" style={{ gap: 4 }}>
            <h1 className="display" style={{ fontSize: 24 }}>
              {u.name}
            </h1>
            <span className="sub">
              @{u.handle} · {u.city} · {u.tier} tier
            </span>
            {u.curator && (
              <span>
                <Chip tone="lilac">Encore Curator</Chip>
              </span>
            )}
          </div>
        </div>
        <div className="grid3">
          <Stat bare n={num((u.followers ?? 0) + (following ? 1 : 0))} l="followers" />
          <Stat bare n={u.garmentsBack ?? 0} l="garments back" />
          <Stat bare n={u.heartsThisWeek ?? 0} l="hearts this week" />
        </div>
        <div className="row wrap">
          {u.aesthetics?.map((a) => (
            <Chip key={a} tone="ghost">
              {a}
            </Chip>
          ))}
          {u.fit && <Chip tone="ghost">{u.fit}</Chip>}
        </div>

        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'closet'} onClick={() => setTab('closet')}>
            Her closet
          </button>
          <button type="button" role="tab" aria-selected={tab === 'looks'} onClick={() => setTab('looks')}>
            Looks · {u.looksCount}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'notes'} onClick={() => setTab('notes')}>
            Fit notes · {u.fitNotesCount}
          </button>
        </div>

        {tab === 'closet' && (
          <div className="grid2">
            {items.map((it) => {
              const inner = (
                <>
                  <GarmentTile g={garment(it.garment)} />
                  <span className="meta">
                    <b style={{ fontSize: 13 }}>{it.label}</b>
                    <span className={it.preOwned ? 'lilac' : 'lime'} style={{ fontSize: 12, fontWeight: 600 }}>
                      {it.status}
                    </span>
                  </span>
                </>
              );
              return it.piece ? (
                <Link key={it.label} className="look" to={`/piece/${it.piece}`}>
                  {inner}
                </Link>
              ) : (
                <button
                  key={it.label}
                  type="button"
                  className="look"
                  style={{ textAlign: 'left' }}
                  onClick={() => s.say('This opens Zara Pre-Owned. Encore only shows the listing.')}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        )}
        {tab === 'looks' && (
          <>
            <div className="grid2">
              {herLooks.map((l) => (
                <LookCard key={l.id} look={l} />
              ))}
            </div>
            <p className="sub">Showing her latest. The other {(u.looksCount ?? 1) - herLooks.length} are not in this demo.</p>
          </>
        )}
        {tab === 'notes' && (
          <div className="col">
            {herNotes.map(({ p, n }) => (
              <div key={p.id} className="card row" style={{ gap: 12 }}>
                <GarmentTile g={garment(p.garment)} size="sm" />
                <div>
                  <b>
                    {garment(p.garment).name} · {n.size}
                  </b>
                  <p className="sub">“{n.text}”</p>
                </div>
              </div>
            ))}
            {s.askedFit.includes(who) && (
              <div className="card note">
                <Icon name="ruler" size={18} />
                <p>Your question is with {first}. Her answer will be added here as a fit note.</p>
              </div>
            )}
          </div>
        )}

        <div className="card note">
          <Icon name="star" size={18} />
          <p>
            <span className="b">How she earns.</span> Sells from her closet on Zara Pre-Owned (+
            {seed.rules.points.preOwnedSale} points a sale), styles looks people heart, and every piece she brings back
            earns a key. Never from spending.
          </p>
        </div>
      </Body>
      <Actions row>
        <Btn tone="ghost" onClick={() => setAsking(true)}>
          Ask about fit
        </Btn>
        <Btn tone="lilac" to={items[0]?.piece ? `/piece/${items[0].piece}` : '/drop-home'}>
          Shop her edit · {items.length}
        </Btn>
      </Actions>

      {asking && (
        <BottomSheet label={`Ask ${first} about fit`} onClose={() => setAsking(false)}>
          <h2>Ask {first} about fit</h2>
          <p className="sub">
            One structured question about her {garment(items[0].garment).short}. Her answer becomes a fit note that
            everyone with your kept size can read.
          </p>
          <div className="col" role="radiogroup" aria-label="Your question">
            {QUESTIONS.map((x) => (
              <button key={x} type="button" role="radio" className="opt" style={{ minHeight: 48 }} aria-checked={q === x} onClick={() => setQ(x)}>
                {x}
              </button>
            ))}
          </div>
          <Btn
            tone="lilac"
            onClick={() => {
              s.askFit(who);
              setAsking(false);
              setTab('notes');
              s.say(`Sent to ${first}: “${q}”`);
            }}
          >
            Send question
          </Btn>
        </BottomSheet>
      )}
    </Screen>
  );
}

const short = (n: number) => `${n / 1000}k`;

/** 3.5 · City goal */
export function CityGoal() {
  const s = useStore();
  const goal = selGoal(s);
  const p = cityGoalProgress(goal);

  return (
    <Screen>
      <TopBar back="Looks" backTo="/looks" right={<Chip tone="ghost">{goal.season} season</Chip>} />
      <Body>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="title xl">{goal.city}’s goal</h1>
          <p className="sub">
            Every garment anyone in {goal.city} brings back counts. Each milestone unlocks something Zara does for the
            city.
          </p>
        </div>
        <div className="goalcard">
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <span className="big" aria-live="polite">
              {num(goal.current)}
            </span>
            <b>of {num(goal.target)}</b>
          </div>
          <b style={{ fontSize: 13 }}>
            garments back this season · {goal.mine} of them yours
          </b>
          <Progress value={p.ratio} tone="ink" />
        </div>

        <div className="col">
          {p.milestones.map((m) => {
            const next = m === p.next;
            return (
              <div key={m.at} className={`ms${next ? ' next' : ''}`}>
                {m.reached ? (
                  <Chip tone="lime">
                    {short(m.at)} <Icon name="check" size={13} />
                  </Chip>
                ) : (
                  <Chip tone={next ? 'ink' : 'ghost'}>
                    {short(m.at)}
                    {next ? ' next' : ''}
                  </Chip>
                )}
                <span>{m.reward}</span>
              </div>
            );
          })}
        </div>
        {p.next && (
          <p className="sub">
            {num(p.toNext)} garments to the {short(p.next.at)} milestone.
          </p>
        )}

        <span className="label">City race · share of goal</span>
        <div className="col" style={{ gap: 4 }}>
          {goal.race.map((r) => {
            const share = r.city === goal.city ? p.ratio : r.share;
            return (
              <div key={r.city} className="race">
                <span className={r.city === goal.city ? 'b' : ''}>{r.city}</span>
                <Progress value={share} tone={r.city === goal.city ? undefined : 'lilac'} />
                <span>{Math.floor(share * 100)}%</span>
              </div>
            );
          })}
        </div>
        <p className="sub" style={{ fontSize: 12 }}>
          Figures are illustrative. Rewards are stated as actions with numbers, never as offsets or “carbon neutral”.
        </p>
      </Body>
      <Actions>
        <Btn to="/scan">Bring a piece back · +1 for {goal.city}</Btn>
      </Actions>
    </Screen>
  );
}

