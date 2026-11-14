import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Garment, Lot, TierId } from '../types';
import { TIER_ORDER, tierIndex } from '../rules';
import { keysLabel } from '../format';
import { selKeys, useStore } from '../store';

/* ---------- Icons: simple stroke SVGs, never emoji ---------- */

const PATHS: Record<string, ReactNode> = {
  key: (
    <>
      <circle cx="7.5" cy="12" r="4.2" />
      <path d="M11.7 12H21M17 12v3.4M20 12v2.4" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5c1-4 4-6 7.5-6s6.500 2 7.500 6" />
    </>
  ),
  bin: (
    <>
      <path d="M5 7h14l-1.200 13H6.200z" />
      <path d="M3.500 7h17M9 7V4.500h6V7M10 11v6M14 11v6" />
    </>
  ),
  cards: (
    <>
      <rect x="4" y="5" width="12" height="15" rx="2" />
      <path d="M8 3.500h10a2 2 0 012 2V17M7.500 12.500l2 2 3.500-4" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3.500L9 5.500h6L16.500 8H20v11H4z" />
      <circle cx="12" cy="13" r="3.400" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0z" />
      <path d="M8 6H5c0 3 1.500 4.500 3.500 4.500M16 6h3c0 3-1.500 4.500-3.500 4.500M12 13v4M8.500 20h7M9.500 17h5" />
    </>
  ),
  check: <path d="M5 12.500l4.500 4.500L19 7.500" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  heart: <path d="M12 20s-7-4.400-7-9.600A3.900 3.900 0 0112 8a3.900 3.900 0 017 2.400C19 15.600 12 20 12 20z" />,
  shield: (
    <>
      <path d="M12 3.500l7 2.500v5.500c0 4.500-3 7.500-7 9-4-1.500-7-4.500-7-9V6z" />
      <path d="M9 12l2.200 2.200L15.200 10" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 10.500h16M8.500 3.500v4M15.500 3.500v4" />
    </>
  ),
  bolt: <path d="M13 3L5.500 13.500H11L10 21l8-11h-5.500z" />,
  up: <path d="M12 19V6M6.500 11.500L12 6l5.500 5.500" />,
  play: <path d="M7 5l12 7-12 7z" />,
  back: <path d="M14.500 5.500L8 12l6.500 6.500" />,
  share: (
    <>
      <path d="M12 15V4M7.500 8L12 3.500 16.500 8" />
      <path d="M5 13v6.500h14V13" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  ruler: (
    <>
      <rect x="3" y="8.500" width="18" height="7" rx="1.500" />
      <path d="M7 8.500v3M11 8.500v4M15 8.500v3M19 8.500v0" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.500-6 6.500-11a6.500 6.500 0 00-13 0c0 5 6.500 11 6.500 11z" />
      <circle cx="12" cy="10" r="2.300" />
    </>
  ),
  star: <path d="M12 3.500l2.600 5.400 5.900.800-4.300 4.100 1 5.800L12 16.900 6.800 19.600l1-5.800L3.500 9.700l5.900-.800z" />,
  wrench: <path d="M14.500 6.500a4 4 0 005 5L10 21l-3-3 9.500-9.500a4 4 0 00-2-2z" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, fill }: { name: IconName; size?: number; fill?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ---------- Layout ---------- */

export function Screen({
  tone = 'ink',
  children,
  className = '',
}: {
  tone?: 'ink' | 'paper';
  children: ReactNode;
  className?: string;
}) {
  return <div className={`screen ${tone} ${className}`}>{children}</div>;
}

export function TopBar({
  back,
  backTo,
  left,
  right,
}: {
  back?: string;
  backTo?: string;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="topbar">
      {back && backTo ? (
        <Link className="back" to={backTo}>
          <Icon name="back" size={16} />
          {back}
        </Link>
      ) : (
        (left ?? <span />)
      )}
      {right ?? <span />}
    </header>
  );
}

export const Body = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <main className="body" style={style}>
    {children}
  </main>
);

export const Actions = ({ children, row }: { children: ReactNode; row?: boolean }) => (
  <footer className={`actions${row ? ' row' : ''}`}>{children}</footer>
);

export const Logo = () => (
  <span className="logo">
    Encore<i>.</i>
  </span>
);

/* ---------- Small pieces ---------- */

type Tone = 'lime' | 'lilac' | 'gold' | 'teal' | 'coral' | 'ghost' | 'ink';

export const Chip = ({ tone, children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`chip${tone ? ` chip-${tone}` : ''}`}>{children}</span>
);

/** Gold pill with the live key balance. Always links to the wallet. */
export function KeyCounter({ short }: { short?: boolean }) {
  const keys = useStore(selKeys);
  return (
    <Link className="keys" to="/keys" aria-label={`${keysLabel(keys)}. Open the keys wallet`}>
      <Icon name="key" size={18} />
      {short ? keys : keysLabel(keys)}
    </Link>
  );
}

export function Btn({
  to,
  tone = 'lime',
  sm,
  children,
  onClick,
  disabled,
}: {
  to?: string;
  tone?: 'lime' | 'ink' | 'ghost' | 'lilac' | 'gold';
  sm?: boolean;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls = `btn btn-${tone}${sm ? ' btn-sm' : ''}`;
  if (to && !disabled) {
    return (
      <Link className={cls} to={to} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export const Progress = ({ value, tone }: { value: number; tone?: 'ink' | 'lilac' }) => (
  <div
    className={`progress${tone ? ` ${tone}` : ''}`}
    role="progressbar"
    aria-valuenow={Math.round(value * 100)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
  </div>
);

const src = (image: string) => (/^(https?:)?\/\//.test(image) ? image : import.meta.env.BASE_URL + image);

/** A garment image on its tinted tile. Swap garment.image for a real photo with no layout change. */
export function GarmentTile({
  g,
  size,
  tall,
  children,
}: {
  g: Garment;
  size?: 'sm' | 'md';
  tall?: boolean;
  children?: ReactNode;
  /** Kept for callers; every garment now sits on the same neutral tile. */
  dark?: boolean;
}) {
  return (
    <div
      className={`garment${size ? ` ${size}` : ''}${tall ? ' tall' : ''}`}
    >
      <img src={src(g.image)} alt={g.name} loading="lazy" />
      {children}
    </div>
  );
}

export const garmentSrc = (g: Garment) => src(g.image);

export const Stat = ({ n, l, tone, bare }: { n: ReactNode; l: string; tone?: 'lime' | 'gold' | 'lilac'; bare?: boolean }) => (
  <div className={`stat${bare ? ' bare' : ''}`}>
    <div className={`n${tone ? ` ${tone}` : ''}`}>{n}</div>
    <div className="l">{l}</div>
  </div>
);

export const Avatar = ({ initial, size }: { initial: string; i?: number; size?: 'lg' | 'xs' }) => (
  <span className={`avatar${size ? ` ${size}` : ''}`} aria-hidden="true">
    {initial}
  </span>
);

export const Badge = ({ on, icon, children }: { on: boolean; icon: IconName; children: ReactNode }) => (
  <div className={`badge${on ? ' on' : ''}`}>
    <i>
      <Icon name={icon} size={22} />
    </i>
    <span>
      {children}
      {!on && <span className="sr"> (not earned yet)</span>}
    </span>
  </div>
);

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="switch" onClick={onChange} />;
}

/** Five equal segments. Every segment links to the tiers screen. */
export function TierTrack({ tier }: { tier: TierId }) {
  return (
    <Link className="tiers" to="/tiers" aria-label={`Your tier is ${tier}. See what every tier unlocks`}>
      {TIER_ORDER.map((t) => (
        <span key={t} className={`tier${t === tier ? ' now' : tierIndex(t) < tierIndex(tier) ? ' done' : ''}`}>
          {t}
        </span>
      ))}
    </Link>
  );
}

const DESTINATION: Record<string, string> = { vintage_lane: 'Vintage lane', recut: 'Re-cut edition', fiber: 'Fiber' };

/** Compact Collected → Graded → destination line for the home card. */
export function LotTimeline({ lot }: { lot: Lot }) {
  const graded = lot.status.includes('graded');
  const dest = lot.status.find((s) => DESTINATION[s]);
  return (
    <div className="lotline">
      <div className="node">
        <span className="dot done" />
        Collected
      </div>
      <span className={`seg${graded ? ' done' : ''}`} />
      <div className="node">
        <span className={`dot${graded ? ' done' : ''}`} />
        Graded
      </div>
      <span className={`seg${dest ? ' done' : ''}`} />
      <div className="node">
        <span className={`dot${dest ? ' done' : ''}`} />
        {dest ? DESTINATION[dest] : 'Destination'}
      </div>
    </div>
  );
}

export function BottomSheet({ children, onClose, label }: { children: ReactNode; onClose?: () => void; label: string }) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <span className="handle" />
        {children}
      </div>
    </div>
  );
}

export const Note = ({ icon = 'shield', children }: { icon?: IconName; children: ReactNode }) => (
  <div className="card note">
    <Icon name={icon} size={18} />
    <p>{children}</p>
  </div>
);

const TABS: { icon: IconName; label: string }[] = [
  { icon: 'home', label: 'Home' },
  { icon: 'search', label: 'Search' },
  { icon: 'key', label: 'Encore' },
  { icon: 'bag', label: 'Bag' },
  { icon: 'user', label: 'Me' },
];

/** The host app's tab bar. Only the Encore tab belongs to this concept. */
export function TabBar() {
  const say = useStore((s) => s.say);
  const nav = useNavigate();
  return (
    <nav className="tabbar" aria-label="App tabs">
      {TABS.map((t) =>
        t.label === 'Encore' ? (
          <button key={t.label} type="button" className="tab on" aria-current="page" onClick={() => nav('/main')}>
            <Icon name={t.icon} />
            {t.label}
          </button>
        ) : (
          <button
            key={t.label}
            type="button"
            className="tab"
            onClick={() => say(`${t.label} belongs to the host app. This concept is the Encore tab.`)}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ),
      )}
    </nav>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  const clear = useStore((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2600);
    return () => clearTimeout(t);
  }, [toast, clear]);
  return (
    <div aria-live="polite">
      {toast && (
        <div key={toast.id} className="toast" role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

const CONFETTI = ['#D4FF3F', '#F5C542', '#C9B8FF', '#2CD4BD', '#F4F1EA'];
export const Confetti = () => (
  <div className="confetti" aria-hidden="true">
    {Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2;
      const r = 110 + (i % 5) * 26;
      return (
        <i
          key={i}
          style={
            {
              background: CONFETTI[i % CONFETTI.length],
              '--x': `${Math.cos(angle) * r}px`,
              '--y': `${Math.sin(angle) * r - 40}px`,
              animationDelay: `${(i % 6) * 0.04}s`,
            } as CSSProperties
          }
        />
      );
    })}
  </div>
);
