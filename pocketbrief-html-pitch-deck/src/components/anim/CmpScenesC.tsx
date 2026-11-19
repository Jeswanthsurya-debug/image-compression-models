import { useEffect, useState, type CSSProperties } from "react";
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
/*  SLIDE 11 — lossy · the JPEG pipeline                              */
/* ================================================================== */

export const JPEG_STEPS: Step[] = timeline(
  [
    ["block", "8×8 block", "JPEG splits the image into 8×8 blocks of pixel values."],
    ["dct", "DCT", "The discrete cosine transform packs the energy into the top-left corner."],
    ["quant", "Quantize", "Small coefficients are divided away to zero — this is the lossy part."],
    ["zigzag", "Zigzag scan", "The matrix unrolls into one run of numbers, zeros trailing behind."],
    ["entropy", "Entropy coding", "Run-length + Huffman squeeze the zeros into a tiny bitstream."],
  ],
  2900
);

const DCT = Array.from({ length: 8 }, (_, r) =>
  Array.from({ length: 8 }, (_, c) => {
    const mag = (7.4 - r * 0.92) * (7.4 - c * 0.92) * 1.55;
    const sgn = hash(r * 3 + 1, c * 7 + 2) > 0.42 ? 1 : -1;
    return Math.round(mag * sgn);
  })
);

const zigzag: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let sum = 0; sum <= 14; sum++) {
    if (sum % 2 === 0)
      for (let r = Math.min(sum, 7); r >= Math.max(0, sum - 7); r--) out.push([r, sum - r]);
    else for (let r = Math.max(0, sum - 7); r <= Math.min(sum, 7); r++) out.push([r, sum - r]);
  }
  return out;
})();

const IN8 = Array.from({ length: 8 }, (_, r) =>
  Array.from({ length: 8 }, (_, c) => 120 + Math.round((7 - r) * 9 + hash(r, c) * 26))
);

const prevVal = (r: number, c: number) => {
  if (r < 6) return 165 + r * 8 + (c > 7 ? 14 : 0);
  if (r >= 6 && r <= 7 && c > 2 && c < 6) return 235; // sun
  return 82 - (r - 6) * 10 + (c % 3) * 6;
};

