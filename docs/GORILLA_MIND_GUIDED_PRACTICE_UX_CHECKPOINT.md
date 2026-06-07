# Gorilla Mind — Guided Practice Audio Mapping + UX Checkpoint

## Purpose

The guided practice screen now has clean, canonical audio mapping and a single
**Start Session → Complete Session** flow. No duplicate "play" controls, no
dead-end placeholder copy, and no raw technical labels visible to normal users.

This checkpoint locks the current state before MP3 uploads begin.

---

## Files changed

- `src/lib/audio-assets.ts` — canonical `linkedPracticeIds` for every asset
- `src/lib/practices.ts` — added canonical `urge_reset_10min` and
  `relapse_repair_7min` practices; removed wrong `relapse_repair_7min_audio`
  link from `journal_checkin_3min`
- `src/components/GuidedAudioPlayer.tsx` — parent-controlled `started` prop,
  auto-plays only after user presses Start, internal Play button removed
- `src/routes/practice.$practiceId.tsx` — unified Start → Complete flow,
  premium card layout, debug-only internals

---

## Canonical audio mappings

| Practice ID | Audio Asset ID | Audio URL | Notes |
|---|---|---|---|
| `box_breathing_5min` | `box_breathing_5min_audio` | `/audio/box-breathing-5min.mp3` | canonical |
| `extended_exhale_3min` | `extended_exhale_3min_audio` | `/audio/extended-exhale-3min.mp3` | canonical |
| `breathwork_wind_down_5min` | `sleep_downshift_5min_audio` | `/audio/sleep-downshift-5min.mp3` | canonical |
| `morning_identity_reset_5min` | `morning_identity_reset_5min_audio` | `/audio/morning-identity-reset-5min.mp3` | canonical |
| `morning_protocol_lock_in` | `morning_protocol_lock_in_audio` | `/audio/morning-protocol-lock-in.mp3` | canonical |
| `urge_reset_10min` | `urge_reset_10min_audio` | `/audio/urge-reset-10min.mp3` | canonical |
| `meditation_urge_surfing_5min` | `urge_reset_10min_audio` | `/audio/urge-reset-10min.mp3` | **legacy alias** — coach still routes here for SOBRIETY_CRAVING / PROCESS_ADDICTION |
| `relapse_repair_7min` | `relapse_repair_7min_audio` | `/audio/relapse-repair-7min.mp3` | canonical |
| `meditation_grounding_5min` | `grounding_reset_5min_audio` | `/audio/grounding-reset-5min.mp3` | canonical |

All assets currently `status: "placeholder"`. Flip to `"ready"` only after
the MP3 file exists at the listed URL.

---

## UX behaviour

- **One clear Start Session CTA** — full-width gold button at the bottom of the screen
- **No duplicate play/start confusion** — the audio player has no independent Play button before Start is pressed
- **Audio starts only after the user presses Start Session** — user-initiated, never autoplay
- **Pause / Restart shown only after Start** — secondary controls inside the audio card
- **Complete Session disabled until Start has been pressed** — prevents accidental instant completion
- **Placeholder audio no longer feels like a dead end** — quiet card reads "Follow the on-screen steps below. Voice guidance arrives shortly."
- **Completion still works if audio is missing, placeholder, or fails** — DP / streak logic unchanged
- **Debug / internal labels hidden from normal users** — `subRoute`, `source`, `linkedCoachRoute`, `dailyActionKey`, audio status, etc. only render when `?debug=true`
- **Premium feel** — dark card surfaces, `rounded-2xl`, subtle gold shadow on the primary CTA, clean spacing

---

## Tests passed (latest audit)

- Coach recommends **Box Breathing** → practice opens with `box_breathing_5min_audio` ✅
- Coach recommends **Extended Exhale** → opens with `extended_exhale_3min_audio` ✅
- Coach recommends **Sleep Downshift** → opens with `sleep_downshift_5min_audio` ✅
- Coach recommends **Urge Reset** (via `meditation_urge_surfing_5min`) → opens with `urge_reset_10min_audio` and safety note renders above the player ✅
- Coach recommends **Morning Identity Reset** → opens with `morning_identity_reset_5min_audio` ✅
- Coach recommends **Grounding Reset** → opens with `grounding_reset_5min_audio` ✅
- Placeholder audio → no dead-end copy; on-screen steps still guide the session ✅
- Complete button → cannot fire before Start; fires correctly after Start; logs correct practice label and DP ✅
- DP / streak logic preserved (unchanged) ✅
- Build green (`tsc --noEmit` clean) ✅

---

## Remaining TODOs

- Upload MP3 files under `/public/audio/` using the exact filenames above
- Add `transcriptUrl` values to each audio asset once transcripts exist
- Flip each asset's `status` from `"placeholder"` to `"ready"` only after its MP3 is in place
- Later: add workout-support audio (warm-up cues, between-set prompts) as a separate `workout_support` category

---

## Warnings

- **Do not break canonical practice IDs.** The Coach selector and Plan builder reference these strings directly — renaming a canonical ID without a registry alias will break recommendations.
- **Do not reintroduce duplicate Start / Play controls.** The Practice Player has one Start CTA. The audio card's Pause / Restart appear only after Start.
- **Do not mark audio as `"ready"` until the MP3 file exists at the listed `audioUrl`.** A `"ready"` asset with a missing file falls through to the "Audio unavailable" fallback — usable, but a quality regression.
- **Do not change the stable coach brain, onboarding, auth gate, workout completion, or DP/streak logic** as part of audio/UX iterations.
