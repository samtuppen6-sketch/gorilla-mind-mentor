# GORILLA_MIND_COACH_STABLE_CHECKPOINT

**Status:** STABLE — do not refactor `src/lib/coach.functions.ts` unless strictly necessary.
**Owner file:** `src/lib/coach.functions.ts` (+ `src/routes/coach.tsx` for UI/debug surface)

This note exists to protect the coach brain from regressions. The routing,
response-mode mapping, guided card selection, and continuation flow are all
working live against the OpenAI flow as of this checkpoint. Any future edit
that touches `detectRealWorldIntent`, `detectRoute`, `ROUTE_RESPONSE_MODE`,
the morning-filler suppression set, or the response normaliser must be
re-validated against the full live test list below before shipping.

---

## 1. Coach brain — current working state

### Routes currently working
- `SAFETY_CRISIS` (self-harm / overdose / medical emergency override)
- `GENERAL_TRANSFORMATION_REQUEST` (explicit 20/60/90-day / "transform my life")
- `PROCESS_ADDICTION` (phone / doomscroll / wasted-morning)
- `MISSED_DAY_REPAIR` (missed yesterday / fell off / broken streak)
- `EVENING_WORK_PROTOCOL` (working late / late shift / home late)
- `FAT_LOSS_STARTER_PLAN` (lose fat / weight loss / macros / diet)
- `STRESS_RESET` (stressed / overwhelmed / anxious / racing thoughts / head all over the place)
- `GYM_STRENGTH_PLAN` (build muscle / gym access / hypertrophy)
- `LOW_ENERGY_MINIMUM_PLAN` (feel like crap / tired / 20 minutes / drained — only when no sleep cue)
- `GENERAL_LIFE_STUCK` (hate my job / feel stuck / lost — fallback only, never overrides explicit intent)
- `SLEEP_WIND_DOWN` (bed / sleep / wind-down language)
- `BREATHWORK` (+ `DOWNREGULATE` sub-route → STRESS_RESET mode)
- `CORE_BACK_SUPPORT_PLAN`, `PILATES_CORE_PLAN`, `RUNNING_STARTER_PLAN`,
  `INTERMEDIATE_FITNESS_PLAN`, `FULL_REBUILD_PLAN`, `MORNING_PROTOCOL_REQUEST`,
  `BREATHWORK_MEDITATION_REQUEST`, `NUTRITION_CALORIE_REQUEST`,
  `LOW_ENERGY_SESSION`, `MISSED_MORNING`
- Late-night override forces `SLEEP_WIND_DOWN` over intense intents

### Response modes currently working
- `MORNING_ACTIVATION` (dayPart MORNING default, suppressed for non-morning routes)
- `AFTERNOON_RESCUE` (MIDDAY default)
- `EVENING_RESET` (EVENING default)
- `LATE_NIGHT_SHUTDOWN` (after 21:30 or LATE_NIGHT)
- `PLAN_BUILDING` (FAT_LOSS_STARTER_PLAN, GYM_STRENGTH_PLAN, NUTRITION_CALORIE_REQUEST, FULL_REBUILD_PLAN, MORNING_PROTOCOL_REQUEST, PROGRAM_REQUEST, BREATHWORK_MEDITATION_REQUEST, continuation routes)
- `LOW_ENERGY_MINIMUM` (LOW_ENERGY_MINIMUM_PLAN, LOW_ENERGY_SESSION)
- `EVENING_PROTOCOL` (EVENING_WORK_PROTOCOL)
- `RESET_RECOVERY` (MISSED_DAY_REPAIR)
- `STRESS_RESET` (STRESS_RESET route + BREATHWORK/DOWNREGULATE)
- `SLEEP_WIND_DOWN` (SLEEP_WIND_DOWN route, daypart-aware)
- `PROCESS_RESET` (PROCESS_ADDICTION outside morning context)

### Morning-filler suppression
Only the following routes are allowed to inject hydrate / sunlight / phone-away /
protein-breakfast bullets:
- `MORNING_PROTOCOL_REQUEST`, `FULL_REBUILD_PLAN`, `PROGRAM_REQUEST`,
  `PROCESS_ADDICTION`
- `GENERAL_LIFE_STUCK` **only when** dayPart === MORNING

