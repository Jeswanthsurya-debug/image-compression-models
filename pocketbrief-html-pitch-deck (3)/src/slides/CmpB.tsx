import { StepPlayer } from "../components/anim/Controls";
import { useTransport } from "../components/anim/core";
import {
  BLOCKS_STEPS, BlocksScene, LOSSLESS_STEPS, LosslessScene,
} from "../components/anim/CmpScenesB";
import { PSYCH_STEPS, PsychScene, RLE_STEPS, RleScene } from "../components/anim/CmpScenesA";
import { AnimSlide, Chip, Plate, SlideShell, Tilt, Title } from "../components/ui";

const r = (i: number) => ({ ["--i" as string]: i });

/* ================= 06 · SPATIAL REDUNDANCY · RLE ================= */

export function RleSlide() {
  const tr = useTransport(RLE_STEPS);
  return (
    <AnimSlide index={6} pill="06 · Spatial" topic="Run-length encoding"
      title="Spatial redundancy" tr={tr} foot="WWWWWBBBWW → 5W 3B 2W">
      <RleScene tr={tr} />
    </AnimSlide>
  );
}

/* ================= 07 · IRRELEVANT INFORMATION ================= */

export function PsychSlide() {
  const tr = useTransport(PSYCH_STEPS);
  return (
    <AnimSlide index={7} pill="07 · Psychovisual" topic="Irrelevant information"
      title="What the eye can't see" tr={tr} foot="Perception sets the budget">
      <PsychScene tr={tr} />
    </AnimSlide>
  );
}

/* ================= 08 · THE COMPRESSION MODEL ================= */

import { MODEL_STEPS, ModelScene } from "../components/anim/CmpScenesB";

export function ModelSlide() {
  const tr = useTransport(MODEL_STEPS);
  return (
    <AnimSlide index={8} pill="08 · The model" topic="Compression model"
      title="The compression model" tr={tr} layout="bar"
      lead="Gonzalez & Woods in one diagram: encode, send, decode."
      foot="Packets travel block by block">
      <ModelScene tr={tr} />
    </AnimSlide>
  );
}

/* ============ 09 · THE THREE BLOCKS + LOSSLESS TOGGLE ============ */

const BLOCK_CARDS = [
  {
    n: "01",
    name: "Mapper",
    purpose: "Decorrelates the pixels with a transform or prediction.",
    removes: "spatial · temporal",
    rev: true,
  },
  {
    n: "02",
    name: "Quantizer",
    purpose: "Rounds away detail the eye will not recover. The only lossy stage.",
    removes: "psychovisual",
    rev: false,
  },
  {
    n: "03",
    name: "Symbol Encoder",
    purpose: "Assigns the shortest codes to the most frequent symbols.",
    removes: "coding",
    rev: true,
  },
];

export function BlocksSlide() {
  const tr = useTransport(BLOCKS_STEPS);
  const lossless = tr.step >= 3;

  return (
    <SlideShell index={9} pill="09 · The blocks" topic="Inside the encoder"
      foot="Toggle lossless mode in the diagram">
      <div className="block-slide-content flex min-h-0 flex-1 flex-col gap-[clamp(10px,1.6vh,20px)]">
        <Title index={2}>The three blocks, in detail</Title>

        <div className="block-toggle-row flex items-center justify-between gap-4">
          <span className="mono-label text-[10px] text-muted">Lossless mode</span>
          <button
            type="button"
            onClick={() => tr.goto(lossless ? 1 : 3)}
            aria-pressed={lossless}
            aria-label={`Lossless mode ${lossless ? "on" : "off"}`}
            className={`lossless-switch relative flex min-h-11 min-w-[82px] items-center rounded-full border px-1.5 transition-colors duration-300 ${
              lossless
                ? "justify-end border-[rgba(61,220,151,0.65)] bg-[rgba(61,220,151,0.12)]"
                : "justify-start border-line bg-card"
            }`}
          >
            <span className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-mono text-[10px] font-bold ${
              lossless ? "bg-[#3DDC97] text-[#0B0C12]" : "bg-[#292B39] text-muted"
            }`}>
              {lossless ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        <div className="blocks-main grid min-h-0 grid-cols-1 items-stretch gap-[clamp(10px,1.4vw,24px)] lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <Plate index={3} minH="clamp(200px,34vh,460px)" className="blocks-plate">
            <BlocksScene tr={tr} />
          </Plate>

          <div className="reveal block-step-panel flex min-h-0 flex-col justify-center" style={r(4)}>
            <StepPlayer tr={tr} layout="side" />
          </div>
        </div>

        {/* detail cards */}
        <div className="block-card-rail grid grid-cols-1 gap-[clamp(12px,1.2vw,20px)] md:grid-cols-3 [perspective:1300px]">
          {BLOCK_CARDS.map((c, i) => {
            const on = tr.step === i;
            const bypassed = lossless && i === 1;
            return (
              <Tilt key={c.name} max={6} className="block-card-item reveal h-full">
                <button
                  type="button"
                  onClick={() => tr.goto(i)}
                  className={`depth-sm group flex h-full w-full cursor-pointer flex-col rounded-[20px] border bg-card p-[clamp(16px,1.5vw,24px)] text-left transition-colors duration-300 ${
                    bypassed
                      ? "border-[rgba(255,92,122,0.55)]"
                      : on
                        ? "border-[rgba(91,99,240,0.65)]"
                        : "border-line hover:border-[rgba(91,99,240,0.4)]"
                  }`}
                  style={{ ...r(5 + i), transformStyle: "preserve-3d", opacity: bypassed ? 0.72 : 1 }}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className={`num-dim text-[30px] font-extrabold leading-none tracking-[-0.06em] ${on ? "!text-accent" : ""}`}>
                      {c.n}
                    </span>
                    {bypassed ? (
                      <Chip tone="red">bypassed</Chip>
                    ) : (
                      <Chip tone={c.rev ? "green" : "red"}>{c.rev ? "reversible ✓" : "irreversible ✗"}</Chip>
                    )}
                  </span>
                  <span className="mt-3 block text-[clamp(16px,1.4vw,21px)] font-extrabold tracking-[-0.02em] text-chalk">
                    {c.name}
                  </span>
                  <span className="deck-copy mt-2 block text-[clamp(12px,0.95vw,14px)] leading-[1.6] text-muted">
                    {c.purpose}
                  </span>
                  <span className="mono-label mt-3 block text-[9px] text-accent-light">
                    removes {c.removes}
                  </span>
                </button>
              </Tilt>
            );
          })}
        </div>
      </div>
    </SlideShell>
  );
}

/* ==================== 10 · ERROR-FREE COMPRESSION ==================== */

export function LosslessSlide() {
  const tr = useTransport(LOSSLESS_STEPS);
  return (
    <AnimSlide index={10} pill="10 · Lossless" topic="Error-free compression"
      title="Error-free compression" tr={tr}
      lead="RLE, Huffman and LZW — with PNG, TIFF and GIF carrying the result."
      foot="Medical · satellite · archival">
      <LosslessScene tr={tr} />
    </AnimSlide>
  );
}
