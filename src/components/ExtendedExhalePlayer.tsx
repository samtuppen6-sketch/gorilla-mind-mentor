import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import type { AudioAsset } from "@/lib/audio-assets";

type Props = {
  asset: AudioAsset;
  started: boolean;
  onEnded?: () => void;
  onClose?: () => void;
};

// Timing map (seconds) — audio.currentTime is the single source of truth.
const BREATHING_START = 58;
const BREATHING_END = 208; // 58 + 15 * 10
const OUTRO_START = 214;
const ROUND_LENGTH = 10;
const INHALE_LENGTH = 4;
const EXHALE_LENGTH = 6;
const TOTAL_ROUNDS = 15;

const SCALE_MIN = 0.75;
const SCALE_MAX = 1.15;

type Phase = "PREPARE" | "INHALE" | "EXHALE" | "OUTRO";

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
  phaseTime: number;
} {
  if (t < BREATHING_START) {
    return { phase: "PREPARE", countdown: 0, round: 0, phaseTime: 0 };
  }
  if (t >= OUTRO_START || t >= BREATHING_END) {
    return { phase: "OUTRO", countdown: 0, round: TOTAL_ROUNDS, phaseTime: 0 };
  }
  const elapsed = t - BREATHING_START;
  const roundIndex = Math.floor(elapsed / ROUND_LENGTH);
  const inRound = elapsed - roundIndex * ROUND_LENGTH;
  if (inRound < INHALE_LENGTH) {
    return {
      phase: "INHALE",
      countdown: Math.max(1, INHALE_LENGTH - Math.floor(inRound)),
      round: Math.min(TOTAL_ROUNDS, roundIndex + 1),
      phaseTime: inRound,
    };
  }
  const exhaleIn = inRound - INHALE_LENGTH;
  return {
    phase: "EXHALE",
    countdown: Math.max(1, EXHALE_LENGTH - Math.floor(exhaleIn)),
    round: Math.min(TOTAL_ROUNDS, roundIndex + 1),
    phaseTime: exhaleIn,
  };
}

export function ExtendedExhalePlayer({ asset, started, onEnded, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

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

  const { phase, countdown, round, phaseTime } = computeState(current);
  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const remaining = Math.max(0, duration - current);

  const easeInOutCubic = (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  let scale = SCALE_MIN;
  let glow = 0.4;

  if (phase === "PREPARE") {
    const p = (current % 6) / 6;
    const base = 0.6 + Math.sin(p * Math.PI * 2) * 0.04;
    const tToStart = BREATHING_START - current;
    const settle = Math.max(0, Math.min(1, 1 - tToStart / 2));
    scale = lerp(base, SCALE_MIN, easeInOutCubic(settle));
    glow = 0.4;
  } else if (phase === "OUTRO") {
    scale = 0.7;
    glow = 0.5;
  } else if (phase === "INHALE") {
    const progress = Math.max(0, Math.min(1, phaseTime / INHALE_LENGTH));
    scale = lerp(SCALE_MIN, SCALE_MAX, easeInOutCubic(progress));
    glow = lerp(0.4, 1, easeInOutCubic(progress));
  } else {
    // EXHALE — slow, calm contraction over 6s
    const progress = Math.max(0, Math.min(1, phaseTime / EXHALE_LENGTH));
    scale = lerp(SCALE_MAX, SCALE_MIN, easeInOutCubic(progress));
    glow = lerp(1, 0.4, easeInOutCubic(progress));
  }

  const phaseLabel =
    phase === "INHALE" ? "INHALE" : phase === "EXHALE" ? "EXHALE SLOW" : "";

  const subtext =
    phase === "PREPARE"
      ? "Prepare. Slow the body down."
      : phase === "OUTRO"
        ? "System down. State protected."
        : phase === "INHALE"
          ? "Through the nose"
          : "Through the mouth";

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

      <div className="text-center mb-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold-muted">
          {phase === "PREPARE"
            ? "Get ready"
            : phase === "OUTRO"
              ? "Session complete"
              : `Round ${round} of ${TOTAL_ROUNDS}`}
        </p>
      </div>

      <div className="relative mx-auto my-4 flex items-center justify-center h-64 w-64">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            transform: `scale(${scale})`,
            background:
              "radial-gradient(circle at 50% 45%, color-mix(in oklab, var(--gold) 90%, transparent), color-mix(in oklab, var(--gold) 15%, transparent) 60%, transparent 75%)",
            opacity: glow,
            filter: "blur(2px)",
          }}
        />
        <div
          className="absolute rounded-full border border-gold/40"
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

      {phase !== "PREPARE" && phase !== "OUTRO" && (
        <p className="text-center text-xs text-muted-foreground mb-4">{subtext}</p>
      )}

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
