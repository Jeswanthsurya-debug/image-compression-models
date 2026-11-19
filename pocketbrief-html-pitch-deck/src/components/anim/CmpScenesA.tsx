import {
  clamp01, easeInOut, easeOut, hash, lerp, seg, timeline,
  type Step, type Transport,
} from "./core";
import { TipBubble, useTip } from "./Controls";

const ACCENT = "#5B63F0";
const LIGHT = "#8A90FF";
const CHALK = "#F1F1F5";
const MUTED = "#9A9DB0";
const GREEN = "#3DDC97";
const RED = "#FF5C7A";
const mono = { fontFamily: "var(--font-mono)" } as const;

/* ================================================================== */
/*  SLIDE 2 — why compression?                                        */
/* ================================================================== */

export const SIZE_STEPS: Step[] = timeline(
  [
    ["frame", "One raw frame", "A single 1920×1080 frame at 24 bits needs 6.2 MB — before any compression."],
    ["video", "One minute of video", "At 30 fps for 60 seconds that explodes to roughly 11 GB of raw data."],
    ["shrink", "Compress it", "A 10 : 1 compression shrinks the minute to about 1 GB — suddenly streamable."],
  ],
  3200
);

export function SizeScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const t = tr.t;
  const s = tr.step;

  const c0 = 6.2 * easeOut(seg(t, 0.03, 0.26));
  const c1 = 11.2 * easeOut(seg(t, 0.36, 0.6));
  const p2 = easeInOut(seg(t, 0.68, 0.92));
  const on = (i: number) => s >= i;

  const card = (
    x: number, w: number, op: number, active: boolean,
    label: string, value: string, sub: string, id: string, tipText: string, color: string
  ) => (
    <g opacity={op} {...bind(id, tipText)}>
      <rect x={x} y="120" width={w} height="150" rx="20"
        fill={hot === id ? "#1B1D29" : "#15161F"}
        stroke={active ? color : "#2A2C3A"} strokeWidth={active ? 2 : 1.4} />
      <text x={x + 26} y="158" {...mono} fontSize="12.5" letterSpacing="0.18em" fill={MUTED}>
        {label}
      </text>
      <text x={x + 26} y="214" fontSize="46" fontWeight="800" letterSpacing="-0.04em"
        fill={active ? CHALK : "rgba(241,241,245,0.55)"}>
        {value}
      </text>
      <text x={x + 26} y="248" {...mono} fontSize="11.5" fill={MUTED}>{sub}</text>
    </g>
  );

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 620" className="h-full w-full" role="img"
        aria-label="Raw image and video data sizes versus a compressed size">
        <defs>
          <pattern id="szMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
        </defs>
        <rect width="1100" height="620" fill="url(#szMesh)" />

        {card(60, 300, on(0) ? 1 : 0.3, s === 0, "1 FRAME · RAW",
          `${c0.toFixed(1)} MB`, "1920 × 1080 × 24 bits", "frame",
          "One full-HD frame already fills 6.2 megabytes.", LIGHT)}
        {card(400, 300, on(1) ? 1 : 0.3, s === 1, "1 MINUTE · 30 FPS",
          `${c1.toFixed(1)} GB`, "6.2 MB × 30 × 60", "video",
          "A minute of uncompressed full-HD video ≈ 11 GB.", LIGHT)}
        {card(740, 300, on(2) ? 1 : 0.3, s === 2, "COMPRESSED · 10 : 1",
          `${(11.2 - 10.1 * p2).toFixed(1)} GB`, "CR = 10 : 1 · RD = 0.9", "comp",
          "Compression removes redundancy — the same minute, ten times smaller.", GREEN)}

        {/* bars */}
        <g opacity={on(1) ? 1 : 0.35}>
          <text x="60" y="380" {...mono} fontSize="12.5" letterSpacing="0.18em" fill={MUTED}>
            ONE MINUTE OF VIDEO
          </text>
          <rect x="60" y="396" width="980" height="46" rx="14" fill="#15161F" stroke="#2A2C3A" />
          <rect x="60" y="396" width={980 * clamp01(seg(t, 0.38, 0.62))} height="46" rx="14"
            fill={hot === "video" ? LIGHT : ACCENT} opacity="0.9" />
          <text x="1028" y="426" textAnchor="end" {...mono} fontSize="15" fontWeight="700"
            fill={CHALK}>11.2 GB</text>
        </g>

        <g opacity={p2}>
          <text x="60" y="502" {...mono} fontSize="12.5" letterSpacing="0.18em" fill={GREEN}>
            AFTER COMPRESSION
          </text>
          <rect x="60" y="518" width="980" height="46" rx="14" fill="#15161F" stroke="#2A2C3A"
            opacity="0.6" />
          <rect x="60" y="518" width={Math.max(98, 980 * 0.1 * p2)} height="46" rx="14"
            fill={GREEN} opacity="0.85" />
          <text x={70 + Math.max(98, 980 * 0.1 * p2)} y="548" {...mono} fontSize="15"
            fontWeight="700" fill={GREEN}>≈ 1.1 GB</text>

          <rect x="760" y="496" width="280" height="94" rx="18" fill="rgba(61,220,151,0.1)"
            stroke={GREEN} strokeWidth="1.5" />
          <text x="1024" y="534" textAnchor="end" {...mono} fontSize="13" fontWeight="700"
            letterSpacing="0.12em" fill={GREEN}>STREAMABLE ✓</text>
          <text x="1024" y="566" textAnchor="end" {...mono} fontSize="11.5" fill={MUTED}>
            11.2 GB → 1.1 GB
          </text>
        </g>
      </svg>
      <TipBubble tip={tip} />
    </div>
  );
}

