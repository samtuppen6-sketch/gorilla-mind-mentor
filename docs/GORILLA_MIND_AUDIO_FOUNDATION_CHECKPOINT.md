# Gorilla Mind — Guided Audio Foundation Checkpoint

## Purpose

The app now has a central MP3 audio asset system so guided practices can use
fixed, quality-controlled audio instead of live-generated voice or dead-end
placeholders. All guided audio is reviewed, fixed MP3 content — no live AI
voice generation for core practices.

## Files created/changed

- `src/lib/audio-assets.ts` — central audio registry
- `src/components/GuidedAudioPlayer.tsx` — reusable audio player
- `src/lib/practices.ts` — added `audioAssetId` field on `GuidedPractice`
- `src/routes/practice.$practiceId.tsx` — wires player + safety notes into the practice route

## Audio registry (8 placeholder assets)

All assets currently ship with `status: "placeholder"` until real MP3s are
uploaded under `/public/audio/`.

1. `box_breathing_5min_audio` — Box Breathing — 5 Minutes (breathwork)
2. `extended_exhale_3min_audio` — Extended Exhale — 3 Minutes (breathwork)
3. `morning_identity_reset_5min_audio` — Morning Identity Reset — 5 Minutes (identity)
4. `morning_protocol_lock_in_audio` — Morning Protocol Lock-In (morning_protocol)
5. `sleep_downshift_5min_audio` — Sleep Downshift — 5 Minutes (sleep)
6. `urge_reset_10min_audio` — Urge Reset — 10 Minutes (urge_reset, safety note)
7. `relapse_repair_7min_audio` — Relapse Repair — 7 Minutes (recovery, safety note)
8. `grounding_reset_5min_audio` — Grounding Reset — 5 Minutes (grounding)

## Practice links (audioAssetId)

| Practice ID | Audio Asset ID |
|---|---|
| `box_breathing_5min` | `box_breathing_5min_audio` |
| `extended_exhale_3min` | `extended_exhale_3min_audio` |
| `morning_identity_reset_5min` | `morning_identity_reset_5min_audio` |
| `morning_protocol_lock_in` | `morning_protocol_lock_in_audio` |
| `breathwork_wind_down_5min` | `sleep_downshift_5min_audio` |
| `meditation_urge_surfing_5min` | `urge_reset_10min_audio` |
| `journal_checkin_3min` | `relapse_repair_7min_audio` |
| `meditation_grounding_5min` | `grounding_reset_5min_audio` |

## Player behaviour

- No autoplay — audio only starts on explicit user tap.
- Play / pause toggle.
- Progress bar with elapsed / total duration.
- Restart returns to 0:00.
- Unmount / navigation stops audio and resets `currentTime`.
- Error fallback: if the MP3 fails to load, shows "Audio unavailable. Continue with visual guidance."
- Transcript support is optional via `transcriptUrl` (renders a "View transcript" link when present).
- Practice completion works whether or not the audio is played.
- Placeholder state replaces the old dead-end "Audio coming soon" block with a non-blocking placeholder message; on-screen steps remain usable.

## Safety

Safety notes render above the player for urge / recovery practices:

- `urge_reset_10min_audio` — "This is not emergency support…"
- `relapse_repair_7min_audio` — "This is a support practice, not medical or crisis care."

## Tests passed

- Box Breathing — player renders, no autoplay, completion still awards DP.
- Extended Exhale — player renders, restart works.
- Urge Reset — safety note renders above the player.
- Missing/broken audio — error fallback message shown, practice still completable.
- No autoplay confirmed across all linked practices.
- Build green (`tsc --noEmit`).

## Remaining TODOs

- Add real MP3 files under `/public/audio/` matching each `audioUrl`.
- Add transcripts (`transcriptUrl`) for accessibility.
- Flip asset `status` to `"ready"` once MP3s are uploaded and reviewed.
- Later: add workout-support audio (warm-up cues, finisher pacing) if needed.

## Warning

Do **not** connect live AI-generated voice for these core practices.
Use fixed, reviewed MP3s for consistency, safety and quality control.
Breathwork, urge reset, and relapse repair especially require known,
vetted scripts — never improvised generation.
