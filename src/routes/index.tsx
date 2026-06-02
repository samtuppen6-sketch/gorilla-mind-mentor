import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { useProfile } from "@/lib/profile-store";
import { Check, Circle } from "lucide-react";

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
  const profileExtras = profile as typeof profile & ProfileExtras;
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [log, setLog] = useState<PracticeLogEntry[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [logLoaded, setLogLoaded] = useState(false);

  // Hydrate AFTER mount to avoid SSR/client mismatch and to read fresh
  // values every time the route mounts.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setProgress(loadDailyProgress());
    setProgressLoaded(!!localStorage.getItem(DAILY_PROGRESS_KEY));
    const l = loadPracticeLog();
    setLog(l);
    setLogLoaded(!!localStorage.getItem(PRACTICE_LOG_KEY));
  }, []);

  const t = todayStr();
  const d = new Date();
  const today = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  const todaysLog = log.filter((e) => e.date === t);

  const meaningful = progress
    ? [
        progress.breathworkCompleted,
        progress.meditationCompleted || progress.mindfulnessCompleted,
        progress.trainingCompleted || progress.mobilityCompleted || progress.pilatesCompleted,
        progress.nutritionCompleted,
        progress.journalCompleted,
        progress.coldExposureCompleted,
        progress.heatExposureCompleted,
      ].filter(Boolean).length
    : 0;
  const dailyMinimumMet = meaningful >= 3;

  const dpToday = progress?.disciplinePointsToday ?? 0;
  const practiceStreak = profileExtras.practiceStreak ?? 0;
  const protocolStreak = dailyMinimumMet ? profile.currentStreak : 0;

  const actions: { key: string; label: string; done: boolean }[] = progress
    ? [
        { key: "breathwork", label: "Breathwork", done: progress.breathworkCompleted },
        { key: "meditation", label: "Meditation / Mindfulness", done: progress.meditationCompleted || progress.mindfulnessCompleted },
        { key: "training", label: "Training / Mobility / Pilates", done: progress.trainingCompleted || progress.mobilityCompleted || progress.pilatesCompleted },
        { key: "nutrition", label: "Nutrition", done: progress.nutritionCompleted },
        { key: "journal", label: "Journal / Check-in", done: progress.journalCompleted },
        { key: "cold", label: "Cold exposure", done: progress.coldExposureCompleted },
        { key: "heat", label: "Heat exposure", done: progress.heatExposureCompleted },
      ]
    : [];

  return (
    <>
      <SectionHeader eyebrow={today} title="Today." sub="One clean win. No phone-first behaviour. Execute the protocol." />
      <div className="px-5 space-y-4 pb-8">
        <Stat label="Discipline points" value={String(dpToday)} hint="Earned today" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Practice streak" value={`${practiceStreak}d`} hint="Any guided practice" />
          <Stat
            label="Protocol streak"
            value={`${protocolStreak}d`}
            hint={dailyMinimumMet ? "Daily minimum met" : "Not yet today"}
          />
        </div>

        {/* Daily minimum tracker */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Daily minimum</p>
            <span className={`text-xs font-semibold ${dailyMinimumMet ? "text-gold" : "text-foreground"}`}>
              {meaningful} / 3 actions
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-background overflow-hidden">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${Math.min(100, (meaningful / 3) * 100)}%` }}
            />
          </div>
          {progress?.fullProtocolCompleted && (
            <p className="mt-2 text-[11px] text-gold font-semibold">Full protocol completed ✓</p>
          )}
        </div>

        {/* Today's actions checklist */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-muted mb-2">Today's actions</p>
          {actions.length === 0 && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          {actions.map((a) => (
            <div
              key={a.key}
              className={`flex items-center gap-3 text-sm ${a.done ? "text-gold font-semibold" : "text-muted-foreground"}`}
            >
              {a.done ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span>{a.label}</span>
              {a.done && <span className="ml-auto text-[10px] uppercase tracking-wider">Completed</span>}
            </div>
          ))}
        </div>

        {/* Completed today */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-muted mb-2">Completed today</p>
          {todaysLog.length === 0 ? (
            <p className="text-xs text-muted-foreground">No guided practice completed yet today.</p>
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

        <Card title="Morning protocol" body="Hydration. Box breathing. 5 min meditation. No phone for the first hour. One clean win before noon." />
        <Card title="Training" body="Block scheduled. Execute as planned. Stop short of unsafe pain." />
        <Card title="Sleep" body="Wind-down at 22:30. Lights low. No screens in bed." />

        {/* Debug panel */}
        <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-[11px] font-mono space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Today debug</p>
          <DRow k="gm.dailyProgress.v1 loaded" v={String(progressLoaded)} />
          <DRow k="gm.userProfile.v1 loaded" v={String(!!profile)} />
          <DRow k="gm.practiceLog.v1 loaded" v={String(logLoaded)} />
          <DRow k="date" v={t} />
          <DRow k="disciplinePointsToday" v={String(dpToday)} />
          <DRow
            k="completedPracticeIdsToday"
            v={progress?.completedPracticeIdsToday.join(", ") || "—"}
          />
          <DRow k="breathworkCompleted" v={String(!!progress?.breathworkCompleted)} />
          <DRow k="meditationCompleted" v={String(!!progress?.meditationCompleted)} />
          <DRow k="trainingCompleted" v={String(!!progress?.trainingCompleted)} />
          <DRow k="mobilityCompleted" v={String(!!progress?.mobilityCompleted)} />
          <DRow k="nutritionCompleted" v={String(!!progress?.nutritionCompleted)} />
          <DRow k="journalCompleted" v={String(!!progress?.journalCompleted)} />
          <DRow k="coldExposureCompleted" v={String(!!progress?.coldExposureCompleted)} />
          <DRow k="heatExposureCompleted" v={String(!!progress?.heatExposureCompleted)} />
          <DRow k="meaningful count" v={`${meaningful} / 3`} />
          <DRow k="dailyMinimumMet" v={String(dailyMinimumMet)} />
          <DRow k="fullProtocolCompleted" v={String(!!progress?.fullProtocolCompleted)} />
          <DRow k="practiceStreak" v={String(practiceStreak)} />
          <DRow k="currentStreak (protocol)" v={String(profile.currentStreak)} />
          <DRow k="disciplinePoints (lifetime)" v={String(profile.disciplinePoints)} />
          <DRow k="lastCompletedPracticeId" v={profileExtras.lastCompletedPracticeId ?? "—"} />
          <DRow k="lastCompletedPracticeCategory" v={profileExtras.lastCompletedPracticeCategory ?? "—"} />
          <DRow k="practiceLog entries today" v={String(todaysLog.length)} />
        </div>
      </div>
    </>
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

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
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
