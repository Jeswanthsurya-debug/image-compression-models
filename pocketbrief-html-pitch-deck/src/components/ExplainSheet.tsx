import { useRef, type TouchEvent as ReactTouchEvent } from "react";
import type { SlideExplanation } from "../explain";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ExplainSheet({
  open,
  index,
  elapsed,
  note,
  onClose,
}: {
  open: boolean;
  index: number;
  elapsed: number;
  note: SlideExplanation;
  onClose: () => void;
}) {
  const startY = useRef<number | null>(null);

  if (!open) return null;

  const onTouchStart = (e: ReactTouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    if (startY.current === null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    startY.current = null;
    if (dy > 72) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(0,0,0,0.36)]"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="false"
        aria-label={`Speaker notes for slide ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="explain-sheet tip-in no-bar w-full max-w-[760px] overflow-y-auto rounded-t-[26px] border border-line bg-[#12131B] px-[clamp(20px,4vw,34px)] pt-3 shadow-[0_-28px_90px_-40px_rgba(0,0,0,0.95)] sm:rounded-[26px] sm:mb-6"
      >
        <div className="mx-auto h-[5px] w-[48px] rounded-full bg-[rgba(241,241,245,0.2)] sm:hidden" />

        <header className="mt-4 flex items-center justify-between gap-4">
          <div>
            <span className="mono-label text-[9px] text-accent-light">speaker notes · slide {String(index + 1).padStart(2, "0")}</span>
            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-chalk">Explain this slide</h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-line bg-card px-3 py-2 font-mono text-[11px] text-muted">
              {formatTime(elapsed)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close speaker notes"
              className="nav-btn flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                <path d="m3 3 10 10M13 3 3 13" />
              </svg>
            </button>
          </div>
        </header>

        <div className="mt-5 space-y-3 pb-5">
          <NoteBlock label="Say this" text={note.say} />
          <NoteBlock label="Show this" text={note.show} tone="accent" />
          <NoteBlock label="If asked" text={note.ask} tone="muted" />
        </div>

        <p className="pb-2 text-center font-mono text-[10px] text-[rgba(154,157,176,0.55)] sm:hidden">
          swipe down to close
        </p>
      </section>
    </div>
  );
}

function NoteBlock({
  label,
  text,
  tone = "default",
}: {
  label: string;
  text: string;
  tone?: "default" | "accent" | "muted";
}) {
  const labelColor = tone === "accent" ? "text-accent-light" : tone === "muted" ? "text-muted" : "text-chalk";
  return (
    <article className="rounded-[17px] border border-line bg-card px-4 py-4">
      <span className={`mono-label text-[9px] ${labelColor}`}>{label}</span>
      <p className="mt-2 text-[16px] leading-[1.55] text-[rgba(241,241,245,0.92)]">{text}</p>
    </article>
  );
}