export function JpegScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const t = tr.t;
  const step = tr.step;
  const [quality, setQuality] = useState(72);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 699px) and (orientation: portrait)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pIn = easeOut(seg(t, 0.02, 0.14));
  const pDct = easeInOut(seg(t, 0.22, 0.38));
  const pQuant = easeInOut(seg(t, 0.42, 0.58));
  const pZig = easeInOut(seg(t, 0.62, 0.78));
  const pEnt = easeInOut(seg(t, 0.82, 0.96));

  const Q = Math.round(lerp(34, 1, quality / 100));
  const QUANT = DCT.map((row) => row.map((v) => Math.round(v / Q)));
  const zeroCells: [number, number][] = [];
  QUANT.forEach((row, r) => row.forEach((v, c) => { if (v === 0) zeroCells.push([r, c]); }));
  zeroCells.sort(([r1, c1], [r2, c2]) => Math.abs(DCT[r1][c1]) - Math.abs(DCT[r2][c2]));
  const shownZeros = Math.floor(pQuant * zeroCells.length);
  const isZeroShown = (r: number, c: number) =>
    zeroCells.findIndex(([zr, zc]) => zr === r && zc === c) < shownZeros;

  const bits = Math.max(10, 64 - zeroCells.length);
  const bitStr = Array.from({ length: 42 }, (_, i) => (hash(i, quality) > 0.5 ? "1" : "0")).join("");
  const sizeKB = Math.round(lerp(64, 840, quality / 100));
  const bs = quality >= 75 ? 1 : quality >= 50 ? 2 : quality >= 28 ? 4 : 6;

  const cell = 30;
  const zzLine = zigzag
    .map(([r, c], i) => `${i === 0 ? "M" : "L"}${380 + c * cell + cell / 2} ${150 + r * cell + cell / 2}`)
    .join(" ");

  return (
    <div ref={ref} className="relative h-full w-full">
      {phone ? (
        <div className="jpeg-portrait-layout h-full w-full">
          <MobileJpegDiagram
            t={t}
            quality={quality}
            q={Q}
            quantized={QUANT}
            pIn={pIn}
            pDct={pDct}
            pQuant={pQuant}
            pZig={pZig}
            pEnt={pEnt}
            sizeKB={sizeKB}
            bind={bind}
          />
          <div className="jpeg-quality-mobile">
            <span className="quality-label text-[#FF9DB0]">LOW</span>
            <input
              type="range"
              min={5}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="qslider"
              style={{ ["--fill" as string]: `${quality}%` } as CSSProperties}
              aria-label="JPEG quality"
            />
            <span className="quality-label text-[#8FE8C3]">HIGH</span>
            <span className="font-mono text-[10px] text-accent-light">{quality}</span>
          </div>
        </div>
      ) : (
        <>
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1200 640" className="h-full w-full" role="img"
        aria-label="JPEG pipeline: block, DCT, quantization, zigzag scan and entropy coding">
        <defs>
          <pattern id="jpMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
        </defs>
        <rect width="1200" height="640" fill="url(#jpMesh)" />

        {/* ---------- 8x8 block ---------- */}
        <g opacity={pIn} {...bind("block", "An 8×8 block of raw pixel values (0–255).")}>
          <rect x="48" y="140" width="260" height="260" rx="16"
            fill={hot === "block" ? "#1B1D29" : "#15161F"}
            stroke={hot === "block" ? LIGHT : "#2A2C3A"} strokeWidth="1.5" />
          {IN8.map((row, r) =>
            row.map((v, c) => (
              <g key={`${r}${c}`} opacity={clamp01(pIn * 2.4 - (r + c) * 0.05)}>
                <rect x={56 + c * 30} y={148 + r * 30} width="27" height="27" rx="5"
                  fill="#101119" stroke="#2A2C3A" strokeWidth="1" />
                <text x={56 + c * 30 + 13.5} y={148 + r * 30 + 18.5} textAnchor="middle"
                  {...mono} fontSize="10" fill={r % 2 ? LIGHT : MUTED}>{v}</text>
              </g>
            ))
          )}
          <text x="178" y="122" textAnchor="middle" {...mono} fontSize="12" letterSpacing="0.16em"
            fill={MUTED}>8×8 BLOCK</text>
        </g>

        {/* ---------- DCT ---------- */}
        <g opacity={pDct} {...bind("dct", "DCT: energy concentrates in the low-frequency corner.")}>
          <path d="M318 270 L362 270" stroke={LIGHT} strokeWidth="2.2" fill="none"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pDct} />
          <rect x="372" y="140" width="260" height="260" rx="16"
            fill={hot === "dct" ? "#1B1D29" : "#15161F"}
            stroke={hot === "dct" ? LIGHT : "#2A2C3A"} strokeWidth="1.5" />
          {DCT.map((row, r) =>
            row.map((v, c) => {
              const mag = clamp01(Math.abs(v) / 95);
              return (
                <g key={`${r}${c}`} opacity={clamp01(pDct * 2.4 - (r + c) * 0.04)}>
                  <rect x={380 + c * 30} y={148 + r * 30} width="27" height="27" rx="5"
                    fill={ACCENT} opacity={0.08 + mag * 0.5} />
                  <text x={380 + c * 30 + 13.5} y={148 + r * 30 + 18.5} textAnchor="middle"
                    {...mono} fontSize="9.5" fill={mag > 0.4 ? CHALK : MUTED}>{v}</text>
                </g>
              );
            })
          )}
          <text x="502" y="122" textAnchor="middle" {...mono} fontSize="12" letterSpacing="0.16em"
            fill={MUTED}>DCT COEFFICIENTS</text>
        </g>

        {/* ---------- quantized + zigzag ---------- */}
        <g opacity={pQuant} {...bind("quant", `Quantization: divide by Q = ${Q}, then round. Small values die.`)}>
          <path d="M642 270 L686 270" stroke={LIGHT} strokeWidth="2.2" fill="none"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pQuant} />
          <rect x="696" y="140" width="260" height="260" rx="16"
            fill={hot === "quant" ? "#1B1D29" : "#15161F"}
            stroke={hot === "quant" ? RED : "#2A2C3A"}
            strokeWidth={hot === "quant" ? 2 : 1.5} />
          {QUANT.map((row, r) =>
            row.map((v, c) => {
              const dead = v === 0 && isZeroShown(r, c);
              return (
                <g key={`${r}${c}`} opacity={clamp01(pQuant * 2.4 - (r + c) * 0.04)}>
                  <rect x={704 + c * 30} y={148 + r * 30} width="27" height="27" rx="5"
                    fill={dead ? "rgba(255,92,122,0.16)" : "#101119"}
                    stroke={dead ? RED : "#2A2C3A"} strokeWidth="1" />
                  <text x={704 + c * 30 + 13.5} y={148 + r * 30 + 18.5} textAnchor="middle"
                    {...mono} fontSize="9.5" fill={dead ? RED : v === 0 ? MUTED : CHALK}>
                    {v}
                  </text>
                </g>
              );
            })
          )}
          <text x="826" y="122" textAnchor="middle" {...mono} fontSize="12" letterSpacing="0.16em"
            fill={RED}>QUANTIZED · Q = {Q}</text>
          <text x="826" y="430" textAnchor="middle" {...mono} fontSize="12" fill={RED}>
            {zeroCells.length} of 64 → 0
          </text>

          {/* zigzag path */}
          <path d={zzLine} fill="none" stroke={LIGHT} strokeWidth="2" opacity={0.85 * pZig}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pZig} />
        </g>

        {/* ---------- zigzag stream ---------- */}
        <g opacity={pZig} {...bind("zz", "Zigzag order groups the trailing zeros into long runs.")}>
          <text x="60" y="486" {...mono} fontSize="12" letterSpacing="0.16em" fill={MUTED}>
            ZIGZAG → RUN OF SYMBOLS
          </text>
          {zigzag.slice(0, 16).map(([r, c], i) => {
            const v = QUANT[r][c];
            const d = clamp01(pZig * 2.4 - i * 0.1);
            return (
              <g key={i} opacity={d}>
                <rect x={60 + i * 52} y="500" width="44" height="40" rx="9"
                  fill={v === 0 ? "rgba(255,92,122,0.14)" : "rgba(91,99,240,0.16)"}
                  stroke={v === 0 ? RED : ACCENT} strokeWidth="1.2" />
                <text x={60 + i * 52 + 22} y="526" textAnchor="middle" {...mono} fontSize="13"
                  fontWeight="700" fill={v === 0 ? RED : LIGHT}>{v}</text>
              </g>
            );
          })}
          <text x={60 + 16 * 52 + 8} y="526" {...mono} fontSize="15" fill={MUTED}>… +48 more</text>
        </g>

        {/* ---------- entropy + size + preview ---------- */}
        <g opacity={pEnt} {...bind("ent", "Run-length + Huffman: long zero runs cost almost nothing.")}>
          <rect x="60" y="556" width="560" height="52" rx="14" fill="#15161F"
            stroke={hot === "ent" ? LIGHT : "#2A2C3A"} strokeWidth="1.4" />
          <text x="80" y="588" {...mono} fontSize="13" fill={LIGHT} letterSpacing="0.08em">
            {bitStr.slice(0, Math.round(bitStr.length * pEnt))}
          </text>
          <text x="600" y="588" textAnchor="end" {...mono} fontSize="13" fontWeight="700"
            fill={GREEN}>≈ {sizeKB} KB · {bits} bits left</text>

          {/* preview */}
          <g {...bind("preview", "Reconstruction: high quality sharp, low quality blocky.")}>
            <rect x="950" y="452" width="196" height="156" rx="16" fill="#101119"
              stroke={hot === "preview" ? LIGHT : "#2A2C3A"} strokeWidth="1.5" />
            {Array.from({ length: 12 / bs }, (_, br) =>
              Array.from({ length: 12 / bs }, (_, bc) => {
                const v = prevVal(br * bs, bc * bs);
                const light = v > 150;
                return (
                  <rect key={`${br}${bc}`} x={958 + bc * bs * 15} y={460 + br * bs * 15}
                    width={bs * 15 - 1} height={bs * 15 - 1} rx={bs === 1 ? 3 : 1}
                    fill={light ? LIGHT : "#232741"}
                    opacity={light ? 0.35 + (v - 150) / 160 : 0.55 + v / 260} />
                );
              })
            )}
            <text x="1048" y="440" textAnchor="middle" {...mono} fontSize="11.5"
              letterSpacing="0.14em" fill={MUTED}>
              RECONSTRUCTED · q={quality}
            </text>
          </g>
        </g>

        {/* step indicator */}
        <text x="1140" y="66" textAnchor="end" {...mono} fontSize="12" fill={MUTED}>
          {JPEG_STEPS[Math.min(step, 4)].label.toUpperCase()}
        </text>
      </svg>

      {/* quality slider */}
      <div className="absolute inset-x-5 bottom-4 flex items-center gap-4 rounded-full border border-line bg-[rgba(11,12,18,0.88)] px-5 py-3 backdrop-blur-sm">
        <span className="mono-label shrink-0 text-[9px] text-[#FF9DB0]">low q · blocky</span>
        <input
          type="range"
          min={5}
          max={100}
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="qslider min-w-[80px] flex-1"
          style={{ ["--fill" as string]: `${quality}%` } as CSSProperties}
          aria-label="JPEG quality"
        />
        <span className="mono-label shrink-0 text-[9px] text-[#8FE8C3]">high q · sharp</span>
        <span className="mono-label min-w-[96px] shrink-0 text-right text-[10px] text-accent-light">
          q = {quality} · Q = {Q}
        </span>
      </div>
        </>
      )}

      <TipBubble tip={tip} />
    </div>
  );
}