/* ================================================================== */
/*  SLIDE 5 — coding redundancy · Huffman                             */
/* ================================================================== */

export const HUFF_STEPS: Step[] = timeline(
  [
    ["probs", "Probabilities", "Four symbols with unequal odds: A shows up half the time."],
    ["fixed", "Fixed 2-bit codes", "A fixed code wastes bits — every symbol pays for the rarest one."],
    ["tree", "Build the tree", "Merge the two least likely symbols, again and again, up to the root."],
    ["codes", "Assign the codes", "Read the branches: left is 0, right is 1 — rare symbols get long codes."],
    ["avg", "Average: 1.75 bits", "Weighted by probability, Huffman needs only 1.75 bits per symbol."],
  ],
  3000
);

const SYMS = [
  { s: "A", p: 0.5, fx: "00", hf: "0" },
  { s: "B", p: 0.25, fx: "01", hf: "10" },
  { s: "C", p: 0.125, fx: "10", hf: "110" },
  { s: "D", p: 0.125, fx: "11", hf: "111" },
];

const N = {
  R: [690, 96], A: [480, 292], N1: [870, 292], B: [740, 476],
  N2: [980, 476], C: [892, 620], D: [1068, 620],
} as Record<string, [number, number]>;

export function HuffScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const t = tr.t;

  const pProb = easeOut(seg(t, 0.02, 0.16));
  const pFix = easeOut(seg(t, 0.22, 0.36));
  const pTree = seg(t, 0.42, 0.58);
  const ph1 = easeOut(clamp01(pTree / 0.34));
  const ph2 = easeOut(clamp01((pTree - 0.34) / 0.33));
  const ph3 = easeOut(clamp01((pTree - 0.67) / 0.33));
  const pCode = easeOut(seg(t, 0.62, 0.78));
  const pAvg = easeInOut(seg(t, 0.82, 0.97));

  const Edge = ({ a, b, op, label, side }: {
    a: [number, number]; b: [number, number]; op: number; label: string; side: number;
  }) => (
    <g opacity={op}>
      <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={LIGHT} strokeWidth="2"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - op} fill="none" />
      <text x={(a[0] + b[0]) / 2 + side * 18} y={(a[1] + b[1]) / 2 + 6} textAnchor="middle"
        {...mono} fontSize="15" fontWeight="700" fill={CHALK} opacity={pCode}>{label}</text>
    </g>
  );

  const Node = ({ p, x, y, label, leaf, op }: {
    p: [number, number]; x: number; y: number; label: string; leaf: boolean; op: number;
  }) => (
    <g opacity={op}>
      <circle cx={x} cy={y} r={(leaf ? 34 : 30) * op} fill={leaf ? "#15161F" : "rgba(91,99,240,0.16)"}
        stroke={leaf ? LIGHT : ACCENT} strokeWidth="1.8" />
      <text x={x} y={y + 6} textAnchor="middle" {...mono} fontSize={leaf ? 17 : 13.5}
        fontWeight="700" fill={leaf ? CHALK : LIGHT} opacity={op}>{label}</text>
      <title>{p ? "" : ""}</title>
    </g>
  );

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 680" className="h-full w-full" role="img"
        aria-label="Huffman coding: probabilities, fixed codes, tree construction and average length">
        <defs>
          <pattern id="hfMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
        </defs>
        <rect width="1100" height="680" fill="url(#hfMesh)" />

        {/* ---------- symbol table ---------- */}
        <g {...bind("table", "Symbol table: probability, fixed code, Huffman code.")}>
          <rect x="48" y="86" width="330" height="330" rx="20"
            fill={hot === "table" ? "#1B1D29" : "#15161F"}
            stroke={hot === "table" ? LIGHT : "#2A2C3A"} strokeWidth="1.4" />
          <text x="72" y="122" {...mono} fontSize="12" letterSpacing="0.18em" fill={MUTED}>SYMBOL</text>
          <text x="150" y="122" {...mono} fontSize="12" letterSpacing="0.18em" fill={MUTED}>P</text>
          <text x="218" y="122" {...mono} fontSize="12" letterSpacing="0.18em" fill={MUTED}
            opacity={pFix}>FIXED</text>
          <text x="294" y="122" {...mono} fontSize="12" letterSpacing="0.18em" fill={LIGHT}
            opacity={pCode}>HUFF</text>

          {SYMS.map((sym, i) => {
            const y = 176 + i * 60;
            const d = clamp01(pProb * 2 - i * 0.18);
            return (
              <g key={sym.s}>
                <text x="72" y={y} fontSize="30" fontWeight="800" fill={CHALK} opacity={d}>
                  {sym.s}
                </text>
                <rect x="128" y={y - 20} width="70" height="14" rx="7" fill="#101119" />
                <rect x="128" y={y - 20} width={70 * sym.p * 2 * d} height="14" rx="7"
                  fill={ACCENT} />
                <text x="128" y={y + 18} {...mono} fontSize="12.5" fill={MUTED} opacity={d}>
                  {sym.p}
                </text>
                <text x="218" y={y} {...mono} fontSize="17" fill={MUTED} opacity={pFix}>
                  {sym.fx}
                </text>
                <text x="294" y={y} {...mono} fontSize="17" fontWeight="700" fill={LIGHT}
                  opacity={pCode}>
                  {sym.hf}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---------- average length ---------- */}
        <g opacity={pAvg} {...bind("avg", "Average length: Σ pᵢ × length(codeᵢ).")}>
          <text x="48" y="472" {...mono} fontSize="12" letterSpacing="0.18em" fill={MUTED}>
            AVG BITS / SYMBOL
          </text>
          <text x="48" y="516" {...mono} fontSize="13" fill={MUTED}>fixed</text>
          <rect x="110" y="500" width="240" height="18" rx="9" fill="#1B1D29" />
          <rect x="110" y="500" width={240 * pAvg} height="18" rx="9" fill={MUTED} opacity="0.55" />
          <text x="360" y="515" {...mono} fontSize="14" fontWeight="700" fill={MUTED}>2.00</text>

          <text x="48" y="562" {...mono} fontSize="13" fill={LIGHT}>huffman</text>
          <rect x="110" y="546" width="240" height="18" rx="9" fill="#1B1D29" />
          <rect x="110" y="546" width={240 * 0.875 * pAvg} height="18" rx="9" fill={ACCENT} />
          <text x="360" y="561" {...mono} fontSize="14" fontWeight="700" fill={LIGHT}>1.75</text>

          <rect x="48" y="588" width="330" height="48" rx="14" fill="rgba(61,220,151,0.1)"
            stroke={GREEN} strokeWidth="1.4" />
          <text x="213" y="618" textAnchor="middle" {...mono} fontSize="14" fontWeight="700"
            fill={GREEN} letterSpacing="0.08em">−12.5% BITS · LOSSLESS ✓</text>
        </g>

        {/* ---------- tree ---------- */}
        <g {...bind("tree", "Huffman tree: merge the two smallest probabilities each time.")}>
          <Edge a={N.N2} b={N.C} op={ph1} label="0" side={-1} />
          <Edge a={N.N2} b={N.D} op={ph1} label="1" side={1} />
          <Edge a={N.N1} b={N.B} op={ph2} label="0" side={-1} />
          <Edge a={N.N1} b={N.N2} op={ph2} label="1" side={1} />
          <Edge a={N.R} b={N.A} op={ph3} label="0" side={-1} />
          <Edge a={N.R} b={N.N1} op={ph3} label="1" side={1} />

          <Node p={N.C} x={N.C[0]} y={N.C[1]} label="C · ⅛" leaf op={ph1} />
          <Node p={N.D} x={N.D[0]} y={N.D[1]} label="D · ⅛" leaf op={ph1} />
          <Node p={N.N2} x={N.N2[0]} y={N.N2[1]} label="0.25" leaf={false} op={ph1} />
          <Node p={N.B} x={N.B[0]} y={N.B[1]} label="B · ¼" leaf op={ph2} />
          <Node p={N.N1} x={N.N1[0]} y={N.N1[1]} label="0.5" leaf={false} op={ph2} />
          <Node p={N.A} x={N.A[0]} y={N.A[1]} label="A · ½" leaf op={ph3} />
          <Node p={N.R} x={N.R[0]} y={N.R[1]} label="1.0" leaf={false} op={ph3} />
        </g>

        <text x="700" y="44" {...mono} fontSize="12.5" letterSpacing="0.2em" fill={MUTED}
          opacity={pProb}>
          HUFFMAN TREE · BUILD BOTTOM-UP
        </text>
      </svg>
      <TipBubble tip={tip} />
    </div>
  );
}

/* ================================================================== */
/*  SLIDE 6 — spatial redundancy · RLE                                */
/* ================================================================== */

export const RLE_STEPS: Step[] = timeline(
  [
    ["strip", "A strip of pixels", "A clear-sky scan line: long runs of identical neighbours."],
    ["runs", "Runs of equals", "Group the equals: five whites, three blacks, two whites."],
    ["merge", "RLE pairs", "Run-length encoding stores each run as one count–value pair."],
    ["saved", "10 → 6 symbols", "Ten pixels become six numbers — a 40% saving on flat regions."],
  ],
  3000
);

const CELLS = [0, 0, 0, 0, 0, 1, 1, 1, 0, 0]; // 0 = W, 1 = B
const CX0 = 110;
const CY = 330;
const CW = 80;
const BLOCKS = [
  { label: "5W", n: 5, w: 250, color: "#F1F1F5", txt: "#0B0C12" },
  { label: "3B", n: 3, w: 180, color: "#22242F", txt: "#F1F1F5" },
  { label: "2W", n: 2, w: 140, color: "#F1F1F5", txt: "#0B0C12" },
];

export function RleScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const t = tr.t;

  const pStrip = easeOut(seg(t, 0.02, 0.16));
  const pRuns = easeOut(seg(t, 0.27, 0.42));
  const pMerge = easeInOut(seg(t, 0.52, 0.7));
  const pSave = easeInOut(seg(t, 0.76, 0.92));

  /* merged block targets */
  const targets: { x: number; w: number; b: number }[] = [];
  let bx = 190;
  BLOCKS.forEach((b, bi) => {
    const per = b.w / b.n;
    for (let k = 0; k < b.n; k++) targets.push({ x: bx + k * per, w: per, b: bi });
    bx += b.w + 34;
  });

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 620" className="h-full w-full" role="img"
        aria-label="Run-length encoding merging runs of equal pixels into count-value pairs">
        <defs>
          <pattern id="rlMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A4180" />
            <stop offset="100%" stopColor="#191C2C" />
          </linearGradient>
        </defs>
        <rect width="1100" height="620" fill="url(#rlMesh)" />

        {/* ---------- sky strip ---------- */}
        <g opacity={pStrip} {...bind("strip", "Most neighbours in a sky are identical.")}>
          <rect x={CX0 - 16} y="110" width="832" height="140" rx="20" fill="url(#sky)"
            stroke={hot === "strip" ? LIGHT : "#2A2C3A"} strokeWidth="1.5" />
          <circle cx="220" cy="160" r="26" fill={CHALK} opacity="0.8" />
          <path d="M330 190 q50 -26 100 0" stroke={CHALK} strokeWidth="2" fill="none" opacity="0.25" />
          <path d="M600 150 q60 -30 120 0" stroke={CHALK} strokeWidth="2" fill="none" opacity="0.18" />
          <text x={CX0 - 16} y="92" {...mono} fontSize="12" letterSpacing="0.18em" fill={MUTED}>
            ONE SCAN LINE OF A CLEAR SKY
          </text>
        </g>

        {/* ---------- pixel cells / merged blocks ---------- */}
        <g {...bind("cells", "Ten pixels — five W, three B, two W.")}>
          {CELLS.map((c, i) => {
            const tgt = targets[i];
            const x = lerp(CX0 + i * CW, tgt.x, pMerge);
            const w = lerp(CW - 6, tgt.w - 6, pMerge);
            const d = clamp01(pStrip * 2.2 - i * 0.1);
            return (
              <g key={i} opacity={d}>
                <rect x={x + 3} y={CY} width={w} height="84" rx="12"
                  fill={c === 0 ? "#F1F1F5" : "#22242F"}
                  stroke={hot === "cells" ? LIGHT : "#2A2C3A"} strokeWidth="1.3" />
                <text x={x + 3 + w / 2} y={CY + 50} textAnchor="middle" {...mono}
                  fontSize="16" fontWeight="700" fill={c === 0 ? "#0B0C12" : "#F1F1F5"}
                  opacity={1 - pMerge}>
                  {c === 0 ? "W" : "B"}
                </text>
              </g>
            );
          })}

          {/* merged pair labels */}
          {BLOCKS.map((b, bi) => {
            const x = targets.find((tt) => tt.b === bi)!.x;
            return (
              <text key={bi} x={x + b.w / 2 - 3} y={CY + 52} textAnchor="middle" {...mono}
                fontSize="22" fontWeight="800" fill={b.txt} opacity={pMerge}>
                {b.label}
              </text>
            );
          })}
        </g>

        {/* ---------- run brackets ---------- */}
        <g opacity={pRuns * (1 - pMerge * 0.6)} stroke={LIGHT} strokeWidth="2" fill="none">
          {[
            [0, 5, "run · 5"],
            [5, 8, "run · 3"],
            [8, 10, "run · 2"],
          ].map(([a, b, lab], i) => (
            <g key={i}>
              <path d={`M${CX0 + (a as number) * CW + 4} ${CY + 108} L${CX0 + (a as number) * CW + 4} ${CY + 120} L${CX0 + (b as number) * CW - 10} ${CY + 120} L${CX0 + (b as number) * CW - 10} ${CY + 108}`} />
              <text x={CX0 + (((a as number) + (b as number)) / 2) * CW - 3} y={CY + 146}
                textAnchor="middle" {...mono} fontSize="13" fill={LIGHT} stroke="none">
                {lab as string}
              </text>
            </g>
          ))}
        </g>

        {/* ---------- savings ---------- */}
        <g opacity={pSave}>
          <rect x="190" y="512" width="660" height="66" rx="18" fill="#15161F"
            stroke={GREEN} strokeWidth="1.5" />
          <text x="214" y="540" {...mono} fontSize="13" fill={MUTED}>
            before: <tspan fill={CHALK} fontWeight="700">10 pixels</tspan>
          </text>
          <text x="214" y="564" {...mono} fontSize="13" fill={MUTED}>
            after:  <tspan fill={GREEN} fontWeight="700">3 pairs = 6 numbers</tspan>
          </text>
          <text x="826" y="552" textAnchor="end" {...mono} fontSize="20" fontWeight="800"
            fill={GREEN}>−40% ✓</text>

          <text x="880" y="540" {...mono} fontSize="11.5" fill={MUTED}>great: flat skies</text>
          <text x="880" y="562" {...mono} fontSize="11.5" fill={MUTED}>bad: noisy photos</text>
        </g>
      </svg>
      <TipBubble tip={tip} />
    </div>
  );
}

