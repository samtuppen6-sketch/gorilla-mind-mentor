import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import {
  askCoach,
  type CoachResponse,
  type CoachDebug,
  type DayPart,
  type SessionContext,
  type TemporalContext,
  type CoachHistoryTurn,
  type GuidedWorkoutRecommendation,
  type ProgramState,
} from "@/lib/coach.functions";
import { useProfile, useJournal } from "@/lib/profile-store";
import { loadDailyProgress } from "@/lib/practice-progress";
import { Loader2, Send, Play, Clock, ChevronDown, AlertTriangle, RotateCcw } from "lucide-react";
import type { GuidedPracticeRec } from "@/lib/practices";


const coachSearchSchema = z.object({
  prefill: z.string().max(2000).optional(),
});

export const Route = createFileRoute("/coach")({
  validateSearch: coachSearchSchema,
  head: () => ({
    meta: [
      { title: "AI Coach — Gorilla Mind" },
      { name: "description", content: "Direct, disciplined, grounded in the Gorilla Mind knowledge base." },
    ],
  }),
  component: () => (
    <AppShell>
      <CoachPage />
    </AppShell>
  ),
});

const SEED = "I hate my job, I feel stuck, I'm not motivated but want to get fit. What should I do?";

type ErrorKind =
  | "offline"
  | "rate_limit"
  | "no_credits"
  | "server"
  | "upstream"
  | "timeout"
  | "unknown";

type ThreadMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      guidedPractice: GuidedPracticeRec | null;
      guidedWorkout: GuidedWorkoutRecommendation | null;
      quickReplies: string[];
      debug: CoachDebug;
      programState: ProgramState | null;
      failure?: { kind: ErrorKind; title: string; description: string; lastUserMessage: string } | null;
    };

function classifyError(err: unknown): { kind: ErrorKind; title: string; description: string } {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const msg = raw.toLowerCase();

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { kind: "offline", title: "You're offline", description: "Check your connection and tap Retry." };
  }
  if (/failed to fetch|networkerror|network request failed|fetch failed/.test(msg)) {
    return { kind: "offline", title: "Can't reach the Coach", description: "Network request failed. Check your connection and retry." };
  }
  if (/\b429\b|rate.?limit|too many requests/.test(msg)) {
    return { kind: "rate_limit", title: "Coach is rate limited", description: "Too many requests right now. Wait a moment, then retry." };
  }
  if (/\b402\b|payment required|insufficient.*credit|out of credit/.test(msg)) {
    return { kind: "no_credits", title: "Out of AI credits", description: "Add credits in Workspace → Usage, then retry." };
  }
  if (/\b5\d\d\b|internal server|bad gateway|service unavailable|gateway timeout/.test(msg)) {
    return { kind: "server", title: "Coach service is down", description: "Upstream error. Try again in a minute." };
  }
  if (/timeout|timed out|aborted/.test(msg)) {
    return { kind: "timeout", title: "Coach took too long", description: "The request timed out. Tap Retry." };
  }
  if (/openai|knowledge.?base|file_search|vector store|retrieval/.test(msg)) {
    return { kind: "upstream", title: "Knowledge base error", description: "The Coach couldn't reach its knowledge base. Retry shortly." };
  }
  return { kind: "unknown", title: "Coach request failed", description: raw ? raw.slice(0, 140) : "Something went wrong. Tap Retry." };
}

