import { Link, useNavigate } from 'react-router-dom';
import { Actions, Avatar, Badge, Body, Btn, Chip, GarmentTile, Icon, KeyCounter, Progress, Screen, Stat, Switch, TopBar, type IconName } from '../components/ui';
import { ME, garment, me, seed } from '../seed';
import { dayMonth, euro, kg, monthYear } from '../format';
import {
  selBadges,
  selDropsEntered,
  selGarmentsBack,
  selKeys,
  selKeysEarned,
  selKg,
  selLotsFollowed,
  selMonthEarned,
  useStore,
} from '../store';
import type { KeyEntry, Settings } from '../types';

const LANE_LABEL = { vintage: 'vintage lane', recut: 're-cut edition', first_access: 'first access · 24 h early' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 6.1 · Keys wallet */
export function Keys() {
  const s = useStore();
  const cap = seed.rules.monthlyKeyCap;
  const month = selMonthEarned(s);
  const history = s.ledger.filter((e) => e.user === ME).slice().reverse();

  const detail = (e: KeyEntry) => {
    const lot = s.lots.find((l) => l.id === e.lot);
    if (e.reason === 'return' && lot) {
      return `${lot.droppedAt.replace('Zara ', '').split(',')[0]} · lot ${lot.id} · ${lot.grade ? `graded ${lot.grade}` : 'grade pending'}`;
    }
    if (e.reason === 'grade_bonus') return `lot ${e.lot} · second key for grade A`;
    if (e.reason === 'tier_bonus') return 'tier bonus';
    return `Archive Drop · ${e.lane ? LANE_LABEL[e.lane] : ''}`;
  };
  const garmentOf = (e: KeyEntry) => {
    const lot = s.lots.find((l) => l.id === e.lot);
    return garment(lot?.garment ?? e.garment ?? 'g_skirt');
  };

  return (
    <Screen>
      <TopBar back="Encore" backTo="/main" right={<Chip tone="ghost">cap · {cap} keys a month</Chip>} />
      <Body>
        <div className="wallet">
          <div className="row between">
            <Chip tone="ink">ARCHIVE KEYS</Chip>
            <b style={{ fontSize: 12.5 }}>
              {me().name} · {s.city}
            </b>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <Icon name="key" size={44} />
            <span className="bal" aria-live="polite">
              {selKeys(s)}
            </span>
          </div>
          <b style={{ fontSize: 13 }}>
            keys · {selKeysEarned(s)} earned this season · {selDropsEntered(s)} {selDropsEntered(s) === 1 ? "drop" : "drops"} entered
          </b>
          <div className="row wrap">
            <Chip tone="ink">never expire</Chip>
            <Chip tone="ink">no cash value</Chip>
            <Chip tone="ink">cannot be bought</Chip>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <Progress value={month / cap} tone="ink" />
            <span style={{ fontSize: 12, fontWeight: 700 }}>
              {month} of {cap} earned in {MONTHS[Number(s.now.slice(5, 7)) - 1]}
            </span>
          </div>
        </div>

        <span className="label">History</span>
        <div className="col" style={{ gap: 2 }}>
          {history.map((e, i) => (
            <div key={`${e.date}-${e.lot ?? e.lane}-${i}`} className="hist">
              <GarmentTile g={garmentOf(e)} size="sm" />
              <div className="grow">
                <b>{e.note}</b>
                <p>
                  {dayMonth(e.date)} · {detail(e)}
                </p>
              </div>
              <span className={`delta${e.delta > 0 ? ' plus' : ''}`}>
                {e.delta > 0 ? `+${e.delta}` : `−${Math.abs(e.delta)}`}
              </span>
            </div>
          ))}
        </div>

        <div className="card note">
          <Icon name="shield" size={18} />
          <p>
            Keys are status, not money. They open drops; they never discount anything.{' '}
            {month >= cap ? 'You have reached this month’s cap.' : `${cap - month} more this month before the cap.`}
          </p>
        </div>
      </Body>
      <Actions row>
        <Btn tone="gold" to="/scan">
          Earn one
        </Btn>
        <Btn tone="ghost" to="/profile">
          Profile
        </Btn>
      </Actions>
    </Screen>
  );
}

const BADGES: { id: string; label: string; icon: IconName }[] = [
  { id: 'first_return', label: 'First Return', icon: 'bin' },
  { id: 'fit_guru', label: 'Fit Guru', icon: 'ruler' },
  { id: 'lot_follower', label: 'Lot Follower', icon: 'pin' },
  { id: 'battle_winner', label: 'Battle Winner', icon: 'trophy' },
  { id: 'archive_insider', label: 'Archive Insider', icon: 'star' },
];

const SWITCHES: { key: keyof Settings; label: string; sub: string }[] = [
  { key: 'leaderboards', label: 'City leaderboards', sub: 'Hides your rank and league. Keys and badges stay. Switching on confirms you are 16 or over.' },
  { key: 'photos', label: 'Photos in feed', sub: 'Off by default. Your looks only show while this is on.' },
  { key: 'dropReminder', label: 'Drop notifications', sub: 'One reminder per drop, 15 minutes before. Never more.' },
];

/** 6.2 · Profile and badges */
export function Profile() {
  const s = useStore();
  const nav = useNavigate();
  const u = me();
  const badges = selBadges(s);

  return (
    <Screen>
      <TopBar back="Encore" backTo="/main" right={<KeyCounter />} />
      <Body>
        <div className="row" style={{ gap: 14 }}>
          <Avatar initial={u.initial} i={4} size="lg" />
          <div className="col" style={{ gap: 3 }}>
            <h1 className="display" style={{ fontSize: 26 }}>
              {u.name}
            </h1>
            <span className="sub">
              @{u.handle} · {s.city} · {s.tier} tier
            </span>
            <span className="sub">in Encore since {monthYear(u.since ?? '2026-09')}</span>
          </div>
        </div>
        <div className="grid3">
          <Stat n={selGarmentsBack(s)} l="garments back" tone="lime" />
          <Stat n={kg(selKg(s))} l="kg given a second life" />
          <Stat n={selLotsFollowed(s)} l="lots followed" />
        </div>

        <span className="label">Badges · for actions only</span>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          {BADGES.map((b) => (
            <Badge key={b.id} on={badges.includes(b.id)} icon={b.icon}>
              {b.label}
            </Badge>
          ))}
        </div>

        <span className="label">Certificates</span>
        {s.certificates.length === 0 ? (
          <p className="sub">Pieces you buy in a drop show up here, each with its number and grade.</p>
        ) : (
          <div className="col">
            {s.certificates.map((c) => (
              <Link key={c.piece} className="card tap row" style={{ gap: 12 }} to={`/piece/${c.piece}`}>
                <GarmentTile g={garment(c.garment)} size="sm" />
                <div className="grow">
                  <b>{garment(c.garment).name}</b>
                  <p className="sub" style={{ fontSize: 12 }}>
                    {c.number}
                    {c.grade ? ` · graded ${c.grade}` : ''} · {dayMonth(c.date)} · {euro(c.paid)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <span className="label">One-tap switches</span>
        <div className="card col" style={{ gap: 2 }}>
          {SWITCHES.map((w) => (
            <div key={w.key} className="setrow">
              <div className="grow">
                <b>{w.label}</b>
                <p>{w.sub}</p>
              </div>
              <Switch on={s.settings[w.key]} onChange={() => s.toggleSetting(w.key)} label={w.label} />
            </div>
          ))}
        </div>

        <p className="sub" style={{ fontSize: 12 }}>
          Encore is a student design concept for the BIC × Zara case competition by Victor Hsu, Juliet Dong, Sophie Hsu
          and Kaitlyn Lavichant. Not affiliated with or endorsed by Zara or Inditex. All people, numbers and lots are
          illustrative.
        </p>
      </Body>
      <Actions row>
        <Btn tone="ghost" to="/keys">
          Keys wallet
        </Btn>
        <Btn
          tone="ghost"
          onClick={() => {
            s.reset();
            nav('/onboarding');
          }}
        >
          Reset demo
        </Btn>
      </Actions>
    </Screen>
  );
}
