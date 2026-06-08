# Guided Practice Implementation Standard

Reference implementation for all guided MP3 practices in Gorilla Mind.

## Reference Implementation

**Box Breathing** (`box_breathing_5min`) is the canonical template. All new
guided MP3 practices MUST copy its architecture.

- Audio: `box-breathing.mp3` (`audioAssetId: "box_breathing_5min_audio"`)
- Player component: `src/components/BoxBreathingPlayer.tsx`
- Practice route: `src/routes/practice.$practiceId.tsx` (dispatches on `practice.id`)
- Registry entry: `src/lib/practices.ts` → `box_breathing_5min`
- Prescription mapping: `src/lib/coach.functions.ts` → `BREATHWORK_PROTOCOL_META`

Confirmed working: audio-synced visual, PREPARE → INHALE → HOLD → EXHALE → HOLD → OUTRO,
rAF-driven orb, no phase popping, play/pause/restart/close all correct, completion
awards DP once per day, streak + protocol progress update.

Do not alter `BoxBreathingPlayer.tsx` unless the change improves the shared
architecture for ALL guided practices.

## Core Principles

### 1. Audio is the single source of truth

Visual state MUST be derived from `audio.currentTime` every frame, not from
CSS keyframes, JS timers, or phase change events.

```ts
const { phase, countdown, round } = computeState(audio.currentTime);
const scale = computeScale(audio.currentTime);
```

Why: pause/resume/seek/restart and any audio drift stay perfectly in sync.
CSS phase animations desync the moment audio pauses or buffers.

### 2. rAF tick loop while playing

```ts
useEffect(() => {
  if (!isPlaying) return;
  let raf = 0;
  const tick = () => {
    setCurrent(audioRef.current?.currentTime ?? 0);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, [isPlaying]);
```

Stop rAF on pause → orb freezes exactly where audio froze.

### 3. No phase pops at boundaries

When a calm/idle "PREPARE" loop hands off to the active pattern, ease into
the active phase's starting scale in the final ~2 s before the handover.
Same rule for OUTRO entry from EXHALE.

### 4. Cleanup on unmount

```ts
useEffect(() => () => {
  const el = audioRef.current;
  if (el) { el.pause(); el.currentTime = 0; }
}, []);
```

Close must stop audio. Background playback after navigation is a bug.

### 5. Completion is user-confirmed

The user taps **Complete Session** after the player ends. The route calls
`completePracticeSession({ practice, source, linkedCoachRoute })` which:

- awards `disciplinePoints` once per day (duplicate flag handles replays)
- flips the practice's `dailyActionKey`
- updates practice streak and protocol streak per existing rules

Do not auto-complete on `onEnded` — keeps the user in control and avoids
double-counting from autoplay or background tabs.

## Required Fields Per Practice

Every new guided practice needs the following defined together so the
prescription card, player, and progress system stay in lockstep.

| Field                  | Location                           | Notes |
| ---------------------- | ---------------------------------- | ----- |
| `id`                   | `practices.ts`                     | Stable, snake_case, used by Coach |
| `title`                | `practices.ts`                     | Displayed on card + player |
| `durationMinutes`      | `practices.ts`                     | Match audio length (rounded) |
| `audioAssetId`         | `practices.ts` + `audio-assets.ts` | Links practice → MP3 |
| Audio file             | `audio-assets.ts`                  | `.mp3` in public assets |
| Timing map             | Player constants                   | PREPARE start, active window, OUTRO start |
| Visual pattern         | Player `computeScale()`            | Scale + glow derived from `currentTime` |
| Phase labels           | Player                             | e.g. INHALE / HOLD / EXHALE / HOLD |
| Phase sub-instructions | Player                             | "Through the nose", "Hold", etc. |
| Completion message     | Player OUTRO subtext               | One short identity line |
| `disciplinePoints`     | `practices.ts`                     | DP awarded once/day |
| `dailyActionKey`       | `practices.ts`                     | e.g. `breathworkCompleted` |
| `primaryButtonLabel`   | `practices.ts`                     | e.g. `Start Box Breathing` |
| `recommendedWhen` / `avoidWhen` / `safetyNotes` | `practices.ts` | Used by card + safety banner |
| Coach mapping          | `coach.functions.ts` `BREATHWORK_PROTOCOL_META` | State → protocol id |
| Debug visibility       | `practice.$practiceId.tsx`         | Already covered by shared debug panel |

## Timing Map Format

```ts
const PREPARE_END   = 55;   // seconds — INHALE starts here
const ACTIVE_END    = 311;  // seconds — last EXHALE ends here
const OUTRO_START   = 314;  // seconds — completion message
const ROUND_LENGTH  = 16;   // seconds per round
const PHASE_LENGTH  = 4;    // seconds per phase
const TOTAL_ROUNDS  = 16;
```

Values come from the actual MP3. Verify against the file before shipping.

## File Layout for a New Practice

```
src/lib/practices.ts                 — registry entry
src/lib/audio-assets.ts              — audio asset + linkedPracticeIds
public/audio/<file>.mp3              — the MP3
src/components/<Name>Player.tsx      — only if visual pattern differs
src/routes/practice.$practiceId.tsx  — add dispatch branch if custom player
src/lib/coach.functions.ts           — add to BREATHWORK_PROTOCOL_META
```

If the new practice uses the SAME visual pattern as Box Breathing (4-4-4-4
square), reuse `BoxBreathingPlayer` parameterized — do not fork it. Fork
only when the pattern truly differs (e.g. extended exhale ratio).

## Practices To Add Next

These are already mapped in the breathwork prescription engine and need
audio + player wiring to match the standard above.

- `extended_exhale_3min`     — Extended Exhale (4 in / 8 out, wind-down)
- `urge_reset_3min`          — Urge Reset (interrupt scroll / craving loop)
- `energising_breath_3min`   — Energising Breath (low-energy morning)
- `identity_reset_breath_5min` — Identity Reset (missed-day re-entry)
- `recovery_breath_5min`     — Recovery Breath (post-training downshift)

For each: drop the MP3, fill the registry entry, define the timing map,
pick the visual pattern (reuse or fork), and verify Coach prescribes it
by state.

## Acceptance Checklist (per practice)

- [ ] Audio plays on first tap (mobile preview)
- [ ] Orb scale derives from `audio.currentTime` every frame
- [ ] No pop at PREPARE → first active phase boundary
- [ ] Pause freezes orb exactly; Resume continues from same point
- [ ] Restart resets audio AND visual AND round counter
- [ ] Close stops audio (no background playback)
- [ ] OUTRO shows completion message
- [ ] Complete Session awards DP once per day
- [ ] Replaying same day does not duplicate DP
- [ ] Streak + protocol progress update
- [ ] Coach card title + button label match `practices.ts` verbatim
- [ ] Build green
