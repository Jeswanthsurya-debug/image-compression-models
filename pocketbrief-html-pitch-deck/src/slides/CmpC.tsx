import { useState } from "react";
import { useTransport } from "../components/anim/core";
import { APPS_STEPS, AppsScene, JPEG_STEPS, JpegScene } from "../components/anim/CmpScenesC";
import { AnimSlide, Chip, SlideShell, Tilt, Title } from "../components/ui";

const r = (i: number) => ({ ["--i" as string]: i });

/* ===================== 11 · LOSSY · THE JPEG PIPELINE ===================== */

export function JpegSlide() {
  const tr = useTransport(JPEG_STEPS);
  return (
    <AnimSlide index={11} pill="11 · Lossy" topic="JPEG pipeline" title="Lossy: the JPEG pipeline"
      tr={tr} layout="bar"
      lead="Block → DCT → quantize → zigzag → entropy code. Drag the quality slider."
      foot="Quantization is where the loss lives">
      <JpegScene tr={tr} />
    </AnimSlide>
  );
}

/* ======================= 12 · LOSSLESS VS LOSSY ======================= */

const VROWS = [
  {
    label: "quantizer",
    hint: "the decisive block",
    lossless: "Removed — nothing is rounded away",
    lossy: "Kept — imperceptible detail is discarded",
  },
  {
    label: "exactness",
    hint: "f̂(x,y) vs f(x,y)",
    lossless: "Bit-for-bit identical, difference = 0",
    lossy: "An approximation, tuned by quality",
  },
  {
    label: "file size",
    hint: "typical ratios",
    lossless: "Modest — 2 : 1 to 5 : 1",
    lossy: "Large — 10 : 1 to 100 : 1",
  },
  {
    label: "examples",
    hint: "formats",
    lossless: "PNG · TIFF · GIF · LZW",
    lossy: "JPEG · JPEG 2000 · MPEG / H.264",
  },
  {
    label: "best for",
    hint: "when to use",
    lossless: "Medical, satellite, archival, text",
    lossy: "Photos, video, streaming, social",
  },
];

