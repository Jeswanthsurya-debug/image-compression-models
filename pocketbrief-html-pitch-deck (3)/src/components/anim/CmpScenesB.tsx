import { useEffect, useState } from "react";
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
/*  SLIDE 8 — THE COMPRESSION MODEL                                   */
/* ================================================================== */

export const MODEL_STEPS: Step[] = timeline(
  [
    ["input", "Input image", "The original image f(x,y) enters the model as a pixel array."],
    ["mapper", "Mapper", "The mapper decorrelates the pixels — reversibly. Spatial/temporal redundancy starts to go."],
    ["quantizer", "Quantizer", "The quantizer rounds away what the eye won't notice — the one irreversible block."],
    ["symenc", "Symbol encoder", "Short codes are written for common symbols; the compressed stream leaves the encoder."],
    ["decoder", "Source decoder", "The decoder reverses the symbol coding and the mapping, bit for bit."],
    ["output", "Reconstructed image", "Out comes f̂(x,y) — identical in lossless mode, an approximation after quantization."],
  ],
  2900
);

/* block geometry */
const BY = 250;
const BH = 110;
const BLOCKS = [
  { id: "mapper", x: 262, w: 110, name: "MAPPER", tag: "reversible ✓", tone: GREEN, tip: "Mapper — reversible transform (e.g. DCT, predict)." },
  { id: "quantizer", x: 392, w: 110, name: "QUANTIZER", tag: "irreversible ✗", tone: RED, tip: "Quantizer — discards precision; this is where loss happens." },
  { id: "symenc", x: 522, w: 110, name: "SYMBOL ENCODER", tag: "reversible ✓", tone: GREEN, tip: "Symbol encoder — Huffman / LZW / arithmetic coding." },
  { id: "symdec", x: 822, w: 100, name: "SYMBOL DECODER", tag: "reversible ✓", tone: GREEN, tip: "Symbol decoder — exact inverse of the encoder." },
  { id: "invm", x: 942, w: 100, name: "INVERSE MAPPER", tag: "reversible ✓", tone: GREEN, tip: "Inverse mapper — reconstructs the pixel domain." },
];

const PACKET_RUN: [number, number][] = [
  [120, 175], [262, 372], [392, 502], [522, 770], [822, 1042], [1060, 1130],
];

function MiniGrid({ x, y, n, cell, op, dim }: {
  x: number; y: number; n: number; cell: number; op: number; dim?: boolean;
}) {
  return (
    <g opacity={op}>
      {Array.from({ length: n * n }, (_, i) => {
        const rr = Math.floor(i / n);
        const cc = i % n;
        const v = hash(rr * 3 + 1, cc * 5 + 2);
        return (
          <rect key={i} x={x + cc * cell + 1} y={y + rr * cell + 1} width={cell - 2}
            height={cell - 2} rx="2.5"
            fill={dim ? MUTED : v > 0.5 ? LIGHT : CHALK}
            opacity={(dim ? 0.25 : 0.35) + v * (dim ? 0.35 : 0.6)} />
        );
      })}
    </g>
  );
}

function Depth3D({ x, y, w, h, active, tone }: {
  x: number; y: number; w: number; h: number; active: boolean; tone: string;
}) {
  return (
    <g>
      <rect x={x + 5} y={y + 7} width={w} height={h} rx="16" fill="#0B0C12" opacity="0.85" />
      <rect x={x} y={y} width={w} height={h} rx="16"
        fill={active ? "#1B1D29" : "#15161F"}
        stroke={active ? tone : "#2A2C3A"} strokeWidth={active ? 2.2 : 1.4} />
      {active && (
        <rect x={x} y={y} width={w} height={h} rx="16" fill="none"
          stroke={tone} strokeWidth="7" opacity="0.16" />
      )}
    </g>
  );
}

