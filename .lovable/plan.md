
# Gorilla Mind Coach — Daily OS Upgrade

Goal: stop generic wellness output. Force pillar-driven, guided, interactive plans with strict nutrition guardrails and matching guided-practice cards.

## Scope (in order)

### 1. New routes + detector
In `src/lib/coach.functions.ts`:
- Add routes: `PROGRAM_REQUEST`, `FITNESS_PLAN_REQUEST` (exists), `BREATHWORK_MEDITATION_REQUEST`, `MORNING_PROTOCOL_REQUEST`, `NUTRITION_CALORIE_REQUEST`, `FULL_REBUILD_PLAN` (exists).
- Add a `detectProgramRoute()` step that runs BEFORE existing detectors. Phrases like "fitness plan and meditation", "build me a plan", "give me a routine", "morning routine", "what should I do every day", "7-day plan", "discipline system" → `FULL_REBUILD_PLAN`.
- Override guard: do not fall into `GENERAL_LIFE_STUCK` / `MISSED_DAY_REPAIR` / `EVENING_REVIEW` / `CONTINUATION_RESET_NOW` unless safety triggers.
- Continuation commands extended: `CALORIES`, `GYM_PLAN`, `HOME_PLAN`, `MORNING_PROTOCOL`, `FAT_LOSS`, `MUSCLE`, `FITNESS`, `ALL_ROUND_RESET`.

### 2. Pillar Recommendation Engine
New helper `selectPillarsForRoute(route, message, profile)` returning ordered pillar IDs from the existing 21 in `protocol-pillars.ts`. Outputs go into the system-prompt context AND into `debug.selectedPillars` + `debug.pillarReasoning`. Safety override: morning daylight phrasing only, never "stare at sun".

### 3. New SYSTEM_INSTRUCTIONS section — Plan Spec
Add a `PLAN_BUILDING_SPEC` block that forces the exact section headers:
HEADLINE / THE STANDARD / YOUR FIRST 24 HOURS / MORNING PROTOCOL / TRAINING PLAN / BREATHWORK / MEDITATION / NUTRITION / WHAT I NEED FROM YOU / REPLY WITH.
Banned phrase list ("light exercise", "guided imagery", "improve mental clarity", "consider…", etc). Required Gorilla phrases vocabulary. Forced when `responseMode === "PLAN_BUILDING"`.

### 4. Guided practice card linkage
- New `selectGuidedPracticeForPlan(route, pillars, dayPart)` → returns `guidedPracticeRecommendation` matching the breathwork/meditation/morning-protocol prescription word-for-word (e.g. Box Breathing → `box_breathing_5min`, Extended Exhale → `extended_exhale_3min`, Morning Identity Reset → `morning_identity_reset_5min`, Morning Protocol Lock-In → `morning_protocol_lock_in`).
- Ensure these practice IDs exist in `src/lib/practices.ts`; add any missing ones with the prescribed title/category/duration.
- `CoachResponse.guidedPractice` returns this card on every plan response.

### 5. Fitness plan quality
- `buildDefaultFitnessPlan({ level, location })` returns the explicit 7-day structure from the spec (home bodyweight + walks default; gym variant on `GYM_PLAN`).
- Refuse heavy prescriptions until injuries/ability/equipment/experience are known.

### 6. Nutrition + calorie guardrails
- New `resolveCalorieTarget(profile)` returning `{ calorieTargetUsed, calorieSource: "profile"|"calculated"|"not_available", calorieMissingFields[], macroTargetUsed }`.
- If `not_available`: ask for the 6 fields, give the temporary non-calorie standard (protein-first, water before caffeine, one whole-food meal, no chaotic evening eating). Never invent calories.
- Debug panel surfaces those fields.

### 7. Program memory
- Extend `CoachResponse` with `programState` and accept `priorProgramState` in `askCoach` input.
- Persist in `src/routes/coach.tsx` thread state: `activePlanType, activePlanLength, selectedFitnessLevel, selectedBreathwork, selectedMeditation, selectedMorningProtocol, missingPersonalisationFields, lastRecommendedGuidedPractice, lastProgrammeRoute`.
- Continuation routing reads program state so "calories" / "gym plan" / "morning protocol" extend the active plan instead of restarting.

### 8. Debug panel
Add to `CoachDebug`:
`selectedPillars, pillarReasoning, activePlanType, activePlanLength, guidedPracticeRecommendation, calorieTargetUsed, calorieSource, calorieMissingFields, macroTargetUsed, programmePersonalisationMissing, knowledgeBaseVolumesUsed, genericFallbackUsed, genericFallbackReason`.
Render new section in `src/routes/coach.tsx` debug drawer.

### 9. Interactive chips
`quickReplies` must mirror the `REPLY WITH` line. For FULL_REBUILD_PLAN: `["CALORIES","GYM PLAN","HOME PLAN","MORNING PROTOCOL"]`. For fitness level prompts: `["BEGINNER","INTERMEDIATE","ADVANCED"]`. For goal prompts: `["FAT LOSS","MUSCLE","FITNESS","ALL-ROUND RESET"]`.

## Out of scope (this turn)
- Real macro calculator beyond Mifflin-St Jeor (we'll wire the formula but no fancy adjustments).
- New practice timer screens — we reuse existing `practice.$practiceId.tsx` and only add missing practice entries.
- Knowledge base file_search query strings stay as today; only the `knowledgeBaseVolumesUsed` debug field is new.

## Acceptance tests (manual via preview)
1. "Recommend a fitness plan and meditation with breathwork." → `selectedRoute=FULL_REBUILD_PLAN`, plan has all required sections, guided card = Box Breathing, chips = CALORIES/GYM PLAN/HOME PLAN/MORNING PROTOCOL, no calories invented.
2. "calories" follow-up → either asks for missing fields or returns calculated target with `calorieSource` visible.
3. "gym plan" follow-up → gym 7-day variant, not re-prints the original.
4. "morning protocol" follow-up → ordered sequence with guided card = Morning Protocol Lock-In.

## Order of operations
1. Routes + detector + continuation commands.
2. Pillar engine.
3. SYSTEM_INSTRUCTIONS plan spec + banned phrases.
4. Guided practice linkage + practice entries.
5. Fitness plan builder.
6. Calorie resolver.
7. Program memory wiring (server + client).
8. Debug fields + UI.
9. Quick chips alignment.
10. Verify via `invoke-server-function` for the 4 acceptance prompts.