export function VsSlide() {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  return (
    <SlideShell index={12} pill="12 · Versus" topic="Lossless vs lossy" foot="Pick by what the data is for">
      <Title index={2}>Lossless vs lossy</Title>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div
          className="comparison-table reveal-soft mt-[clamp(14px,2.4vh,32px)] w-full overflow-hidden rounded-[24px] border border-line bg-card"
          style={r(3)}
        >
          <div className="comparison-head grid grid-cols-[minmax(120px,0.66fr)_1fr_1fr]">
            <div className="border-b border-line px-[clamp(16px,1.8vw,32px)] py-[clamp(13px,1.9vh,21px)]">
              <span className="mono-label text-[9px] text-[rgba(154,157,176,0.6)]">criterion</span>
            </div>
            <div className="border-b border-l border-line bg-[rgba(61,220,151,0.06)] px-[clamp(16px,1.8vw,32px)] py-[clamp(13px,1.9vh,21px)]">
              <span className="block text-[clamp(21px,2.1vw,33px)] font-extrabold leading-none tracking-[-0.04em] text-chalk">
                LOSSLESS
              </span>
              <span className="mono-label mt-[9px] block text-[8.5px] text-[#3DDC97]">
                exact · reversible
              </span>
            </div>
            <div className="border-b border-l border-line bg-[rgba(255,92,122,0.05)] px-[clamp(16px,1.8vw,32px)] py-[clamp(13px,1.9vh,21px)]">
              <span className="block text-[clamp(21px,2.1vw,33px)] font-extrabold leading-none tracking-[-0.04em] text-chalk">
                LOSSY
              </span>
              <span className="mono-label mt-[9px] block text-[8.5px] text-[#FF5C7A]">
                approximate · irreversible
              </span>
            </div>
          </div>

          {VROWS.map((row, i) => (
            <div
              key={row.label}
              role="button"
              tabIndex={0}
              aria-pressed={selectedRow === i}
              onClick={() => setSelectedRow(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedRow(i);
                }
              }}
              className={`comparison-row reveal group grid cursor-pointer transition-colors ${
                selectedRow === i ? "bg-[rgba(91,99,240,0.08)]" : ""
              } grid-cols-[minmax(120px,0.66fr)_1fr_1fr]`}
              style={r(4 + i)}
            >
              <div className="border-b border-line px-[clamp(16px,1.8vw,32px)] py-[clamp(14px,2.1vh,23px)]">
                <span className="mono-label block text-[10px] text-accent-light">{row.label}</span>
                <span className="mt-[8px] block font-mono text-[10.5px] leading-snug text-[rgba(154,157,176,0.65)]">
                  {row.hint}
                </span>
              </div>
              <div className="comparison-value comparison-svm border-b border-l border-line bg-[rgba(61,220,151,0.06)] px-[clamp(16px,1.8vw,32px)] py-[clamp(14px,2.1vh,23px)] transition-transform duration-300 group-hover:bg-[rgba(61,220,151,0.1)]">
                <span className="deck-copy text-[clamp(13px,1.1vw,16px)] leading-[1.5] text-[rgba(241,241,245,0.88)]">
                  {row.lossless}
                </span>
              </div>
              <div className="comparison-value comparison-cnn border-b border-l border-line bg-[rgba(255,92,122,0.05)] px-[clamp(16px,1.8vw,32px)] py-[clamp(14px,2.1vh,23px)] transition-colors duration-300 group-hover:bg-[rgba(255,92,122,0.09)]">
                <span className="deck-copy text-[clamp(13px,1.1vw,16px)] leading-[1.5] text-[rgba(241,241,245,0.88)]">
                  {row.lossy}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

/* ================= 13 · STANDARDS + WHICH TO USE WHEN ================= */

const STANDARDS = [
  { name: "JPEG", kind: "lossy", how: "DCT · 8×8 blocks", use: "photos · web", tone: "red" as const },
  { name: "JPEG 2000", kind: "lossy + lossless", how: "wavelets", use: "cinema · medical", tone: "accent" as const },
  { name: "PNG", kind: "lossless", how: "filter + LZW", use: "graphics · UI", tone: "green" as const },
  { name: "GIF", kind: "lossless", how: "LZW · 256 colours", use: "simple animation", tone: "green" as const },
  { name: "TIFF", kind: "lossless", how: "flexible · RLE/LZW", use: "print · archive", tone: "green" as const },
  { name: "MPEG / H.264", kind: "lossy video", how: "inter-frame prediction", use: "streaming · broadcast", tone: "red" as const },
];

const QUIZ = [
  { id: "ig", q: "Photo for Instagram?", options: ["JPEG", "TIFF"], correct: "JPEG", why: "small file, eye-friendly loss" },
  { id: "xr", q: "X-ray archive?", options: ["JPEG", "Lossless PNG"], correct: "Lossless PNG", why: "diagnosis needs every pixel" },
];

export function StandardsSlide() {
  const [ans, setAns] = useState<Record<string, string>>({});

  return (
    <SlideShell index={13} pill="13 · Standards" topic="Which codec when" foot="Six standards, two quiz questions">
      <Title index={2}>Standards: which one, when</Title>

      <div className="standards-grid mt-[clamp(12px,2.2vh,26px)] grid grid-cols-2 gap-[clamp(10px,1.1vw,18px)] md:grid-cols-3 [perspective:1400px]">
        {STANDARDS.map((st, i) => (
          <Tilt key={st.name} max={9} className="reveal h-full">
            <article
              className="standard-card depth-sm group flex h-full cursor-default flex-col rounded-[20px] border border-line bg-card p-[clamp(14px,1.4vw,24px)] transition-colors duration-300 hover:border-[rgba(91,99,240,0.5)]"
              style={{ ...r(3 + i), transformStyle: "preserve-3d" }}
            >
              <span className="flex items-center justify-between gap-2" style={{ transform: "translateZ(24px)" }}>
                <span className="standard-name text-[clamp(15px,1.4vw,21px)] font-extrabold tracking-[-0.02em] text-chalk">
                  {st.name}
                </span>
                <Chip tone={st.tone}>{st.kind}</Chip>
              </span>
              <span className="mono-label mt-3 block text-[9px] text-accent-light" style={{ transform: "translateZ(16px)" }}>
                {st.how}
              </span>
              <span className="mt-auto block pt-4 font-mono text-[11.5px] text-muted" style={{ transform: "translateZ(16px)" }}>
                → {st.use}
              </span>
            </article>
          </Tilt>
        ))}
      </div>

      {/* mini quiz */}
      <div className="mt-[clamp(12px,2.2vh,26px)] grid grid-cols-1 gap-[clamp(10px,1.1vw,18px)] md:grid-cols-2">
        {QUIZ.map((qz, i) => {
          const picked = ans[qz.id];
          return (
            <div
              key={qz.id}
              className="reveal rounded-[20px] border border-[rgba(91,99,240,0.35)] bg-[rgba(91,99,240,0.07)] px-[clamp(16px,1.6vw,28px)] py-[clamp(14px,2vh,22px)]"
              style={r(9 + i)}
            >
              <span className="mono-label text-[9px] text-accent-light">quick quiz 0{i + 1}</span>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="deck-copy text-[clamp(15px,1.4vw,20px)] font-bold tracking-[-0.015em] text-chalk">
                  {qz.q}
                </span>
                <span className="quiz-options flex gap-2">
                  {qz.options.map((op) => {
                    const chosen = picked === op;
                    const showState = picked !== undefined;
                    const isCorrect = op === qz.correct;
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setAns((a) => ({ ...a, [qz.id]: op }))}
                        className={`rounded-full border px-4 py-[8px] font-mono text-[12px] font-bold tracking-[0.02em] transition-all duration-300 ${
                          showState && isCorrect
                            ? "border-[#3DDC97] bg-[rgba(61,220,151,0.18)] text-[#3DDC97]"
                            : chosen && !isCorrect
                              ? "shake-x border-[#FF5C7A] bg-[rgba(255,92,122,0.16)] text-[#FF5C7A]"
                              : "border-line text-muted hover:border-[rgba(91,99,240,0.6)] hover:text-chalk"
                        }`}
                      >
                        {op}
                        {showState && isCorrect ? " ✓" : chosen && !isCorrect ? " ✗" : ""}
                      </button>
                    );
                  })}
                </span>
              </div>
              <p
                className={`mt-2 font-mono text-[11.5px] transition-opacity duration-500 ${
                  picked ? "opacity-100" : "opacity-0"
                } text-muted`}
              >
                → {qz.correct} · {qz.why}
              </p>
            </div>
          );
        })}
      </div>
    </SlideShell>
  );
}

/* ========================= 14 · APPLICATIONS ========================= */

export function AppsSlide() {
  const tr = useTransport(APPS_STEPS);
  return (
    <AnimSlide index={14} pill="14 · Applications" topic="In the wild" title="Where it all runs"
      tr={tr} layout="bar" foot="DICOM · remote sensing · OTT · cloud">
      <AppsScene tr={tr} />
    </AnimSlide>
  );
}

/* =========================== 15 · SUMMARY =========================== */

const TAKEAWAYS = [
  ["Redundancy is the opportunity", "Coding, spatial/temporal and psychovisual — compression removes exactly these three."],
  ["Measure it", "CR = n₁/n₂ tells the win; RD = 1 − 1/CR tells what was removed; entropy H is the floor."],
  ["One model explains all", "Mapper → quantizer → symbol encoder. Delete the quantizer and compression becomes lossless."],
  ["Pick by the data", "Every pixel sacred → lossless. The eye forgives → JPEG and friends."],
];

export function SummarySlide() {
  return (
    <SlideShell index={15} pill="15 · Summary" topic="Takeaways" foot="Presented by Jeswanth Surya">
      <Title index={2}>Four things to keep</Title>

      <div className="summary-grid mt-[clamp(12px,2.4vh,30px)] grid grid-cols-1 gap-[clamp(10px,1.2vw,20px)] md:grid-cols-2 [perspective:1400px]">
        {TAKEAWAYS.map(([h, b], i) => (
          <Tilt key={h} max={5} className="reveal h-full">
            <article
              className="summary-card depth-sm group flex h-full items-start gap-5 rounded-[20px] border border-line bg-card p-[clamp(16px,1.6vw,26px)] transition-colors duration-300 hover:border-[rgba(91,99,240,0.5)]"
              style={{ ...r(3 + i), transformStyle: "preserve-3d" }}
            >
              <span className="num-dim text-[clamp(34px,3.2vw,48px)] font-extrabold leading-none tracking-[-0.06em]"
                style={{ transform: "translateZ(28px)" }}>
                0{i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[clamp(15px,1.4vw,20px)] font-extrabold leading-tight tracking-[-0.02em] text-chalk">
                  {h}
                </span>
                <span className="deck-copy mt-2 block text-[clamp(12.5px,1vw,14.5px)] leading-[1.62] text-muted">
                  {b}
                </span>
              </span>
            </article>
          </Tilt>
        ))}
      </div>

      <div className="summary-bottom mt-auto flex flex-wrap items-end justify-between gap-8 pt-[clamp(16px,3.6vh,48px)]">
        <div className="reveal max-w-[420px]" style={r(7)}>
          <span className="mono-label text-[9.5px] text-muted">image processing · unit V</span>
          <p className="mt-4 text-[clamp(12.5px,1vw,14.5px)] leading-[1.7] text-[rgba(154,157,176,0.92)]">
            Based on <span className="text-chalk">Gonzalez &amp; Woods, Digital Image Processing</span>.
            Presented by <span className="text-chalk">Jeswanth Surya</span>
            <span className="text-accent">.</span>
          </p>
        </div>

        <h2
          className="summary-thankyou reveal text-[clamp(2.2rem,7.4vw,6.2rem)] font-extrabold leading-[0.86] tracking-[-0.05em] text-chalk"
          style={r(8)}
        >
          Thank you<span className="text-accent">.</span>
          <span className="block text-[clamp(1.2rem,3.4vw,2.8rem)] text-[rgba(241,241,245,0.4)]">
            Questions?
          </span>
        </h2>
      </div>
    </SlideShell>
  );
}