Everything else (STRESS_RESET, EVENING_WORK_PROTOCOL, LOW_ENERGY_MINIMUM_PLAN,
GYM_STRENGTH_PLAN, MISSED_DAY_REPAIR, etc.) explicitly suppresses morning filler.

### Response normaliser
`{"n"}`, `{"\n"}`, and stray `\n` literal tokens are stripped from rendered
prose before it reaches the user. This fix lives in the answer-rendering path
and must not be removed.

---

## 2. Guided practice cards (working)

| Trigger route / sub-route | Guided card |
|---|---|
| `BREATHWORK` / DOWNREGULATE, `STRESS_RESET` (when offered) | Box Breathing session |
| `BREATHWORK_MEDITATION_REQUEST` | Breath + meditation entry |
| `MORNING_PROTOCOL_REQUEST` | Morning Protocol Lock-In |

## 3. Guided workout cards (working)

| Route | Workout card |
|---|---|
| `LOW_ENERGY_SESSION`, `LOW_ENERGY_MINIMUM_PLAN` | Low Energy Minimum (`low_energy_minimum_15`) |
| Beginner home request | Beginner Home Reset |
| `CORE_BACK_SUPPORT_PLAN` / `PILATES_CORE_PLAN` | Core & Back Support (pelvic tilts, dead bugs, glute bridges, bird dogs, side plank from knees) |
| `GYM_STRENGTH_PLAN` / `INTERMEDIATE_FITNESS_PLAN` | Full-Body Gym Standard (`full_body_gym_45`) |
| `RUNNING_STARTER_PLAN` | Run-Walk Foundation (intervals, no-sprint rule) |

Each card's button routes to the correct `workout.$workoutId` page, exercises
render, completion fires `handleComplete`, and the recap returns the user to
the coach.

---

## 4. Continuation chips & program state (working)

### Forced chip routes (chips locked to fallback labels regardless of model output)
- `STRESS_RESET` → `BREATHWORK / JOURNAL / WALK / TALK ME DOWN`
- `MISSED_DAY_REPAIR` → `RESET TODAY / MINIMUM SESSION / JOURNAL`
- `EVENING_WORK_PROTOCOL` → `FOOD / BREATHWORK / MORNING SETUP / RESET TOMORROW`
- `LOW_ENERGY_MINIMUM_PLAN` → `LOW ENERGY / FULL SESSION / WALK / BREATHWORK`
- `GYM_STRENGTH_PLAN` → `BEGINNER / INTERMEDIATE / LOW ENERGY / BUILD MY PLAN`
- `GENERAL_LIFE_STUCK` → `FITNESS / JOB / BOTH`
- `GENERAL_TRANSFORMATION_REQUEST` → `20-DAY / 60-DAY / 90-DAY / START TONIGHT`

### Continuation override
- `detectContinuationCommand` correctly converts user replies that match the
  previous turn's chip set into the right follow-up route, forces
  `PLAN_BUILDING`, and records `selectedRouteBeforeOverride` /
  `selectedRouteAfterOverride` in debug.

### Program state
- `priorProgramState` is threaded through `askCoach` and respected by the
  Daily-OS program-level detector (`detectProgramRoute`).

---

## 5. Debug fields (working / surfaced in `coach.tsx`)
- `selectedRoute`, `responseMode`, `responseModeReason`
- `intentDetected`, `routePriorityReason`
- `profileOverrideSuppressed`, `profileOverrideSuppressedReason`
- `morningFillerSuppressed`
- `timeBasedRouteReason`, `temporalSource`
- `routeOverrideApplied`, `routeOverrideReason`,
  `selectedRouteBeforeOverride`, `selectedRouteAfterOverride`,
  `continuationCommand`
- `retrievalSuppressedVolumes`, `reasonForSuppression`
- `safetyFlags`, `safetyModificationApplied`
- `duplicateAdviceSuppressed`, `suppressedAdvice`
- `quickReplies` (post-parse, post force-chip)

---

## 6. DP / streak / recap flow (working)
- `handleComplete` derives the daily-action label from the completed
  workout/session id, category, or title (NOT hardcoded to mobility).
