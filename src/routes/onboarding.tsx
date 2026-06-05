import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  computeProfileCompleteness,
  deriveNutritionMode,
  deriveRelapseRisk,
  getProfile,
  setProfile,
  type UserProfile,
} from "@/lib/profile-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Gorilla Mind" },
      { name: "description", content: "Set your standard. The coach builds around you." },
    ],
  }),
  component: () => (
    <AppShell>
      <OnboardingPage />
    </AppShell>
  ),
});

type Patch = Partial<UserProfile>;

const STEPS = [
  "Start Point",
  "Current Situation",
  "Biggest Struggle",
  "Control Level",
  "Support",
  "Fitness Setup",
  "Nutrition Setup",
  "Daily Rhythm",
  "Coach Style",
  "Summary",
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Patch>(() => ({ ...getProfile() }));

  // Gate: must have an account first
  if (typeof window !== "undefined" && !getProfile().identityProfile) {
    navigate({ to: "/auth" });
  }


  const patch = (p: Patch) => setDraft((d) => ({ ...d, ...p }));

  const toggleArr = (key: keyof UserProfile, val: string) => {
    const arr = ((draft as Record<string, unknown>)[key as string] as string[] | undefined) ?? [];
    const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
    patch({ [key]: next } as Patch);
  };

  const nutritionMode = useMemo(() => deriveNutritionMode(draft), [draft]);
  const risk = useMemo(() => deriveRelapseRisk(draft), [draft]);
  const completeness = useMemo(() => computeProfileCompleteness(draft), [draft]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    const current = getProfile();
    const now = new Date().toISOString();
    const identityProfile = current.identityProfile
      ? { ...current.identityProfile, onboardingComplete: true, updatedAt: now }
      : null;

    // ---- Safe defaults & derivations for fields not collected by the wizard.
    // Keeps onboarding short while satisfying coach profile expectations.
    const struggles = (draft.primaryStruggle ?? []) as string[];

    // Derive preferredTraining from mainGoal + trainingLocation if not set.
    const derivedPreferredTraining: UserProfile["preferredTraining"] = (() => {
      if (draft.preferredTraining) return draft.preferredTraining;
      const goal = draft.mainGoal ?? "";
      const loc = draft.trainingLocation ?? "";
      if (goal === "muscle") return loc === "home" ? "bodyweight" : "weights";
      if (goal === "fat_loss") return loc === "home" ? "bodyweight" : "weights";
      if (goal === "fitness") return loc === "outdoors" ? "running" : "mixed";
      if (goal === "recovery") return "mobility";
      if (draft.injuryFlag === "back_pain" || draft.injuryFlag === "mobility_limited") return "pilates_core";
      return "mixed";
    })();

    // Derive equipment from trainingLocation if not set.
    const derivedEquipment: UserProfile["equipment"] =
      draft.equipment && draft.equipment !== ""
        ? draft.equipment
        : draft.trainingLocation === "gym"
          ? "full_gym"
          : draft.trainingLocation === "home"
            ? "none"
            : "unknown";

    // Derive compulsionTypes from primaryStruggle.
    const compulsionMap: Array<[RegExp, UserProfile["compulsionTypes"][number]]> = [
      [/phone|social/i, "phone_social"],
      [/alcohol/i, "alcohol"],
      [/substance|drug/i, "substances"],
      [/gambl/i, "gambling"],
      [/porn|sexual/i, "porn_sexual"],
      [/binge/i, "food_binge"],
      [/sugar|takeaway/i, "sugar_takeaways"],
    ];
    const derivedCompulsions = Array.from(
      new Set(
        struggles
          .flatMap((s) => compulsionMap.filter(([rx]) => rx.test(s)).map(([, k]) => k))
      ),
    );

    // Derive biggestBarrier from primaryStruggle if not set.
    const derivedBarrier: UserProfile["biggestBarrier"] = (() => {
      if (draft.biggestBarrier) return draft.biggestBarrier;
      const first = struggles[0] ?? "";
      if (/phone|social/i.test(first)) return "phone";
      if (/alcohol|substance|gambl|porn|binge|sugar/i.test(first)) return "addiction_compulsion";
      if (/sleep/i.test(first)) return "sleep";
      if (/stress/i.test(first)) return "stress";
      if (/discipline/i.test(first)) return "discipline";
      if (draft.injuryFlag && draft.injuryFlag !== "none") return "injury";
      return "routine";
    })();

    // Timezone via browser if not set.
    const derivedTimezone =
      draft.timezone && draft.timezone !== ""
        ? draft.timezone
        : (() => {
            try { return Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""; }
            catch { return ""; }
          })();

    const merged: UserProfile = {
      ...current,
      ...(draft as UserProfile),

      // basicProfile safe defaults (calorie/macros precision fields stay null
      // unless user opted into PRECISION_TRACKING and entered them elsewhere).
      age: draft.age ?? null,
      sex: draft.sex ?? "",
      heightCm: draft.heightCm ?? null,
      weightKg: draft.weightKg ?? null,
      country: draft.country ?? "",
      timezone: derivedTimezone,

      // goals
      secondaryGoals: draft.secondaryGoals ?? [],
      motivationReason: draft.motivationReason ?? "",

      // fitnessProfile
      preferredTraining: derivedPreferredTraining,
      equipment: derivedEquipment,
      injuryNotes: draft.injuryNotes ?? "",

      // nutritionProfile
      dietPreference: draft.dietPreference ?? "no_preference",
      mealsPerDay: draft.mealsPerDay ?? 3,
      allergiesRestrictions: draft.allergiesRestrictions ?? "",

      // recoveryRiskProfile
      compulsionTypes:
        (draft.compulsionTypes && draft.compulsionTypes.length > 0)
          ? draft.compulsionTypes
          : derivedCompulsions,

      // mindsetProfile
      stressLevel: draft.stressLevel && draft.stressLevel !== "" ? draft.stressLevel : "moderate",
      confidenceLevel: draft.confidenceLevel && draft.confidenceLevel !== "" ? draft.confidenceLevel : "medium",
      biggestBarrier: derivedBarrier,

      // derived + meta
      nutritionMode,
      relapseRisk: risk.relapseRisk,
      addictionRiskFlag: risk.addictionRiskFlag,
      processAddictionFlag:
        risk.addictionRiskFlag !== "none" && risk.addictionRiskFlag !== "mild"
          ? true
          : current.processAddictionFlag,
      onboardingComplete: true,
      onboardingCompletedAt: now,
      identityProfile,
    };
    setProfile(merged);
    navigate({ to: "/coach" });
  };

  return (
    <div className="px-5 pb-12 pt-6 space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">
          Step {step + 1} / {STEPS.length}
        </p>
        <h1 className="text-2xl font-semibold mt-1">{STEPS[step]}</h1>
        <div className="mt-2 h-1 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-gold"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <Section title="What's your start point?" hint="One main goal.">
          <Choice
            value={draft.mainGoal ?? ""}
            onChange={(v) => patch({ mainGoal: v as UserProfile["mainGoal"] })}
            options={[
              ["fat_loss", "Fat loss"],
              ["muscle", "Build muscle"],
              ["fitness", "Get fit"],
              ["confidence", "Confidence"],
              ["energy", "Energy"],
              ["discipline", "Discipline"],
              ["recovery", "Recovery"],
              ["mental_clarity", "Mental clarity"],
              ["all_round_reset", "All-round reset"],
            ]}
          />
        </Section>
      )}

      {step === 1 && (
        <Section title="What's going on right now?" hint="Pick anything that applies.">
          <Multi
            selected={draft.currentSituation ?? []}
            onToggle={(v) => toggleArr("currentSituation", v)}
            options={[
              "stuck in a rut",
              "low energy",
              "stressed",
              "burnt out",
              "struggling with addiction or compulsive behaviour",
              "post-break / restart",
              "injured",
              "lost confidence",
              "good — sharpening",
            ]}
          />
        </Section>
      )}

      {step === 2 && (
        <Section title="Biggest struggle?" hint="Honest. No filter.">
          <Multi
            selected={draft.primaryStruggle ?? []}
            onToggle={(v) => toggleArr("primaryStruggle", v)}
            options={[
              "phone/social media",
              "alcohol",
              "substances",
              "gambling",
              "porn/sexual",
              "food binges",
              "sugar/takeaways",
              "discipline",
              "sleep",
              "stress",
              "other",
            ]}
          />
        </Section>
      )}

      {step === 3 && (
        <Section title="How in control do you feel?" hint="No shame. Just data.">
          <Choice
            value={draft.controlLevel ?? ""}
            onChange={(v) => patch({ controlLevel: v as UserProfile["controlLevel"] })}
            options={[
              ["in_control", "In control"],
              ["slipping", "Slipping"],
              ["struggling", "Struggling"],
              ["out_of_control", "Out of control"],
              ["worried_relapse", "Worried I may relapse"],
              ["active_relapse", "In an active relapse"],
              ["prefer_not_say", "Prefer not to say"],
            ]}
          />
          {(risk.relapseRisk === "high" || risk.relapseRisk === "active") && (
            <div className="mt-3 rounded-lg border border-gold bg-gold/10 p-3 text-sm">
              <p className="font-semibold text-gold">Safety first.</p>
              <p className="text-muted-foreground mt-1">
                If you are in immediate danger, contact your local emergency services or a
                trusted support contact now. The coach is not a replacement for crisis or
                medical care.
              </p>
            </div>
          )}
        </Section>
      )}

      {step === 4 && (
        <Section title="Support around you?" hint="One main support.">
          <Choice
            value={draft.supportStatus ?? ""}
            onChange={(v) => patch({ supportStatus: v as UserProfile["supportStatus"] })}
            options={[
              ["none", "None right now"],
              ["friends_family", "Friends / family"],
              ["therapist", "Therapist"],
              ["doctor", "Doctor"],
              ["recovery_group", "Recovery group"],
              ["sponsor_mentor", "Sponsor / mentor"],
              ["rehab_aftercare", "Rehab / aftercare"],
              ["other", "Other"],
              ["prefer_not_say", "Prefer not to say"],
            ]}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold-muted">
            What do you need from the coach?
          </p>
          <Multi
            selected={draft.needsFromCoach ?? []}
            onToggle={(v) => toggleArr("needsFromCoach", v)}
            options={[
              "daily_structure",
              "fitness_plan",
              "morning_routine",
              "urge_support",
              "relapse_prevention",
              "accountability",
              "evening_wind_down",
              "food_structure",
              "mindset_identity",
              "emergency_reset",
            ]}
          />
        </Section>
      )}

      {step === 5 && (
        <Section title="Fitness setup" hint="Truthful, not aspirational.">
          <Label>Level</Label>
          <Choice
            value={draft.fitnessLevel ?? ""}
            onChange={(v) => patch({ fitnessLevel: v as UserProfile["fitnessLevel"] })}
            options={[
              ["beginner", "Beginner"],
              ["intermediate", "Intermediate"],
              ["advanced", "Advanced"],
              ["returning", "Returning"],
            ]}
          />
          <Label>Where</Label>
          <Choice
            value={draft.trainingLocation ?? ""}
            onChange={(v) => patch({ trainingLocation: v as UserProfile["trainingLocation"] })}
            options={[
              ["home", "Home"],
              ["gym", "Gym"],
              ["outdoors", "Outdoors"],
              ["mixed", "Mixed"],
            ]}
          />
          <Label>Time per session</Label>
          <Choice
            value={String(draft.availableTimeMin ?? 0)}
            onChange={(v) => patch({ availableTimeMin: Number(v) as UserProfile["availableTimeMin"] })}
            options={[
              ["10", "10 min"],
              ["20", "20 min"],
              ["30", "30 min"],
              ["45", "45 min"],
              ["60", "60+ min"],
            ]}
          />
          <Label>Injury / limit</Label>
          <Choice
            value={draft.injuryFlag ?? ""}
            onChange={(v) => patch({ injuryFlag: v as UserProfile["injuryFlag"] })}
            options={[
              ["none", "None"],
              ["back_pain", "Back pain"],
              ["knee_pain", "Knee pain"],
              ["shoulder_pain", "Shoulder pain"],
              ["mobility_limited", "Mobility limited"],
              ["other", "Other"],
            ]}
          />
        </Section>
      )}

      {step === 6 && (
        <Section title="Nutrition setup" hint="Pick the approach you'll actually do.">
          <Label>Style</Label>
          <Choice
            value={draft.preferredNutritionStyle ?? ""}
            onChange={(v) => patch({ preferredNutritionStyle: v as UserProfile["preferredNutritionStyle"] })}
            options={[
              ["simple_rules", "Simple rules"],
              ["detailed_tracking", "Detailed tracking"],
              ["not_sure", "Not sure"],
            ]}
          />
          <Label>Want calories / macros?</Label>
          <Choice
            value={draft.wantsCaloriesMacros ?? ""}
            onChange={(v) => patch({ wantsCaloriesMacros: v as UserProfile["wantsCaloriesMacros"] })}
            options={[
              ["no", "No"],
              ["yes", "Yes"],
              ["later", "Maybe later"],
            ]}
          />
          <Label>Current eating issue</Label>
          <Choice
            value={draft.currentEatingIssue ?? ""}
            onChange={(v) => patch({ currentEatingIssue: v as UserProfile["currentEatingIssue"] })}
            options={[
              ["skipping_meals", "Skipping meals"],
              ["overeating_night", "Night overeating"],
              ["sugar_cravings", "Sugar cravings"],
              ["takeaways", "Too many takeaways"],
              ["no_protein", "Not enough protein"],
              ["alcohol", "Alcohol"],
              ["no_structure", "No structure"],
              ["not_sure", "Not sure"],
            ]}
          />
          <p className="mt-3 text-[11px] text-muted-foreground">
            Derived nutrition mode: <span className="text-gold">{nutritionMode}</span>
          </p>
        </Section>
      )}

      {step === 7 && (
        <Section title="Daily rhythm" hint="Wake / sleep targets help build the protocol.">
          <Label>Preferred wake time</Label>
          <input
            type="time"
            value={draft.preferredWakeTime ?? ""}
            onChange={(e) => patch({ preferredWakeTime: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
          <Label>Preferred sleep time</Label>
          <input
            type="time"
            value={draft.preferredSleepTime ?? ""}
            onChange={(e) => patch({ preferredSleepTime: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
          <Label>Hardest part of the day</Label>
          <input
            type="text"
            placeholder="e.g. evenings on the sofa"
            value={draft.hardestPartOfDay ?? ""}
            onChange={(e) => patch({ hardestPartOfDay: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
        </Section>
      )}

      {step === 8 && (
        <Section title="Coach style" hint="How should the coach speak to you?">
          <Choice
            value={draft.preferredSupportTone ?? ""}
            onChange={(v) => patch({ preferredSupportTone: v as UserProfile["preferredSupportTone"] })}
            options={[
              ["direct", "Direct"],
              ["balanced", "Balanced"],
              ["gentle", "Gentle"],
            ]}
          />
        </Section>
      )}

      {step === 9 && (
        <Section title="Your Standard" hint="Confirm and lock it in.">
          <Summary draft={draft} nutritionMode={nutritionMode} risk={risk.relapseRisk} completeness={completeness.score} />
        </Section>
      )}

      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <button
            onClick={back}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm"
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="flex-1 rounded-lg bg-gold text-background font-semibold px-4 py-3 text-sm"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={finish}
            className="flex-1 rounded-lg bg-gold text-background font-semibold px-4 py-3 text-sm"
          >
            Lock it in
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-foreground">{title}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-gold-muted">{children}</p>
  );
}

function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(([v, label]) => {
        const active = value === v;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`rounded-lg border px-3 py-2 text-sm text-left ${
              active ? "border-gold bg-gold/10 text-gold" : "border-border text-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Multi({
  selected,
  onToggle,
  options,
}: {
  selected: string[];
  onToggle: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              active ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Summary({
  draft,
  nutritionMode,
  risk,
  completeness,
}: {
  draft: Patch;
  nutritionMode: string;
  risk: string;
  completeness: number;
}) {
  const firstProtocol =
    risk === "high" || risk === "active"
      ? "Recovery Structure: morning daylight + breathwork + walk + one supportive contact + honest journal."
      : draft.mainGoal === "fat_loss"
        ? "Fat Loss Starter: protein-first meals, daily walk, 3x training, no alcohol weekdays."
        : draft.mainGoal === "muscle"
          ? "Gym Strength Starter: 3x full-body sessions, protein target, sleep window."
          : draft.injuryFlag === "back_pain"
            ? "Core & Back Support: daily mobility + pilates-core foundations."
            : "Daily Standard: morning protocol + one training block + evening reset.";

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
      <Row k="Main goal" v={draft.mainGoal || "—"} />
      <Row k="Control level" v={draft.controlLevel || "—"} />
      <Row k="Relapse risk" v={risk} />
      <Row k="Support" v={draft.supportStatus || "—"} />
      <Row k="Fitness level" v={draft.fitnessLevel || "—"} />
      <Row k="Training location" v={draft.trainingLocation || "—"} />
      <Row k="Injury flag" v={draft.injuryFlag || "—"} />
      <Row k="Nutrition mode" v={nutritionMode} />
      <Row k="Coach tone" v={draft.preferredSupportTone || "—"} />
      <Row k="Profile complete" v={`${completeness}%`} />
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold-muted">First protocol</p>
        <p className="mt-1 text-foreground">{firstProtocol}</p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground text-right">{v}</span>
    </div>
  );
}
