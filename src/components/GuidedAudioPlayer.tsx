import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Music, FileText } from "lucide-react";
import type { AudioAsset } from "@/lib/audio-assets";

type Props = { asset: AudioAsset };

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function GuidedAudioPlayer({ asset }: Props) {
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

  // Placeholder state — no MP3 yet.
  if (asset.status === "placeholder") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 space-y-2">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-muted">
          <Music className="w-3.5 h-3.5" />
          Guided audio placeholder
        </div>
        <p className="text-sm text-foreground font-semibold">{asset.title}</p>
        <p className="text-xs text-muted-foreground">
          This session is ready for an MP3 file. Follow the on-screen steps for now.
        </p>
      </div>
    );
  }

  // Audio failed to load.
  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-5 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Audio</p>
        <p className="text-sm text-foreground">
          Audio unavailable. Continue with visual guidance.
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
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
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
        onEnded={() => setIsPlaying(false)}
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

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handlePlayPause}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </button>
      </div>

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