export function ModelScene({ tr }: { tr: Transport }) {
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

  const pIn = easeOut(seg(t, 0.01, 0.1));
  const pOut = easeOut(seg(t, 0.86, 0.97));

  /* packet position along its run for the active step */
  const cur = MODEL_STEPS[Math.min(step, MODEL_STEPS.length - 1)];
  const p = (t - cur.from) / Math.max(0.0001, cur.to - cur.from);
  const run = PACKET_RUN[Math.min(step, PACKET_RUN.length - 1)];
  const px = lerp(run[0], run[1], easeInOut(clamp01(p)));



  return (
    <div ref={ref} className="relative h-full w-full">
      {phone ? (
        <MobileModelDiagram t={t} p={clamp01(p)} step={step} pIn={pIn} pOut={pOut} hot={hot} bind={bind} />
      ) : (
      <svg viewBox="0 0 1200 620" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
        className="h-full w-full" role="img"
        aria-label="The Gonzalez-Woods compression model: source encoder, channel and source decoder">
        <defs>
          <pattern id="mdMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
        </defs>
        <rect width="1200" height="620" fill="url(#mdMesh)" />

        {/* flow baseline */}
        <path d="M120 305 L1130 305" stroke="#2A2C3A" strokeWidth="1.4" strokeDasharray="3 8"
          opacity="0.7" fill="none" />

        {/* ---------- input ---------- */}
        <g opacity={pIn} {...bind("input", "Input image f(x,y): N×N pixels, 8 bits each.")}>
          <Depth3D x={40} y={220} w={150} h={170} active={step === 0} tone={LIGHT} />
          <MiniGrid x={62} y={242} n={6} cell={17} op={pIn} />
          <text x="115" y="372" textAnchor="middle" {...mono} fontSize="14" fontWeight="700"
            fill={CHALK}>f(x,y)</text>
          <text x="115" y="414" textAnchor="middle" {...mono} fontSize="11" fill={MUTED}>
            input image
          </text>
        </g>

        {/* ---------- source encoder container ---------- */}
        <g opacity={pIn}>
          <rect x="240" y="170" width="410" height="270" rx="22" fill="rgba(91,99,240,0.05)"
            stroke={step >= 1 && step <= 3 ? ACCENT : "#2A2C3A"}
            strokeWidth={step >= 1 && step <= 3 ? 2 : 1.3}
            strokeDasharray={step >= 1 && step <= 3 ? undefined : "6 7"} />
          <text x="262" y="200" {...mono} fontSize="12.5" fontWeight="700" letterSpacing="0.2em"
            fill={step >= 1 && step <= 3 ? LIGHT : MUTED}>
            SOURCE ENCODER
          </text>
        </g>

        {BLOCKS.slice(0, 3).map((b, i) => {
          const active = step === i + 1;
          return (
            <g key={b.id} opacity={pIn} {...bind(b.id, b.tip)}>
              <Depth3D x={b.x} y={BY} w={b.w} h={BH} active={active || hot === b.id}
                tone={active ? b.tone : LIGHT} />
              <text x={b.x + b.w / 2} y={BY + 46} textAnchor="middle" {...mono}
                fontSize="11.5" fontWeight="700" letterSpacing="0.08em"
                fill={active ? CHALK : "rgba(241,241,245,0.75)"}>
                {b.name}
              </text>
              <text x={b.x + b.w / 2} y={BY + 76} textAnchor="middle" {...mono} fontSize="10.5"
                fill={b.tone} opacity={active ? 1 : 0.75}>
                {b.tag}
              </text>
              {i < 2 && (
                <path d={`M${b.x + b.w + 4} ${BY + BH / 2} L${b.x + b.w + 16} ${BY + BH / 2}`}
                  stroke={LIGHT} strokeWidth="2" markerEnd="url(#mArr)" fill="none" />
              )}
            </g>
          );
        })}

        {/* ---------- channel ---------- */}
        <g opacity={pIn} {...bind("chan", "Compressed representation: far fewer bits than the input.")}>
          <text x="715" y="200" textAnchor="middle" {...mono} fontSize="12" letterSpacing="0.18em"
            fill={step === 3 ? LIGHT : MUTED}>CHANNEL</text>
          {Array.from({ length: 6 }, (_, i) => {
            const d = clamp01(seg(t, 0.5 + i * 0.02, 0.58 + i * 0.02));
            return (
              <rect key={i} x={676 + i * 14} y={288 + (i % 2) * 6} width="9" height="22" rx="3"
                fill={i % 2 ? LIGHT : ACCENT} opacity={0.35 + 0.65 * d} />
            );
          })}
          <text x="715" y="352" textAnchor="middle" {...mono} fontSize="11" fill={MUTED}>
            compressed data
          </text>
        </g>

        {/* ---------- source decoder container ---------- */}
        <g opacity={pIn}>
          <rect x="800" y="170" width="262" height="270" rx="22" fill="rgba(91,99,240,0.05)"
            stroke={step === 4 ? ACCENT : "#2A2C3A"}
            strokeWidth={step === 4 ? 2 : 1.3}
            strokeDasharray={step === 4 ? undefined : "6 7"} />
          <text x="822" y="200" {...mono} fontSize="12.5" fontWeight="700" letterSpacing="0.2em"
            fill={step === 4 ? LIGHT : MUTED}>
            SOURCE DECODER
          </text>
        </g>

        {BLOCKS.slice(3).map((b) => {
          const active = step === 4;
          return (
            <g key={b.id} opacity={pIn} {...bind(b.id, b.tip)}>
              <Depth3D x={b.x} y={BY} w={b.w} h={BH} active={active || hot === b.id}
                tone={active ? b.tone : LIGHT} />
              <text x={b.x + b.w / 2} y={BY + 46} textAnchor="middle" {...mono}
                fontSize="10.5" fontWeight="700" letterSpacing="0.05em"
                fill={active ? CHALK : "rgba(241,241,245,0.75)"}>
                {b.name}
              </text>
              <text x={b.x + b.w / 2} y={BY + 76} textAnchor="middle" {...mono} fontSize="10"
                fill={GREEN} opacity={active ? 1 : 0.75}>
                {b.tag}
              </text>
            </g>
          );
        })}

        {/* ---------- output ---------- */}
        <g opacity={pOut} {...bind("output", "Reconstruction f̂(x,y) — exact only when there is no quantizer.")}>
          <Depth3D x={1080} y={220} w={150} h={170} active={step === 5} tone={GREEN} />
          <MiniGrid x={1102} y={242} n={6} cell={17} op={pOut} dim />
          <text x="1155" y="372" textAnchor="middle" {...mono} fontSize="14" fontWeight="700"
            fill={CHALK}>f̂(x,y)</text>
          <text x="1155" y="414" textAnchor="middle" {...mono} fontSize="11" fill={MUTED}>
            reconstructed
          </text>
        </g>

        {/* ---------- travelling packet ---------- */}
        <g opacity={pIn}>
          <rect x={px - 26} y={299} width="26" height="12" rx="6"
            fill={ACCENT} opacity="0.35" />
          <circle cx={px} cy={305} r="9" fill={LIGHT}
            opacity={0.9} />
          <circle cx={px} cy={305} r="16" fill="none" stroke={LIGHT} strokeWidth="1.6"
            opacity={0.35 + 0.3 * Math.sin(t * 50)} />
        </g>

        {/* lossless note */}
        <g opacity={pOut}>
          <text x="450" y="486" textAnchor="middle" {...mono} fontSize="13" fill={MUTED}>
            remove the <tspan fill={RED}>quantizer</tspan> → every block reversible →
            <tspan fill={GREEN}> lossless</tspan>
          </text>
        </g>

        <defs>
          <marker id="mArr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,1 L6.4,4 L1,7" fill="none" stroke={LIGHT} strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
      </svg>
      )}
      <TipBubble tip={tip} />
    </div>
  );
}

