import { useState } from "react";
import {
  easeInOut, lerp, seg, timeline, useTransport,
  type Step, type Transport,
} from "../components/anim/core";
import { TipBubble, useTip } from "../components/anim/Controls";
import { HUFF_STEPS, HuffScene, SIZE_STEPS, SizeScene } from "../components/anim/CmpScenesA";
import { AnimSlide, Chip, Lead, SlideShell, Tilt, Title } from "../components/ui";

const r = (i: number) => ({ ["--i" as string]: i });

/* ============================== 01 · COVER ============================== */

export function CoverSlide() {
  return (
    <SlideShell
      index={1}
      pill="01 · Cover"
      foot="Presented by Jeswanth Surya"
      rightSlot={
        <span className="reveal mono-label text-[10px] text-muted" style={r(1)}>
          Image processing&nbsp;&nbsp;/&nbsp;&nbsp;Unit V
        </span>
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h1 className="title-cover">
            <span className="reveal block text-chalk" style={r(1)}>
              Image
            </span>
            <span className="reveal block text-[rgba(241,241,245,0.3)]" style={r(2)}>
              Compression<span className="text-accent">.</span>
            </span>
          </h1>

          <p
            className="reveal mt-[clamp(18px,3.2vh,36px)] max-w-[640px] text-[clamp(14px,1.3vw,19px)] leading-[1.65] text-muted"
            style={r(3)}
          >
            Models and Types — <span className="text-chalk">Unit V</span>, after Gonzalez &amp;
            Woods. Fewer bits, same picture: the mathematics of throwing away
            only what nobody will miss.
          </p>

          <div className="reveal mt-[clamp(22px,4.6vh,54px)] flex flex-wrap items-center gap-3" style={r(4)}>
            <span className="mono-label text-[10px] text-muted">Presented by</span>
            <span className="flex items-center gap-3 rounded-[18px] border border-line bg-card px-5 py-[12px]">
              <span className="num-dim text-[22px] font-extrabold leading-none tracking-[-0.05em]"
                style={{ color: "rgba(91,99,240,0.85)" }}>
                01
              </span>
              <span className="text-[16px] font-bold tracking-[-0.01em] text-chalk">
                Jeswanth Surya
              </span>
            </span>
            <Chip tone="accent">15 slides · 9 animated</Chip>
          </div>
        </div>

        {/* floating pixels motif */}
        <div className="relative hidden h-[340px] lg:block" aria-hidden>
          <div className="absolute left-[8%] top-[6%] h-[86px] w-[86px]" style={{ perspective: "900px" }}>
            <div className="bob h-full w-full rounded-[18px] border border-[rgba(91,99,240,0.5)] bg-[rgba(91,99,240,0.1)]"
              style={{ transform: "rotateX(24deg) rotateY(-28deg)", animationDelay: "0s" }} />
          </div>
          <div className="absolute left-[42%] top-[0%] h-[58px] w-[58px]" style={{ perspective: "900px" }}>
            <div className="bob h-full w-full rounded-[14px] border border-line bg-card"
              style={{ transform: "rotateX(30deg) rotateY(20deg)", animationDelay: "1.2s" }} />
          </div>
          <div className="absolute left-[64%] top-[30%] h-[108px] w-[108px]" style={{ perspective: "900px" }}>
            <div className="bob-slow h-full w-full rounded-[20px] border border-[rgba(138,144,255,0.55)] bg-[rgba(91,99,240,0.14)] depth-sm"
              style={{ transform: "rotateX(20deg) rotateY(-18deg)", animationDelay: "0.6s" }}>
              <div className="grid h-full w-full grid-cols-3 gap-[6px] p-[10px]">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="rounded-[4px]"
                    style={{ background: i % 3 === 0 ? "rgba(138,144,255,0.75)" : "rgba(138,144,255,0.2)" }} />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute left-[24%] top-[58%] h-[44px] w-[44px]" style={{ perspective: "900px" }}>
            <div className="bob h-full w-full rounded-[12px] border border-line bg-card-hi"
              style={{ transform: "rotateX(26deg) rotateY(26deg)", animationDelay: "2s" }} />
          </div>
          <div className="absolute left-[52%] top-[72%] w-[240px]">
            <div className="mono-label mb-2 text-[9px] text-muted">12 px → 3 pairs</div>
            <div className="flex items-center gap-2">
              <span className="h-[14px] flex-1 rounded-full bg-[rgba(241,241,245,0.25)]" />
              <span className="text-accent">→</span>
              <span className="h-[14px] w-[26%] rounded-full bg-accent shadow-[0_0_18px_rgba(91,99,240,0.8)]" />
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

/* ========================== 02 · WHY COMPRESSION ========================== */

export function WhySlide() {
  const tr = useTransport(SIZE_STEPS);
  return (
    <AnimSlide index={2} pill="02 · Motivation" topic="Why compress" title="Why compression"
      tr={tr} foot="Bits add up fast">
      <SizeScene tr={tr} />
    </AnimSlide>
  );
}

/* =========================== 03 · KEY TERMS =========================== */

const TERMS_STEPS: Step[] = timeline(
  [
    ["ratios", "CR and RD", "10 MB compressed to 2 MB: the ratio is 5 : 1 and 80% of the data was redundant."],
    ["entropy", "The entropy floor", "Entropy H is the hard lower limit — no lossless code can beat it."],
  ],
  3600
);

const CHALK = "#F1F1F5";
const MUTED = "#9A9DB0";
const LIGHT = "#8A90FF";
const GREEN = "#3DDC97";
const mono = { fontFamily: "var(--font-mono)" } as const;

function TermsScene({ tr }: { tr: Transport }) {
  const { ref, tip, bind } = useTip();
  const t = tr.t;
  const pA = easeInOut(seg(t, 0.04, 0.42));
  const pB = easeInOut(seg(t, 0.55, 0.92));
  const cr = lerp(1, 5, pA);
  const rd = lerp(0, 0.8, pA);

  return (
    <div ref={ref} className="relative h-full w-full">
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 520" className="h-full w-full" role="img"
      aria-label="Compression ratio, relative redundancy and the entropy lower bound">
      <defs>
        <pattern id="tmMesh" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
        </pattern>
      </defs>
      <rect width="1100" height="520" fill="url(#tmMesh)" />

      <g {...bind("ratios", "10 MB divided by 2 MB gives CR 5:1 and RD 80%.")}>
      {/* CR / RD example */}
      <text x="60" y="84" {...mono} fontSize="13" letterSpacing="0.2em" fill={MUTED}>
        EXAMPLE · 10 MB → 2 MB
      </text>

      <text x="60" y="150" {...mono} fontSize="14" fill={MUTED}>n₁ original</text>
      <rect x="210" y="132" width="460" height="26" rx="13" fill="#1B1D29" />
      <rect x="210" y="132" width={460 * pA} height="26" rx="13" fill={LIGHT} opacity="0.85" />
      <text x="686" y="152" {...mono} fontSize="15" fontWeight="700" fill={CHALK}>
        10 MB
      </text>

      <text x="60" y="206" {...mono} fontSize="14" fill={MUTED}>n₂ compressed</text>
      <rect x="210" y="188" width="460" height="26" rx="13" fill="#1B1D29" />
      <rect x="210" y="188" width={Math.max(92, 460 * 0.2 * pA)} height="26" rx="13"
        fill={GREEN} opacity="0.9" />
      <text x="686" y="208" {...mono} fontSize="15" fontWeight="700" fill={GREEN}>
        2 MB
      </text>

      <rect x="60" y="252" width="300" height="118" rx="20" fill="#15161F" stroke="#2A2C3A"
        strokeWidth="1.4" />
      <text x="84" y="288" {...mono} fontSize="12.5" letterSpacing="0.16em" fill={MUTED}>
        CR = n₁ / n₂
      </text>
      <text x="84" y="344" fontSize="44" fontWeight="800" letterSpacing="-0.03em" fill={CHALK}>
        {cr.toFixed(1)} : 1
      </text>

      <rect x="380" y="252" width="300" height="118" rx="20" fill="#15161F" stroke="#2A2C3A"
        strokeWidth="1.4" />
      <text x="404" y="288" {...mono} fontSize="12.5" letterSpacing="0.16em" fill={MUTED}>
        RD = 1 − 1/CR
      </text>
      <text x="404" y="344" fontSize="44" fontWeight="800" letterSpacing="-0.03em" fill={LIGHT}>
        {(rd * 100).toFixed(0)}%
      </text>
      </g>

      {/* entropy floor */}
      <g opacity={pB} {...bind("entropy", "Entropy H is the lower bound on average bits per symbol.")}>
        <text x="60" y="436" {...mono} fontSize="13" letterSpacing="0.2em" fill={MUTED}>
          ENTROPY · THE LOWER LIMIT
        </text>
        <text x="760" y="120" {...mono} fontSize="13.5" fill={CHALK}>bits / symbol</text>

        <text x="760" y="170" {...mono} fontSize="13" fill={MUTED}>fixed code</text>
        <rect x="880" y="154" width="170" height="20" rx="10" fill="#1B1D29" />
        <rect x="880" y="154" width={170 * pB} height="20" rx="10" fill={MUTED} opacity="0.55" />
        <text x="1058" y="170" textAnchor="end" {...mono} fontSize="13" fontWeight="700"
          fill={MUTED}>2.00</text>

        <text x="760" y="224" {...mono} fontSize="13" fill={LIGHT}>huffman</text>
        <rect x="880" y="208" width="170" height="20" rx="10" fill="#1B1D29" />
        <rect x="880" y="208" width={170 * 0.875 * pB} height="20" rx="10" fill={LIGHT} />
        <text x="1058" y="224" textAnchor="end" {...mono} fontSize="13" fontWeight="700"
          fill={LIGHT}>1.75</text>

        <path d={`M${880 + 170 * 0.875} 128 L${880 + 170 * 0.875} 244`} stroke={GREEN}
          strokeWidth="2" strokeDasharray="6 6" opacity={pB} />
        <rect x="760" y="252" width="300" height="104" rx="18" fill="rgba(61,220,151,0.08)"
          stroke={GREEN} strokeWidth="1.4" />
        <text x="782" y="286" {...mono} fontSize="12.5" fill={GREEN} letterSpacing="0.06em">
          H = −Σ pᵢ · log₂ pᵢ
        </text>
        <text x="782" y="316" {...mono} fontSize="12.5" fill={CHALK}>
          = 1.75 bits · no lossless code
        </text>
        <text x="782" y="338" {...mono} fontSize="12.5" fill={CHALK}>
          can go below this floor
        </text>
      </g>
    </svg>
    <TipBubble tip={tip} />
    </div>
  );
}

export function TermsSlide() {
  const tr = useTransport(TERMS_STEPS);
  return (
    <AnimSlide index={3} pill="03 · Definitions" topic="Key terms" title="The measures that matter"
      tr={tr} foot="CR · RD · entropy">
      <TermsScene tr={tr} />
    </AnimSlide>
  );
}

/* ====================== 04 · THREE TYPES OF REDUNDANCY ====================== */

const REDUN = [
  {
    n: "01",
    name: "Coding",
    line: "The codes used to represent symbols cost more bits than they need.",
    fix: "killed by Huffman · LZW",
    motif: (
      <svg viewBox="0 0 120 70" className="h-[64px] w-[110px]" aria-hidden>
        <rect x="4" y="8" width="30" height="30" rx="7" fill="none" stroke="#8A90FF" strokeWidth="2" />
        <text x="19" y="30" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="15"
          fontWeight="700" fill="#F1F1F5">01</text>
        <rect x="46" y="8" width="66" height="30" rx="7" fill="rgba(255,92,122,0.12)"
          stroke="#FF5C7A" strokeWidth="1.6" strokeDasharray="4 4" />
        <text x="79" y="30" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12"
          fill="#FF5C7A">wasted</text>
        <rect x="4" y="46" width="30" height="18" rx="6" fill="rgba(61,220,151,0.16)"
          stroke="#3DDC97" strokeWidth="1.6" />
        <text x="19" y="60" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11"
          fill="#3DDC97">0</text>
      </svg>
    ),
  },
  {
    n: "02",
    name: "Spatial & Temporal",
    line: "Neighbouring pixels — and neighbouring frames — repeat each other endlessly.",
    fix: "killed by RLE · prediction",
    motif: (
      <svg viewBox="0 0 120 70" className="h-[64px] w-[110px]" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={4 + (i % 6) * 19} y={6 + Math.floor(i / 6) * 19} width="16" height="16"
            rx="4" fill={i % 6 < 4 ? "rgba(138,144,255,0.55)" : "rgba(138,144,255,0.14)"} />
        ))}
        <path d="M10 58 L108 58" stroke="#3DDC97" strokeWidth="2" strokeDasharray="5 5" />
        <text x="59" y="70" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9"
          fill="#3DDC97">one run</text>
      </svg>
    ),
  },
  {
    n: "03",
    name: "Irrelevant · Psychovisual",
    line: "Some detail is simply invisible to the human eye, so it can be discarded.",
    fix: "killed by quantization",
    motif: (
      <svg viewBox="0 0 120 70" className="h-[64px] w-[110px]" aria-hidden>
        <path d="M10 35 q50 -34 100 0 q-50 34 -100 0 Z" fill="none" stroke="#8A90FF"
          strokeWidth="2" />
        <circle cx="60" cy="35" r="13" fill="none" stroke="#F1F1F5" strokeWidth="2" />
        <circle cx="60" cy="35" r="5.5" fill="#5B63F0" />
        <path d="M86 20 L104 8 M88 32 L110 28" stroke="#FF5C7A" strokeWidth="1.6"
          strokeDasharray="3 4" />
      </svg>
    ),
  },
];