- Verified labels:
  - Beginner Home Reset → "Home strength completed"
  - Core & Back Support → "Core support completed"
  - Full-Body Gym Standard → "Gym strength completed"
  - Run-Walk Foundation → "Run-walk completed"
  - Box Breathing → "Breathwork completed"
  - Morning Protocol Lock-In → "Morning protocol completed"
- DP values, streak increments, and recap screen all update correctly.
- Recap returns user to coach.

---

## 7. Acceptance tests passed (static + UI)
- Box Breathing recommend → card → session → complete → recap → coach
- Beginner Home Reset recommend → card → workout detail → steps render →
  complete → recap ("Home strength completed")
- Core & Back Support — safety caveat present, correct exercise list
- Run-Walk Foundation — intervals clear, no-sprint rule visible
- Full-Body Gym Standard — sets/reps, 2 RIR, progressive overload

## 8. Real-world live tests passed (OpenAI flow)

| Prompt | Route | Mode |
|---|---|---|
| "I feel like crap today and don't want to train." | LOW_ENERGY_MINIMUM_PLAN | LOW_ENERGY_MINIMUM |
| "I want to lose fat but I don't know where to start." | FAT_LOSS_STARTER_PLAN | PLAN_BUILDING |
| "I'm stressed and my head is all over the place." | STRESS_RESET | STRESS_RESET |
| "I only have 20 minutes and I'm tired." | LOW_ENERGY_MINIMUM_PLAN | LOW_ENERGY_MINIMUM |
| "I want to build muscle and I've got access to a gym." | GYM_STRENGTH_PLAN | PLAN_BUILDING |
| "I'm working late tonight, what should I do?" | EVENING_WORK_PROTOCOL | EVENING_PROTOCOL |
| "I missed yesterday and feel like I've fallen off." | MISSED_DAY_REPAIR | RESET_RECOVERY |

All passed live with correct chips, no `{"n"}` artefacts, no morning-filler
bleed, and on-brand Gorilla Mind tone.

---

## 9. Known non-critical limitations
- File-search citation footnotes (`[1] … [8]`) can occasionally surface in
  long retrieval responses (e.g. MISSED_DAY_REPAIR). Not a render bug — it is
  the OpenAI file_search citation payload. Cosmetic only; flow still works.
- "MORNING SETUP" chip in `EVENING_WORK_PROTOCOL` refers to *tomorrow's*
  morning prep, not morning-activation advice. Working as intended; do not
  remove.
- Profile `sleepQuality` only triggers a sleep route when the message text
  explicitly mentions sleep / bed / wind-down. Intentional guard against the
  earlier over-routing bug.
- Temporal fallback (`temporalSource: "fallback"`) uses UTC. Client-supplied
  `temporal` is preferred and almost always present.

---

## 10. Do-not-touch warnings

**Do NOT refactor `src/lib/coach.functions.ts` unless absolutely necessary.**

Specifically, the following are load-bearing and must not be reordered or
"cleaned up" without a full live re-test of all 7 real-world prompts plus
the acceptance suite:

1. The order of checks inside `detectRealWorldIntent` (PROCESS_ADDICTION →
   MISSED_DAY → EVENING_WORK → FAT_LOSS → STRESS → GYM → LOW_ENERGY).
   Explicit goal intents MUST resolve before LOW_ENERGY's "tired" catch.
2. The order inside `detectRoute`: SAFETY → transformation → RWI →
   GENERAL_LIFE_STUCK → program → late-night → remaining keyword routes.
   RWI must run **before** GENERAL_LIFE_STUCK or stress/fat-loss/missed-day
   prompts will be swallowed by the life-stuck fallback.
3. `ROUTE_RESPONSE_MODE` mapping and the `!isSafetyCrisis && !continuation`
   guard around it.
4. `MORNING_FILLER_ALLOWED` set — adding routes here re-introduces the
   morning-protocol bleed bug.
5. The `{"n"}` / `\n` normaliser in the answer-rendering path.
6. Forced-chip route table — these are deliberately locked so the model
   cannot drift the chip labels.
7. `handleComplete` daily-action label derivation — do not re-hardcode to
   `mobility_recovery_10min`.

If you must edit any of the above, re-run the full real-world test list
(Section 8) **and** the acceptance suite (Section 7) before merging. Keep
build green.