/* ================================================================== */
/*  SLIDE 7 — irrelevant (psychovisual) information                   */
/* ================================================================== */

export const PSYCH_STEPS: Step[] = timeline(
  [
    ["original", "The original", "A photograph is full of fine detail the eye barely registers."],
    ["details", "What the eye misses", "Thin rays, wispy clouds, grass texture — flagged as expendable."],
    ["gone", "Throw it away", "Remove those details; the picture still looks the same."],
    ["size", "Same look, fewer bits", "The file drops from 4.0 MB to 0.9 MB with no visible loss."],
  ],
  3000
);

export function PsychScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const t = tr.t;
  const s = tr.step;

  const pIn = easeOut(seg(t, 0.02, 0.15));
  const pFlag = easeInOut(seg(t, 0.27, 0.44));
  const pGone = easeInOut(seg(t, 0.52, 0.7));
  const pSize = easeInOut(seg(t, 0.76, 0.94));
  const pulse = 0.5 + 0.5 * Math.sin(t * 40);

  const detailOp = 1 - pGone;
  const flagTint = pFlag * (1 - pGone);

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 620" className="h-full w-full" role="img"
        aria-label="Psychovisual redundancy: fine detail the eye cannot see is removed, shrinking the file">
        <defs>
          <pattern id="pvMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
          <linearGradient id="pvSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C3152" />
            <stop offset="100%" stopColor="#161927" />
          </linearGradient>
          <clipPath id="imgClip">
            <rect x="70" y="120" width="500" height="380" rx="22" />
          </clipPath>
        </defs>
        <rect width="1100" height="620" fill="url(#pvMesh)" />

        {/* ---------- the picture ---------- */}
        <g opacity={pIn} {...bind("img", "The scene: sky, sun, hills and grass.")}>
          <rect x="70" y="120" width="500" height="380" rx="22" fill="url(#pvSky)"
            stroke={hot === "img" ? LIGHT : "#2A2C3A"} strokeWidth="1.6" />
          <g clipPath="url(#imgClip)">
            {/* sun */}
            <circle cx="440" cy="210" r="42" fill="#E8D9A8" opacity="0.9" />
            {/* fine detail: sun rays */}
            <g strokeWidth="2" strokeLinecap="round">
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={440 + Math.cos(a) * 52}
                    y1={210 + Math.sin(a) * 52}
                    x2={440 + Math.cos(a) * 70}
                    y2={210 + Math.sin(a) * 70}
                    opacity={0.55 * detailOp * (flagTint > 0.3 ? 0.45 + 0.55 * pulse : 1)}
                    stroke={flagTint > 0.3 ? RED : "#E8D9A8"}
                  />
                );
              })}
            </g>
            {/* clouds (fine wisps) */}
            <g opacity={detailOp * (flagTint > 0.3 ? 0.4 + 0.6 * pulse : 1)}
              stroke={flagTint > 0.3 ? RED : CHALK} strokeWidth="2.4" fill="none" strokeLinecap="round">
              <path d="M120 180 q30 -16 60 0 q24 -12 48 2" />
              <path d="M150 210 q26 -12 52 2" />
              <path d="M280 160 q34 -18 68 0" />
            </g>
            {/* hills */}
            <path d="M70 400 q120 -90 250 -34 q130 56 250 -22 L570 500 L70 500 Z"
              fill="#1D2136" />
            <path d="M70 440 q160 -60 320 -18 q110 30 180 -6 L570 500 L70 500 Z"
              fill="#14172A" />
            {/* fine detail: grass strokes */}
            <g opacity={detailOp * (flagTint > 0.3 ? 0.4 + 0.6 * pulse : 1)}
              stroke={flagTint > 0.3 ? RED : "#8A90FF"} strokeWidth="1.6" strokeLinecap="round">
              {Array.from({ length: 46 }, (_, i) => {
                const gx = 84 + i * 10.4;
                const gh = 8 + hash(i, 3) * 14;
                return <line key={i} x1={gx} y1={496} x2={gx + (hash(i, 5) - 0.5) * 8} y2={496 - gh} />;
              })}
            </g>
            {/* fine detail: birds */}
            <g opacity={detailOp * (flagTint > 0.3 ? 0.4 + 0.6 * pulse : 1)} stroke={flagTint > 0.3 ? RED : CHALK}
              strokeWidth="2.2" fill="none" strokeLinecap="round">
              <path d="M180 250 q8 -8 16 0 q8 -8 16 0" />
              <path d="M240 228 q7 -7 14 0 q7 -7 14 0" />
            </g>
          </g>

          <text x="70" y="540" {...mono} fontSize="13" letterSpacing="0.14em" fill={MUTED}>
            {s >= 2 ? "AFTER — LOOKS THE SAME ✓" : "BEFORE"}
          </text>
          <text x="70" y="100" {...mono} fontSize="12" letterSpacing="0.18em" fill={MUTED}>
            PHOTOGRAPH · 4.0 MB
          </text>
        </g>

        {/* ---------- flag list ---------- */}
        <g opacity={pFlag} {...bind("flag", "The visual system is insensitive to these fine details.")}>
          <rect x="620" y="140" width="420" height="196" rx="20" fill="#15161F"
            stroke={hot === "flag" ? RED : "#2A2C3A"} strokeWidth="1.4" />
          <text x="644" y="176" {...mono} fontSize="12.5" letterSpacing="0.18em" fill={RED}>
            MARKED IRRELEVANT
          </text>
          {["sun-ray texture", "cloud wisps", "grass strokes", "distant birds"].map((d, i) => (
            <g key={d} opacity={clamp01(pFlag * 2.4 - i * 0.3)}>
              <rect x="644" y={196 + i * 32} width="12" height="12" rx="3" fill={RED}
                opacity={0.55 + 0.45 * pulse} />
              <text x="668" y={207 + i * 32} {...mono} fontSize="13.5" fill="rgba(241,241,245,0.85)">
                {d}
              </text>
            </g>
          ))}
        </g>

        {/* ---------- size comparison ---------- */}
        <g opacity={pSize}>
          <text x="620" y="412" {...mono} fontSize="12.5" letterSpacing="0.18em" fill={MUTED}>
            FILE SIZE
          </text>
          <text x="620" y="452" {...mono} fontSize="13" fill={MUTED}>before</text>
          <rect x="700" y="438" width="320" height="18" rx="9" fill="#1B1D29" />
          <rect x="700" y="438" width={320 * pSize} height="18" rx="9" fill={MUTED} opacity="0.5" />
          <text x="1032" y="453" textAnchor="end" {...mono} fontSize="13" fontWeight="700"
            fill={MUTED}>4.0 MB</text>

          <text x="620" y="498" {...mono} fontSize="13" fill={GREEN}>after</text>
          <rect x="700" y="484" width="320" height="18" rx="9" fill="#1B1D29" />
          <rect x="700" y="484" width={Math.max(72, 320 * 0.225 * pSize)} height="18" rx="9"
            fill={GREEN} />
          <text x="1032" y="499" textAnchor="end" {...mono} fontSize="13" fontWeight="700"
            fill={GREEN}>0.9 MB</text>

          <rect x="620" y="524" width="420" height="50" rx="15" fill="rgba(61,220,151,0.1)"
            stroke={GREEN} strokeWidth="1.4" />
          <text x="830" y="555" textAnchor="middle" {...mono} fontSize="14" fontWeight="700"
            fill={GREEN} letterSpacing="0.06em">−77% · NO VISIBLE LOSS</text>
        </g>
      </svg>
      <TipBubble tip={tip} />
    </div>
  );
}
