import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BottomSheet, Btn, Icon, Logo, Switch, Toast } from './components/ui';
import { CHAPTERS, JUDGE_STEPS, screenFor } from './guide';
import { selKeys, useStore } from './store';
import { Main, Onboarding } from './screens/Start';
import { Confirm, Drop, KeyLanding, LotTracker, Scan } from './screens/BringBack';
import { DeckDone, FitNote, Swipe } from './screens/Swipe';
import { Battle, CityGoal, Closet, Looks, PostLook } from './screens/Community';
import { League, Pass, Tiers, Wrapped } from './screens/League';
import { DropHome, DropLive, Piece, YoureIn } from './screens/Drops';
import { Keys, Profile } from './screens/Account';

const NOTICE = 'Design concept · not affiliated with Zara or Inditex';

function useJudge() {
  const s = useStore();
  const current = JUDGE_STEPS.findIndex((step) => !step.done(s));
  return { s, current, finished: current === -1 };
}

/** The story checklist. Each step is ticked from real state, not from visiting a screen. */
function JudgeSteps({ onGo }: { onGo?: () => void }) {
  const { s, current } = useJudge();
  const nav = useNavigate();
  return (
    <div className="col" style={{ gap: 2 }}>
      {JUDGE_STEPS.map((step, i) => {
        const done = step.done(s);
        return (
          <button
            key={step.title}
            type="button"
            className={`jstep${done ? ' done' : ''}${i === current ? ' cur' : ''}`}
            onClick={() => {
              nav(step.to);
              onGo?.();
            }}
          >
            <span className="n">{done ? <Icon name="check" size={13} /> : i + 1}</span>
            <span>
              {step.title}
              <small>{step.hint}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ResetButton({ onDone }: { onDone?: () => void }) {
  const reset = useStore((s) => s.reset);
  const nav = useNavigate();
  return (
    <Btn
      tone="ghost"
      sm
      onClick={() => {
        reset();
        nav('/onboarding');
        onDone?.();
      }}
    >
      Reset demo
    </Btn>
  );
}

/** Thin bar inside the phone that walks the demo story. */
function Coach() {
  const { s, current, finished } = useJudge();
  const { pathname } = useLocation();
  const nav = useNavigate();
  if (finished) {
    return (
      <div className="coach" role="status">
        <span>
          Story complete
          <small>{selKeys(s)} keys left, 0 points from buying</small>
        </span>
        <button
          type="button"
          onClick={() => {
            s.reset();
            nav('/onboarding');
          }}
        >
          Run again
        </button>
      </div>
    );
  }
  const step = JUDGE_STEPS[current];
  return (
    <div className="coach" role="status">
      <span>
        {current + 1}/{JUDGE_STEPS.length} · {step.title}
        <small>{step.hint}</small>
      </span>
      {pathname !== step.to && <Link to={step.to}>Go</Link>}
    </div>
  );
}

function StepList({ onGo }: { onGo?: () => void }) {
  const { pathname } = useLocation();
  const here = screenFor(pathname);
  return (
    <nav aria-label="All screens" className="col" style={{ gap: 4 }}>
      {CHAPTERS.map((c) => (
        <div key={c.n} className="chapter">
          <span>
            {c.n} · {c.name}
          </span>
          {c.screens.map((sc) => (
            <Link
              key={sc.path}
              to={sc.path}
              className={`steplink${here.path === sc.path ? ' on' : ''}`}
              aria-current={here.path === sc.path ? 'page' : undefined}
              onClick={onGo}
            >
              <small>{sc.step}</small>
              {sc.title}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function JudgePanel({ onGo }: { onGo?: () => void }) {
  const judge = useStore((s) => s.judge);
  const setJudge = useStore((s) => s.setJudge);
  return (
    <div className="panel">
      <div className="setrow" style={{ minHeight: 0 }}>
        <div className="grow">
          <h3>Judge mode</h3>
          <p style={{ fontSize: 12.5 }}>The whole story in seven moves, under three minutes.</p>
        </div>
        <Switch on={judge} onChange={() => setJudge(!judge)} label="Judge mode" />
      </div>
      {judge && <JudgeSteps onGo={onGo} />}
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const onboarded = useStore((s) => s.onboarded);
  const judge = useStore((s) => s.judge);
  const [menu, setMenu] = useState(false);
  const here = screenFor(pathname);
  const close = () => setMenu(false);

  return (
    <div className="stage">
      <aside className="side" aria-label="Screens">
        <Logo />
        <p style={{ fontSize: 13 }}>Your old Zara gets you into the new drop. A clickable design concept.</p>
        <StepList />
      </aside>

      <div className="phone">
        <div className="concept">
          <span>{NOTICE}</span>
          <button type="button" className={`demo-btn${judge ? ' on' : ''}`} onClick={() => setMenu(true)} aria-haspopup="dialog">
            Demo
          </button>
        </div>
        {judge && <Coach />}

        <Routes>
          <Route path="/" element={<Navigate to={onboarded ? '/main' : '/onboarding'} replace />} />
          <Route path="/main" element={<Main />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/drop" element={<Drop />} />
          <Route path="/key-landing" element={<KeyLanding />} />
          <Route path="/lot-tracker/:id?" element={<LotTracker />} />
          <Route path="/swipe" element={<Swipe />} />
          <Route path="/fit-note/:id?" element={<FitNote />} />
          <Route path="/deck-done" element={<DeckDone />} />
          <Route path="/looks" element={<Looks />} />
          <Route path="/post-look" element={<PostLook />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/closet/:id?" element={<Closet />} />
          <Route path="/city-goal" element={<CityGoal />} />
          <Route path="/league" element={<League />} />
          <Route path="/pass" element={<Pass />} />
          <Route path="/wrapped" element={<Wrapped />} />
          <Route path="/tiers" element={<Tiers />} />
          <Route path="/drop-home" element={<DropHome />} />
          <Route path="/drop-live" element={<DropLive />} />
          <Route path="/piece/:id?" element={<Piece />} />
          <Route path="/youre-in" element={<YoureIn />} />
          <Route path="/keys" element={<Keys />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toast />

        {menu && (
          <BottomSheet label="Demo controls" onClose={close}>
            <h2>Demo controls</h2>
            <JudgePanel onGo={close} />
            <ResetButton onDone={close} />
            <StepList onGo={close} />
            <p className="fine">
              Encore is a student design concept. Not affiliated with or endorsed by Zara or Inditex. Camera, bin,
              payment and notifications are simulated.
            </p>
          </BottomSheet>
        )}
      </div>

      <aside className="side right" aria-label="About this screen">
        <span className="eyebrow">
          Step {here.step} · {here.chapter.name}
        </span>
        <h2>{here.title}</h2>
        <p>{here.guide}</p>
        <JudgePanel />
        <div className="panel">
          <h3>Demo state</h3>
          <p style={{ fontSize: 12.5 }}>
            Keys, points and ranks are live and saved in this browser. Camera, bin, payment and notifications are
            simulated.
          </p>
          <ResetButton />
        </div>
        <p style={{ fontSize: 12 }}>
          Student design concept for the BIC × Zara case competition. Not affiliated with or endorsed by Zara or
          Inditex. All people, numbers and lots are illustrative.
        </p>
      </aside>
    </div>
  );
}
