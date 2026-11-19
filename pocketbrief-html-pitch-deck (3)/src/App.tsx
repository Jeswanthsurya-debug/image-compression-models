import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ExplainSheet } from "./components/ExplainSheet";
import { activeTransport, type Snap } from "./components/anim/core";
import { DeckActionsContext, pad2, TOTAL } from "./components/ui";
import { EXPLANATIONS } from "./explain";
import { SLIDES } from "./slides";

const Chevron = ({ dir }: { dir: 1 | -1 }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: dir === -1 ? "rotate(180deg)" : undefined }}
    aria-hidden
  >
    <path d="M6 3.2 10.8 8 6 12.8" />
  </svg>
);

/* scattered pixel squares for the deep parallax layer */
const PIXELS = [
  { l: "8%", t: "18%", s: 34, d: "0s" },
  { l: "16%", t: "70%", s: 22, d: "1.4s" },
  { l: "30%", t: "12%", s: 16, d: "0.7s" },
  { l: "55%", t: "8%", s: 26, d: "2.1s" },
  { l: "72%", t: "22%", s: 18, d: "0.4s" },
  { l: "88%", t: "14%", s: 30, d: "1.8s" },
  { l: "92%", t: "64%", s: 24, d: "0.9s" },
  { l: "64%", t: "84%", s: 20, d: "2.6s" },
  { l: "40%", t: "88%", s: 16, d: "1.1s" },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [speakerMode, setSpeakerMode] = useState(true);
  const [explainOpen, setExplainOpen] = useState(false);
  const [transport, setTransport] = useState<Snap | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [railDim, setRailDim] = useState(true);
  const [railTouch, setRailTouch] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const slideOpenedAt = useRef(Date.now());
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const go = useCallback((step: number) => {
    setDir(step >= 0 ? 1 : -1);
    setTransport(null);
    setExplainOpen(false);
    setRailOpen(false);
    setRailDim(true);
    setIndex((i) => (i + step + TOTAL) % TOTAL);
  }, []);

  const jump = useCallback((next: number) => {
    setDir(next >= indexRef.current ? 1 : -1);
    setTransport(null);
    setExplainOpen(false);
    setRailOpen(false);
    setRailDim(true);
    setIndex(next);
  }, []);

  /* keyboard: Space + ←/→ → step player · PageUp/Down → deck */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (explainOpen) {
        if (k === "Escape") setExplainOpen(false);
        return;
      }
      const tr = activeTransport();

      if (k === " " || k === "Spacebar") {
        e.preventDefault();
        if (tr) tr.toggle();
        else go(1);
        return;
      }
      if (k === "ArrowRight" || k === "ArrowLeft") {
        if (tr) {
          e.preventDefault();
          if (k === "ArrowRight") tr.next();
          else tr.prev();
          return;
        }
        e.preventDefault();
        go(k === "ArrowRight" ? 1 : -1);
        return;
      }
      if (k === "PageDown" || k === "ArrowDown") {
        e.preventDefault();
        go(1);
      } else if (k === "PageUp" || k === "ArrowUp") {
        e.preventDefault();
        go(-1);
      } else if (k === "Home") {
        jump(0);
      } else if (k === "End") {
        jump(TOTAL - 1);
      } else if (k.toLowerCase() === "r" && tr) {
        tr.replay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [explainOpen, go, jump]);

  /* the explain clock belongs to the current slide visit */
  useEffect(() => {
    slideOpenedAt.current = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - slideOpenedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [index]);

  useEffect(() => {
    const onStatus = (event: Event) => {
      setTransport((event as CustomEvent<Snap>).detail);
    };
    window.addEventListener("transport:status", onStatus);
    const id = window.setTimeout(() => {
      const tr = activeTransport();
      if (tr) setTransport(tr);
    }, 0);
    return () => {
      window.removeEventListener("transport:status", onStatus);
      window.clearTimeout(id);
    };
  }, [index]);

  useEffect(() => {
    if (!speakerMode) setExplainOpen(false);
  }, [speakerMode]);

  useEffect(() => {
    if (!railOpen) return;
    setRailDim(false);
    const fade = window.setTimeout(() => setRailDim(true), 1200);
    const collapse = window.setTimeout(() => {
      setRailOpen(false);
      setRailDim(true);
    }, 3000);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(collapse);
    };
  }, [railOpen, railTouch]);

  const touchRail = () => {
    setRailDim(false);
    setRailTouch((v) => v + 1);
  };

  const toggleRail = () => {
    if (railOpen) {
      setRailOpen(false);
      setRailDim(true);
    } else {
      setRailDim(false);
      setRailOpen(true);
    }
    setRailTouch((v) => v + 1);
  };

  const toggleMode = () => {
    setSpeakerMode((v) => !v);
    setRailOpen(false);
    setRailDim(true);
  };

  const openExplain = () => {
    setRailOpen(false);
    setRailDim(true);
    setExplainOpen(true);
  };

  /* layered parallax — pointer-driven, rAF-lerped, zero re-renders */
  const l1 = useRef<HTMLDivElement>(null);
  const l2 = useRef<HTMLDivElement>(null);
  const l3 = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) return;
    let raf = 0;
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      tgt.x = e.clientX / window.innerWidth - 0.5;
      tgt.y = e.clientY / window.innerHeight - 0.5;
    };
    const loop = () => {
      cur.x += (tgt.x - cur.x) * 0.045;
      cur.y += (tgt.y - cur.y) * 0.045;
      if (l1.current)
        l1.current.style.transform = `translate3d(${cur.x * -14}px, ${cur.y * -10}px, 0)`;
      if (l2.current)
        l2.current.style.transform = `translate3d(${cur.x * -30}px, ${cur.y * -22}px, 0)`;
      if (l3.current)
        l3.current.style.transform = `translate3d(${cur.x * -52}px, ${cur.y * -38}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  /* swipe */
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: ReactTouchEvent) => {
    const target = e.target;
    if (
      target instanceof Element &&
      target.closest("button,input,[role='slider'],.explain-sheet,[data-no-swipe]")
    ) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.25) go(dx < 0 ? 1 : -1);
  };

  const currentExplanation = EXPLANATIONS[index];

  const Active = SLIDES[index].Component;

  return (
    <div
      className="grain relative h-[100dvh] w-full select-none overflow-hidden bg-void text-chalk"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ---------- parallax field ---------- */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div ref={l1} className="absolute -inset-[12%] will-change-transform">
          <div
            className="drift-a absolute -left-[16%] -top-[26%] h-[64vw] w-[64vw] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(91,99,240,0.17), rgba(91,99,240,0) 62%)",
            }}
          />
          <div
            className="drift-b absolute -bottom-[30%] -right-[18%] h-[58vw] w-[58vw] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(70,140,255,0.12), rgba(70,140,255,0) 64%)",
            }}
          />
        </div>

        <div ref={l2} className="absolute -inset-[12%] will-change-transform">
          <div className="mesh absolute inset-0" />
        </div>

        <div ref={l3} className="absolute -inset-[12%] will-change-transform">
          {PIXELS.map((p, i) => (
            <span
              key={i}
              className="px-sq bob absolute"
              style={{
                left: p.l,
                top: p.t,
                width: p.s,
                height: p.s,
                animationDelay: p.d,
                opacity: 0.5,
                transform: `rotate(${(i * 47) % 36}deg)`,
              }}
            />
          ))}
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-[26vh]"
          style={{
            background: "linear-gradient(to top, rgba(11,12,18,0.88), rgba(11,12,18,0))",
          }}
        />
      </div>

      {/* ---------- progress ---------- */}
      <div className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-30 h-[2px] bg-[rgba(42,44,58,0.6)]">
        <div
          className="h-full bg-accent shadow-[0_0_16px_rgba(91,99,240,0.85)] transition-[width] duration-[650ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{ width: `${((index + 1) / TOTAL) * 100}%` }}
        />
      </div>

      {/* ---------- slide ---------- */}
      <main className="relative z-10 h-full w-full [perspective:1500px]">
        <div key={index} className={dir === 1 ? "enter-fwd h-full" : "enter-back h-full"}>
          <DeckActionsContext.Provider value={{ speakerMode, toggleMode, explain: openExplain }}>
            <Active />
          </DeckActionsContext.Provider>
        </div>
      </main>

      {/* Compact right-edge rail; it sits below the main diagram area. */}
      <div
        className={`control-rail fixed z-50 ${railDim ? "rail-idle" : "rail-active"}`}
        onPointerDown={touchRail}
      >
        {railOpen ? (
          <div className="control-rail-expanded">
            <span className="rail-counter">{pad2(index + 1)}/{pad2(TOTAL)}</span>
            <RailButton label="Previous slide" onClick={() => { touchRail(); go(-1); }}>
              <Chevron dir={-1} />
            </RailButton>
            <RailButton
              label={transport?.playing ? "Pause animation" : "Resume animation"}
              disabled={!transport || transport.reduced}
              active
              onClick={() => { touchRail(); activeTransport()?.toggle(); }}
            >
              {transport?.playing ? <PauseGlyph /> : <PlayGlyph />}
            </RailButton>
            <RailButton label="Replay animation" disabled={!transport || transport.reduced}
              onClick={() => { touchRail(); activeTransport()?.replay(); }}>
              <ReplayGlyph />
            </RailButton>
            <RailButton label="Next slide" active onClick={() => { touchRail(); go(1); }}>
              <Chevron dir={1} />
            </RailButton>
            <button
              type="button"
              className="rail-speed"
              aria-label={`Playback speed ${transport?.speed ?? 1} times; tap to change speed`}
              title="Cycle speed: 0.5×, 1×, 1.5×"
              disabled={!transport || transport.reduced}
              onClick={() => {
                touchRail();
                const tr = activeTransport();
                if (!tr) return;
                const speeds = [0.5, 1, 1.5];
                tr.setSpeed(speeds[(speeds.indexOf(tr.speed) + 1) % speeds.length]);
              }}
            >
              {transport?.speed ?? 1}×
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Open presentation controls"
            aria-expanded="false"
            className="control-rail-toggle"
            onClick={toggleRail}
          >
            {transport?.playing ? <PauseGlyph /> : <PlayGlyph />}
          </button>
        )}
      </div>

      <ExplainSheet
        open={explainOpen && speakerMode}
        index={index}
        elapsed={elapsed}
        note={currentExplanation}
        onClose={() => setExplainOpen(false)}
      />
    </div>
  );
}

function PauseGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="3.6" y="2.4" width="3.2" height="11.2" rx="1" />
      <rect x="9.2" y="2.4" width="3.2" height="11.2" rx="1" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 2.2 13 8l-9 5.8z" />
    </svg>
  );
}

function ReplayGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 7.5a5.5 5.5 0 1 0 1.8-4" />
      <path d="M2.2 1.8v3.6h3.6" />
    </svg>
  );
}

function RailButton({
  children,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`control-rail-button ${
        active ? "control-rail-primary" : ""
      } ${disabled ? "control-rail-disabled" : ""}`}
    >
      {children}
    </button>
  );
}
