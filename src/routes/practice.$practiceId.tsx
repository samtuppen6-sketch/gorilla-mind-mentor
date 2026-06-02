import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { getPracticeById } from "@/lib/practices";
import { ArrowLeft, Play, Pause, Check, Clock, Music, Video, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/practice/$practiceId")({
  head: () => ({
    meta: [
      { title: "Guided Practice — Gorilla Mind" },
      { name: "description", content: "Guided breathwork, meditation, mobility and recovery practices." },
    ],
  }),
  component: () => (
    <AppShell>
      <PracticePlayerPage />
    </AppShell>
  ),
});

type PlayerState = "idle" | "playing" | "paused" | "complete";

function PracticePlayerPage() {
  const { practiceId } = useParams({ from: "/practice/$practiceId" });
  const practice = getPracticeById(practiceId);
  const [state, setState] = useState<PlayerState>("idle");

  if (!practice) {
    return (
      <>
        <SectionHeader eyebrow="Practice" title="Not found." sub="That practice does not exist." />
        <div className="px-5">
          <Link
            to="/coach"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coach
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader eyebrow={practice.category} title={practice.title} sub={practice.description} />
      <div className="px-5 space-y-4 pb-8">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {practice.durationMinutes} min
          </span>
          <span>Intensity: {practice.intensity}</span>
          <span>Sub-route: {practice.subRoute}</span>
        </div>

        {/* Media placeholders */}
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-center">
          <Music className="w-5 h-5 mx-auto text-gold-muted mb-2" />
          <p className="text-xs text-muted-foreground">Audio coming soon</p>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-center">
          <Video className="w-5 h-5 mx-auto text-gold-muted mb-2" />
          <p className="text-xs text-muted-foreground">Visual guide coming soon</p>
        </div>

        {/* Instruction text */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Instructions</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{practice.instructionText}</p>
        </div>

        {/* When to use */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Use when</p>
          <ul className="text-sm text-foreground space-y-1">
            {practice.whenToUse.map((u) => (
              <li key={u}>• {u}</li>
            ))}
          </ul>
        </div>

        {/* Contraindications */}
        {practice.contraindications.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2 inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Safety
            </p>
            <ul className="text-sm text-foreground space-y-1">
              {practice.contraindications.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Player status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Player status</p>
          <p className="text-sm text-foreground">
            {state === "idle" && "Ready"}
            {state === "playing" && "Playing…"}
            {state === "paused" && "Paused"}
            {state === "complete" && "Complete ✓"}
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setState("playing")}
            disabled={state === "playing" || state === "complete"}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
          <button
            type="button"
            onClick={() => setState("paused")}
            disabled={state !== "playing"}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-3 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
          <button
            type="button"
            onClick={() => setState("complete")}
            disabled={state === "complete"}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gold/40 bg-card py-3 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Complete
          </button>
        </div>

        <Link
          to="/coach"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card/60 py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Coach
        </Link>
      </div>
    </>
  );
}
