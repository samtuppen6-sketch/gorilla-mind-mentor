import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import {
  useProfile,
  useJournal,
  setProfile,
  setJournal,
  DEFAULT_PROFILE,
  DEFAULT_JOURNAL,
  type UserProfile,
  type JournalEntry,
} from "@/lib/profile-store";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Gorilla Mind" }, { name: "description", content: "Test profile and journal context for the AI Coach." }] }),
  component: () => (
    <AppShell>
      <SectionHeader eyebrow="Identity" title="Profile." sub="Temporary test profile + journal. Feeds the AI Coach." />
      <div className="px-5 space-y-6 pb-6">
        <ProfilePanel />
        <JournalPanel />
      </div>
    </AppShell>
  ),
});

function ProfilePanel() {
  const profile = useProfile();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function update<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  }

  function save() {
    console.log("Profile save clicked");
    setProfile(draft);
    console.log("Profile saved to localStorage", draft);
    setSaved(true);
    setToast("Profile saved");
    window.setTimeout(() => setToast(null), 2500);
  }
  function reset() {
    setDraft(DEFAULT_PROFILE);
    setProfile(DEFAULT_PROFILE);
    setSaved(true);
    setToast("Profile reset to defaults");
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      {toast && (
        <div className="rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Test profile</p>
        <span className={`text-[10px] ${saved ? "text-gold" : "text-muted-foreground"}`}>{saved ? "saved" : "unsaved"}</span>
      </div>

      <Text label="name" v={draft.name} onChange={(v) => update("name", v)} />
      <Text label="identityAnchor" v={draft.identityAnchor} onChange={(v) => update("identityAnchor", v)} />
      <Text label="primaryGoal" v={draft.primaryGoal} onChange={(v) => update("primaryGoal", v)} />
      <Text label="primaryGap" v={draft.primaryGap} onChange={(v) => update("primaryGap", v)} />
      <Text label="chronicity" v={draft.chronicity} onChange={(v) => update("chronicity", v)} />
      <Text label="trainingLevel" v={draft.trainingLevel} onChange={(v) => update("trainingLevel", v)} />
      <Text label="gymAccess" v={draft.gymAccess} onChange={(v) => update("gymAccess", v)} />
      <Text label="sleepQuality" v={draft.sleepQuality} onChange={(v) => update("sleepQuality", v)} />
      <Text label="nutritionStatus" v={draft.nutritionStatus} onChange={(v) => update("nutritionStatus", v)} />
      <Text label="bodyCompGoal" v={draft.bodyCompGoal} onChange={(v) => update("bodyCompGoal", v)} />
      <Text label="recoveryState" v={draft.recoveryState} onChange={(v) => update("recoveryState", v)} />
      <Text label="readinessState" v={draft.readinessState} onChange={(v) => update("readinessState", v)} />
      <Num label="protocolDay" v={draft.protocolDay} onChange={(v) => update("protocolDay", v)} />
      <Num label="currentStreak" v={draft.currentStreak} onChange={(v) => update("currentStreak", v)} />
      <Num label="disciplinePoints" v={draft.disciplinePoints} onChange={(v) => update("disciplinePoints", v)} />
      <Bool label="alcoholFlag" v={draft.alcoholFlag} onChange={(v) => update("alcoholFlag", v)} />
      <Bool label="processAddictionFlag" v={draft.processAddictionFlag} onChange={(v) => update("processAddictionFlag", v)} />
      <Bool label="foodBoundaryActive" v={draft.foodBoundaryActive} onChange={(v) => update("foodBoundaryActive", v)} />

      <div className="flex gap-2 pt-2">
        <button onClick={save} className="flex-1 rounded-lg bg-gold py-2 text-xs font-semibold text-primary-foreground">Save profile</button>
        <button onClick={reset} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Reset</button>
      </div>
    </section>
  );
}

function JournalPanel() {
  const existing = useJournal();
  const today = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState<JournalEntry>(existing ?? { ...DEFAULT_JOURNAL, date: today });
  const [saved, setSaved] = useState(false);

  function update<K extends keyof JournalEntry>(k: K, v: JournalEntry[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  }
  function save() { setJournal({ ...draft, date: draft.date || today }); setSaved(true); }
  function clear() { setJournal(null); setDraft({ ...DEFAULT_JOURNAL, date: today }); setSaved(true); }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Latest journal / check-in</p>
        <span className="text-[10px] text-muted-foreground">{saved ? "saved" : existing ? "loaded" : "empty"}</span>
      </div>

      <Text label="date" v={draft.date} onChange={(v) => update("date", v)} />
      <Num label="mood (0-10)" v={draft.mood} onChange={(v) => update("mood", v)} />
      <Num label="energy (0-10)" v={draft.energy} onChange={(v) => update("energy", v)} />
      <Num label="stress (0-10)" v={draft.stress} onChange={(v) => update("stress", v)} />
      <Num label="sleep (hours)" v={draft.sleep} onChange={(v) => update("sleep", v)} />
      <Num label="cravingLevel (0-10)" v={draft.cravingLevel} onChange={(v) => update("cravingLevel", v)} />
      <Bool label="trainingCompleted" v={draft.trainingCompleted} onChange={(v) => update("trainingCompleted", v)} />
      <Bool label="nutritionCompleted" v={draft.nutritionCompleted} onChange={(v) => update("nutritionCompleted", v)} />
      <Bool label="morningProtocolCompleted" v={draft.morningProtocolCompleted} onChange={(v) => update("morningProtocolCompleted", v)} />
      <Bool label="eveningProtocolCompleted" v={draft.eveningProtocolCompleted} onChange={(v) => update("eveningProtocolCompleted", v)} />
      <Text label="patternFlags (comma-separated)" v={draft.patternFlags.join(", ")} onChange={(v) => update("patternFlags", v.split(",").map((s) => s.trim()).filter(Boolean))} />
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">journalText</label>
        <textarea
          value={draft.journalText}
          onChange={(e) => update("journalText", e.target.value)}
          rows={4}
          className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:border-gold"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={save} className="flex-1 rounded-lg bg-gold py-2 text-xs font-semibold text-primary-foreground">Save journal</button>
        <button onClick={clear} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Clear</button>
      </div>
    </section>
  );
}

function Text({ label, v, onChange }: { label: string; v: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</label>
      <input value={v} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-gold" />
    </div>
  );
}
function Num({ label, v, onChange }: { label: string; v: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</label>
      <input type="number" value={v} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-gold" />
    </div>
  );
}
function Bool({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-foreground">{label}</span>
      <input type="checkbox" checked={v} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[color:var(--gold)]" />
    </label>
  );
}
