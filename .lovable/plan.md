# Gorilla Mind Onboarding + Profile Engine — Plan

The coach brain (`src/lib/coach.functions.ts`) is stable per `docs/GORILLA_MIND_COACH_STABLE_CHECKPOINT.md`. This plan adds an onboarding flow + extended profile + recovery-aware routes **without** reordering or refactoring the existing routing pipeline. New routes are appended; new profile fields feed personalisation hooks.

---

## 1. Profile data model (`src/lib/profile-store.ts`)

Extend `UserProfile` with grouped fields (kept flat on the type for simple localStorage persistence, grouped via comment blocks):

- **basicProfile**: `age`, `sex`, `heightCm`, `weightKg`, `country`, `timezone`, `preferredWakeTime`, `preferredSleepTime`
- **goals**: `mainGoal`, `secondaryGoals[]`, `motivationReason`
- **fitnessProfile**: `fitnessLevel`, `trainingLocation`, `equipment`, `availableTimeMin`, `preferredTraining`, `injuryFlag`, `injuryNotes`
- **nutritionProfile**: `nutritionMode` (`SIMPLE_STANDARD` | `PRECISION_TRACKING`), `currentEatingIssue`, `preferredNutritionStyle`, `dietPreference`, `mealsPerDay`, `allergiesRestrictions`, `wantsCaloriesMacros`, `calorieTarget`, `macroTarget`
- **currentSituation**: `currentSituation[]`, `primaryStruggle[]`, `controlLevel`, `supportStatus`, `needsFromCoach[]`
- **recoveryRiskProfile**: `addictionRiskFlag`, `compulsionTypes[]`, `relapseRisk`, `preferredSupportTone`, `safetySupportShown`
- **mindsetProfile**: `stressLevel`, `confidenceLevel`, `biggestBarrier`
- **onboardingComplete**: boolean, `onboardingCompletedAt`

Defaults preserve existing behaviour. Backward-compat: legacy fields (`sleepQuality`, `gymAccess`, etc.) stay so the existing coach reads keep working.

Derivation helpers in the same file:
- `deriveNutritionMode(profile)` — applies the rules in section 3.
- `deriveRelapseRisk(profile)` — maps `controlLevel` + `primaryStruggle` to none/low/moderate/high/active.
- `computeProfileCompleteness(profile)` → `{ score, missingFields[] }`.

## 2. Onboarding flow (`src/routes/onboarding.tsx`, new)

Multi-step guided wizard. One question (or tight cluster) per step. Premium dark masculine styling reusing existing tokens. Steps:

1. Start Point — mainGoal
2. Current Situation — currentSituation[]
3. Biggest Struggle — primaryStruggle[]
4. Control Level — controlLevel
5. Support — supportStatus
6. Fitness Setup — fitnessLevel / trainingLocation / availableTime / injuryFlag / preferredTraining
7. Nutrition Setup — currentEatingIssue / preferredNutritionStyle / dietPreference / mealsPerDay / wantsCaloriesMacros
8. Daily Rhythm — wake / sleep / preferred training window / hardest part of day
9. Coach Style — preferredSupportTone
10. Summary screen — User Standard Summary + Recommended First Protocol + first coach message + CTA to coach

Mid-flow safety: if `controlLevel ∈ {"worried about relapse", "active relapse pattern"}` OR primaryStruggle includes substances/gambling/alcohol with controlLevel ≥ struggling → set `addictionRiskFlag = "high"`, `relapseRisk = "high"`, show inline `SAFETY_SUPPORT` card (non-blocking) and mark `safetySupportShown=true`.

Wired from `src/routes/index.tsx`: when `!profile.onboardingComplete`, primary CTA → `/onboarding`. Existing flows remain.

## 3. Coach routes (`src/lib/coach.functions.ts`)

**Strictly additive.** Do not touch the order of `detectRealWorldIntent` or `detectRoute` checks listed as load-bearing in the checkpoint. New work goes in via:

a. New route constants appended: `URGE_RESET`, `RELAPSE_PREVENTION`, `POST_RELAPSE_REPAIR`, `RECOVERY_STRUCTURE`, `SAFETY_SUPPORT`.

b. New RWI checks inserted **after `SAFETY_CRISIS` and before `PROCESS_ADDICTION`** (these recovery checks are higher-priority than existing PROCESS_ADDICTION but never override SAFETY_CRISIS). Keyword lists per the user spec ("I have an urge", "I want to drink", "I relapsed", etc.).

c. `ROUTE_RESPONSE_MODE` extended with new modes: `URGE_RESET`, `RELAPSE_PREVENTION`, `POST_RELAPSE_REPAIR`, `RECOVERY_STRUCTURE`, `SAFETY_SUPPORT`.

d. Forced-chip table extended for each new route per spec.

e. `MORNING_FILLER_ALLOWED` unchanged. New routes suppress morning filler.

f. Profile-aware personalisation hook inside the prompt builder (no routing change):
   - If `relapseRisk` ∈ {high, active} → inject system note prioritising structure/safety, suggest support contact, no intense training.
   - If `injuryFlag !== "none"` → inject safety modification note.
   - If `nutritionMode === "SIMPLE_STANDARD"` → instruct model NOT to ask for calories.
   - If `nutritionMode === "PRECISION_TRACKING"` and basicProfile missing → ask for the missing fields explicitly.
   - If beginner → simpler plan, fewer questions.

g. Debug fields appended to the response payload: `nutritionMode`, `relapseRisk`, `addictionRiskFlag`, `controlLevel`, `safetyRouteTriggered`, `recoveryRoute`, `urgeSupportShown`, `professionalSupportSuggested`, `profileCompletenessScore`, `missingProfileFields`.

## 4. Coach UI (`src/routes/coach.tsx`)

Surface the new debug fields in the existing debug panel. No structural changes to the chat UI.

## 5. Recovery response templates

Hard-coded template stubs (HEADLINE / DO THIS NOW / COACH CLOSE / REPLY WITH) injected as system guidance for the model when these routes fire, mirroring the existing STRESS_RESET / MISSED_DAY_REPAIR pattern. Forced chips lock the REPLY WITH labels.

## 6. Acceptance tests

After implementation, run the 6 acceptance tests from the spec by invoking `askCoach` server function directly (Node script under `/tmp`) and printing route/mode/debug. Report a results table. Fix only minimum to pass.

## 7. Files changed

- `src/lib/profile-store.ts` — extended profile model + helpers
- `src/lib/coach.functions.ts` — additive: new routes, modes, chips, personalisation hooks, debug fields
- `src/routes/onboarding.tsx` — new wizard
- `src/routes/index.tsx` — CTA to onboarding when incomplete
- `src/routes/coach.tsx` — debug-panel additions only
- `src/routes/profile.tsx` — minor: show new summary + "Restart onboarding"
- `docs/GORILLA_MIND_COACH_STABLE_CHECKPOINT.md` — append a "Recovery routes added" note (not refactor)

## 8. Safety guarantees

- All 7 real-world live tests from checkpoint section 8 must still pass (re-run after build).
- No reorder of `detectRealWorldIntent` / `detectRoute` core branches.
- `MORNING_FILLER_ALLOWED` unchanged.
- `{"n"}` normaliser untouched.
- DP/streak/recap unchanged.
- Guided workout / practice card mapping unchanged.

Build kept green throughout.