function MobileModelDiagram({
  t,
  p,
  step,
  pIn,
  pOut,
  hot,
  bind,
}: {
  t: number;
  p: number;
  step: number;
  pIn: number;
  pOut: number;
  hot: string | null;
  bind: ReturnType<typeof useTip>["bind"];
}) {
  const routes: [number, number][] = [[35, 60], [60, 143], [143, 204], [204, 373], [373, 522], [522, 600]];
  const [from, to] = routes[Math.min(step, routes.length - 1)];
  const packetY = lerp(from, to, easeInOut(clamp01(p)));
  const pulse = 0.5 + 0.5 * Math.sin(t * 50);
  const encoderActive = step >= 1 && step <= 3;
  const decoderActive = step === 4;
  const blocks = [
    { id: "mapper", y: 118, label: "Mapper", tag: "reversible", color: GREEN, active: step === 1 },
    { id: "quantizer", y: 178, label: "Quantizer", tag: "irreversible", color: RED, active: step === 2 },
    { id: "symenc", y: 238, label: "Symbol Encoder", tag: "reversible", color: GREEN, active: step === 3 },
  ];

  const Block = ({
    x = 36,
    y,
    label,
    tag,
    color,
    active,
    id,
    tip,
    h = 46,
  }: {
    x?: number;
    y: number;
    label: string;
    tag: string;
    color: string;
    active: boolean;
    id: string;
    tip: string;
    h?: number;
  }) => (
    <g {...bind(id, tip)}>
      <rect x={x + 3} y={y + 4} width="288" height={h} rx="12" fill="#07080D" opacity="0.85" />
      <rect x={x} y={y} width="288" height={h} rx="12"
        fill={active || hot === id ? "#1B1D29" : "#15161F"}
        stroke={active || hot === id ? color : "#2A2C3A"} strokeWidth={active || hot === id ? 2.2 : 1.2} />
      <text x="180" y={y + (h === 46 ? 24 : 25)} textAnchor="middle" fontSize="24"
        fontWeight="750" fill={active || hot === id ? CHALK : "rgba(241,241,245,0.82)"}>
        {label}
      </text>
      <text x="180" y={y + h - 4} textAnchor="middle" fontFamily="var(--font-mono)"
        fontSize="18" fontWeight="600" fill={color}>
        {tag}
      </text>
      {(active || hot === id) && (
        <rect x={x} y={y} width="288" height={h} rx="12" fill="none" stroke={color}
          strokeWidth="7" opacity={0.13 + 0.08 * pulse} pointerEvents="none" />
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 360 640" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Vertical source encoder and decoder compression model">
      <defs>
        <pattern id="mobileModelMesh" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill={CHALK} opacity="0.05" />
        </pattern>
        <radialGradient id="mobilePacketGlow">
          <stop offset="0%" stopColor={LIGHT} stopOpacity="0.72" />
          <stop offset="100%" stopColor={LIGHT} stopOpacity="0" />
        </radialGradient>
        <marker id="mobileModelArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M1 1 L4 6 L7 1" fill="none" stroke={LIGHT} strokeWidth="1.4" strokeLinecap="round" />
        </marker>
      </defs>
      <rect width="360" height="640" fill="#101119" />
      <rect width="360" height="640" fill="url(#mobileModelMesh)" />

      {/* Input image */}
      <g opacity={pIn} {...bind("input", "Input image f(x,y): the original pixel array.")}>
        <rect x="36" y="10" width="288" height="50" rx="13" fill="#15161F"
          stroke={step === 0 || hot === "input" ? LIGHT : "#2A2C3A"} strokeWidth="1.6" />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={49 + (i % 3) * 11} y={20 + Math.floor(i / 3) * 11} width="8" height="8" rx="2"
            fill={i % 2 ? LIGHT : CHALK} opacity="0.65" />
        ))}
        <text x="193" y="42" textAnchor="middle" fontSize="25" fontWeight="750" fill={CHALK}>
          Input image f(x,y)
        </text>
      </g>

      {/* Source encoder group */}
      <rect x="20" y="80" width="320" height="248" rx="17" fill="rgba(91,99,240,0.035)"
        stroke={encoderActive ? ACCENT : "#2A2C3A"} strokeWidth="1.6" strokeDasharray="7 7" />
      <text x="180" y="105" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="20"
        fontWeight="700" letterSpacing="1.4" fill={encoderActive ? LIGHT : MUTED}>
        SOURCE ENCODER
      </text>
      {blocks.map((b) => (
        <Block key={b.id} y={b.y} label={b.label} tag={b.tag} color={b.color} active={b.active}
          id={b.id} tip={`${b.label} · ${b.tag}.`} />
      ))}
      <path d="M180 165 L180 174" stroke={LIGHT} strokeWidth="1.8" markerEnd="url(#mobileModelArrow)" />
      <path d="M180 225 L180 234" stroke={LIGHT} strokeWidth="1.8" markerEnd="url(#mobileModelArrow)" />

      {/* Channel */}
      <path d="M180 288 L180 346" stroke={LIGHT} strokeWidth="1.8" markerEnd="url(#mobileModelArrow)" />
      <g opacity={pIn} {...bind("chan", "Compressed data travels through the channel.")}>
        <rect x="36" y="351" width="288" height="42" rx="12" fill="#15161F"
          stroke={step === 3 || hot === "chan" ? LIGHT : "#2A2C3A"} strokeWidth="1.4" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={52 + i * 18} y={365 + (i % 2) * 5} width="11" height="12" rx="3"
            fill={i % 2 ? LIGHT : ACCENT} opacity={0.48 + 0.52 * clamp01(seg(t, 0.48 + i * 0.015, 0.6 + i * 0.015))} />
        ))}
        <text x="256" y="378" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="17"
          fontWeight="700" fill={step === 3 ? CHALK : MUTED}>CHANNEL</text>
      </g>

      {/* Source decoder group */}
      <path d="M180 394 L180 416" stroke={LIGHT} strokeWidth="1.8" markerEnd="url(#mobileModelArrow)" />
      <rect x="20" y="420" width="320" height="130" rx="17" fill="rgba(91,99,240,0.035)"
        stroke={decoderActive ? ACCENT : "#2A2C3A"} strokeWidth="1.6" strokeDasharray="7 7" />
      <text x="180" y="443" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="20"
        fontWeight="700" letterSpacing="1.4" fill={decoderActive ? LIGHT : MUTED}>
        SOURCE DECODER
      </text>
      <Block y={450} h={40} label="Symbol Decoder" tag="reversible" color={GREEN}
        active={decoderActive && p < 0.52} id="symdec" tip="Symbol decoder · exact inverse of the encoder." />
      <path d="M180 491 L180 496" stroke={LIGHT} strokeWidth="1.6" markerEnd="url(#mobileModelArrow)" />
      <Block y={500} h={40} label="Inverse Mapper" tag="reversible" color={GREEN}
        active={decoderActive && p >= 0.52} id="invm" tip="Inverse mapper · reconstructs the pixel domain." />

      {/* Reconstructed output; fully inside the phone viewBox */}
      <path d="M180 550 L180 570" stroke={LIGHT} strokeWidth="1.8" markerEnd="url(#mobileModelArrow)" />
      <g opacity={pOut} {...bind("output", "Reconstructed image f-hat(x,y).")}>
        <rect x="36" y="576" width="288" height="48" rx="13" fill="#15161F"
          stroke={step === 5 || hot === "output" ? GREEN : "#2A2C3A"} strokeWidth="1.5" />
        <text x="180" y="608" textAnchor="middle" fontSize="24" fontWeight="750" fill={GREEN}>
          Reconstructed f̂(x,y)
        </text>
      </g>

      {/* Traveling packet and soft trail */}
      <g pointerEvents="none">
        <path d={`M180 ${packetY - 26} L180 ${packetY - 7}`} stroke={LIGHT} strokeWidth="4"
          strokeLinecap="round" opacity="0.42" />
        <circle cx="180" cy={packetY} r="19" fill="url(#mobilePacketGlow)" />
        <circle cx="180" cy={packetY} r="7" fill={CHALK} stroke={LIGHT} strokeWidth="2" />
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  SLIDE 9 — the three blocks (+ lossless toggle)                    */
/* ================================================================== */