function buildTemporalContext(message: string): TemporalContext {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayPart: DayPart =
    hour >= 4 && hour < 11 ? "MORNING" :
    hour >= 11 && hour < 16 ? "MIDDAY" :
    (hour >= 16 && (hour < 21 || (hour === 21 && minute < 30))) ? "EVENING" :
    "LATE_NIGHT";

  const m = message.toLowerCase();
  let sessionContext: SessionContext =
    dayPart === "MORNING" ? "MORNING_CHECK_IN" :
    dayPart === "MIDDAY" ? "MIDDAY_COURSE_CORRECTION" :
    dayPart === "EVENING" ? "EVENING_REVIEW" : "LATE_NIGHT_SLEEP_PROTECTION";

  if (/safety|emergency|crisis|self.?harm|boundary|relapse/.test(m)) sessionContext = "SAFETY_OR_BOUNDARY";
  else if (/hate my job|feel stuck|not motivated|wasting my life|don'?t know where to start|lost|directionless/.test(m)) sessionContext = "GENERAL_LIFE_STUCK";
  else if (/transform my life|change my life|reset my life|full reset|20.?day|60.?day|90.?day|full plan|complete plan/.test(m)) sessionContext = "GENERAL_TRANSFORMATION_REQUEST";
  else if (/pre.?training|about to train|before (gym|training)|warm.?up/.test(m)) sessionContext = "PRE_TRAINING";
  else if (/post.?training|after (gym|training)|just trained|finished (gym|training)/.test(m)) sessionContext = "POST_TRAINING";
  else if (/missed (the )?day|broken streak|fell off|bad day/.test(m)) sessionContext = "MISSED_DAY_REPAIR";
  else if (/plan my day|today'?s plan|daily plan/.test(m)) sessionContext = "DAILY_PLAN";
  else if (/wind ?down|before bed|bedtime/.test(m)) sessionContext = "WIND_DOWN";

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    localDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    localTime: `${pad(hour)}:${pad(minute)}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    dayOfWeek: days[now.getDay()],
    dayPart,
    sessionContext,
  };
}

function buildFailureDebug(temporal: TemporalContext, err: unknown): CoachDebug {
  return {
    selectedRoute: "GENERAL_COACHING",
    breathworkSubRoute: "NONE",
    routeReason: "Client-side request failure before route detector ran.",
    retrievalQuery: "",
    fileSearchCalled: false,
    vectorStoreId: null,
    retrievedChunksCount: 0,
    retrievedFilenames: [],
    retrievedPreviews: [],
    groundedInRetrieval: false,
    apiError: err instanceof Error ? err.message : String(err),
    model: "",
    profileContextSent: false,
    latestJournalSent: false,
    primaryGapUsed: null,
    protocolDayUsed: null,
    safetyFlagsUsed: [],
    guidedPracticeId: null,
    guidedPracticeReason: null,
    localDate: temporal.localDate,
    localTime: temporal.localTime,
    timezone: temporal.timezone,
    dayOfWeek: temporal.dayOfWeek,
    dayPart: temporal.dayPart,
    sessionContext: temporal.sessionContext,
    temporalSource: "client",
    timeBasedRouteReason: null,
    responseMode:
      temporal.dayPart === "MORNING" ? "MORNING_ACTIVATION" :
      temporal.dayPart === "MIDDAY" ? "AFTERNOON_RESCUE" :
      temporal.dayPart === "EVENING" ? "EVENING_RESET" : "LATE_NIGHT_SHUTDOWN",
    conversationContinuation: false,
    userCanReply: true,
    quickRepliesShown: false,
    retrievalSuppressedVolumes: [],
    reasonForSuppression: null,
    previousCoachReplyOptions: [],
    userContinuationCommandDetected: false,
    continuationCommand: "NONE",
    routeOverrideApplied: false,
    routeOverrideReason: null,
    selectedRouteBeforeOverride: null,
    selectedRouteAfterOverride: null,
    duplicateAdviceSuppressed: false,
    suppressedAdvice: [],
    fitnessGoal: "unknown",
    fitnessLevel: "unknown",
    trainingLocation: "unknown",
    equipment: "unknown",
    injuryFlag: "unknown",
    availableTime: "unknown",
    energyLevel: "unknown",
    preferredStyle: "unknown",
    exerciseRoute: null,
    guidedWorkoutRecommendation: null,
    exercisePersonalisationMissing: [],
    exerciseContinuationDetected: false,
    exercisePlanSource: null,
    exerciseKnowledgeUsed: false,
    safetyModificationApplied: false,
    selectedPillars: [],
    pillarReasoning: "",
    activePlanType: null,
    activePlanLength: null,
    guidedPracticeRecommendation: null,
    calorieTargetUsed: null,
    calorieSource: "not_available",
    calorieMissingFields: [],
    macroTargetUsed: null,
    programmePersonalisationMissing: [],
    knowledgeBaseVolumesUsed: [],
    genericFallbackUsed: false,
    genericFallbackReason: null,
  };
}

function CoachPage() {
  const ask = useServerFn(askCoach);
  const profile = useProfile();
  const journal = useJournal();
  const search = useSearch({ from: "/coach" });
  const [seed, setSeed] = useState(search.prefill ?? SEED);
  const [reply, setReply] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If the route was opened with ?prefill=..., load it into the seed/reply
  // composer once so the user can edit-then-send. We only apply it on initial
  // arrival to avoid clobbering the user's own typing.
  const prefillAppliedRef = useRef(false);
  useEffect(() => {
    if (prefillAppliedRef.current) return;
    if (!search.prefill) return;
    prefillAppliedRef.current = true;
    if (thread.length === 0) {
      setSeed(search.prefill);
    } else {
      setReply(search.prefill);
      setComposerOpen(true);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [search.prefill, thread.length]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, loading]);

  // Tap-outside-to-collapse.
  useEffect(() => {
    if (!composerOpen) return;
    const onDown = (e: PointerEvent) => {
      const el = composerRef.current;
      if (el && !el.contains(e.target as Node)) setComposerOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [composerOpen]);

  const send = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || loading) return;

    const history: CoachHistoryTurn[] = thread.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Find the most recent assistant programState to carry the active plan forward.
    const priorProgramState: ProgramState | null = (() => {
      for (let i = thread.length - 1; i >= 0; i--) {
        const m = thread[i];
        if (m.role === "assistant" && m.programState) return m.programState;
      }
      return null;
    })();

    setThread((t) => [...t, { role: "user", content: message }]);
    setReply("");
    setComposerOpen(false);
    setLoading(true);
    const temporal = buildTemporalContext(message);
    try {
      const dailyProgress = loadDailyProgress();
      const res: CoachResponse = await ask({
        data: { question: message, profile, journal, dailyProgress, temporal, history, priorProgramState },
      });

      // Server function returned, but the upstream model/KB call failed —
      // it surfaces this via debug.apiError + a placeholder answer.
      if (res.debug.apiError) {
        const cls = classifyError(res.debug.apiError);
        toast.error(cls.title, {
          description: cls.description,
          action: { label: "Retry", onClick: () => send(message) },
        });
        setThread((t) => [
          ...t,
          {
            role: "assistant",
            content: res.answer || `${cls.title} — ${cls.description}`,
            guidedPractice: res.guidedPractice,
            guidedWorkout: res.guidedWorkout,
            quickReplies: res.quickReplies ?? [],
            debug: res.debug,
            programState: res.programState ?? null,
            failure: { ...cls, lastUserMessage: message },
          },
        ]);
        return;
      }

      setThread((t) => [
        ...t,
        {
          role: "assistant",
          content: res.answer,
          guidedPractice: res.guidedPractice,
          guidedWorkout: res.guidedWorkout,
          quickReplies: res.quickReplies ?? [],
          debug: res.debug,
          programState: res.programState ?? null,
          failure: null,
        },
      ]);
    } catch (err) {
      const cls = classifyError(err);
      toast.error(cls.title, {
        description: cls.description,
        action: { label: "Retry", onClick: () => send(message) },
      });
      setThread((t) => [
        ...t,
        {
          role: "assistant",
          content: `${cls.title}. ${cls.description}`,
          guidedPractice: null,
          guidedWorkout: null,
          quickReplies: [],
          debug: buildFailureDebug(temporal, err),
          programState: null,
          failure: { ...cls, lastUserMessage: message },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [ask, journal, loading, profile, thread]);

  const hasThread = thread.length > 0;
  const lastAssistant = [...thread].reverse().find((m) => m.role === "assistant") as
    | (Extract<ThreadMessage, { role: "assistant" }>)
    | undefined;

  return (
    <>
      <SectionHeader eyebrow="AI" title="Coach." sub="Direct. Calm. Grounded in profile, journal and the Gorilla Mind knowledge base." />
      <div className="px-5 space-y-4 pb-40">
        <div className="rounded-xl border border-border bg-card/60 p-3 text-[11px] text-muted-foreground">
          <span className="text-gold-muted">Context loaded:</span> profile · {profile.name} · day {profile.protocolDay} · gap "{profile.primaryGap}" {journal ? `· journal ${journal.date}` : "· no journal yet"}
        </div>

        {!hasThread && (
          <form
            onSubmit={(e) => { e.preventDefault(); send(seed); }}
            className="rounded-xl border border-border bg-card p-3"
          >
            <textarea
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Ask the Coach…"
              rows={4}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
            <button
              type="submit"
              disabled={loading || !seed.trim()}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Searching the knowledge base…" : "Ask the Coach"}
            </button>
          </form>
        )}

        {hasThread && (
          <div className="space-y-3">
            {thread.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="rounded-xl border border-border bg-background/60 p-4 ml-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">You</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{m.content}</p>
                </div>
              ) : (
                <div key={i} className="space-y-2 mr-6">
                  {m.failure ? (
                    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-destructive">{m.failure.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{m.failure.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => send(m.failure!.lastUserMessage)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-background/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Coach</p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                  )}
                  {m.guidedPractice && (
                    <div className="rounded-xl border border-gold/40 bg-card p-5 space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Guided practice</p>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{m.guidedPractice.title}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                          <span>{m.guidedPractice.category}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{m.guidedPractice.durationMinutes} min</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="text-gold-muted">Why: </span>{m.guidedPractice.reason}
                      </p>
                      <Link
                        to="/practice/$practiceId"
                        params={{ practiceId: m.guidedPractice.id }}
                        search={{ source: "coach", route: m.debug.selectedRoute }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground"
                      >
                        <Play className="w-4 h-4" />
                        {m.guidedPractice.buttonLabel}
                      </Link>
                    </div>
                  )}
                  {m.guidedWorkout && (
                    <div className="rounded-xl border border-gold/40 bg-card p-5 space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Guided workout</p>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{m.guidedWorkout.title}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                          <span className="capitalize">{m.guidedWorkout.category.replace(/_/g, " ")}</span>
                          <span className="capitalize">{m.guidedWorkout.level}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{m.guidedWorkout.durationMinutes} min</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="text-gold-muted">Why: </span>{m.guidedWorkout.reason}
                      </p>
                      <Link
                        to="/workout/$workoutId"
                        params={{ workoutId: m.guidedWorkout.id }}
                        search={{ source: "coach", route: m.debug.selectedRoute }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground"
                      >
                        <Play className="w-4 h-4" />
                        {m.guidedWorkout.buttonLabel}
                      </Link>
                    </div>
                  )}
                </div>
              )
            )}
            {loading && (
              <div className="mr-6 rounded-xl border border-border bg-card p-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Coach is thinking…
              </div>
            )}
            <div ref={threadEndRef} />
          </div>
        )}

        <DebugPanel debug={lastAssistant?.debug ?? null} loading={loading} />
      </div>

      {/* Collapsible bottom composer */}
      {hasThread && (
        <div
          ref={composerRef}
          className="fixed left-0 right-0 bottom-16 z-40 px-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="mx-auto max-w-screen-sm rounded-xl border border-border bg-card shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/95">
            {!composerOpen ? (
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(true);
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="w-full h-12 px-4 flex items-center justify-between text-left text-sm text-muted-foreground"
              >
                <span className="truncate">
                  {reply.trim() ? reply : "Reply to the coach..."}
                </span>
                <Send className="w-4 h-4 text-gold shrink-0" />
              </button>
            ) : (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Reply</span>
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    aria-label="Collapse composer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {lastAssistant && lastAssistant.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lastAssistant.quickReplies.map((q) => (
                      <button
                        key={q}
                        type="button"
                        disabled={loading}
                        onClick={() => send(q)}
                        className="text-[11px] uppercase tracking-[0.15em] rounded-full border border-gold/50 px-3 py-1.5 text-gold hover:bg-gold/10 disabled:opacity-50 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(e) => { e.preventDefault(); send(reply); }}
                  className="space-y-2"
                >
                  <textarea
                    ref={textareaRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to the coach..."
                    rows={3}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        send(reply);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !reply.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? "Coach is thinking…" : "Send reply"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DebugPanel({ debug: d, loading }: { debug: CoachDebug | null; loading: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-xs font-mono">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-3">Debug panel</p>
      {loading && <p className="text-muted-foreground">Awaiting response…</p>}
      {!loading && !d && <p className="text-muted-foreground">No request yet.</p>}
      {d && (
        <dl className="space-y-2 text-muted-foreground">
          <Row k="selected route" v={d.selectedRoute} />
          <Row k="response mode" v={d.responseMode} />
          <Row k="conversation continuation" v={String(d.conversationContinuation)} />
          <Row k="previous coach reply options" v={d.previousCoachReplyOptions.length ? d.previousCoachReplyOptions.join(", ") : "—"} />
          <Row k="user continuation command detected" v={String(d.userContinuationCommandDetected)} />
          <Row k="continuation command" v={d.continuationCommand} />
          <Row k="route override applied" v={String(d.routeOverrideApplied)} />
          <Row k="route override reason" v={d.routeOverrideReason ?? "—"} />
          <Row k="selected route before override" v={d.selectedRouteBeforeOverride ?? "—"} />
          <Row k="selected route after override" v={d.selectedRouteAfterOverride ?? "—"} />
          <Row k="duplicate advice suppressed" v={String(d.duplicateAdviceSuppressed)} />
          <Row k="suppressed advice" v={d.suppressedAdvice.length ? d.suppressedAdvice.join(", ") : "—"} />
          <Row k="breathwork sub-route" v={d.breathworkSubRoute} />
          <Row k="route reason" v={d.routeReason} />
          <Row k="time-based route reason" v={d.timeBasedRouteReason ?? "—"} />
          <Row k="user can reply" v={String(d.userCanReply)} />
          <Row k="quick replies shown" v={String(d.quickRepliesShown)} />
          <Row k="retrieval suppressed volumes" v={d.retrievalSuppressedVolumes.length ? d.retrievalSuppressedVolumes.join(", ") : "none"} />
          <Row k="reason for suppression" v={d.reasonForSuppression ?? "—"} />
          <Row k="localDate" v={d.localDate ?? "—"} />
          <Row k="localTime" v={d.localTime ?? "—"} />
          <Row k="timezone" v={d.timezone ?? "—"} />
          <Row k="dayOfWeek" v={d.dayOfWeek ?? "—"} />
          <Row k="dayPart" v={d.dayPart ?? "—"} />
          <Row k="sessionContext" v={d.sessionContext ?? "—"} />
          <Row k="temporal source" v={d.temporalSource} />
          <Row k="retrieval query" v={d.retrievalQuery || "—"} />
          <Row k="model" v={d.model} />
          <Row k="profile context sent" v={String(d.profileContextSent)} />
          <Row k="latest journal sent" v={String(d.latestJournalSent)} />
          <Row k="primaryGap used" v={d.primaryGapUsed ?? "—"} />
          <Row k="protocolDay used" v={d.protocolDayUsed === null ? "—" : String(d.protocolDayUsed)} />
          <Row k="safety flags used" v={d.safetyFlagsUsed.length ? d.safetyFlagsUsed.join(", ") : "none"} />
          <Row k="guided practice selected" v={d.guidedPracticeId ? "true" : "false"} />
          <Row k="guided practice id" v={d.guidedPracticeId ?? "—"} />
          <Row k="guided practice reason" v={d.guidedPracticeReason ?? "—"} />
          <Row k="file_search called" v={String(d.fileSearchCalled)} />
          <Row k="vector store ID" v={d.vectorStoreId ?? "—"} />
          <Row k="retrieved chunks" v={String(d.retrievedChunksCount)} />
          <Row k="grounded in retrieval" v={String(d.groundedInRetrieval)} />
          <Row k="OpenAI error" v={d.apiError ?? "none"} />
          <div>
            <p className="text-foreground">retrieved filenames:</p>
            {d.retrievedFilenames.length === 0 ? (
              <p className="pl-2">—</p>
            ) : (
              <ul className="pl-2 space-y-0.5">
                {d.retrievedFilenames.map((f) => <li key={f}>• {f}</li>)}
              </ul>
            )}
          </div>
          <div>
            <p className="text-foreground">chunk previews (first 240 chars):</p>
            {d.retrievedPreviews.length === 0 ? (
              <p className="pl-2">—</p>
            ) : (
              <ol className="pl-2 space-y-2">
                {d.retrievedPreviews.map((p, i) => (
                  <li key={i} className="text-[11px] leading-relaxed">
                    <span className="text-gold-muted">[{i + 1}]</span> {p}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="pt-2 border-t border-border/40">
            <p className="text-foreground mb-1">Daily OS:</p>
            <Row k="selected pillars" v={fmtArr(d.selectedPillars)} />
            <Row k="pillar reasoning" v={d.pillarReasoning || "—"} />
            <Row k="active plan type" v={d.activePlanType ?? "—"} />
            <Row k="active plan length" v={d.activePlanLength ?? "—"} />
            <Row k="guided practice recommendation" v={fmtObj(d.guidedPracticeRecommendation)} />
            <Row k="calorie target used" v={d.calorieTargetUsed == null ? "—" : String(d.calorieTargetUsed)} />
            <Row k="calorie source" v={d.calorieSource ?? "—"} />
            <Row k="calorie missing fields" v={fmtArr(d.calorieMissingFields)} />
            <Row k="macro target used" v={fmtObj(d.macroTargetUsed)} />
            <Row k="programme personalisation missing" v={fmtArr(d.programmePersonalisationMissing)} />
            <Row k="knowledge base volumes used" v={fmtArr(d.knowledgeBaseVolumesUsed)} />
            <Row k="generic fallback used" v={String(d.genericFallbackUsed)} />
            <Row k="generic fallback reason" v={d.genericFallbackReason ?? "—"} />
          </div>
          <div className="pt-2 border-t border-border/40">
            <p className="text-foreground mb-1">Exercise engine:</p>
            <Row k="fitness goal" v={d.fitnessGoal ?? "—"} />
            <Row k="fitness level" v={d.fitnessLevel ?? "—"} />
            <Row k="training location" v={d.trainingLocation ?? "—"} />
            <Row k="equipment" v={d.equipment ?? "—"} />
            <Row k="injury flag" v={d.injuryFlag ?? "—"} />
            <Row k="available time" v={d.availableTime ?? "—"} />
            <Row k="energy level" v={d.energyLevel ?? "—"} />
            <Row k="preferred style" v={d.preferredStyle ?? "—"} />
            <Row k="exercise route" v={d.exerciseRoute ?? "—"} />
            <Row k="guided workout recommendation" v={fmtObj(d.guidedWorkoutRecommendation)} />
            <Row k="exercise personalisation missing" v={fmtArr(d.exercisePersonalisationMissing)} />
            <Row k="exercise continuation detected" v={String(d.exerciseContinuationDetected)} />
            <Row k="exercise plan source" v={d.exercisePlanSource ?? "—"} />
            <Row k="exercise knowledge used" v={String(d.exerciseKnowledgeUsed)} />
            <Row k="safety modification applied" v={String(d.safetyModificationApplied)} />
          </div>
        </dl>
      )}
    </div>
  );
}

function fmtArr(a: unknown): string {
  if (!Array.isArray(a) || a.length === 0) return "—";
  return a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(", ");
}

function fmtObj(o: unknown): string {
  if (o == null) return "—";
  if (typeof o === "string") return o;
  try {
    const s = JSON.stringify(o);
    return s === "{}" ? "—" : s;
  } catch {
    return String(o);
  }
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-foreground shrink-0">{k}:</span>
      <span className="break-all">{v}</span>
    </div>
  );
}
