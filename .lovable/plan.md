
# Plan — Coach Temporal Context + Hybrid Mindset Brain

Scope: Add user-local time-of-day awareness and Gorilla Mindset hybrid principles to the AI Coach. Plan only — no edits until you confirm.

## What stays untouched
PRACTICE_REGISTRY, `completePracticeSession`, Top 21 pillar logic, daily minimum, guided practice cards, DP, streaks, vector store retrieval, profile + journal saving, all existing routes and sub-routes.

## Files to change

1. `src/lib/coach.functions.ts` — add temporal types, schema, routing, context block, mindset rules.
2. `src/routes/coach.tsx` — capture local browser time, send it, render new debug rows.
3. (No changes to `practice-progress.ts`, `protocol-pillars.ts`, `profile-store.ts`.)

## 1. Temporal context payload

Frontend builds and sends a `temporal` object alongside the existing `profile/journal/dailyProgress`:

```text
temporal: {
  localDate, localTime, timezone, dayOfWeek,
  dayPart,                // MORNING | MIDDAY | EVENING | LATE_NIGHT
  sessionContext,         // see list below
}
```

Derivation (client-side in `coach.tsx` at submit time):
- `localDate` = `YYYY-MM-DD` from `new Date()`
- `localTime` = `HH:mm`
- `timezone` = `Intl.DateTimeFormat().resolvedOptions().timeZone`
- `dayOfWeek` = `MON..SUN`
- `dayPart`: 04:00–10:59 MORNING · 11:00–15:59 MIDDAY · 16:00–21:29 EVENING · else LATE_NIGHT
- `sessionContext`: default mapped from `dayPart` (MORNING→MORNING_CHECK_IN, MIDDAY→MIDDAY_COURSE_CORRECTION, EVENING→EVENING_REVIEW, LATE_NIGHT→LATE_NIGHT_SLEEP_PROTECTION); upgraded by message keywords (pre/post training, missed day, "stuck/hate my job/wasting my life" → GENERAL_LIFE_STUCK, "transform/reset my life" → GENERAL_TRANSFORMATION_REQUEST, crisis/boundary phrases → SAFETY_OR_BOUNDARY, "plan my day" → DAILY_PLAN, "wind down" → WIND_DOWN).

Backend: add `TemporalSchema` + plumb through `askCoach.inputValidator`. If absent, fall back to a server-derived UTC-based dayPart and flag `temporalSource: "fallback"` in debug.

## 2. Route detector changes (`detectRoute`)

- Accept `temporal` as a 4th argument.
- New early branches **after SAFETY but before keyword routes**:
  - `LATE_NIGHT` + any intense intent (cold, hard training, "energise", planning) → force `SLEEP_WIND_DOWN` with reason "Late-night override: protect sleep."
  - `EVENING` + no specific intent → `EVENING_REVIEW`.
  - `MORNING` + no specific intent → existing `MISSED_MORNING` only if journal flags it, else new `GENERAL_COACHING` with morning-priority hint (handled via context block, not a new route).
- New route added to `CoachRoute` union: `GENERAL_LIFE_STUCK` and `GENERAL_TRANSFORMATION_REQUEST`.
- Detection patterns:
  - `GENERAL_LIFE_STUCK`: `/hate my job|feel stuck|not motivated|wasting my life|don'?t know where to start|lost|directionless/i`
  - `GENERAL_TRANSFORMATION_REQUEST`: `/transform my life|change my life|reset my life|full reset|20.?day|60.?day|90.?day plan/i` — only routes here if the user **explicitly** asks for a long plan.

## 3. Context block (`buildContextBlock`)

Add a new section above OPERATOR CONTEXT:

```text
[TEMPORAL CONTEXT]
localDate / localTime / timezone / dayOfWeek
dayPart
sessionContext
priorityFocus: <derived list per dayPart>
```

`priorityFocus` text is the exact MORNING / MIDDAY / EVENING / LATE_NIGHT priority bullet lists from your spec, so the model sees them inline.

Also add a `yesterdaySummary` block derived from `journal` (already present) — re-label for clarity. `missingAssignedPillarsToday` already computed; keep.

## 4. Hybrid Mindset brain

Append to `SYSTEM_INSTRUCTIONS` a new block "GORILLA MINDSET PRINCIPLES" listing your 14 principles (consistency over intensity, …no shame, …teach through action) and two hard rules:

- **No long plans by default.** Do not produce a 20/60/90-day plan unless `selectedRoute === GENERAL_TRANSFORMATION_REQUEST`.
- For `GENERAL_LIFE_STUCK`: respond in this exact short shape — HEADLINE / WHAT'S HAPPENING (1–2 lines) / DO THIS NOW (≤3 bullets, body-first) / TODAY'S NON-NEGOTIABLES (≤3 bullets) / GUIDED PRACTICE (only if `guidedPractice` selected) / COACH CLOSE (1 line) / ONE QUESTION (1 line).
- Ask only one clarifying question, and only when needed; otherwise act first.

`routeInstruction` gains branches for `GENERAL_LIFE_STUCK` and `GENERAL_TRANSFORMATION_REQUEST` enforcing the short format.

## 5. Debug panel (`coach.tsx`)

Extend `CoachDebug` and `DebugPanel` rows with:
- `localDate`, `localTime`, `timezone`, `dayOfWeek`
- `dayPart`
- `sessionContext`
- `temporalSource` (`client` | `fallback`)
- `timeBasedRouteReason` (string explaining if a time rule overrode keyword routing, e.g. "LATE_NIGHT override forced SLEEP_WIND_DOWN")

All existing rows remain.

## 6. Verification checklist (after build mode)

- 06:30 + "what should I do?" → MORNING_CHECK_IN, no late-night override, priorityFocus = morning list.
- 14:00 + "I'm drifting" → MIDDAY_COURSE_CORRECTION.
- 18:30 + "check in" → EVENING_REVIEW + `journal_checkin_3min`.
- 23:30 + "let's do cold plunge" → LATE_NIGHT override → SLEEP_WIND_DOWN, no cold recommendation.
- "I hate my job, feel stuck, want to get fit" → GENERAL_LIFE_STUCK, short body-first response, one question, no 20-day plan.
- "Give me the full 60-day reset" → GENERAL_TRANSFORMATION_REQUEST, long plan allowed.
- All existing breathwork / nutrition / recovery / sobriety routes still trigger as before.
- Debug panel shows all new temporal fields.

Confirm and I'll implement.