export function RedundancySlide() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <SlideShell index={4} pill="04 · Redundancy" topic="Three types"
      foot="Coding · Spatial/Temporal · Psychovisual">
      <Title index={2}>Three kinds of redundancy</Title>
      <Lead index={3}>
        Compression is only possible because data carries more bits than the
        information it actually holds.
      </Lead>

      <div className="mt-[clamp(16px,3vh,40px)] grid min-h-0 flex-1 grid-cols-1 items-stretch gap-[clamp(14px,1.5vw,26px)] md:grid-cols-3 [perspective:1400px]">
        {REDUN.map((c, i) => (
          <Tilt key={c.n} max={8} className="reveal h-full" >
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(i);
                }
              }}
              className={`depth group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border bg-card p-[clamp(22px,2vw,34px)] text-left transition-colors duration-300 ${
                selected === i
                  ? "border-accent bg-[rgba(91,99,240,0.13)]"
                  : "border-line hover:border-[rgba(91,99,240,0.5)]"
              }`}
              style={{ ...r(4 + i), transformStyle: "preserve-3d" }}
            >
              <span className="num-dim pointer-events-none absolute -right-[10px] -top-[44px] text-[clamp(100px,10vw,158px)] font-extrabold leading-none tracking-[-0.07em]"
                style={{ transform: "translateZ(36px)" }}>
                {c.n}
              </span>
              <span className="flip-in" style={{ ...r(4 + i), transform: "translateZ(30px)" }}>
                {c.motif}
              </span>
              <h3 className="relative mt-[22px] text-[clamp(21px,1.9vw,29px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-chalk"
                style={{ transform: "translateZ(26px)" }}>
                {c.name}
              </h3>
              <p className="relative mt-4 text-[clamp(13px,1.05vw,15.5px)] leading-[1.68] text-muted"
                style={{ transform: "translateZ(18px)" }}>
                {c.line}
              </p>
              <span className="relative mt-auto pt-8" style={{ transform: "translateZ(22px)" }}>
                <Chip tone="accent">{c.fix}</Chip>
              </span>
            </div>
          </Tilt>
        ))}
      </div>
    </SlideShell>
  );
}

/* ======================= 05 · CODING REDUNDANCY ======================= */

export function HuffmanSlide() {
  const tr = useTransport(HUFF_STEPS);
  return (
    <AnimSlide index={5} pill="05 · Coding" topic="Huffman coding" title="Coding redundancy"
      tr={tr} foot="Short codes for frequent symbols">
      <HuffScene tr={tr} />
    </AnimSlide>
  );
}
