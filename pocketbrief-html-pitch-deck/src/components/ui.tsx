import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import type { Transport } from "./anim/core";

export const TOTAL = 15;

export const pad2 = (n: number) => String(n).padStart(2, "0");
const r = (i: number) => ({ ["--i" as string]: i }) as React.CSSProperties;

export type DeckActions = {
  speakerMode: boolean;
  toggleMode: () => void;
  explain: () => void;
};

export const DeckActionsContext = createContext<DeckActions | null>(null);

/* ---------------- mouse-tilt 3D wrapper ---------------- */

export function Tilt({
  children,
  className = "",
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = outer.current;
    const n = inner.current;
    if (!o || !n) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const limit = window.matchMedia("(pointer: coarse)").matches ? Math.min(max, 2.5) : max;

    const onMove = (e: PointerEvent) => {
      const b = o.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width - 0.5;
      const py = (e.clientY - b.top) / b.height - 0.5;
      const x = -py * 2 * limit;
      const y = px * 2 * limit;
      n.style.transform = `perspective(900px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
    };
    const onLeave = () => {
      n.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    };

    o.addEventListener("pointermove", onMove);
    o.addEventListener("pointerleave", onLeave);
    o.addEventListener("pointercancel", onLeave);
    return () => {
      o.removeEventListener("pointermove", onMove);
      o.removeEventListener("pointerleave", onLeave);
      o.removeEventListener("pointercancel", onLeave);
    };
  }, [max]);

  return (
    <div ref={outer} className={className}>
      <div ref={inner} className="tilt-card3d h-full w-full will-change-transform">
        {children}
      </div>
    </div>
  );
}

/* ---------------- header atoms ---------------- */

export function Pill({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <span
      className="slide-pill reveal inline-flex items-center gap-3 rounded-full border border-line bg-card px-4 py-[9px]"
      style={r(index)}
    >
      <span className="pulse-dot h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
      <span className="slide-pill-label mono-label text-[10.5px] text-[rgba(241,241,245,0.8)]">{children}</span>
    </span>
  );
}

export function TopicTag({ topic }: { topic: string }) {
  return (
    <span
      title={topic}
      className="slide-topic reveal inline-flex items-center gap-2.5 rounded-full border border-line bg-[rgba(21,22,31,0.78)] px-4 py-[9px] backdrop-blur-sm transition-colors duration-300 hover:border-[rgba(91,99,240,0.5)]"
      style={r(1)}
    >
      <span className="slide-topic-label mono-label text-[10.5px] text-[rgba(241,241,245,0.88)]">{topic}</span>
      <span className="pulse-dot h-[6px] w-[6px] shrink-0 rounded-full bg-accent" />
    </span>
  );
}

/* ---------------- slide shell ---------------- */

export function SlideShell({
  index,
  pill,
  topic,
  children,
  foot,
  rightSlot,
}: {
  index: number;
  pill: string;
  topic?: string;
  children: ReactNode;
  foot?: string;
  rightSlot?: ReactNode;
}) {
  const actions = useContext(DeckActionsContext);
  return (
    <section className="deck-slide pad relative flex h-full w-full flex-col" data-slide={index}>
      <header className="slide-header mx-auto flex w-full max-w-[1460px] shrink-0 flex-wrap items-center justify-between gap-3">
        <Pill index={0}>{pill}</Pill>
        <div className="slide-header-right flex items-center gap-2">
          {rightSlot ?? (index > 1 && topic ? <TopicTag topic={topic} /> : null)}
          {actions && (
            <div className="slide-actions flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={actions.toggleMode}
                aria-label={actions.speakerMode ? "Switch to present mode" : "Switch to speaker mode"}
                aria-pressed={actions.speakerMode}
                className="deck-mode-button rounded-full border border-line bg-card font-mono text-[9px] font-bold tracking-[0.06em] text-muted"
              >
                {actions.speakerMode ? "SPK" : "PRE"}
              </button>
              {actions.speakerMode && (
                <button
                  type="button"
                  onClick={actions.explain}
                  aria-label="Explain this slide"
                  title="Explain this slide"
                  className="deck-explain-button nav-btn flex items-center justify-center rounded-full border border-[rgba(91,99,240,0.55)] bg-[rgba(91,99,240,0.12)] text-accent-light"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 4.5h5.2a2.3 2.3 0 0 1 2.3 2.3v9a2.3 2.3 0 0 0-2.3-2.3H3z" />
                    <path d="M17 4.5h-4.2a2.3 2.3 0 0 0-2.3 2.3v9a2.3 2.3 0 0 1 2.3-2.3H17z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="slide-content no-bar relative mx-auto flex w-full max-w-[1460px] min-h-0 flex-1 flex-col overflow-y-auto pt-[clamp(14px,2.6vh,34px)] pb-[clamp(22px,3.6vh,48px)]">
        {children}
      </div>

      <footer className="slide-footer mx-auto flex w-full max-w-[1460px] shrink-0 flex-wrap items-center gap-x-5 gap-y-2 pr-[clamp(0px,24vw,300px)]">
        <span className="mono-label flex items-center gap-[3px] text-[10px] text-[rgba(154,157,176,0.6)]">
          image_compression
          <span className="caret text-accent">_</span>
        </span>
        <span className="mono-label hidden text-[9.5px] text-[rgba(154,157,176,0.5)] sm:block">
          {foot ?? `${pad2(index)} / ${TOTAL}`}
        </span>
      </footer>
    </section>
  );
}

/* ---------------- type ---------------- */

export function Title({
  children,
  index = 2,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <h2 className={`reveal title-xl ${className}`} style={r(index)}>
      {children}
      <span className="text-accent">.</span>
    </h2>
  );
}

export function Lead({ children, index = 3 }: { children: ReactNode; index?: number }) {
  return (
    <p
      className="slide-lead reveal mt-3.5 max-w-[680px] text-[clamp(13.5px,1.1vw,16px)] leading-[1.7] text-muted"
      style={r(index)}
    >
      {children}
    </p>
  );
}

/* ---------------- diagram plate ---------------- */

export function Plate({
  children,
  className = "",
  index = 3,
  minH,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  minH?: string;
}) {
  return (
    <div
      className={`reveal-soft plate relative min-h-0 overflow-hidden rounded-[24px] border border-line shadow-[var(--shadow-plate)] ${className}`}
      style={{ ...r(index), minHeight: minH }}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-inset ring-[rgba(91,99,240,0.14)]" />
    </div>
  );
}

/* ---------------- chip ---------------- */

export function Chip({
  children,
  tone = "line",
}: {
  children: ReactNode;
  tone?: "line" | "green" | "red" | "accent";
}) {
  const map = {
    line: "border-line text-muted",
    green: "border-[rgba(61,220,151,0.5)] text-[#3DDC97] bg-[rgba(61,220,151,0.08)]",
    red: "border-[rgba(255,92,122,0.5)] text-[#FF5C7A] bg-[rgba(255,92,122,0.08)]",
    accent: "border-[rgba(91,99,240,0.55)] text-accent-light bg-[rgba(91,99,240,0.1)]",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-[7px] font-mono text-[11px] tracking-[0.04em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/* ---------------- animated-slide layout (reused by the deck) ---------------- */

import { StepPlayer } from "./anim/Controls";

export function AnimSlide({
  index,
  pill,
  topic,
  title,
  lead,
  foot,
  tr,
  layout = "side",
  children,
}: {
  index: number;
  pill: string;
  topic?: string;
  title: string;
  lead?: string;
  foot?: string;
  tr: Transport;
  layout?: "side" | "bar";
  children: ReactNode;
}) {
  return (
    <SlideShell index={index} pill={pill} topic={topic} foot={foot}>
      <div className="flex min-h-0 flex-1 flex-col gap-[clamp(10px,1.6vh,20px)]">
        <div>
          <Title index={2}>{title}</Title>
          {lead && <Lead index={3}>{lead}</Lead>}
        </div>

        <div className="anim-layout" data-layout={layout}>
          <Plate index={3} minH="clamp(210px,42vh,540px)" className="anim-plate">
            {children}
            {!tr.playing && !tr.reduced && (
              <div className="paused-overlay">
                <span className="paused-badge">
                  <span className="h-[6px] w-[6px] rounded-full bg-[#FF5C7A]" />
                  PAUSED
                </span>
                <button type="button" onClick={tr.play} className="paused-resume">
                  ▶ Resume
                </button>
              </div>
            )}
          </Plate>
          <div className="step-panel reveal min-h-0" style={r(4)}>
            <StepPlayer tr={tr} layout="side" />
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
