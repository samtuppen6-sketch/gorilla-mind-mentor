import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import {
  loadDailyProgress,
  loadPracticeLog,
  today as todayStr,
  type DailyProgress,
  type PracticeLogEntry,
  PRACTICE_LOG_KEY,
  DAILY_PROGRESS_KEY,
} from "@/lib/practice-progress";
import { useProfile, getUserEntryRoute } from "@/lib/profile-store";
import { useDebugMode } from "@/lib/debug-mode";
import {
  PROTOCOL_PILLAR_REGISTRY,
  computePillarStates,
  computeProtocolDailyState,
  pillarStatusLabel,
  type PillarComputedState,
} from "@/lib/protocol-pillars";
import { Check, Circle, ChevronDown, ChevronUp, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Gorilla Mind" },
      { name: "description", content: "Your daily protocol, discipline points and streak." },
    ],
  }),
  component: () => (
    <AppShell>
      <TodayPage />
    </AppShell>
  ),
});

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

type ProfileExtras = {
  practiceStreak?: number;
  lastCompletedPracticeId?: string;
  lastCompletedPracticeCategory?: string;
};

function TodayPage() {
  const profile = useProfile();
  const debugMode = useDebugMode();
  const navigate = useNavigate();
  const profileExtras = profile as typeof profile & ProfileExtras;
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [log, setLog] = useState<PracticeLogEntry[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [logLoaded, setLogLoaded] = useState(false);
  const [showTop21, setShowTop21] = useState(true);

  // First-open gate: if there is no account yet, route to /auth; if account
  // but onboarding incomplete, route to /onboarding. Completed users see the
  // Today dashboard as before. Runs post-mount to avoid SSR hydration jank.
  useEffect(() => {
    const dest = getUserEntryRoute(profile, "/");
    if (dest === "/auth") navigate({ to: "/auth" });
    else if (dest === "/onboarding") navigate({ to: "/onboarding" });
  }, [profile.identityProfile, profile.onboardingComplete, navigate]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    setProgress(loadDailyProgress());
    setProgressLoaded(!!localStorage.getItem(DAILY_PROGRESS_KEY));
    setLog(loadPracticeLog());
    setLogLoaded(!!localStorage.getItem(PRACTICE_LOG_KEY));
  }, []);

  const t = todayStr();
  const d = new Date();
  const today = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const todaysLog = log.filter((e) => e.date === t);

  const pillarStates: PillarComputedState[] = useMemo(
    () => computePillarStates(progress, profile),
    [progress, profile],
  );
  const protocolState = useMemo(
    () => computeProtocolDailyState(progress, profile),
    [progress, profile],
  );

  const dpToday = progress?.disciplinePointsToday ?? 0;
  const practiceStreak = profileExtras.practiceStreak ?? 0;
  const protocolStreak = protocolState.dailyMinimumMet ? profile.currentStreak : 0;

  const assignedStates = pillarStates.filter((s) => s.assigned);
  const completedStates = assignedStates.filter((s) => s.completed);
  const remainingStates = assignedStates.filter((s) => !s.completed);
  const unavailableStates = pillarStates.filter((s) => !s.assigned);
  const highPriorityCompleted = protocolState.highPriorityPillarsCompletedToday.length;

  return (
    <>
      <SectionHeader
        eyebrow={today}
        title="Today."
        sub="One clean win. No phone-first behaviour. Execute the protocol."
      />
      <div className="px-5 space-y-4 pb-8">
        {!profile.onboardingComplete && (
          <Link
            to={profile.identityProfile ? "/onboarding" : "/auth"}
            className="block rounded-xl border border-gold bg-gold/10 p-4 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">
              Get personalised
            </p>
            <p className="text-lg font-semibold text-gold mt-1">
              Start Your Reset
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.identityProfile
                ? "2 minutes. Coach builds around you after."
                : "Create your account, then 2 minutes of setup."}
            </p>
          </Link>
        )}
        <Stat label="Discipline points" value={String(dpToday)} hint="Earned today" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Practice streak" value={`${practiceStreak}d`} hint="Any guided practice" />
          <Stat
            label="Protocol streak"
            value={`${protocolStreak}d`}
            hint={protocolState.dailyMinimumMet ? "Daily minimum met" : "Not yet today"}
          />
        </div>

        {/* Daily minimum tracker */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Daily minimum
            </p>
            <span
              className={`text-xs font-semibold ${
                protocolState.dailyMinimumMet ? "text-gold" : "text-foreground"
              }`}
            >
              {protocolState.dailyMinimumCount} / 3 pillars
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-background overflow-hidden">
            <div
              className="h-full bg-gold transition-all"
              style={{
                width: `${Math.min(100, (protocolState.dailyMinimumCount / 3) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            High-priority completed: {highPriorityCompleted} / {protocolState.highPriorityAssignedPillarIds.length}
          </p>
          {protocolState.fullProtocolCompleted && (
            <p className="mt-2 text-[11px] text-gold font-semibold">Full protocol completed ✓</p>
          )}
        </div>

        {/* Top 21 expandable */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowTop21((s) => !s)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold-muted">
                Top 21 Protocol
              </p>
              <p className="text-sm text-foreground mt-1">
                {completedStates.length} / {assignedStates.length} assigned complete
                {unavailableStates.length > 0 ? ` · ${unavailableStates.length} not assigned` : ""}
              </p>
            </div>
            {showTop21 ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showTop21 && (
            <ul className="border-t border-border divide-y divide-border">
              {pillarStates
                .slice()
                .sort((a, b) => a.pillar.displayOrder - b.pillar.displayOrder)
                .map((s) => (
                  <PillarRow key={s.pillar.pillarId} state={s} />
                ))}
            </ul>
          )}
        </div>

        {/* Completed today list */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-muted mb-2">
            Completed practices today
          </p>
          {todaysLog.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No guided practice completed yet today.
            </p>
          ) : (
            <ul className="space-y-2">
              {todaysLog.map((e) => (
                <li key={e.id} className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                  <p className="text-sm font-semibold text-foreground">{e.practiceTitle}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {e.category} · {e.durationMinutes} min ·{" "}
                    <span className="text-gold font-semibold">+{e.disciplinePointsAwarded} DP</span> ·{" "}
                    <span className="capitalize">{e.source}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Remaining assigned pillars */}
        {remainingStates.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold-muted mb-2">
              Remaining assigned pillars
            </p>
            <ul className="space-y-1">
              {remainingStates.slice(0, 6).map((s) => (
                <li
                  key={s.pillar.pillarId}
                  className="text-xs text-muted-foreground flex items-center gap-2"
                >
                  <Circle className="w-3 h-3" />
                  <span>{s.pillar.title}</span>
                  {s.pillar.highPriority && (
                    <span className="text-[9px] uppercase tracking-wider text-gold">
                      Priority
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Debug panel */}
        {debugMode && (
        <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-[11px] font-mono space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">
            Today debug
          </p>
          <DRow k="PROTOCOL_PILLAR_REGISTRY loaded" v={String(PROTOCOL_PILLAR_REGISTRY.length === 21)} />
          <DRow k="gm.dailyProgress.v1 loaded" v={String(progressLoaded)} />
          <DRow k="gm.userProfile.v1 loaded" v={String(!!profile)} />
          <DRow k="gm.practiceLog.v1 loaded" v={String(logLoaded)} />
          <DRow k="date" v={t} />
          <DRow k="assignedPillars" v={protocolState.assignedPillarIds.join(", ") || "—"} />
          <DRow k="unavailablePillars" v={protocolState.unavailablePillarIds.join(", ") || "none"} />
          <DRow
            k="completedPillarIdsToday"
            v={protocolState.completedPillarIdsToday.join(", ") || "none"}
          />
          <DRow
            k="completedDailyActionKeysToday"
            v={protocolState.completedDailyActionKeysToday.join(", ") || "none"}
          />
          <DRow
            k="highPriorityPillarsCompletedToday"
            v={protocolState.highPriorityPillarsCompletedToday.join(", ") || "none"}
          />
          <DRow k="dailyMinimumCount" v={String(protocolState.dailyMinimumCount)} />
          <DRow k="highPriorityMinimumCount" v={String(protocolState.highPriorityMinimumCount)} />
          <DRow k="dailyMinimumMet" v={String(protocolState.dailyMinimumMet)} />
          <DRow k="fullProtocolCompleted" v={String(protocolState.fullProtocolCompleted)} />
          <DRow k="protocolStreakEligible" v={String(protocolState.protocolStreakEligible)} />
          <DRow k="disciplinePointsToday" v={String(dpToday)} />
          <DRow k="practiceStreak" v={String(practiceStreak)} />
          <DRow k="currentStreak (protocol)" v={String(profile.currentStreak)} />
          <DRow k="disciplinePoints (lifetime)" v={String(profile.disciplinePoints)} />
          <DRow k="heatExposureAccess" v={profile.heatExposureAccess} />
          <DRow
            k="heatExposure assigned/excluded"
            v={protocolState.assignedPillarIds.includes("heat_exposure") ? "assigned" : "excluded"}
          />
          <DRow k="coldExposureAccess" v={profile.coldExposureAccess} />
          <DRow
            k="coldExposure assigned/excluded"
            v={protocolState.assignedPillarIds.includes("cold_exposure") ? "assigned" : "excluded"}
          />
          <DRow k="strengthTrainingAccess" v={profile.strengthTrainingAccess} />
          <DRow
            k="strengthTraining assigned/excluded"
            v={protocolState.assignedPillarIds.includes("strength_training") ? "assigned" : "excluded"}
          />
          <DRow k="pilatesMobilityAccess" v={profile.pilatesMobilityAccess} />
          <DRow k="lastCompletedPracticeId" v={profileExtras.lastCompletedPracticeId ?? "—"} />
          <DRow
            k="lastCompletedPracticeCategory"
            v={profileExtras.lastCompletedPracticeCategory ?? "—"}
          />
          <DRow k="practiceLog entries today" v={String(todaysLog.length)} />
        </div>
        )}
      </div>
    </>
  );
}

function PillarRow({ state }: { state: PillarComputedState }) {
  const { pillar, completed, assigned, disciplinePointsEarned } = state;
  const statusText =
    !assigned
      ? pillar.noAccessStateLabel ?? "Not assigned"
      : completed
        ? "Complete"
        : pillar.frequency === "principle"
          ? "Principle"
          : pillar.frequency.startsWith("weekly") || pillar.frequency === "session_based"
            ? "Weekly target"
            : pillarStatusLabel("not_complete");
  return (
    <li className="px-4 py-3 flex items-center gap-3">
      {!assigned ? (
        <Lock className="w-4 h-4 text-muted-foreground/60" />
      ) : completed ? (
        <Check className="w-4 h-4 text-gold" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            !assigned
              ? "text-muted-foreground/70"
              : completed
                ? "text-gold font-semibold"
                : "text-foreground"
          }`}
        >
          {pillar.title}
          {pillar.highPriority && assigned && !completed && (
            <span className="ml-2 text-[9px] uppercase tracking-wider text-gold-muted">
              Priority
            </span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{statusText}</p>
      </div>
      {completed && disciplinePointsEarned > 0 && (
        <span className="text-[10px] text-gold font-semibold shrink-0">
          +{disciplinePointsEarned} DP
        </span>
      )}
    </li>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
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
