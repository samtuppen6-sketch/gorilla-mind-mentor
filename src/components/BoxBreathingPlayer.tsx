import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import type { AudioAsset } from "@/lib/audio-assets";

type Props = {
  asset: AudioAsset;
  started: boolean;
  onEnded?: () => void;
  onClose?: () => void;
};

const BREATHING_START = 55;
const BREATHING_END = 311;
const OUTRO_START = 314;
const ROUND_LENGTH = 16;
const PHASE_LENGTH = 4;
const TOTAL_ROUNDS = 16;

type Phase = "PREPARE" | "INHALE" | "HOLD" | "EXHALE" | "OUTRO";

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function computeState(t: number): {
  phase: Phase;
  countdown: number;
  round: number;
} {
  if (t < BREATHING_START) {
    return { phase: "PREPARE", countdown: 0, round: 0 };
  }
  if (t >= OUTRO_START) {
    return { phase: "OUTRO", countdown: 0, round: TOTAL_ROUNDS };
  }
  if (t >= BREATHING_END) {
    return { phase: "OUTRO", countdown: 0, round: TOTAL_ROUNDS };
  }
  const elapsed = t - BREATHING_START;
  const roundIndex = Math.floor(elapsed / ROUND_LENGTH);
  const inRound = elapsed - roundIndex * ROUND_LENGTH;
  const phaseIndex = Math.floor(inRound / PHASE_LENGTH);
  const inPhase = inRound - phaseIndex * PHASE_LENGTH;
  const countdown = Math.max(1, PHASE_LENGTH - Math.floor(inPhase));
  const phases: Phase[] = ["INHALE", "HOLD", "EXHALE", "HOLD"];
  return {
    phase: phases[phaseIndex] ?? "INHALE",
    countdown,
    round: Math.min(TOTAL_ROUNDS, roundIndex + 1),
  };
}

export function BoxBreathingPlayer({ asset, started, onEnded, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  // Smooth animation tick using rAF while playing
  useEffect(() => {
    function tick() {
      const el = audioRef.current;
      if (el) setCurrent(el.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    }
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying]);

  // Stop on unmount
  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!started) return;
    const el = audioRef.current;
    if (!el) return;
    void el.play().catch(() => setError(true));
  }, [started]);

  function handlePlayPause() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setError(true));
    else el.pause();
  }
  function handleRestart() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    setCurrent(0);
  }

  const { phase, countdown, round } = computeState(current);
  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const remaining = Math.max(0, duration - current);

  // Orb scale: inhale grows 0.55 -> 1, exhale shrinks 1 -> 0.55, hold stays.
  let scale = 0.55;
  let glow = 0.4;
  if (phase === "INHALE") {
    const inRound = (current - BREATHING_START) % ROUND_LENGTH;
    const inPhase = inRound % PHASE_LENGTH;
    scale = 0.55 + (inPhase / PHASE_LENGTH) * 0.45;
    glow = 0.4 + (inPhase / PHASE_LENGTH) * 0.6;
  } else if (phase === "EXHALE") {
    const inRound = (current - BREATHING_START) % ROUND_LENGTH;
    const inPhase = inRound % PHASE_LENGTH;
    scale = 1 - (inPhase / PHASE_LENGTH) * 0.45;
    glow = 1 - (inPhase / PHASE_LENGTH) * 0.6;
  } else if (phase === "HOLD") {
    // Stay where we are. Determine which hold from phaseIndex.
    const elapsed = current - BREATHING_START;
    const inRound = elapsed - Math.floor(elapsed / ROUND_LENGTH) * ROUND_LENGTH;
    const phaseIndex = Math.floor(inRound / PHASE_LENGTH);
    if (phaseIndex === 1) {
      scale = 1;
      glow = 1;
    } else {
      scale = 0.55;
      glow = 0.4;
    }
  } else if (phase === "OUTRO") {
    scale = 0.7;
    glow = 0.5;
  } else if (phase === "PREPARE") {
    // Subtle slow pulse during prep
    const p = (current % 6) / 6;
    scale = 0.6 + Math.sin(p * Math.PI * 2) * 0.04;
    glow = 0.4;
  }

  const phaseLabel =
    phase === "PREPARE"
      ? "PREPARE"
      : phase === "OUTRO"
        ? "COMPLETE"
        : phase;

  const subtext =
    phase === "PREPARE"
      ? "Prepare. Slow down. Get ready."
      : phase === "OUTRO"
        ? "Breath locked in. State controlled."
        : phase === "INHALE"
          ? "Through the nose"
          : phase === "EXHALE"
            ? "Through the mouth"
            : "Hold";

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm text-foreground">
          Audio unavailable. Continue with visual guidance below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-border bg-gradient-to-b from-card to-background p-6 overflow-hidden">
      <audio
        ref={audioRef}
        src={asset.audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onError={() => setError(true)}
      />

      {/* Close */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Round counter */}
      <div className="text-center mb-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold-muted">
          {phase === "PREPARE"
            ? "Get ready"
            : phase === "OUTRO"
              ? "Session complete"
              : `Round ${round} of ${TOTAL_ROUNDS}`}
        </p>
      </div>

      {/* Orb */}
      <div className="relative mx-auto my-4 flex items-center justify-center h-64 w-64">
        <div
          className="absolute inset-0 rounded-full transition-transform duration-1000 ease-in-out"
          style={{
            transform: `scale(${scale})`,
            background:
              "radial-gradient(circle at 50% 45%, hsl(var(--gold) / 0.9), hsl(var(--gold) / 0.15) 60%, transparent 75%)",
            opacity: glow,
            filter: "blur(2px)",
          }}
        />
        <div
          className="absolute rounded-full border border-gold/40 transition-transform duration-1000 ease-in-out"
          style={{
            width: "16rem",
            height: "16rem",
            transform: `scale(${scale})`,
          }}
        />
        <div className="relative text-center z-10">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gold-muted mb-2">
            {phase === "PREPARE" || phase === "OUTRO" ? "" : phaseLabel}
          </p>
          <p className="text-5xl font-bold text-foreground tabular-nums leading-none">
            {phase === "PREPARE" || phase === "OUTRO" ? "" : countdown}
          </p>
          {(phase === "PREPARE" || phase === "OUTRO") && (
            <p className="text-base font-semibold text-foreground max-w-[14rem] mx-auto">
              {subtext}
            </p>
          )}
        </div>
      </div>

      {/* Sub-instruction */}
      {phase !== "PREPARE" && phase !== "OUTRO" && (
        <p className="text-center text-xs text-muted-foreground mb-4">{subtext}</p>
      )}

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-gold transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-2 mb-4">
        <span>{formatTime(current)}</span>
        <span>-{formatTime(remaining)}</span>
      </div>

      {/* Controls */}
      {started && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePlayPause}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground hover:border-gold/40"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground hover:border-gold/40"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
