# Gorilla Mind — Onboarding & Profile Stability Checkpoint

Status: Stable
Companion to: `docs/GORILLA_MIND_COACH_STABLE_CHECKPOINT.md`

This document records the current state of the auth → onboarding → profile →
coach flow. It is a reference point; future edits should not regress from this
baseline without explicit reason.

---

## 1. Current Auth / Profile Flow

```
Landing (/)
  └── CTA: "Start Your Reset"
        ├── if identityProfile missing       → /auth
        ├── if onboardingComplete === false  → /onboarding
        └── if onboardingComplete === true   → /coach

/auth
  └── Create/connect identity
        └── writes identityProfile
              └── redirects to /onboarding

/onboarding
  └── Multi-section wizard
        └── on completion sets onboardingComplete = true
              └── redirects to /coach

/coach
  └── Loads identityProfile + onboarding profile into coach context
```

Returning users with `onboardingComplete = true` bypass `/auth` and
`/onboarding` and go straight to `/coach`.

---

## 2. Identity Fields

Stored under `identityProfile` in `profile-store`:

- `userId`
- `firstName`
- `lastName`
- `fullName`
- `email`
- `phoneNumber`
- `authProvider` (`email` | `google` | `apple` | `local`)
- `onboardingComplete`
- `createdAt`
- `updatedAt`

---

## 3. Onboarding Profile Sections

The wizard captures, in order:

1. **Start Point** — entry context, why they are here
2. **Current Situation** — life status flags (incl. recovery markers)
3. **Biggest Struggle** — the single dominant problem
4. **Control Level** — self-rated control / discipline
5. **Support** — supportStatus, recovery group, trusted contact intent
6. **Fitness Setup** — fitnessLevel, trainingLocation, equipment, injuryFlag,
   preferredTraining, availableTime
7. **Nutrition Setup** — nutritionMode, preferredNutritionStyle,
   wantsCaloriesMacros, dietary constraints
8. **Daily Rhythm** — wake/sleep windows, dayPart preferences
9. **Coach Style** — preferredSupportTone, directness level
10. **Summary** — review + lock-in (sets `onboardingComplete = true`)

---

## 4. Nutrition Behaviour

Two nutrition modes drive coach behaviour:

### SIMPLE_STANDARD
- Default for users who do not want tracking.
- Coach **does not ask** for calories, macros, weight, height, age.
- Uses protein-first simple rules ("palm of protein per meal", "two fists
  of veg", "carbs around training").
- Calorie/macro numbers are **never invented**.

### PRECISION_TRACKING
- For users who explicitly want detailed tracking.
- Coach asks **only for missing fields** (age, sex, height, weight).
- Once stored, fields are not re-asked.
- Calorie/macro numbers are computed from stored data; never invented.

### When calories/macros are asked for
- `nutritionMode === PRECISION_TRACKING` AND required fields missing.
- User explicitly asks ("give me my calories", "what are my macros").

### When calories/macros are suppressed
- `nutritionMode === SIMPLE_STANDARD`.
- User asks vague nutrition questions ("what should I eat today").
- Recovery-first context where food tracking would harm the user.

---

## 5. Recovery / Addiction-Aware Behaviour

The coach supports these recovery routes:

- **URGE_RESET** — short-term urge in the moment (10-minute rule, breath,
  remove trigger, delay).
- **RELAPSE_PREVENTION** — danger window: lead with safety, contact a person,
  no fitness lead.
- **POST_RELAPSE_REPAIR** — non-shaming reset; one next action; no spiral.
- **RECOVERY_STRUCTURE** — daily structure for someone in recovery
  (morning plan, movement, honest journal, support contact, evening reset).
- **SAFETY_SUPPORT** — crisis-adjacent; defers to safety resources.

### Non-diagnostic language
- Coach never diagnoses, never names disorders, never prescribes medication.
- For sharp/neurological/worsening pain → recommends medical/physio review.
- For active crisis → safety resources first, no fitness/nutrition lead.

### Safety / support rules
- SAFETY_CRISIS always wins over all other routes.
- Recovery routes win over fitness/nutrition routes when explicit.
- Support contact is referenced when `supportStatus` indicates a person/group
  is available.

---

## 6. Profile-Aware Route Biases (now working)

Applied in `detectRoute` **after** explicit RWI checks and **before**
`GENERAL_LIFE_STUCK` fallback. None override crisis, transformation,
relapse, nutrition, gym, or running explicit routes.

| Trigger | Condition | Route |
|---|---|---|
| Relapse risk | `relapseRisk ∈ {high, active}` + vague struggle language | `RELAPSE_PREVENTION` |
| Recovery goal | `mainGoal=recovery` (or recovery signals) + vague planning language | `RECOVERY_STRUCTURE` |
| Nutrition vague | "what should I eat / eat today / food today" | `FAT_LOSS_STARTER_PLAN` (nutritionMode governs depth) |
| Back-pain home | `injuryFlag=back_pain` + `trainingLocation=home` + vague training language | `CORE_BACK_SUPPORT_PLAN` |

Each bias emits `routePriorityReason` for debug:
- `"profile.relapseRisk bias"`
- `"profile.recovery structure bias"`
- `"profile.injury route bias"`

---

## 7. Live / Logic Tests Passed

- ✅ High relapse risk flow ("I'm struggling tonight" → RELAPSE_PREVENTION)
- ✅ Returning user persistence (onboardingComplete persists, CTA gates)
- ✅ Simple fat loss logic (SIMPLE_STANDARD, no calorie ask)
- ✅ Precision nutrition logic (PRECISION_TRACKING, asks only missing, no invent)
- ✅ Back-pain beginner profile bias (vague training → CORE_BACK_SUPPORT_PLAN,
  safety caveat applied)
- ✅ Recovery structure bias (vague plan ask with recovery profile)

---

## 8. Current Limitations / TODOs

- 🔲 Google OAuth not yet connected (button is a placeholder)
- 🔲 Apple OAuth not yet connected (button is a placeholder)
- 🔲 Email/password auth is placeholder / local-only
- 🔲 Profile persists locally (browser store) only
- 🔲 Supabase Auth + `profiles` table integration still TODO
- 🔲 No server-side persistence of identityProfile across devices

When real auth is wired:
- Replace local identity write with Supabase Auth signup/login.
- Mirror identity + onboarding fields into a `profiles` table with RLS.
- Add `user_roles` table per security guidance — do NOT store role on profile.

---

## 9. Warning for Future Edits

- **Do not refactor `src/lib/coach.functions.ts`** unless necessary. The
  stable coach brain (routing priority, RWI regex, route templates) is the
  product. Treat it as load-bearing.
- **Do not weaken route priority.** Order is:
  1. SAFETY_CRISIS
  2. Transformation requests
  3. Explicit RWI (relapse, urge, nutrition, gym, running, etc.)
  4. Profile-aware biases (relapse / recovery / injury / nutrition keyword)
  5. GENERAL_LIFE_STUCK fallback
- **Do not let profile context override explicit user intent.** Profile
  biases only fire when no explicit RWI matched.
- **Do not allow profile context to override** crisis safety, explicit
  nutrition asks, explicit injury statements, or explicit recovery
  statements — those are handled at RWI level and must win.
- **Do not add new routes** to satisfy edge cases without a checkpoint
  update and acceptance tests.
- **Do not edit the onboarding UI** without re-running the acceptance
  flow tests in this document.
