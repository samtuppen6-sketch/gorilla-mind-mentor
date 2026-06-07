import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Music, FileText } from "lucide-react";
import type { AudioAsset } from "@/lib/audio-assets";

type Props = {
  asset: AudioAsset;
  /** Parent-controlled "session started" flag. When it flips true, audio auto-plays. */
  started: boolean;
  /** Called when the audio reaches the end (so the parent can enable Complete). */
  onEnded?: () => void;
};

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function GuidedAudioPlayer({ asset, started, onEnded }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  // Stop audio on unmount / navigation away.
  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    };
  }, []);

  // When the parent flips started -> true, kick off playback (user-initiated).
  useEffect(() => {
    if (!started) return;
    if (asset.status !== "ready") return;
    const el = audioRef.current;
    if (!el) return;
    void el.play().catch(() => setError(true));
  }, [started, asset.status]);

  // Placeholder state — no MP3 yet. Show the title block without dead-end copy.
  if (asset.status === "placeholder") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-muted">
          <Music className="w-3.5 h-3.5" />
          Guided audio
        </div>
        <p className="text-sm font-semibold text-foreground">{asset.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Follow the on-screen steps below. Voice guidance arrives shortly.
        </p>
      </div>
    );
  }

  // Audio failed to load — still allow the user to complete via visual guidance.
  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-muted">
          <Music className="w-3.5 h-3.5" />
          Guided audio
        </div>
        <p className="text-sm text-foreground">
          Audio unavailable. Continue with visual guidance below.
        </p>
      </div>
    );
  }

  function handlePlayPause() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => setError(true));
    } else {
      el.pause();
    }
  }

  function handleRestart() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    setCurrent(0);
  }

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4 text-gold-muted" />
        <p className="text-sm font-semibold text-foreground">{asset.title}</p>
      </div>

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

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-gold transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Secondary controls — primary CTA is the Start/Complete button below. */}
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

      {asset.transcriptUrl && (
        <a
          href={asset.transcriptUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gold-muted hover:text-gold"
        >
          <FileText className="w-3.5 h-3.5" />
          View transcript
        </a>
      )}
    </div>
  );
}