function MobileJpegDiagram({
  t,
  quality,
  q,
  quantized,
  pIn,
  pDct,
  pQuant,
  pZig,
  pEnt,
  sizeKB,
  bind,
}: {
  t: number;
  quality: number;
  q: number;
  quantized: number[][];
  pIn: number;
  pDct: number;
  pQuant: number;
  pZig: number;
  pEnt: number;
  sizeKB: number;
  bind: ReturnType<typeof useTip>["bind"];
}) {
  const zeros = quantized.flat().filter((v) => v === 0).length;
  const pulse = 0.5 + 0.5 * Math.sin(t * 36);
  const heat = (r: number, c: number) => Math.max(0.08, 0.85 - (r + c) * 0.085);
  const stream = Array.from({ length: 9 }, (_, i) => (hash(i, quality) > 0.58 ? 1 : 0));
  const previewCols = quality < 34 ? 3 : 6;
  const previewRows = quality < 34 ? 2 : 4;
  const previewCell = quality < 34 ? 28 : 14;

  return (
    <svg className="jpeg-portrait-svg" viewBox="0 0 360 360" width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet" role="img" aria-label="JPEG stages in a vertical phone layout">
      {/* raw 8 × 8 block */}
      <g opacity={pIn} {...bind("block", "JPEG starts with one 8×8 block of pixel values.")}>
        <text x="14" y="20" fontFamily="var(--font-mono)" fontSize="17" fontWeight="700"
          letterSpacing="0.5" fill={CHALK}>01 · 8×8 INPUT</text>
        {IN8.map((row, r) => row.map((v, c) => (
          <rect key={`${r}-${c}`} x={14 + c * 13} y={28 + r * 13} width="11.5" height="11.5" rx="2"
            fill={v > 165 ? "#F1F1F5" : "#40445B"} opacity={0.35 + (v / 255) * 0.65} />
        )))}
        <text x="126" y="61" fontFamily="var(--font-mono)" fontSize="14" fill={MUTED}>64 pixel values</text>
        <text x="126" y="82" fontFamily="var(--font-mono)" fontSize="14" fill={MUTED}>one 8×8 block</text>
        <text x="228" y="20" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700"
          letterSpacing="0.4" fill={MUTED}>PREVIEW</text>
        <g {...bind("preview", "Quality changes the reconstructed picture and file size.")}>
          {Array.from({ length: previewRows * previewCols }, (_, i) => {
            const rr = Math.floor(i / previewCols);
            const cc = i % previewCols;
            const value = prevVal(rr * (quality < 34 ? 3 : 2), cc * (quality < 34 ? 2 : 1));
            return (
              <rect key={i} x={228 + cc * previewCell} y={29 + rr * previewCell}
                width={previewCell - 1} height={previewCell - 1} rx={quality < 34 ? 1 : 3}
                fill={value > 150 ? LIGHT : "#252A43"}
                opacity={value > 150 ? 0.32 + (value - 150) / 180 : 0.5 + value / 280} />
            );
          })}
        </g>
      </g>

      {/* DCT, quantization, zigzag and entropy continue down the phone frame. */}
      <path d="M180 143 L180 153" stroke={LIGHT} strokeWidth="1.6" />
      <g opacity={pDct} {...bind("dct", "DCT moves image energy into low-frequency coefficients.")}>
        <text x="14" y="173" fontFamily="var(--font-mono)" fontSize="17" fontWeight="700"
          letterSpacing="0.5" fill={CHALK}>02 · DCT</text>
        <g transform="translate(16 181)">
          {Array.from({ length: 16 }, (_, i) => {
            const rr = Math.floor(i / 4);
            const cc = i % 4;
            return <rect key={i} x={cc * 14} y={rr * 14} width="12" height="12" rx="2"
              fill={ACCENT} opacity={heat(rr * 2, cc * 2)} />;
          })}
        </g>
        <text x="86" y="204" fontFamily="var(--font-mono)" fontSize="14" fill={MUTED}>
          energy collects in low frequencies
        </text>
      </g>

      <path d="M180 239 L180 247" stroke={LIGHT} strokeWidth="1.6" />
      <g opacity={pQuant} {...bind("quant", `Quantize by Q=${q}; small coefficients turn to zero.`)}>
        <text x="14" y="267" fontFamily="var(--font-mono)" fontSize="17" fontWeight="700"
          letterSpacing="0.5" fill={RED}>03 · QUANTIZE</text>
        <g transform="translate(16 275)">
          {Array.from({ length: 16 }, (_, i) => {
            const rr = Math.floor(i / 4) * 2;
            const cc = (i % 4) * 2;
            const v = quantized[rr][cc];
            return <rect key={i} x={(i % 4) * 14} y={Math.floor(i / 4) * 14} width="12" height="12" rx="2"
              fill={v === 0 ? RED : ACCENT} opacity={v === 0 ? 0.58 + 0.42 * pulse : heat(rr, cc)} />;
          })}
        </g>
        <text x="86" y="298" fontFamily="var(--font-mono)" fontSize="14" fill={RED}>
          Q={q} · {zeros} small coefficients → 0
        </text>
      </g>

      <path d="M180 309 L180 317" stroke={LIGHT} strokeWidth="1.6" />
      <g opacity={pZig} {...bind("zz", "Zigzag scan groups the quantized zeros together.")}>
        <text x="14" y="337" fontFamily="var(--font-mono)" fontSize="16" fontWeight="700"
          letterSpacing="0.4" fill={CHALK}>04 · ZIGZAG + ENTROPY</text>
        {stream.map((v, i) => (
          <g key={i} opacity={Math.max(0.2, pZig * 1.7 - i * 0.08)}>
            <rect x={14 + i * 36} y="342" width="32" height="24" rx="6"
              fill={v ? "rgba(91,99,240,0.18)" : "rgba(255,92,122,0.13)"}
              stroke={v ? ACCENT : RED} strokeWidth="1" />
            <text x={30 + i * 36} y="359" textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize="14" fill={v ? LIGHT : RED}>{v}</text>
          </g>
        ))}
      </g>
      <g opacity={pEnt} {...bind("ent", "Run-length and Huffman coding compress the zero run.")}>
        <rect x="14" y="374" width="332" height="12" rx="6" fill="#1B1D29" />
        <rect x="14" y="374" width={332 * (1 - quality / 125)} height="12" rx="6" fill={ACCENT} />
        <text x="180" y="405" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14"
          fontWeight="700" fill={CHALK}>
          {sizeKB} KB · quality {quality} · {zeros}/64 zeros
        </text>
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  SLIDE 14 — applications                                           */
/* ================================================================== */

export const APPS_STEPS: Step[] = timeline(
  [
    ["medical", "Medical imaging", "DICOM archives store scans losslessly — no pixel may ever be invented."],
    ["satellite", "Satellite sensing", "Terabytes of Earth observation must survive the downlink intact."],
    ["ott", "OTT streaming", "Adaptive bitrates squeeze cinema through your home connection."],
    ["cloud", "Cloud storage", "Deduplication and tiering multiply every petabyte you buy."],
  ],
  3000
);

export function AppsScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const [phone, setPhone] = useState(false);
  const t = tr.t;
  const step = tr.step;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 699px) and (orientation: portrait)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const panel = (i: number) => (step === i || hot === ["medical", "satellite", "ott", "cloud"][i] ? 1 : 0.34);

  return (
    <div ref={ref} className="relative h-full w-full">
      {phone ? (
        <AppsPortrait t={t} step={step} bind={bind} hot={hot} />
      ) : (
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 620" className="h-full w-full" role="img"
        aria-label="Four applications of image compression, each with a small animation">
        <defs>
          <pattern id="apMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
          <clipPath id="medClip"><rect x="78" y="98" width="180" height="170" rx="14" /></clipPath>
          <clipPath id="ottClip"><rect x="80" y="372" width="200" height="120" rx="12" /></clipPath>
        </defs>
        <rect width="1100" height="620" fill="url(#apMesh)" />

        {/* ---------- medical ---------- */}
        <g opacity={panel(0)} {...bind("medical", "DICOM: lossless by regulation in most archives.")}>
          <rect x="40" y="44" width="490" height="248" rx="22"
            fill={step === 0 ? "#1B1D29" : "#15161F"}
            stroke={step === 0 ? GREEN : "#2A2C3A"} strokeWidth={step === 0 ? 2 : 1.4} />
          <text x="300" y="80" {...mono} fontSize="13.5" fontWeight="700" letterSpacing="0.16em"
            fill={step === 0 ? CHALK : MUTED}>MEDICAL IMAGING</text>
          <rect x="78" y="98" width="180" height="170" rx="14" fill="#101119" stroke="#2A2C3A" />
          <g clipPath="url(#medClip)">
            <rect x="160" y="112" width="16" height="142" rx="7" fill={CHALK} opacity="0.16" />
            {Array.from({ length: 5 }, (_, i) => (
              <path key={i} d={`M96 ${128 + i * 26} q72 ${20 + i * 2} 144 0`} stroke={CHALK}
                strokeWidth="4" fill="none" opacity="0.14" />
            ))}
            <rect x="78" y={98 + ((t * 1.6) % 1) * 170} width="180" height="26" fill={GREEN}
              opacity="0.16" />
            <path d={`M78 ${98 + ((t * 1.6) % 1) * 170 + 13} L258 ${98 + ((t * 1.6) % 1) * 170 + 13}`}
              stroke={GREEN} strokeWidth="2" opacity="0.8" />
          </g>
          <text x="300" y="140" {...mono} fontSize="12" fill={MUTED}>lossless archive</text>
          <rect x="300" y="158" width="200" height="40" rx="12" fill="rgba(61,220,151,0.1)"
            stroke={GREEN} strokeWidth="1.3" />
          <text x="400" y="184" textAnchor="middle" {...mono} fontSize="13" fontWeight="700"
            fill={GREEN}>DICOM · CR = 1 : 1</text>
          <text x="300" y="232" {...mono} fontSize="11.5" fill={MUTED}>
            every pixel preserved — diagnosis depends on it
          </text>
        </g>

        {/* ---------- satellite ---------- */}
        <g opacity={panel(1)} {...bind("satellite", "Remote sensing: 12-bit multispectral bands, downlinked continuously.")}>
          <rect x="570" y="44" width="490" height="248" rx="22"
            fill={step === 1 ? "#1B1D29" : "#15161F"}
            stroke={step === 1 ? LIGHT : "#2A2C3A"} strokeWidth={step === 1 ? 2 : 1.4} />
          <text x="598" y="80" {...mono} fontSize="13.5" fontWeight="700" letterSpacing="0.16em"
            fill={step === 1 ? CHALK : MUTED}>SATELLITE REMOTE SENSING</text>

          <circle cx="760" cy="190" r="44" fill={ACCENT} opacity="0.3" />
          <circle cx="760" cy="190" r="44" fill="none" stroke={LIGHT} strokeWidth="1.6" />
          <path d="M722 176 q40 16 76 0 M724 206 q36 14 72 -2" stroke={LIGHT} strokeWidth="2"
            fill="none" opacity="0.55" />
          <ellipse cx="760" cy="190" rx="92" ry="34" fill="none" stroke={MUTED}
            strokeWidth="1.2" strokeDasharray="4 6" opacity="0.7"
            transform="rotate(-16 760 190)" />
          <circle
            cx={760 + Math.cos(t * Math.PI * 2) * 92}
            cy={190 + Math.sin(t * Math.PI * 2) * 34}
            r="7" fill={LIGHT}
            transform="rotate(-16 760 190)" />
          <path
            d={`M${760 + Math.cos(t * Math.PI * 2) * 92} ${190 + Math.sin(t * Math.PI * 2) * 34} L760 236`}
            stroke={GREEN} strokeWidth="1.4" strokeDasharray="5 6" opacity="0.75" fill="none" />

          <text x="880" y="150" {...mono} fontSize="12" fill={MUTED}>12-bit bands</text>
          <text x="880" y="178" {...mono} fontSize="12" fill={MUTED}>TB / day / satellite</text>
          <rect x="880" y="196" width="150" height="40" rx="12" fill="rgba(91,99,240,0.12)"
            stroke={ACCENT} strokeWidth="1.3" />
          <text x="955" y="222" textAnchor="middle" {...mono} fontSize="13" fontWeight="700"
            fill={LIGHT}>near-lossless</text>
        </g>

        {/* ---------- OTT ---------- */}
        <g opacity={panel(2)} {...bind("ott", "Streaming: the encoder adapts bitrate to your connection.")}>
          <rect x="40" y="330" width="490" height="248" rx="22"
            fill={step === 2 ? "#1B1D29" : "#15161F"}
            stroke={step === 2 ? LIGHT : "#2A2C3A"} strokeWidth={step === 2 ? 2 : 1.4} />
          <text x="300" y="362" {...mono} fontSize="13.5" fontWeight="700" letterSpacing="0.16em"
            fill={step === 2 ? CHALK : MUTED}>OTT VIDEO STREAMING</text>

          <rect x="80" y="378" width="200" height="120" rx="12" fill="#101119" stroke="#2A2C3A" />
          <g clipPath="url(#ottClip)">
            <rect x="80" y="378" width="200" height="120" fill="url(#sky2)" />
            <circle cx="240" cy="408" r="14" fill={CHALK} opacity="0.7" />
            <path d="M80 470 q60 -26 120 -8 q50 14 80 -4 L280 498 L80 498 Z" fill="#1D2136" />
          </g>
          <path d="M168 424 L168 452 L194 438 Z" fill={CHALK} opacity={0.85} />
          <rect x="80" y="506" width="200" height="8" rx="4" fill="#1B1D29" />
          <rect x="80" y="506" width={200 * ((t * 0.9) % 1)} height="8" rx="4" fill={RED} />

          <text x="316" y="412" {...mono} fontSize="12" fill={MUTED}>adaptive bitrate</text>
          {[2.4, 4.8, 8].map((mb, i) => {
            const on = (t * 0.9) % 1 > (i + 1) / 4;
            return (
              <g key={mb} opacity={on ? 1 : 0.35}>
                <rect x={316 + i * 56} y="428" width="48" height="26" rx="9"
                  fill={on ? "rgba(91,99,240,0.2)" : "#101119"} stroke={ACCENT} strokeWidth="1.2" />
                <text x={340 + i * 56} y="446" textAnchor="middle" {...mono} fontSize="11"
                  fontWeight="700" fill={on ? LIGHT : MUTED}>{mb}M</text>
              </g>
            );
          })}
          <text x="316" y="492" {...mono} fontSize="11.5" fill={MUTED}>
            H.264 / H.265 · inter-frame prediction
          </text>
        </g>

        {/* ---------- cloud ---------- */}
        <g opacity={panel(3)} {...bind("cloud", "Cloud storage: compress once, store tiers, ship bytes cheaply.")}>
          <rect x="570" y="330" width="490" height="248" rx="22"
            fill={step === 3 ? "#1B1D29" : "#15161F"}
            stroke={step === 3 ? LIGHT : "#2A2C3A"} strokeWidth={step === 3 ? 2 : 1.4} />
          <text x="598" y="362" {...mono} fontSize="13.5" fontWeight="700" letterSpacing="0.16em"
            fill={step === 3 ? CHALK : MUTED}>CLOUD STORAGE</text>

          <path d="M700 452 q-30 2 -30 -26 q0 -26 28 -28 q6 -26 36 -26 q28 0 36 24 q30 0 30 28 q0 28 -32 28 Z"
            fill="rgba(91,99,240,0.12)" stroke={LIGHT} strokeWidth="2" />
          {Array.from({ length: 3 }, (_, i) => {
            const ph = (t * 0.7 + i * 0.34) % 1;
            return (
              <rect key={i} x={712 + i * 22} y={532 - ph * 90} width="14" height="14" rx="4"
                fill={LIGHT} opacity={(1 - ph) * 0.9} />
            );
          })}
          <text x="800" y="420" {...mono} fontSize="12" fill={MUTED}>dedupe + tiering</text>
          <rect x="800" y="438" width="212" height="40" rx="12" fill="rgba(61,220,151,0.1)"
            stroke={GREEN} strokeWidth="1.3" />
          <text x="906" y="464" textAnchor="middle" {...mono} fontSize="13" fontWeight="700"
            fill={GREEN}>10× less $ / TB</text>
          <text x="800" y="512" {...mono} fontSize="11.5" fill={MUTED}>
            cold tiers store compressed archives for years
          </text>
        </g>

        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C3152" />
            <stop offset="100%" stopColor="#161927" />
          </linearGradient>
        </defs>
      </svg>
      )}
      <TipBubble tip={tip} />
    </div>
  );
}

