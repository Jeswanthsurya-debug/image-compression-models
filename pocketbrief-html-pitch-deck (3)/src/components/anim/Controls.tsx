import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { pad2, type Transport } from "./core";

/* diagram part id → step id, used when a part has no step of the same name */
const PART_ALIAS: Record<string, string> = {
  comp: "shrink",
  table: "probs",
  cells: "merge",
  img: "original",
  flag: "details",
  chan: "symenc",
  symdec: "decoder",
  invm: "decoder",
  symbol: "symenc",
  orig: "original",
  enc: "encode",
  dec: "decode",
  dct: "dct",
  quant: "quant",
  zz: "zigzag",
  ent: "entropy",
  preview: "entropy",
  diff: "diff",
  medical: "medical",
  satellite: "satellite",
  ott: "ott",
  cloud: "cloud",
  band: "margin",
  plane: "ring",
  circ: "back",
  pts: "lift",
  la: "lineA",
  lb: "lineB",
  lc: "lineC",
  vec: "vector",
  spam: "space",
  ham: "space",
  new: "verdict",
  grid: "draw",
  flat: "flatten",
  ker: "kernel",
  win: "kernel",
  sum: "dot",
  map: "slide",
  xray: "scan",
  mri: "scan",
  res: "result",
  scene: "frame",
  ego: "decide",
  phone: "face",
  score: "match",
  svm: "manual",
  cnn: "auto",
};

/* ---------------- icons ---------------- */

const Ico = {
  play: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.6 2.7 12.7 8l-8.1 5.3z" />
    </svg>
  ),
  pause: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="4.1" y="2.9" width="2.7" height="10.2" rx="1" />
      <rect x="9.2" y="2.9" width="2.7" height="10.2" rx="1" />
    </svg>
  ),
  replay: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.6 8a5.4 5.4 0 1 0 1.7-3.9" />
      <path d="M2.3 2.6v3.2h3.2" />
    </svg>
  ),
  prev: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.6 2.8 5.4 8l6.2 5.2z" />
      <rect x="3.2" y="2.8" width="1.7" height="10.4" rx="0.8" />
    </svg>
  ),
  next: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.4 2.8 10.6 8l-6.2 5.2z" />
      <rect x="11.1" y="2.8" width="1.7" height="10.4" rx="0.8" />
    </svg>
  ),
};

/* ---------------- hover tooltip ---------------- */

export type Tip = { x: number; y: number; text: string } | null;

export function useTip() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip>(null);
  const [hot, setHot] = useState<string | null>(null);

  const bind = (id: string, text: string) => ({
    style: { cursor: "pointer" as const },
    onClick: () =>
      window.dispatchEvent(new CustomEvent("part:pick", { detail: id })),
    onMouseMove: (e: ReactMouseEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const x = Math.min(Math.max(e.clientX - box.left, 150), Math.max(150, box.width - 150));
      setTip({ x, y: e.clientY - box.top, text });
      setHot(id);
    },
    onMouseLeave: () => {
      setTip(null);
      setHot(null);
    },
  });

  return { ref, tip, hot, bind };
}

export function TipBubble({ tip }: { tip: Tip }) {
  if (!tip) return null;
  const below = tip.y < 96;
  return (
    <div
      className="tip-in pointer-events-none absolute z-30 flex max-w-[300px] items-start gap-2 rounded-[11px] border border-[rgba(91,99,240,0.45)] bg-[rgba(11,12,18,0.96)] px-3 py-2 shadow-[0_18px_40px_-20px_rgba(0,0,0,1)] backdrop-blur-sm"
      style={{
        left: tip.x,
        top: below ? tip.y + 20 : tip.y - 14,
        transform: below ? "translate(-50%,0)" : "translate(-50%,-100%)",
      }}
    >
      <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent-light" />
      <span className="font-mono text-[11.5px] leading-[1.45] text-chalk">{tip.text}</span>
    </div>
  );
}

/* ---------------- the step player ---------------- */

const SPEEDS = [0.5, 1, 1.5];