export const BLOCKS_STEPS: Step[] = timeline(
  [
    ["mapper", "Mapper", "Decorrelates the pixels (transform or prediction) — fully reversible. Removes spatial and temporal redundancy."],
    ["quantizer", "Quantizer", "Rounds values the eye won't miss — irreversible. Removes psychovisual redundancy. The only source of loss."],
    ["symenc", "Symbol encoder", "Writes the fewest bits for the most common symbols — reversible. Removes coding redundancy."],
    ["lossless", "Lossless mode", "Bypass the quantizer and every stage is reversible: the output is bit-for-bit identical."],
  ],
  3100
);

export function BlocksScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const [phone, setPhone] = useState(false);
  const t = tr.t;
  const step = tr.step;
  const lossless = step >= 3;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 699px) and (orientation: portrait)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pIn = easeOut(seg(t, 0.02, 0.14));
  const lift = easeInOut(seg(t, 0.78, 0.94));
  const bypass = easeInOut(seg(t, 0.8, 0.96));
  const pulse = 0.5 + 0.5 * Math.sin(t * 40);

  const QY = lerp(170, 66, lift);
  const active = (i: number) => (!lossless && step === i) || hot === ["mapper", "quantizer", "symenc"][i];

  const defs = [
    { x: 150, name: "MAPPER", tag: "reversible ✓", tone: GREEN },
    { x: 460, name: "QUANTIZER", tag: "irreversible ✗", tone: RED },
    { x: 770, name: "SYMBOL ENCODER", tag: "reversible ✓", tone: GREEN },
  ];

  return (
    <div ref={ref} className="relative h-full w-full">
      {phone ? (
        <MobileBlocksDiagram t={t} step={step} pIn={pIn} lift={lift} bypass={bypass}
          lossless={lossless} hot={hot} bind={bind} />
      ) : (
      <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1100 420" className="h-full w-full" role="img"
        aria-label="The three encoder blocks; in lossless mode the quantizer is bypassed">
        <defs>
          <pattern id="blMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
        </defs>
        <rect width="1100" height="420" fill="url(#blMesh)" />

        {/* flow line (bypassable) */}
        <path d="M96 225 L1010 225" stroke="#2A2C3A" strokeWidth="1.4" strokeDasharray="3 8"
          fill="none" opacity="0.8" />

        {/* bypass arc */}
        <path d="M330 196 C 420 108, 660 108, 762 196" fill="none" stroke={GREEN}
          strokeWidth="2.4" strokeDasharray="9 8" pathLength={1} strokeDashoffset={1 - bypass}
          opacity={bypass} />
        <text x="546" y="120" textAnchor="middle" {...mono} fontSize="12.5" fontWeight="700"
          fill={GREEN} opacity={bypass} letterSpacing="0.12em">
          BYPASS · LOSSLESS
        </text>

        {/* input / output */}
        <g opacity={pIn}>
          <rect x="52" y="180" width="88" height="90" rx="14" fill="#15161F" stroke="#2A2C3A" />
          <text x="96" y="232" textAnchor="middle" {...mono} fontSize="13" fontWeight="700"
            fill={CHALK}>f(x,y)</text>
          <rect x="966" y="180" width="88" height="90" rx="14" fill="#15161F"
            stroke={lossless ? GREEN : "#2A2C3A"} strokeWidth={lossless ? 2 : 1.3} />
          <text x="1010" y="232" textAnchor="middle" {...mono} fontSize="13" fontWeight="700"
            fill={lossless ? GREEN : CHALK}>f̂(x,y)</text>
        </g>

        {/* the three blocks */}
        {defs.map((b, i) => {
          const lifted = i === 1 && lift > 0;
          const y = i === 1 ? QY : 170;
          const dimmed = i === 1 && lossless;
          return (
            <g key={b.name} opacity={pIn} transform={undefined}
              {...bind(b.name.toLowerCase().split(" ")[0], b.name)}>
              <g opacity={dimmed ? 1 - lift * 0.62 : 1}>
                <rect x={b.x + 5} y={y + 7} width="180" height="110" rx="18" fill="#0B0C12"
                  opacity="0.85" />
                <rect x={b.x} y={y} width="180" height="110" rx="18"
                  fill={active(i) ? "#1B1D29" : "#15161F"}
                  stroke={active(i) ? b.tone : lifted ? RED : "#2A2C3A"}
                  strokeWidth={active(i) ? 2.4 : 1.5} />
                <text x={b.x + 90} y={y + 50} textAnchor="middle" {...mono} fontSize="13.5"
                  fontWeight="700" letterSpacing="0.1em" fill={active(i) ? CHALK : "rgba(241,241,245,0.8)"}>
                  {b.name}
                </text>
                <text x={b.x + 90} y={y + 80} textAnchor="middle" {...mono} fontSize="11"
                  fill={b.tone}>
                  {b.tag}
                </text>
              </g>
            </g>
          );
        })}

        {/* arrows between blocks */}
        <g stroke={LIGHT} strokeWidth="2" fill="none" opacity={pIn}>
          <path d="M330 225 L452 225" />
          <path d="M446 219 L456 225 L446 231" />
          <path d="M640 225 L762 225" opacity={1 - lift} />
          <path d="M756 219 L766 225 L756 231" opacity={1 - lift} />
        </g>

        {/* travelling packet */}
        <g opacity={pIn}>
          <circle
            cx={lerp(140, 960, easeInOut(clamp01(((t % 0.5) / 0.5))))}
            cy={lossless && bypass > 0.5 ? 225 - Math.sin(clamp01((t % 0.5) / 0.5) * Math.PI) * 96 : 225}
            r="8" fill={LIGHT} opacity={0.9} />
        </g>

        {/* status line */}
        <text x="550" y="382" textAnchor="middle" {...mono} fontSize="13"
          fill={lossless ? GREEN : MUTED} letterSpacing="0.08em">
          {lossless
            ? "mode: LOSSLESS · reconstruction is exact"
            : `mode: LOSSY · quantizer discards detail ${pulse > 0.5 ? "·" : ""}`}
        </text>
      </svg>
      )}
      <TipBubble tip={tip} />
    </div>
  );
}

