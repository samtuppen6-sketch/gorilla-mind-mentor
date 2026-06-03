import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { getWorkoutById, type WorkoutBlock } from "@/lib/workouts";
import {
  completePracticeSession,
  dailyActionLabel,
  type CompletionResult,
  type PracticeSource,
} from "@/lib/practice-progress";
import { getPracticeById } from "@/lib/practices";
import { ArrowLeft, Play, Pause, Check, Clock, Dumbbell, ShieldAlert, CalendarCheck } from "lucide-react";

const searchSchema = z.object({
  source: z.enum(["coach", "library", "protocol"]).optional(),
  route: z.string().optional(),
});

export const Route = createFileRoute("/workout/$workoutId")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Guided Workout — Gorilla Mind" },
      { name: "description", content: "Guided exercise routines: home, gym, Pilates, running and low-energy sessions." },
    ],
  }),
  component: () => (
    <AppShell>
      <WorkoutPlayerPage />
    </AppShell>
  ),
});

type PlayerState = "idle" | "playing" | "paused" | "complete";

function WorkoutPlayerPage() {
  const { workoutId } = useParams({ from: "/workout/$workoutId" });
  const search = useSearch({ from: "/workout/$workoutId" });
  const source: PracticeSource = search.source ?? "library";
  const linkedCoachRoute = search.route ?? null;

  const workout = getWorkoutById(workoutId);
  const [state, setState] = useState<PlayerState>("idle");
  const [completion, setCompletion] = useState<CompletionResult | null>(null);

  if (!workout) {
    return (
      <>
        <SectionHeader eyebrow="Workout" title="Not found." sub="That workout does not exist." />
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

  function handleComplete() {
    if (!workout || state === "complete") return;
    // Map workout completion onto a training-equivalent practice slot so DP / streaks /
    // daily minimum logic continues to work without introducing a second progress system.
    const trainingPractice = getPracticeById("mobility_recovery_10min");
    if (!trainingPractice) {
      setState("complete");
      return;
    }
    const result = completePracticeSession({
      practice: trainingPractice,
      source,
      linkedCoachRoute,
    });
    setCompletion(result);
    setState("complete");
  }

  return (
    <>
      <SectionHeader
        eyebrow={`${workout.category.replace(/_/g, " ")} · ${workout.level}`}
        title={workout.title}
        sub={workout.summary}
      />
      <div className="px-5 space-y-4 pb-8">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {workout.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" />
            {workout.equipment.join(", ")}
          </span>
          <span>Source: {source}</span>
        </div>

        <BlockSection label="Warm-up" blocks={workout.warmup} />
        <BlockSection label="Main session" blocks={workout.main} emphasized />
        <BlockSection label="Cool-down" blocks={workout.cooldown} />

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Coaching cues</p>
          <ul className="text-sm text-foreground space-y-1">
            {workout.cues.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>

        {workout.safetyNotes.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2 inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Safety
            </p>
            <ul className="text-sm text-foreground space-y-1">
              {workout.safetyNotes.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Session status</p>
          <p className="text-sm text-foreground">
            {state === "idle" && "Ready"}
            {state === "playing" && "In progress…"}
            {state === "paused" && "Paused"}
            {state === "complete" && "Complete ✓"}
          </p>
        </div>

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
            onClick={handleComplete}
            disabled={state === "complete"}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gold/40 bg-card py-3 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Complete
          </button>
        </div>

        {completion && (
          <div className="rounded-xl border border-gold/60 bg-gold/10 p-5 space-y-3">
            <p className="text-sm font-bold text-gold inline-flex items-center gap-2">
              <Check className="w-4 h-4" />
              Workout complete
            </p>
            <div className="text-xs text-foreground space-y-1">
              <p>
                <span className="text-gold-muted">Discipline points awarded: </span>
                <span className="font-semibold text-gold">
                  +{completion.pointsAwarded}
                  {completion.duplicate && " (duplicate today — no DP)"}
                </span>
              </p>
              <p>
                <span className="text-gold-muted">Daily action: </span>
                <span className="font-semibold">{dailyActionLabel(completion.dailyActionUpdated)}</span>
              </p>
              <p>
                <span className="text-gold-muted">Protocol streak: </span>
                {completion.protocolStreakUpdated
                  ? "daily minimum met — incremented"
                  : completion.dailyProgress.dailyMinimumMet
                    ? "already counted today"
                    : "daily minimum not yet met"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/coach"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-3 text-xs font-semibold text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Coach
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/50 bg-card py-3 text-xs font-semibold text-foreground"
              >
                <CalendarCheck className="w-4 h-4" />
                View Today
              </Link>
            </div>
          </div>
        )}

        {!completion && (
          <Link
            to="/coach"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card/60 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coach
          </Link>
        )}

        <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-[11px] font-mono space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Workout debug</p>
          <DRow k="workoutId" v={workout.id} />
          <DRow k="category" v={workout.category} />
          <DRow k="level" v={workout.level} />
          <DRow k="durationMinutes" v={String(workout.durationMinutes)} />
          <DRow k="source" v={source} />
          <DRow k="linkedCoachRoute" v={linkedCoachRoute ?? "—"} />
          <DRow k="completion saved" v={String(!!completion)} />
        </div>
      </div>
    </>
  );
}

function BlockSection({ label, blocks, emphasized }: { label: string; blocks: WorkoutBlock[]; emphasized?: boolean }) {
  return (
    <div className={`rounded-xl border ${emphasized ? "border-gold/40" : "border-border"} bg-card p-5`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">{label}</p>
      <ul className="text-sm text-foreground space-y-1.5">
        {blocks.map((b, i) => (
          <li key={`${b.name}-${i}`} className="flex justify-between gap-3">
            <span>{b.name}</span>
            <span className="text-muted-foreground text-right">{b.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2 text-muted-foreground">
      <span className="text-foreground shrink-0">{k}:</span>
      <span className="break-all">{v}</span>
    </div>
  );
}