export function StepPlayer({
  tr,
  layout = "side",
  className = "",
}: {
  tr: Transport;
  layout?: "side" | "bar";
  className?: string;
}) {
  const { steps, step: cur } = tr;
  const held = tr.held && !tr.playing;
  const active = steps[Math.min(cur, steps.length - 1)];
  const trRef = useRef(tr);
  const activeStepRef = useRef<HTMLButtonElement | null>(null);
  trRef.current = tr;

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({
      behavior: tr.reduced ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [cur, tr.reduced]);

  /* clicking a part of the diagram jumps to its step, then holds there */
  useEffect(() => {
    const onPick = (e: Event) => {
      const id = String((e as CustomEvent).detail ?? "");
      const list = trRef.current.steps;
      let i = list.findIndex((s) => s.id === id);
      if (i < 0 && PART_ALIAS[id]) i = list.findIndex((s) => s.id === PART_ALIAS[id]);
      if (i >= 0) trRef.current.goto(i);
    };
    window.addEventListener("part:pick", onPick);
    return () => window.removeEventListener("part:pick", onPick);
  }, []);

  const TBtn = ({
    onClick,
    title,
    children,
    wide = false,
    accent = false,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    wide?: boolean;
    accent?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`nav-btn flex h-10 items-center justify-center gap-2 rounded-full border font-mono text-[11px] tracking-[0.06em] ${
        wide ? "px-4" : "w-10"
      } ${
        accent
          ? "border-[rgba(91,99,240,0.6)] bg-[rgba(91,99,240,0.18)] text-accent-light"
          : "border-line text-muted"
      }`}
    >
      {children}
    </button>
  );

  const stepButtons = (
    <div className="step-list-mobile min-w-0">
      {steps.map((s, i) => {
        const on = i === cur;
        const done = i < cur;
        return (
          <button
            key={s.id}
            ref={on ? activeStepRef : null}
            type="button"
            onClick={() => tr.goto(i)}
            aria-current={on}
            className={`group row-slide flex w-full cursor-pointer items-center gap-3.5 rounded-[15px] border px-4 py-[11px] text-left transition-colors duration-300 ${
              on
                ? "border-[rgba(91,99,240,0.65)] bg-[rgba(91,99,240,0.14)]"
                : "border-line bg-[rgba(21,22,31,0.6)] hover:border-[rgba(91,99,240,0.4)] hover:bg-card-hi"
            }`}
          >
            <span
              className={`step-number shrink-0 text-[clamp(19px,1.7vw,25px)] font-extrabold leading-none tracking-[-0.05em] transition-all duration-500 ${
                on
                  ? "text-accent [text-shadow:0_0_26px_rgba(91,99,240,0.7)]"
                  : done
                    ? "text-[rgba(91,99,240,0.5)]"
                    : "num-dim group-hover:text-accent-light"
              }`}
            >
              {pad2(i + 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`step-label block text-[clamp(12.5px,1vw,14.5px)] font-bold leading-tight tracking-[-0.01em] ${
                  on ? "text-chalk" : "text-[rgba(241,241,245,0.62)]"
                }`}
              >
                {s.label}
              </span>
              {on && !tr.reduced && (
                <span className="mt-[7px] block h-[3px] w-full overflow-hidden rounded-full bg-[#22242F]">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${Math.round(tr.p * 100)}%` }}
                  />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  const caption = (
    <div className="anim-caption rounded-[18px] border border-[rgba(91,99,240,0.32)] bg-[rgba(91,99,240,0.08)] px-5 py-4">
      <span className="mono-label text-[9px] text-accent-light">what&apos;s happening</span>
      <p
        key={cur}
        className="reveal mt-[9px] text-[clamp(14px,1.2vw,18px)] font-semibold leading-[1.45] tracking-[-0.01em] text-chalk"
      >
        {active?.caption}
      </p>
    </div>
  );

  const transport = (
    <div className="portrait-controls flex flex-wrap items-center gap-2">
      <TBtn onClick={tr.prev} title="Previous step (←)">
        {Ico.prev}
      </TBtn>
      <TBtn
        onClick={tr.toggle}
        title={tr.playing ? "Pause (Space)" : "Play (Space)"}
        accent={!tr.playing}
      >
        {tr.playing ? Ico.pause : Ico.play}
      </TBtn>
      <TBtn onClick={tr.next} title="Next step (→)">
        {Ico.next}
      </TBtn>
      <TBtn onClick={tr.replay} title="Replay from step 01" wide>
        {Ico.replay}
        <span>REPLAY</span>
      </TBtn>

      <span className="mx-1 flex items-center gap-1 rounded-full border border-line bg-[rgba(21,22,31,0.7)] p-1">
        {SPEEDS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => tr.setSpeed(v)}
            aria-label={`Speed ${v} times`}
            className={`rounded-full px-2.5 py-[5px] font-mono text-[10.5px] transition-colors duration-300 ${
              tr.speed === v
                ? "bg-accent text-[#0B0C12]"
                : "text-muted hover:text-chalk"
            }`}
          >
            {v}×
          </button>
        ))}
      </span>

      {!tr.playing && !tr.reduced && (
        <>
          <span className="flex items-center gap-2 rounded-full border border-[rgba(255,92,122,0.45)] bg-[rgba(255,92,122,0.1)] px-3.5 py-[7px]">
            <span className="pulse-dot h-[6px] w-[6px] rounded-full bg-[#FF5C7A]" />
            <span className="mono-label text-[9px] text-[#FF9DB0]">
              {held ? `held on step ${pad2(cur + 1)}` : "paused"}
            </span>
          </span>
          <button
            type="button"
            onClick={tr.play}
            className="nav-btn flex h-10 items-center gap-2 rounded-full border border-accent bg-accent px-5 font-mono text-[11.5px] font-bold tracking-[0.08em] text-[#0B0C12]"
          >
            {Ico.play}
            RESUME
          </button>
        </>
      )}

      {tr.reduced && (
        <span className="mono-label rounded-full border border-line px-3.5 py-[7px] text-[9px] text-muted">
          reduced motion · static frames
        </span>
      )}
    </div>
  );

  return (
    <div className={`flex w-full flex-col gap-3 ${className}`} data-layout={layout}>
      {caption}
      {stepButtons}
      {transport}
    </div>
  );
}