function AppsPortrait({
  t,
  step,
  bind,
  hot,
}: {
  t: number;
  step: number;
  bind: ReturnType<typeof useTip>["bind"];
  hot: string | null;
}) {
  const cards = [
    { id: "medical", x: 10, y: 10, title: "MEDICAL", sub: "DICOM · lossless", color: GREEN },
    { id: "satellite", x: 186, y: 10, title: "SATELLITE", sub: "remote sensing", color: LIGHT },
    { id: "ott", x: 10, y: 240, title: "OTT VIDEO", sub: "adaptive bitrate", color: LIGHT },
    { id: "cloud", x: 186, y: 240, title: "CLOUD", sub: "dedupe · tiering", color: GREEN },
  ];

  return (
    <svg className="apps-portrait-svg" viewBox="0 0 360 460" width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet" role="img" aria-label="Four animated image compression application cards">
      {cards.map((c, i) => {
        const active = step === i;
        const opacity = active || hot === c.id ? 1 : 0.58;
        return (
          <g key={c.id} opacity={opacity} {...bind(c.id, `${c.title}: ${c.sub}.`)}>
            <rect x={c.x} y={c.y} width="164" height="214" rx="16"
              fill={active ? "#1B1D29" : "#15161F"}
              stroke={active || hot === c.id ? c.color : "#2A2C3A"}
              strokeWidth={active || hot === c.id ? 2 : 1.2} />
            <text x={c.x + 12} y={c.y + 25} fontFamily="var(--font-mono)" fontSize="16"
              fontWeight="700" letterSpacing="0.45" fill={active ? CHALK : MUTED}>{c.title}</text>

            {c.id === "medical" && (
              <g>
                <rect x={c.x + 28} y={c.y + 43} width="108" height="102" rx="12"
                  fill="#0B0C12" stroke="#2A2C3A" />
                <rect x={c.x + 78} y={c.y + 50} width="10" height="88" rx="5" fill={CHALK} opacity="0.16" />
                {Array.from({ length: 4 }, (_, j) => (
                  <path key={j} d={`M${c.x + 40} ${c.y + 61 + j * 19} q42 15 84 0`}
                    stroke={CHALK} strokeWidth="2.5" fill="none" opacity="0.2" />
                ))}
                <rect x={c.x + 28} y={c.y + 43 + ((t * 1.7) % 1) * 102} width="108" height="13"
                  fill={GREEN} opacity="0.2" />
              </g>
            )}

            {c.id === "satellite" && (
              <g>
                <circle cx={c.x + 82} cy={c.y + 99} r="35" fill={ACCENT} opacity="0.26" />
                <circle cx={c.x + 82} cy={c.y + 99} r="35" fill="none" stroke={LIGHT} strokeWidth="1.4" />
                <path d={`M${c.x + 50} ${c.y + 94} q32 14 64 0 M${c.x + 52} ${c.y + 108} q30 12 60 -2`}
                  stroke={LIGHT} strokeWidth="1.6" fill="none" opacity="0.6" />
                <ellipse cx={c.x + 82} cy={c.y + 99} rx="62" ry="24" fill="none" stroke={MUTED}
                  strokeWidth="1" strokeDasharray="4 5" transform={`rotate(-16 ${c.x + 82} ${c.y + 99})`} />
                <circle cx={c.x + 82 + Math.cos(t * Math.PI * 2) * 62}
                  cy={c.y + 99 + Math.sin(t * Math.PI * 2) * 24} r="5" fill={LIGHT} />
                <path d={`M${c.x + 82} ${c.y + 134} L${c.x + 82} ${c.y + 157}`}
                  stroke={GREEN} strokeWidth="1.4" strokeDasharray="4 5" />
              </g>
            )}

            {c.id === "ott" && (
              <g>
                <rect x={c.x + 20} y={c.y + 48} width="124" height="86" rx="10" fill="#101119"
                  stroke="#2A2C3A" />
                <rect x={c.x + 22} y={c.y + 50} width="120" height="82" rx="8" fill="#202541" />
                <circle cx={c.x + 119} cy={c.y + 68} r="10" fill={CHALK} opacity="0.65" />
                <path d={`M${c.x + 22} ${c.y + 119} q36 -26 70 -10 q26 10 50 -5 v28 H${c.x + 22}Z`}
                  fill="#343A61" />
                <path d={`M${c.x + 73} ${c.y + 77} v25 l23 -12.5z`} fill={CHALK} />
                <rect x={c.x + 20} y={c.y + 143} width="124" height="6" rx="3" fill="#2A2C3A" />
                <rect x={c.x + 20} y={c.y + 143} width={124 * ((t * 0.9) % 1)} height="6" rx="3" fill={RED} />
              </g>
            )}

            {c.id === "cloud" && (
              <g>
                <path d={`M${c.x + 48} ${c.y + 120} q-21 0 -21 -19 q0 -18 20 -19 q5 -19 24 -19 q20 0 25 18 q21 0 21 19 q0 20 -22 20z`}
                  fill="rgba(91,99,240,0.14)" stroke={LIGHT} strokeWidth="1.8" />
                {Array.from({ length: 3 }, (_, j) => {
                  const phase = (t * 0.8 + j * 0.34) % 1;
                  return <rect key={j} x={c.x + 62 + j * 19} y={c.y + 164 - phase * 48}
                    width="11" height="11" rx="3" fill={GREEN} opacity={1 - phase} />;
                })}
              </g>
            )}

            <text x={c.x + 82} y={c.y + 183} textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize="13.5" fontWeight="700" fill={c.color}>{c.sub}</text>
            <text x={c.x + 82} y={c.y + 203} textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize="11.5" fill={MUTED}>TAP TO PLAY</text>
          </g>
        );
      })}
    </svg>
  );
}
