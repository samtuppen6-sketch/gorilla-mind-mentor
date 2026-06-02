import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
      <div className="px-5 space-y-6 pb-40">
        <ProfilePanel />
        <JournalPanel />
      </div>
    </AppShell>
  ),
});

const PROFILE_STORAGE_KEY = "gm.userProfile.v1";

function ProfilePanel() {
  const profile = useProfile();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [savedJson, setSavedJson] = useState<string>("");

  // One-shot hydration from localStorage AFTER mount. Avoids SSR/client
  // hydration mismatch that React was resolving by discarding the tree
  // and re-rendering — which silently ate the first click on Save.
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(PROFILE_STORAGE_KEY) : null;
    if (raw) setSavedJson(raw);
  }, []);

  function update<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  }

  function handleSaveProfile() {
    console.log("Profile save clicked");
    const serialized = JSON.stringify(draft);
    localStorage.setItem(PROFILE_STORAGE_KEY, serialized);
    setProfile(draft); // keep in-memory store + Coach request in sync
    console.log("Profile saved to localStorage", draft);
    setSaved(true);
    setSavedJson(serialized);
  }

  function handleLoadProfile() {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      setSavedJson("");
      return;
    }
    try {
      const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) } as UserProfile;
      setDraft(parsed);
      setProfile(parsed);
      setSaved(true);
      setSavedJson(raw);
    } catch (e) {
      console.error("Failed to parse saved profile", e);
    }
  }

  function handleReset() {
    setDraft(DEFAULT_PROFILE);
    setProfile(DEFAULT_PROFILE);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
    setSavedJson(JSON.stringify(DEFAULT_PROFILE));
    setSaved(true);
  }

  return (
    <section className="relative rounded-xl border border-border bg-card p-4 space-y-3">
      <button
        type="button"
        onClick={handleSaveProfile}
        style={{ pointerEvents: "auto", cursor: "pointer", position: "relative", zIndex: 50 }}
        className="block w-full rounded-lg border-2 border-gold bg-gold/20 py-3 text-xs font-bold uppercase tracking-[0.2em] text-gold hover:bg-gold/30"
      >
        TEST SAVE PROFILE
      </button>

      {saved && (
        <div className="rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
          Profile saved
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

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="button" onClick={handleSaveProfile} className="flex-1 min-w-[120px] rounded-lg bg-gold py-2 text-xs font-semibold text-primary-foreground">Save profile</button>
        <button type="button" onClick={handleLoadProfile} className="rounded-lg border border-gold/40 px-3 py-2 text-xs text-gold">Load saved profile</button>
        <button type="button" onClick={handleReset} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Reset</button>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-gold/40 bg-background/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">SAVED PROFILE DEBUG</p>
        <p className="text-[10px] text-muted-foreground mb-1">localStorage key: <span className="text-foreground">{PROFILE_STORAGE_KEY}</span></p>
        <pre className="text-[10px] leading-relaxed text-foreground whitespace-pre-wrap break-all max-h-64 overflow-auto">
{savedJson ? (() => { try { return JSON.stringify(JSON.parse(savedJson), null, 2); } catch { return savedJson; } })() : "(nothing saved yet)"}
        </pre>
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