function MobileBlocksDiagram({
  t,
  step,
  pIn,
  lift,
  bypass,
  lossless,
  hot,
  bind,
}: {
  t: number;
  step: number;
  pIn: number;
  lift: number;
  bypass: number;
  lossless: boolean;
  hot: string | null;
  bind: ReturnType<typeof useTip>["bind"];
}) {
  const current = BLOCKS_STEPS[Math.min(step, BLOCKS_STEPS.length - 1)];
  const progress = clamp01((t - current.from) / Math.max(0.0001, current.to - current.from));
  const route = [[26, 34], [34, 97], [97, 146], [146, 242]][Math.min(step, 3)];
  const packetY = lerp(route[0], route[1], easeInOut(progress));
  const pulse = 0.5 + 0.5 * Math.sin(t * 38);

  const block = (id: string, label: string, y: number, color: string, active: boolean) => (
    <g {...bind(id, `${label} · ${id === "quantizer" ? "irreversible" : "reversible"}.`)}>
      <rect x="36" y={y} width="288" height="38" rx="11"
        fill={active || hot === id ? "#1B1D29" : "#15161F"}
        stroke={active || hot === id ? color : "#2A2C3A"} strokeWidth={active || hot === id ? 2 : 1.1} />
      <text x="180" y={y + 25} textAnchor="middle" fontSize="23" fontWeight="750"
        fill={active || hot === id ? CHALK : "rgba(241,241,245,0.82)"}>{label}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 360 310" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Vertical three-block source encoder with a lossless quantizer bypass">
      <defs>
        <marker id="blocksPhoneArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M1 1 L4 6 L7 1" fill="none" stroke={LIGHT} strokeWidth="1.4" strokeLinecap="round" />
        </marker>
        <radialGradient id="blocksPhoneGlow">
          <stop offset="0%" stopColor={LIGHT} stopOpacity="0.82" />
          <stop offset="100%" stopColor={LIGHT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="310" fill="#101119" />

      <g opacity={pIn}>
        <rect x="100" y="4" width="160" height="34" rx="10" fill="#15161F" stroke="#2A2C3A" />
        <text x="180" y="27" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="22"
          fontWeight="700" fill={CHALK}>INPUT f(x,y)</text>
      </g>
      <path d="M180 39 L180 49" stroke={LIGHT} strokeWidth="1.5" markerEnd="url(#blocksPhoneArrow)" />

      <rect x="20" y="52" width="320" height="166" rx="15" fill="rgba(91,99,240,0.035)"
        stroke={step < 3 ? ACCENT : "#2A2C3A"} strokeWidth="1.4" strokeDasharray="6 6" />
      <text x="180" y="72" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="22"
        fontWeight="700" letterSpacing="1" fill={step < 3 ? LIGHT : MUTED}>SOURCE ENCODER</text>

      {block("mapper", "MAPPER · REVERSIBLE", 78, GREEN, step === 0)}
      <g transform={`translate(0 ${-46 * lift})`} opacity={1 - 0.62 * lift}>
        {block("quantizer", "QUANTIZER · IRREVERSIBLE", 127, RED, step === 1)}
      </g>
      {block("symbol", "SYMBOL ENCODER · REVERSIBLE", 176, GREEN, step === 2)}

      <path d="M180 117 L180 124" stroke={LIGHT} strokeWidth="1.4" markerEnd="url(#blocksPhoneArrow)"
        opacity={1 - bypass} />
      <path d="M180 166 L180 173" stroke={LIGHT} strokeWidth="1.4" markerEnd="url(#blocksPhoneArrow)"
        opacity={1 - bypass} />
      <path d="M324 96 C350 112 350 177 324 194" fill="none" stroke={GREEN} strokeWidth="2"
        strokeDasharray="6 5" pathLength={1} strokeDashoffset={1 - bypass} opacity={bypass} />
      <text x="312" y="148" textAnchor="end" fontFamily="var(--font-mono)" fontSize="22"
        fontWeight="700" fill={GREEN} opacity={bypass}>BYPASS</text>

      <path d="M180 219 L180 229" stroke={LIGHT} strokeWidth="1.5" markerEnd="url(#blocksPhoneArrow)" />
      <g opacity={pIn} {...bind("channel", "Compressed data leaves the source encoder.")}>
        <rect x="42" y="232" width="276" height="30" rx="10" fill="#15161F" stroke="#2A2C3A" />
        <text x="180" y="252" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="22"
          fontWeight="700" fill={step === 2 ? LIGHT : MUTED}>CHANNEL · COMPRESSED DATA</text>
      </g>
      <path d="M180 263 L180 272" stroke={LIGHT} strokeWidth="1.5" markerEnd="url(#blocksPhoneArrow)" />
      <g opacity={pIn}>
        <rect x="74" y="275" width="212" height="30" rx="10" fill="#15161F"
          stroke={lossless ? GREEN : "#2A2C3A"} strokeWidth={lossless ? 1.8 : 1.1} />
        <text x="180" y="295" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="24"
          fontWeight="700" fill={lossless ? GREEN : CHALK}>OUTPUT f̂(x,y)</text>
      </g>

      <g pointerEvents="none">
        <path d={`M180 ${packetY - 15} L180 ${packetY - 6}`} stroke={LIGHT} strokeWidth="3"
          strokeLinecap="round" opacity="0.45" />
        <circle cx="180" cy={packetY} r="16" fill="url(#blocksPhoneGlow)" />
        <circle cx="180" cy={packetY} r="6" fill={CHALK} stroke={LIGHT} strokeWidth="1.6"
          opacity={0.86 + 0.14 * pulse} />
      </g>
    </svg>
  );
}

/* ================================================================== */
/*  SLIDE 10 — error-free (lossless) compression                      */
/* ================================================================== */

export const LOSSLESS_STEPS: Step[] = timeline(
  [
    ["original", "The original", "Eight rows of pixels, many of them identical neighbours."],
    ["encode", "Encode", "Runs and codes: RLE, then Huffman or LZW — no information is thrown away."],
    ["decode", "Decode", "The decoder applies the exact inverse operations, in reverse order."],
    ["diff", "Difference = 0", "Compare pixel by pixel: every difference is zero. Bit-for-bit identical."],
  ],
  3000
);

const GRID = Array.from({ length: 8 }, (_, rr) =>
  Array.from({ length: 8 }, (_, cc) => 240 - Math.floor(rr / 2) * 8 - (cc > 5 ? 12 : 0))
);
const RUNS = ["240×16", "232×8", "224×8", "216×16"];

export function LosslessScene({ tr }: { tr: Transport }) {
  const { ref, tip, hot, bind } = useTip();
  const [phone, setPhone] = useState(false);
  const t = tr.t;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 699px) and (orientation: portrait)");
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pIn = easeOut(seg(t, 0.02, 0.14));
  const pEnc = easeInOut(seg(t, 0.27, 0.46));
  const pDec = easeInOut(seg(t, 0.52, 0.7));
  const pDiff = easeInOut(seg(t, 0.76, 0.93));

  const GridCells = ({ x, y, op, zeros }: { x: number; y: number; op: number; zeros?: boolean }) => (
    <g>
      {GRID.map((row, rr) =>
        row.map((v, cc) => {
          const d = clamp01(op * 2.6 - (rr + cc) * 0.05);
          return (
            <g key={`${rr}${cc}`} opacity={d}>
              <rect x={x + cc * 30} y={y + rr * 30} width="27" height="27" rx="5"
                fill={zeros ? "rgba(61,220,151,0.12)" : "#101119"}
                stroke={zeros ? GREEN : "#2A2C3A"} strokeWidth="1" />
              <text x={x + cc * 30 + 13.5} y={y + rr * 30 + 18} textAnchor="middle" {...mono}
                fontSize="10.5" fill={zeros ? GREEN : rr % 2 ? LIGHT : MUTED}>
                {zeros ? "0" : v}
              </text>
            </g>
          );
        })
      )}
    </g>
  );

  return (
    <div ref={ref} className="relative h-full w-full">
      {phone ? (
        <MobileLosslessDiagram pIn={pIn} pEnc={pEnc} pDec={pDec} pDiff={pDiff} bind={bind} hot={hot} />
      ) : (
      <svg viewBox="0 0 1100 620" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
        className="h-full w-full" role="img"
        aria-label="Lossless compression round trip with a zero difference grid">
        <defs>
          <pattern id="lsMesh" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill={CHALK} opacity="0.05" />
          </pattern>
        </defs>
        <rect width="1100" height="620" fill="url(#lsMesh)" />

        {/* original */}
        <g opacity={pIn} {...bind("orig", "Original 8×8 block — 64 pixels, 512 bits.")}>
          <rect x="48" y="118" width="264" height="264" rx="18"
            fill={hot === "orig" ? "#1B1D29" : "#15161F"}
            stroke={hot === "orig" ? LIGHT : "#2A2C3A"} strokeWidth="1.5" />
          <GridCells x={56} y={126} op={pIn} />
          <text x="180" y="416" textAnchor="middle" {...mono} fontSize="12.5" letterSpacing="0.14em"
            fill={MUTED}>ORIGINAL · 512 bits</text>
        </g>

        {/* encode arrow + code stream */}
        <g opacity={pEnc} {...bind("enc", "RLE then Huffman/LZW — every step reversible.")}>
          <path d="M330 250 L420 250" stroke={LIGHT} strokeWidth="2.4" fill="none"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pEnc} />
          <path d="M412 242 L424 250 L412 258" fill={LIGHT} />
          <text x="375" y="232" textAnchor="middle" {...mono} fontSize="11.5" fill={LIGHT}>
            RLE + Huffman
          </text>

          <rect x="432" y="150" width="228" height="200" rx="18"
            fill={hot === "enc" ? "#1B1D29" : "#15161F"}
            stroke={hot === "enc" ? LIGHT : "#2A2C3A"} strokeWidth="1.5" />
          <text x="452" y="182" {...mono} fontSize="11.5" letterSpacing="0.14em" fill={MUTED}>
            CODE STREAM
          </text>
          {RUNS.map((rn, i) => {
            const d = clamp01(pEnc * 2.4 - i * 0.25);
            return (
              <g key={rn} opacity={d}>
                <rect x="452" y={196 + i * 34} width="128" height="26" rx="8"
                  fill="rgba(91,99,240,0.14)" stroke={ACCENT} strokeWidth="1.2" />
                <text x="516" y={214 + i * 34} textAnchor="middle" {...mono} fontSize="12.5"
                  fontWeight="700" fill={LIGHT}>{rn}</text>
              </g>
            );
          })}
          <text x="452" y="330" {...mono} fontSize="11.5" fill={GREEN}>
            ≈ 96 bits · CR 5.3 : 1
          </text>
        </g>

        {/* decode arrow + reconstructed */}
        <g opacity={pDec} {...bind("dec", "Inverse operations rebuild every pixel exactly.")}>
          <path d="M672 250 L762 250" stroke={LIGHT} strokeWidth="2.4" fill="none"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pDec} />
          <path d="M754 242 L766 250 L754 258" fill={LIGHT} />
          <text x="717" y="232" textAnchor="middle" {...mono} fontSize="11.5" fill={LIGHT}>
            decode
          </text>

          <rect x="780" y="118" width="264" height="264" rx="18"
            fill={hot === "dec" ? "#1B1D29" : "#15161F"}
            stroke={hot === "dec" ? LIGHT : "#2A2C3A"} strokeWidth="1.5" />
          <GridCells x={788} y={126} op={pDec} />
          <text x="912" y="416" textAnchor="middle" {...mono} fontSize="12.5" letterSpacing="0.14em"
            fill={MUTED}>RECONSTRUCTED</text>
        </g>

        {/* difference = 0 */}
        <g opacity={pDiff} {...bind("diff", "A zero difference means the reconstruction is identical." )}>
          <rect x="392" y="448" width="316" height="120" rx="20" fill="rgba(61,220,151,0.09)"
            stroke={GREEN} strokeWidth="1.6" />
          <text x="416" y="486" {...mono} fontSize="13" letterSpacing="0.16em" fill={GREEN}>
            f(x,y) − f̂(x,y)
          </text>
          <text x="416" y="536" fontSize="40" fontWeight="800" fill={GREEN} letterSpacing="-0.03em">
            = 0 ✓
          </text>
          <text x="688" y="536" textAnchor="end" {...mono} fontSize="12.5" fill={GREEN}>
            lossless
          </text>

          <text x="760" y="486" {...mono} fontSize="11.5" fill={MUTED}>formats</text>
          <text x="760" y="512" {...mono} fontSize="13" fontWeight="700" fill={LIGHT}>
            PNG · TIFF · GIF
          </text>
          <text x="760" y="540" {...mono} fontSize="11.5" fill={MUTED}>
            medical · satellite · archival
          </text>
        </g>
      </svg>
      )}
      <TipBubble tip={tip} />
    </div>
  );
}

