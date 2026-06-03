import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  ArrowLeft, Play, Pause, Check, Clock, Dumbbell, ShieldAlert,
  SkipForward, SkipBack, RotateCcw, Flame, Trophy, MessageCircle, Home, Repeat,
} from "lucide-react";

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

type SectionLabel = "Warm-up" | "Main session" | "Cool-down";

type Step = {
  section: SectionLabel;
  name: string;
  detail: string;
  rounds: number;       // for sets/reps or interval rounds
  perRoundSec: number;  // 0 if untimed (manual advance)
};

const DEFAULT_REP_SET_SECONDS = 45;
const DEFAULT_REST_BETWEEN_SETS_SEC = 30;

function parseStep(section: SectionLabel, b: WorkoutBlock): Step {
  const detail = b.detail.toLowerCase();
  // "X min" → minutes
  const minMatch = detail.match(/(\d+(?:\.\d+)?)\s*min\b/);
  // "X sec" → seconds
  const secMatch = detail.match(/(\d+)\s*sec\b/);
  // sets × reps "3 × 10" or "3 x 10"
  const setsRepsMatch = detail.match(/(\d+)\s*[×x]\s*(\d+)(?!\s*sec)/);
  // sets × seconds "3 × 30 sec"
  const setsSecMatch = detail.match(/(\d+)\s*[×x]\s*(\d+)\s*sec/);
  // "N rounds"
  const roundsMatch = detail.match(/(\d+)\s*rounds?/);

  if (setsSecMatch) {
    return { section, name: b.name, detail: b.detail, rounds: Number(setsSecMatch[1]), perRoundSec: Number(setsSecMatch[2]) };
  }
  if (setsRepsMatch) {
    return { section, name: b.name, detail: b.detail, rounds: Number(setsRepsMatch[1]), perRoundSec: DEFAULT_REP_SET_SECONDS };
  }
  if (roundsMatch && minMatch) {
    return { section, name: b.name, detail: b.detail, rounds: Number(roundsMatch[1]), perRoundSec: Math.round(Number(minMatch[1]) * 60) };
  }
  if (minMatch) {
    return { section, name: b.name, detail: b.detail, rounds: 1, perRoundSec: Math.round(Number(minMatch[1]) * 60) };
  }
  if (secMatch) {
    return { section, name: b.name, detail: b.detail, rounds: 1, perRoundSec: Number(secMatch[1]) };
  }
  return { section, name: b.name, detail: b.detail, rounds: 1, perRoundSec: 0 };
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function WorkoutPlayerPage() {
  const { workoutId } = useParams({ from: "/workout/$workoutId" });
  const search = useSearch({ from: "/workout/$workoutId" });
  const source: PracticeSource = search.source ?? "library";
  const linkedCoachRoute = search.route ?? null;

  const workout = getWorkoutById(workoutId);

  const steps = useMemo<Step[]>(() => {
    if (!workout) return [];
    return [
      ...workout.warmup.map((b) => parseStep("Warm-up", b)),
      ...workout.main.map((b) => parseStep("Main session", b)),
      ...workout.cooldown.map((b) => parseStep("Cool-down", b)),
    ];
  }, [workout]);

  // ── Persisted progress (per workoutId, local-only) ───────────────────────────
  // We persist step position + timer state so the user can refresh and resume.
  // We deliberately do NOT persist `running` — sessions resume paused so the
  // user explicitly opts back in.
  const storageKey = `gm:workout-progress:${workoutId}`;
  type Persisted = { stepIdx: number; round: number; resting: boolean; remaining: number };

  const hydrated = useMemo<Persisted | null>(() => {
    if (typeof window === "undefined" || steps.length === 0) return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const p = JSON.parse(raw) as Partial<Persisted>;
      if (
        typeof p.stepIdx !== "number" ||
        typeof p.round !== "number" ||
        typeof p.resting !== "boolean" ||
        typeof p.remaining !== "number"
      ) return null;
      // Sanity-check against current workout shape — discard if out of range.
      if (p.stepIdx < 0 || p.stepIdx >= steps.length) return null;
      if (p.round < 1 || p.round > steps[p.stepIdx].rounds) return null;
      return p as Persisted;
    } catch {
      return null;
    }
    // Hydrate once per workout — depends only on storageKey and step shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, steps.length]);

  const [stepIdx, setStepIdx] = useState<number>(hydrated?.stepIdx ?? 0);
  const [round, setRound] = useState<number>(hydrated?.round ?? 1);          // 1-based within current step
  const [resting, setResting] = useState<boolean>(hydrated?.resting ?? false); // between sets/rounds
  const [remaining, setRemaining] = useState<number>(hydrated?.remaining ?? 0); // seconds left in current timer (0 if untimed)
  const [running, setRunning] = useState(false);                              // resume always paused
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Skip the very first "reset remaining on step/round/resting change" pass so
  // a hydrated `remaining` is not immediately overwritten by step.perRoundSec.
  const skipNextRemainingResetRef = useRef<boolean>(hydrated !== null);

  const currentStep: Step | null = steps[stepIdx] ?? null;
  const isLastStep = currentStep != null && stepIdx === steps.length - 1;
  const isLastRound = currentStep != null && round >= currentStep.rounds;
  const finished = !!completion;

  // Initialise remaining whenever step/round/resting changes.
  useEffect(() => {
    if (!currentStep) return;
    if (skipNextRemainingResetRef.current) {
      skipNextRemainingResetRef.current = false;
      return;
    }
    if (resting) {
      setRemaining(DEFAULT_REST_BETWEEN_SETS_SEC);
    } else {
      setRemaining(currentStep.perRoundSec);
    }
  }, [stepIdx, round, resting, currentStep]);

  // Persist progress on any change. Skip while completed (we wipe the key on complete).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finished) return;
    try {
      const payload: Persisted = { stepIdx, round, resting, remaining };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore quota / disabled storage
    }
  }, [storageKey, stepIdx, round, resting, remaining, finished]);


  // Countdown tick.
  useEffect(() => {
    if (!running || finished) return;
    if (!currentStep) return;
    // Untimed step → no tick; user advances manually.
    if (!resting && currentStep.perRoundSec === 0) return;

    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current!);
          intervalRef.current = null;
          // Advance.
          advanceAfterTimer();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepIdx, round, resting, finished]);

  function advanceAfterTimer() {
    if (!currentStep) return;
    if (resting) {
      setResting(false);
      setRound((r) => r + 1);
      return;
    }
    // Just finished a round.
    if (!isLastRound) {
      setResting(true);
      return;
    }
    // Last round of step → next step or stop.
    if (isLastStep) {
      setRunning(false);
      return;
    }
    setStepIdx((i) => i + 1);
    setRound(1);
    setResting(false);
  }

  function handleStart() {
    if (!currentStep) return;
    setRunning(true);
  }
  function handlePause() {
    setRunning(false);
  }
  function handleSkip() {
    if (!currentStep) return;
    setRunning(false);
    if (resting) {
      setResting(false);
      setRound((r) => Math.min(r + 1, currentStep.rounds));
      return;
    }
    if (!isLastRound) {
      setRound((r) => r + 1);
      setResting(false);
      return;
    }
    if (!isLastStep) {
      setStepIdx((i) => i + 1);
      setRound(1);
      setResting(false);
    }
  }
  function handlePrev() {
    setRunning(false);
    setResting(false);
    if (round > 1) {
      setRound((r) => r - 1);
      return;
    }
    if (stepIdx > 0) {
      const prev = steps[stepIdx - 1];
      setStepIdx(stepIdx - 1);
      setRound(prev.rounds);
    }
  }
  function handleRestart() {
    setRunning(false);
    setResting(false);
    setStepIdx(0);
    setRound(1);
    try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }

  function handleComplete() {
    if (!workout || completion) return;
    const trainingPractice = getPracticeById("mobility_recovery_10min");
    if (!trainingPractice) return;
    const result = completePracticeSession({
      practice: trainingPractice,
      source,
      linkedCoachRoute,
    });
    setCompletion(result);
    setRunning(false);
    try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }


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

  const stepsDone = stepIdx + (isLastRound && !resting && !running && remaining === 0 ? 1 : 0);
  const progressPct = steps.length === 0 ? 0 : Math.min(100, Math.round((stepIdx / steps.length) * 100));

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

        {/* Active step player */}
        {currentStep && (
          <div className="rounded-xl border border-gold/50 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">
                {currentStep.section} · step {stepIdx + 1} / {steps.length}
              </p>
              <div className="flex items-center gap-2">
                {hydrated && !running && (
                  <span className="text-[9px] uppercase tracking-[0.25em] text-gold bg-gold/15 border border-gold/40 rounded px-1.5 py-0.5">
                    Resumed
                  </span>
                )}
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {progressPct}%
                </p>
              </div>
            </div>
            <div className="h-1 w-full bg-background/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {resting ? "Rest" : currentStep.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{currentStep.detail}</p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">
                  {resting ? "Recovery" : "Round"}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {resting ? "—" : `${round} / ${currentStep.rounds}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Timer</p>
                <p className="text-4xl font-bold tabular-nums text-gold">
                  {currentStep.perRoundSec === 0 && !resting ? "—:—" : fmt(remaining)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={stepIdx === 0 && round === 1}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background/60 py-3 text-xs font-semibold text-foreground disabled:opacity-40"
              >
                <SkipBack className="w-4 h-4" />
                Prev
              </button>
              {running ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-gold/40 bg-card py-3 text-xs font-semibold text-foreground"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-gold py-3 text-xs font-semibold text-primary-foreground"
                >
                  <Play className="w-4 h-4" />
                  {currentStep.perRoundSec === 0 && !resting ? "Mark" : "Start"}
                </button>
              )}
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLastStep && isLastRound && !resting}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background/60 py-3 text-xs font-semibold text-foreground disabled:opacity-40"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background/60 py-3 text-xs font-semibold text-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Untimed step: tap "Mark" advances manually. */}
            {currentStep.perRoundSec === 0 && !resting && (
              <p className="text-[11px] text-muted-foreground text-center">
                No clock for this step — tap <span className="text-gold-muted">Mark</span> when the set is done.
              </p>
            )}
          </div>
        )}

        <BlockSection
          label="Warm-up"
          blocks={workout.warmup}
          highlightIndex={currentStep?.section === "Warm-up" ? stepIdx : -1}
          baseIndex={0}
        />
        <BlockSection
          label="Main session"
          blocks={workout.main}
          emphasized
          highlightIndex={currentStep?.section === "Main session" ? stepIdx : -1}
          baseIndex={workout.warmup.length}
        />
        <BlockSection
          label="Cool-down"
          blocks={workout.cooldown}
          highlightIndex={currentStep?.section === "Cool-down" ? stepIdx : -1}
          baseIndex={workout.warmup.length + workout.main.length}
        />

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

        <button
          type="button"
          onClick={handleComplete}
          disabled={!!completion}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gold/40 bg-card py-3 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          Mark workout complete
        </button>

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
          <DRow k="resumed from storage" v={String(hydrated !== null)} />
          <DRow k="storageKey" v={storageKey} />
          <DRow k="category" v={workout.category} />
          <DRow k="level" v={workout.level} />
          <DRow k="durationMinutes" v={String(workout.durationMinutes)} />
          <DRow k="totalSteps" v={String(steps.length)} />
          <DRow k="currentStepIdx" v={String(stepIdx)} />
          <DRow k="currentStep" v={currentStep ? `${currentStep.section} · ${currentStep.name}` : "—"} />
          <DRow k="round" v={currentStep ? `${round}/${currentStep.rounds}` : "—"} />
          <DRow k="resting" v={String(resting)} />
          <DRow k="running" v={String(running)} />
          <DRow k="remainingSec" v={String(remaining)} />
          <DRow k="stepsDone" v={String(stepsDone)} />
          <DRow k="source" v={source} />
          <DRow k="linkedCoachRoute" v={linkedCoachRoute ?? "—"} />
          <DRow k="completion saved" v={String(!!completion)} />
        </div>
      </div>
    </>
  );
}

function BlockSection({
  label, blocks, emphasized, highlightIndex, baseIndex,
}: {
  label: string;
  blocks: WorkoutBlock[];
  emphasized?: boolean;
  highlightIndex: number;
  baseIndex: number;
}) {
  return (
    <div className={`rounded-xl border ${emphasized ? "border-gold/40" : "border-border"} bg-card p-5`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">{label}</p>
      <ul className="text-sm text-foreground space-y-1.5">
        {blocks.map((b, i) => {
          const active = baseIndex + i === highlightIndex;
          return (
            <li
              key={`${b.name}-${i}`}
              className={`flex justify-between gap-3 rounded-md px-2 py-1 ${
                active ? "bg-gold/15 text-gold" : ""
              }`}
            >
              <span>{b.name}</span>
              <span className={active ? "text-gold/80 text-right" : "text-muted-foreground text-right"}>{b.detail}</span>
            </li>
          );
        })}
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
