import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import {
  useProfile,
  
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
  const [saveClicks, setSaveClicks] = useState(0);

  // One-shot hydration from localStorage AFTER mount. Avoids SSR/client
  // hydration mismatch that React was resolving by discarding the tree
  // and silently eating clicks.
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(PROFILE_STORAGE_KEY) : null;
    if (raw) setSavedJson(raw);
  }, []);

  function update<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  }

  function handleSaveProfile() {
    console.log("SAVE PROFILE CLICKED");
    console.log(draft);
    localStorage.setItem("gm.userProfile.v1", JSON.stringify(draft));
    setProfile(draft); // keep AI Coach request in sync
    setSaved(true);
    setSaveClicks((previous) => previous + 1);
    setSavedJson(JSON.stringify(draft, null, 2));
  }

  function handleForceTestSave() {
    const testObject = {
      __test: true,
      savedAt: new Date().toISOString(),
      name: "FORCE_TEST_OPERATOR",
      identityAnchor: "hardcoded test value",
      primaryGap: "hardcoded gap",
      protocolDay: 99,
    };
    console.log("FORCE TEST SAVE CLICKED", testObject);
    localStorage.setItem("gm.userProfile.v1", JSON.stringify(testObject));
    setSavedJson(JSON.stringify(testObject, null, 2));
    setSaved(true);
    setSaveClicks((previous) => previous + 1);
  }

  function handleLoadProfile() {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) { setSavedJson(""); return; }
    try {
      const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) } as UserProfile;
      setDraft(parsed);
      setProfile(parsed);
      setSaved(true);
      setSavedJson(JSON.stringify(JSON.parse(raw), null, 2));
    } catch (e) { console.error("Failed to parse saved profile", e); }
  }

  function handleReset() {
    setDraft(DEFAULT_PROFILE);
    setProfile(DEFAULT_PROFILE);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
    setSavedJson(JSON.stringify(DEFAULT_PROFILE, null, 2));
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
        Save Profile
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

      <div className="mt-4 rounded-lg border border-gold/30 bg-background/40 p-3 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Access & Equipment</p>
        <Select
          label="heatExposureAccess"
          v={draft.heatExposureAccess}
          options={["none", "sauna", "steam_room", "hot_bath", "infrared_sauna", "gym_spa", "home_sauna"]}
          onChange={(v) => update("heatExposureAccess", v as UserProfile["heatExposureAccess"])}
        />
        <Select
          label="coldExposureAccess"
          v={draft.coldExposureAccess}
          options={["none", "cold_shower", "cold_plunge", "sea_swim", "ice_bath"]}
          onChange={(v) => update("coldExposureAccess", v as UserProfile["coldExposureAccess"])}
        />
        <Select
          label="strengthTrainingAccess"
          v={draft.strengthTrainingAccess}
          options={["none", "bodyweight_home", "dumbbells_home", "full_gym"]}
          onChange={(v) => update("strengthTrainingAccess", v as UserProfile["strengthTrainingAccess"])}
        />
        <Select
          label="pilatesMobilityAccess"
          v={draft.pilatesMobilityAccess}
          options={["none", "mat_home", "app_guided", "class_access", "reformer_access"]}
          onChange={(v) => update("pilatesMobilityAccess", v as UserProfile["pilatesMobilityAccess"])}
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          These answers stop the Coach from recommending unavailable practices, such as sauna, cold plunge, or gym-based training, unless the user has access.
        </p>
      </div>


      <div className="pt-2 text-xs">
        <span className="text-muted-foreground">Status: </span>
        <span className={saved ? "text-gold font-semibold" : "text-foreground"}>{saved ? "Saved" : "Unsaved"}</span>
      </div>

      <div className="relative flex flex-wrap gap-2" style={{ zIndex: 50 }}>
        <button type="button" onClick={handleSaveProfile} style={{ pointerEvents: "auto", cursor: "pointer" }} className="relative z-10 flex-1 min-w-[120px] rounded-lg bg-gold py-3 text-xs font-semibold text-primary-foreground hover:opacity-90">Save profile</button>
        <button type="button" onClick={handleForceTestSave} style={{ pointerEvents: "auto", cursor: "pointer" }} className="relative z-10 rounded-lg border-2 border-gold bg-gold/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gold">FORCE TEST SAVE</button>
        <button type="button" onClick={handleLoadProfile} style={{ pointerEvents: "auto", cursor: "pointer" }} className="relative z-10 rounded-lg border border-gold/40 px-3 py-2 text-xs text-gold">Load saved profile</button>
        <button type="button" onClick={handleReset} style={{ pointerEvents: "auto", cursor: "pointer" }} className="relative z-10 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Reset</button>
      </div>

      <p className="text-xs text-muted-foreground">Save clicks: <span className="text-gold font-semibold">{saveClicks}</span></p>



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


const JOURNAL_STORAGE_KEY = "gm.latestJournalEntry.v1";
const JOURNAL_LEGACY_KEY = "gm.latestJournal.v1"; // kept in sync for AI Coach request

function JournalPanel() {
  const [journalDraft, setJournalDraft] = useState<JournalEntry>(() => ({ ...DEFAULT_JOURNAL }));
  const [journalSaved, setJournalSaved] = useState(false);
  const [savedJournalJson, setSavedJournalJson] = useState<string>("");
  const [journalSaveClicks, setJournalSaveClicks] = useState(0);

  // One-shot hydration after mount — avoids SSR/client mismatch from
  // reading localStorage or new Date() during render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw =
      localStorage.getItem(JOURNAL_STORAGE_KEY) ??
      localStorage.getItem(JOURNAL_LEGACY_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (raw) {
      try {
        const parsed = { ...DEFAULT_JOURNAL, ...JSON.parse(raw) } as JournalEntry;
        setJournalDraft(parsed);
        setSavedJournalJson(JSON.stringify(parsed, null, 2));
        return;
      } catch { /* fall through */ }
    }
    setJournalDraft((d) => ({ ...d, date: d.date || today }));
  }, []);

  function update<K extends keyof JournalEntry>(k: K, v: JournalEntry[K]) {
    setJournalDraft((d) => ({ ...d, [k]: v }));
    setJournalSaved(false);
  }

  function handleSaveJournal() {
    console.log("SAVE JOURNAL CLICKED");
    console.log(journalDraft);
    localStorage.setItem("gm.latestJournalEntry.v1", JSON.stringify(journalDraft));
    // Mirror to legacy key so the AI Coach request continues to receive it.
    setJournal(journalDraft);
    setJournalSaved(true);
    setJournalSaveClicks((previous) => previous + 1);
    setSavedJournalJson(JSON.stringify(journalDraft, null, 2));
  }

  function handleForceTestJournalSave() {
    const testJournal = {
      __test: true,
      date: new Date().toISOString().slice(0, 10),
      mood: 7,
      energy: 6,
      stress: 4,
      sleep: 7.5,
      cravingLevel: 1,
      trainingCompleted: true,
      nutritionCompleted: true,
      morningProtocolCompleted: true,
      eveningProtocolCompleted: false,
      journalText: "FORCE TEST JOURNAL — hardcoded write to localStorage.",
      patternFlags: ["test", "force-save"],
    };
    console.log("FORCE TEST JOURNAL SAVE CLICKED", testJournal);
    localStorage.setItem("gm.latestJournalEntry.v1", JSON.stringify(testJournal));
    localStorage.setItem(JOURNAL_LEGACY_KEY, JSON.stringify(testJournal));
    setSavedJournalJson(JSON.stringify(testJournal, null, 2));
    setJournalSaved(true);
    setJournalSaveClicks((previous) => previous + 1);
  }

  function handleClearJournal() {
    setJournal(null);
    localStorage.removeItem("gm.latestJournalEntry.v1");
    setJournalDraft({ ...DEFAULT_JOURNAL });
    setSavedJournalJson("");
    setJournalSaved(false);
  }

  return (
    <section className="relative rounded-xl border border-border bg-card p-4 space-y-3">
      {journalSaved && (
        <div className="rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold">
          Journal saved
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Latest journal / check-in</p>
        <span className={`text-[10px] ${journalSaved ? "text-gold" : "text-muted-foreground"}`}>{journalSaved ? "saved" : "unsaved"}</span>
      </div>

      <Text label="date" v={journalDraft.date} onChange={(v) => update("date", v)} />
      <Num label="mood (0-10)" v={journalDraft.mood} onChange={(v) => update("mood", v)} />
      <Num label="energy (0-10)" v={journalDraft.energy} onChange={(v) => update("energy", v)} />
      <Num label="stress (0-10)" v={journalDraft.stress} onChange={(v) => update("stress", v)} />
      <Num label="sleep (hours)" v={journalDraft.sleep} onChange={(v) => update("sleep", v)} />
      <Num label="cravingLevel (0-10)" v={journalDraft.cravingLevel} onChange={(v) => update("cravingLevel", v)} />
      <Bool label="trainingCompleted" v={journalDraft.trainingCompleted} onChange={(v) => update("trainingCompleted", v)} />
      <Bool label="nutritionCompleted" v={journalDraft.nutritionCompleted} onChange={(v) => update("nutritionCompleted", v)} />
      <Bool label="morningProtocolCompleted" v={journalDraft.morningProtocolCompleted} onChange={(v) => update("morningProtocolCompleted", v)} />
      <Bool label="eveningProtocolCompleted" v={journalDraft.eveningProtocolCompleted} onChange={(v) => update("eveningProtocolCompleted", v)} />
      <Text label="patternFlags (comma-separated)" v={journalDraft.patternFlags.join(", ")} onChange={(v) => update("patternFlags", v.split(",").map((s) => s.trim()).filter(Boolean))} />
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">journalText</label>
        <textarea
          value={journalDraft.journalText}
          onChange={(e) => update("journalText", e.target.value)}
          rows={4}
          className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:border-gold"
        />
      </div>

      <div className="pt-2 text-xs">
        <span className="text-muted-foreground">Status: </span>
        <span className={journalSaved ? "text-gold font-semibold" : "text-foreground"}>{journalSaved ? "Saved" : "Unsaved"}</span>
      </div>

      <div className="relative flex flex-wrap gap-2" style={{ zIndex: 50 }}>
        <button type="button" onClick={handleSaveJournal} style={{ pointerEvents: "auto", cursor: "pointer" }} className="relative z-10 flex-1 min-w-[120px] rounded-lg bg-gold py-3 text-xs font-semibold text-primary-foreground hover:opacity-90">Save journal</button>
        <button type="button" onClick={handleForceTestJournalSave} style={{ pointerEvents: "auto", cursor: "pointer" }} className="relative z-10 rounded-lg border-2 border-gold bg-gold/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gold">FORCE TEST JOURNAL SAVE</button>
        <button type="button" onClick={handleClearJournal} style={{ pointerEvents: "auto", cursor: "pointer" }} className="relative z-10 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Clear</button>
      </div>

      <p className="text-xs text-muted-foreground">Journal save clicks: <span className="text-gold font-semibold">{journalSaveClicks}</span></p>

      <div className="mt-4 rounded-lg border border-dashed border-gold/40 bg-background/60 p-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-2">SAVED JOURNAL DEBUG</p>
        <p className="text-[10px] text-muted-foreground mb-1">localStorage key: <span className="text-foreground">gm.latestJournalEntry.v1</span></p>
        <pre className="text-[10px] leading-relaxed text-foreground whitespace-pre-wrap break-all max-h-64 overflow-auto">
{savedJournalJson || "(nothing saved yet)"}
        </pre>
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
function Select({ label, v, options, onChange }: { label: string; v: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</label>
      <select value={v} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-gold">
        {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    </div>
  );
}
