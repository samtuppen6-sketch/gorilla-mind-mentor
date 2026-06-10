import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { GuidedAudioPlayer } from "@/components/GuidedAudioPlayer";
import { BoxBreathingPlayer } from "@/components/BoxBreathingPlayer";
import { ExtendedExhalePlayer } from "@/components/ExtendedExhalePlayer";
import { UrgeResetPlayer } from "@/components/UrgeResetPlayer";
import { EnergisingBreathPlayer } from "@/components/EnergisingBreathPlayer";
import { IdentityResetBreathPlayer } from "@/components/IdentityResetBreathPlayer";
import { getPracticeById } from "@/lib/practices";
import {
  getAudioAssetById,
  getAudioAssetForPractice,
} from "@/lib/audio-assets";
import {
  completePracticeSession,
  dailyActionLabel,
  type CompletionResult,
  type PracticeSource,
} from "@/lib/practice-progress";
import { useDebugMode } from "@/lib/debug-mode";
import { ArrowLeft, Play, Check, Clock, ShieldAlert, CalendarCheck } from "lucide-react";

const searchSchema = z.object({
  source: z.enum(["coach", "library", "protocol"]).optional(),
  route: z.string().optional(),
});

export const Route = createFileRoute("/practice/$practiceId")({
  validateSearch: searchSchema,
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

function PracticePlayerPage() {
  const { practiceId } = useParams({ from: "/practice/$practiceId" });
  const search = useSearch({ from: "/practice/$practiceId" });
  const source: PracticeSource = search.source ?? "library";
  const linkedCoachRoute = search.route ?? null;
  const debugMode = useDebugMode();

  const practice = getPracticeById(practiceId);
  const audioAsset =
    (practice?.audioAssetId ? getAudioAssetById(practice.audioAssetId) : undefined) ??
    (practice ? getAudioAssetForPractice(practice.id) : undefined);

  const [started, setStarted] = useState(false);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);

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

  function handleStart() {
    setStarted(true);
  }

  function handleComplete() {
    if (!practice || !started || completion) return;
    const result = completePracticeSession({ practice, source, linkedCoachRoute });
    setCompletion(result);
  }

  const canComplete = started && !completion;

  return (
    <>
      <SectionHeader eyebrow={practice.category} title={practice.title} sub={practice.description} />
      <div className="px-5 space-y-4 pb-8">
        {/* Minimal meta row — premium, no raw technical labels */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {practice.durationMinutes > 0 ? `${practice.durationMinutes} min` : "Self-paced"}
          </span>
          <span className="capitalize">Intensity: {practice.intensity}</span>
        </div>

        {/* Safety note (audio-level, shown above player) */}
        {audioAsset?.safetyNote && (
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-xs text-foreground inline-flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-gold-muted shrink-0 mt-0.5" />
            <span>{audioAsset.safetyNote}</span>
          </div>
        )}

        {/* Guided audio — or quiet placeholder card. No dead-end "coming soon" copy. */}
        {audioAsset ? (
          practice.id === "box_breathing_5min" ? (
            <BoxBreathingPlayer asset={audioAsset} started={started} />
          ) : practice.id === "extended_exhale_3min" ? (
            <ExtendedExhalePlayer asset={audioAsset} started={started} />
          ) : practice.id === "urge_reset_3min" ? (
            <UrgeResetPlayer asset={audioAsset} started={started} />
          ) : practice.id === "energising_breath_3min" ? (
            <EnergisingBreathPlayer asset={audioAsset} started={started} />
          ) : practice.id === "identity_reset_breath_5min" ? (
            <IdentityResetBreathPlayer asset={audioAsset} started={started} />
          ) : (
            <GuidedAudioPlayer asset={audioAsset} started={started} />
          )
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Guided session</p>
            <p className="text-sm text-foreground">
              Follow the steps below at your own pace.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Steps</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{practice.instructionText}</p>
        </div>

        {/* Use when */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Use when</p>
          <ul className="text-sm text-foreground space-y-1">
            {practice.recommendedWhen.map((u: string) => (
              <li key={u}>• {u}</li>
            ))}
          </ul>
        </div>

        {/* Avoid when */}
        {practice.avoidWhen.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Avoid when</p>
            <ul className="text-sm text-foreground space-y-1">
              {practice.avoidWhen.map((u: string) => (
                <li key={u}>• {u}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety notes */}
        {practice.safetyNotes.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2 inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Safety
            </p>
            <ul className="text-sm text-foreground space-y-1">
              {practice.safetyNotes.map((c: string) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Single premium CTA: Start → Complete */}
        {!completion && (
          <div className="space-y-2 pt-1">
            {!started ? (
              <button
                type="button"
                onClick={handleStart}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-gold/10"
              >
                <Play className="w-4 h-4" />
                Start Session
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={!canComplete}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-gold/10 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Complete Session
              </button>
            )}
          </div>
        )}

        {/* Success banner */}
        {completion && (
          <div className="rounded-2xl border border-gold/60 bg-gold/10 p-5 space-y-3">
            <p className="text-sm font-bold text-gold inline-flex items-center gap-2">
              <Check className="w-4 h-4" />
              Practice complete
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
                <span className="text-gold-muted">Practice streak: </span>
                {completion.practiceStreakUpdated ? "incremented today" : "already counted today"}
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

        {/* Debug panel (dev-only) */}
        {debugMode && (
          <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-[11px] font-mono space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Practice debug</p>
            <DRow k="practiceId" v={practice.id} />
            <DRow k="audioAssetId" v={audioAsset?.id ?? "—"} />
            <DRow k="audioStatus" v={audioAsset?.status ?? "—"} />
            <DRow k="category" v={practice.category} />
            <DRow k="route" v={practice.route} />
            <DRow k="subRoute" v={practice.subRoute ?? "—"} />
            <DRow k="dailyActionKey" v={practice.dailyActionKey} />
            <DRow k="source" v={source} />
            <DRow k="linkedCoachRoute" v={linkedCoachRoute ?? "—"} />
            <DRow k="started" v={String(started)} />
            <DRow k="completion saved" v={String(!!completion)} />
            <DRow k="duplicate today" v={completion ? String(completion.duplicate) : "—"} />
            <DRow k="DP awarded" v={completion ? `+${completion.pointsAwarded}` : "—"} />
            <DRow k="daily action updated" v={completion ? (completion.dailyActionUpdated ?? "none") : "—"} />
            <DRow k="practice streak updated" v={completion ? String(completion.practiceStreakUpdated) : "—"} />
            <DRow k="protocol streak updated" v={completion ? String(completion.protocolStreakUpdated) : "—"} />
            <DRow
              k="daily minimum count"
              v={
                completion
                  ? `${[
                      completion.dailyProgress.breathworkCompleted,
                      completion.dailyProgress.meditationCompleted || completion.dailyProgress.mindfulnessCompleted,
                      completion.dailyProgress.trainingCompleted || completion.dailyProgress.mobilityCompleted || completion.dailyProgress.pilatesCompleted,
                      completion.dailyProgress.nutritionCompleted,
                      completion.dailyProgress.journalCompleted,
                      completion.dailyProgress.coldExposureCompleted,
                      completion.dailyProgress.heatExposureCompleted,
                    ].filter(Boolean).length} / 3`
                  : "—"
              }
            />
            <DRow k="dailyMinimumMet" v={completion ? String(completion.dailyProgress.dailyMinimumMet) : "—"} />
            <DRow k="fullProtocolCompleted" v={completion ? String(completion.dailyProgress.fullProtocolCompleted) : "—"} />
            <DRow k="DP today (total)" v={completion ? String(completion.dailyProgress.disciplinePointsToday) : "—"} />
            <DRow
              k="completedPracticeIdsToday"
              v={completion ? (completion.dailyProgress.completedPracticeIdsToday.join(", ") || "—") : "—"}
            />
            <DRow k="localStorage keys written" v={completion ? completion.keysWritten.join(", ") : "—"} />
          </div>
        )}
      </div>
    </>
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