function MobileLosslessDiagram({
  pIn,
  pEnc,
  pDec,
  pDiff,
  bind,
  hot,
}: {
  pIn: number;
  pEnc: number;
  pDec: number;
  pDiff: number;
  bind: ReturnType<typeof useTip>["bind"];
  hot: string | null;
}) {
  const grid = (x: number, opacity: number, id: string) => (
    <g opacity={opacity} {...bind(id, id === "orig" ? "The original 8×8 source pixels." : "Decoded pixels match the original exactly.")}>
      <rect x={x - 3} y="36" width="166" height="166" rx="12" fill="#15161F"
        stroke={hot === id ? "#8A90FF" : "#2A2C3A"} strokeWidth="1.3" />
      {GRID.map((row, rr) => row.map((v, cc) => (
        <g key={`${rr}-${cc}`}>
          <rect x={x + cc * 20} y={42 + rr * 20} width="18" height="18" rx="3"
            fill={id === "dec" ? "rgba(61,220,151,0.1)" : "#101119"}
            stroke={id === "dec" ? "rgba(61,220,151,0.45)" : "#2A2C3A"} strokeWidth="0.7" />
          <text x={x + cc * 20 + 9} y={55 + rr * 20} textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize="12.5" fill={id === "dec" ? "#3DDC97" : rr % 2 ? "#8A90FF" : "#9A9DB0"}>
            {v}
          </text>
        </g>
      )))}</g>
  );

  return (
    <svg viewBox="0 0 360 370" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Lossless before and after pixel grids with zero difference">
      <text x="93" y="23" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="15" fontWeight="700"
        letterSpacing="0.8" fill="#9A9DB0">BEFORE</text>
      <text x="267" y="23" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="15" fontWeight="700"
        letterSpacing="0.8" fill="#3DDC97">AFTER</text>
      {grid(10, pIn, "orig")}
      {grid(184, pDec, "dec")}

      <g opacity={pEnc} {...bind("enc", "RLE and Huffman shorten runs without losing a pixel.")}>
        <text x="180" y="222" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="15"
          fontWeight="700" fill="#8A90FF">RLE + HUFFMAN</text>
        {["240×16", "232×8", "224×8"].map((v, i) => (
          <g key={v}>
            <rect x={15 + i * 112} y="232" width="102" height="34" rx="9"
              fill="rgba(91,99,240,0.14)" stroke="#5B63F0" strokeWidth="1.1" />
            <text x={66 + i * 112} y="254" textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize="13" fontWeight="700" fill="#8A90FF">{v}</text>
          </g>
        ))}
      </g>

      <g opacity={pDiff} {...bind("diff", "Difference equals zero: every output pixel is unchanged.")}>
        <rect x="32" y="286" width="296" height="52" rx="15" fill="rgba(61,220,151,0.1)"
          stroke="#3DDC97" strokeWidth="1.5" />
        <text x="180" y="319" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="21"
          fontWeight="800" letterSpacing="0.6" fill="#3DDC97">DIFFERENCE = 0 ✓</text>
      </g>
      <text x="180" y="365" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14"
        fill="#9A9DB0" opacity={pDiff}>PNG · TIFF · GIF · MEDICAL ARCHIVE</text>
    </svg>
  );
}
