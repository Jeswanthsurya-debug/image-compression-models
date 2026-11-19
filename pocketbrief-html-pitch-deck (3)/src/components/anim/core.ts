import { useEffect, useRef, useState } from "react";

/* ---------------- math ---------------- */

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** normalised progress of t inside [a,b] */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const hash = (i: number, j = 0) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const pad2 = (n: number) => String(n).padStart(2, "0");

/* ---------------- steps ---------------- */

export type Phase = { id: string; label: string; from: number; to: number };
export type Step = Phase & { caption: string; dur: number };

/** helper: build steps that evenly divide the timeline */
export function timeline(
  items: [string, string, string][],
  dur = 2600
): Step[] {
  const n = items.length;
  return items.map(([id, label, caption], i) => ({
    id,
    label,
    caption,
    dur,
    from: i / n,
    to: (i + 1) / n,
  }));
}

export type Snap = {
  t: number;
  step: number;
  p: number;
  playing: boolean;
  held: boolean;
  speed: number;
  reduced: boolean;
};

export type Transport = Snap & {
  steps: Step[];
  play: () => void;
  pause: () => void;
  toggle: () => void;
  replay: () => void;
  goto: (i: number) => void;
  next: () => void;
  prev: () => void;
  setSpeed: (v: number) => void;
};

/* ---------------- reduced motion ---------------- */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ---------------- global registry (for keyboard routing) ---------------- */

let registry: Transport | null = null;
export const activeTransport = () => registry;

/* ---------------- transport ---------------- */

type Internal = {
  step: number;
  p: number;
  playing: boolean;
  held: boolean;
  mode: "run" | "single";
  speed: number;
};

/**
 * Step player engine. One normalised timeline value `t` is derived from the
 * current step + its progress, so scenes stay pure functions of `t`.
 *
 *  · opening a slide auto-plays through every step once
 *  · clicking a step (or a diagram part) plays just that step, then HOLDS
 *  · Resume continues from the held step onwards
 */
export function useTransport(steps: Step[]): Transport {
  const reduced = usePrefersReducedMotion();
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const st = useRef<Internal>({
    step: 0,
    p: 0,
    playing: false,
    held: false,
    mode: "run",
    speed: 1,
  });

  const [snap, setSnap] = useState<Snap>({
    t: 0,
    step: 0,
    p: 0,
    playing: false,
    held: false,
    speed: 1,
    reduced: false,
  });
  const lastStatus = useRef("");

  const publish = () => {
    const s = st.current;
    const list = stepsRef.current;
    const cur = list[clamp(s.step, 0, list.length - 1)];
    const nextSnap: Snap = {
      t: cur ? cur.from + s.p * (cur.to - cur.from) : 1,
      step: clamp(s.step, 0, list.length - 1),
      p: s.p,
      playing: s.playing,
      held: s.held,
      speed: s.speed,
      reduced,
    };
    setSnap(nextSnap);

    // The deck dock only needs control-state changes, not every animation frame.
    const signature = `${nextSnap.step}:${nextSnap.playing}:${nextSnap.held}:${nextSnap.speed}:${nextSnap.reduced}`;
    if (signature !== lastStatus.current) {
      lastStatus.current = signature;
      window.dispatchEvent(new CustomEvent("transport:status", { detail: nextSnap }));
    }
  };

  /* open state */
  useEffect(() => {
    const s = st.current;
    if (reduced) {
      s.step = stepsRef.current.length - 1;
      s.p = 1;
      s.playing = false;
      s.held = true;
    } else {
      s.step = 0;
      s.p = 0;
      s.playing = true;
      s.held = false;
      s.mode = "run";
    }
    publish();
  }, [reduced]);

  /* frame loop */
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(80, now - last);
      last = now;
      const s = st.current;
      const list = stepsRef.current;
      if (s.playing && !document.hidden) {
        const cur = list[clamp(s.step, 0, list.length - 1)];
        s.p += (dt * s.speed) / Math.max(120, cur.dur);
        if (s.p >= 1) {
          s.p = 1;
          const isLast = s.step >= list.length - 1;
          if (s.mode === "single" || isLast) {
            s.playing = false;
            s.held = true;
          } else {
            s.step += 1;
            s.p = 0;
          }
        }
        publish();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const play = () => {
    const s = st.current;
    const list = stepsRef.current;
    if (reduced) return;
    if (s.held && s.p >= 1 && s.step < list.length - 1) {
      s.step += 1;
      s.p = 0;
    }
    s.mode = "run";
    s.held = false;
    s.playing = true;
    publish();
  };

  const pause = () => {
    st.current.playing = false;
    publish();
  };

  const goto = (i: number) => {
    const s = st.current;
    const list = stepsRef.current;
    s.step = clamp(i, 0, list.length - 1);
    s.p = reduced ? 1 : 0;
    s.held = reduced;
    s.mode = "single";
    s.playing = !reduced;
    publish();
  };

  const api: Transport = {
    ...snap,
    steps,
    play,
    pause,
    toggle: () => (st.current.playing ? pause() : play()),
    replay: () => {
      const s = st.current;
      s.step = 0;
      s.p = reduced ? 1 : 0;
      s.held = reduced;
      s.mode = "run";
      s.playing = !reduced;
      publish();
    },
    goto,
    next: () => goto(st.current.step + 1),
    prev: () => goto(st.current.step - 1),
    setSpeed: (v: number) => {
      st.current.speed = v;
      publish();
    },
  };

  /* register so the deck can route Space / arrow keys to this player */
  useEffect(() => {
    registry = api;
    return () => {
      if (registry === api) registry = null;
    };
  });

  return api;
}
