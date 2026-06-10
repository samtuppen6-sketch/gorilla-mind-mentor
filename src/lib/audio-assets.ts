// Central registry for guided-audio MP3 assets.
//
// Quality-controlled fixed audio for the Practice Player. No live AI voice
// generation. No autoplay. Real MP3 files are dropped under /public/audio/
// later; until then assets stay marked "placeholder" and the player shows a
// non-dead-end placeholder block while visual/timed guidance still works.

export type AudioCategory =
  | "breathwork"
  | "meditation"
  | "sleep"
  | "morning_protocol"
  | "recovery"
  | "urge_reset"
  | "grounding"
  | "identity"
  | "workout_support";

export type AudioAssetStatus = "placeholder" | "ready";

export type AudioAsset = {
  id: string;
  title: string;
  category: AudioCategory;
  durationMinutes: number;
  audioUrl: string;
  transcriptUrl?: string;
  description: string;
  safetyNote?: string;
  voiceStyle: string;
  status: AudioAssetStatus;
  linkedPracticeIds: string[];
};

import boxBreathingAsset from "@/assets/box-breathing.mp3.asset.json";
import extendedExhaleAsset from "@/assets/extended-exhale.mp3.asset.json";
import urgeResetAsset from "@/assets/urge-reset.mp3.asset.json";
import energisingBreathAsset from "@/assets/energising-breath.mp3.asset.json";
import identityResetBreathAsset from "@/assets/identity-reset-breath.mp3.asset.json";
import recoveryBreathAsset from "@/assets/recovery-breath.mp3.asset.json";

export const AUDIO_ASSETS: AudioAsset[] = [
  {
    id: "box_breathing_5min_audio",
    title: "Box Breathing — 6 Minutes",
    category: "breathwork",
    durationMinutes: 6,
    audioUrl: boxBreathingAsset.url,
    description:
      "Controlled 4-4-4-4 box breathing. 16 rounds. Morning activation before phone or caffeine.",
    voiceStyle: "calm, controlled, masculine",
    status: "ready",
    linkedPracticeIds: ["box_breathing_5min"],
  },
  {
    id: "extended_exhale_3min_audio",
    title: "Extended Exhale — 4 Minutes",
    category: "breathwork",
    durationMinutes: 4,
    audioUrl: extendedExhaleAsset.url,
    description:
      "Nasal inhale 4, slow exhale 6. 15 rounds. Downshift the nervous system before sleep.",
    voiceStyle: "calm, controlled, masculine",
    status: "ready",
    linkedPracticeIds: ["extended_exhale_3min"],
  },
  {
    id: "energising_breath_3min_audio",
    title: "Energising Breath — 4 Minutes",
    category: "breathwork",
    durationMinutes: 4,
    audioUrl: energisingBreathAsset.url,
    description:
      "Sharp nasal inhale 3, controlled exhale 3. 20 rounds. Wake the system up and turn energy into action.",
    voiceStyle: "calm, controlled, masculine",
    status: "ready",
    linkedPracticeIds: ["energising_breath_3min"],
  },
  {
    id: "identity_reset_breath_5min_audio",
    title: "Identity Reset Breath — 5 Minutes",
    category: "breathwork",
    durationMinutes: 5,
    audioUrl: identityResetBreathAsset.url,
    description:
      "Nasal inhale 4, hold 2, slow exhale 6. 12 rounds. Stops the shame loop and re-anchors the standard.",
    voiceStyle: "calm, controlled, masculine",
    status: "ready",
    linkedPracticeIds: ["identity_reset_breath_5min"],
  },
  {
    id: "morning_protocol_lock_in_audio",
    title: "Morning Protocol Lock-In",
    category: "morning_protocol",
    durationMinutes: 30,
    audioUrl: "/audio/morning-protocol-lock-in.mp3",
    description:
      "Full morning lock-in: water, daylight, breath, identity, movement, protein, one journal line.",
    voiceStyle: "calm, controlled, masculine",
    status: "placeholder",
    linkedPracticeIds: ["morning_protocol_lock_in"],
  },
  {
    id: "sleep_downshift_5min_audio",
    title: "Sleep Downshift — 5 Minutes",
    category: "sleep",
    durationMinutes: 5,
    audioUrl: "/audio/sleep-downshift-5min.mp3",
    description:
      "Lights low, phone down. Slow nasal breathing to prepare the system for sleep.",
    voiceStyle: "calm, controlled, masculine",
    status: "placeholder",
    linkedPracticeIds: ["breathwork_wind_down_5min"],
  },
  {
    id: "urge_reset_3min_audio",
    title: "Urge Reset Breath — 5 Minutes",
    category: "urge_reset",
    durationMinutes: 5,
    audioUrl: urgeResetAsset.url,
    description:
      "Nasal inhale 4, long mouth exhale 8. 12 rounds. Break the urge loop and create space before action.",
    safetyNote:
      "If urges involve self-harm or suicidal ideation: stop and contact a crisis line or emergency services immediately.",
    voiceStyle: "calm, controlled, masculine",
    status: "ready",
    linkedPracticeIds: ["urge_reset_3min"],
  },
  {
    id: "urge_reset_10min_audio",
    title: "Urge Reset — 10 Minutes",
    category: "urge_reset",
    durationMinutes: 10,
    audioUrl: "/audio/urge-reset-10min.mp3",
    description:
      "Ride the urge without acting on it. Watch it rise, peak, and fall.",
    safetyNote:
      "This is not emergency support. If you are in immediate danger, contact emergency services or a trusted support person now.",
    voiceStyle: "calm, controlled, masculine",
    status: "placeholder",
    linkedPracticeIds: ["urge_reset_10min", "meditation_urge_surfing_5min"],
  },
  {
    id: "relapse_repair_7min_audio",
    title: "Relapse Repair — 7 Minutes",
    category: "recovery",
    durationMinutes: 7,
    audioUrl: "/audio/relapse-repair-7min.mp3",
    description:
      "Repair after a slip. No shame, no spin. Operator log, identity, next action.",
    safetyNote:
      "This is a support practice, not medical or crisis care.",
    voiceStyle: "calm, controlled, masculine",
    status: "placeholder",
    linkedPracticeIds: ["relapse_repair_7min"],
  },
  {
    id: "grounding_reset_5min_audio",
    title: "Grounding Reset — 5 Minutes",
    category: "grounding",
    durationMinutes: 5,
    audioUrl: "/audio/grounding-reset-5min.mp3",
    description:
      "5-4-3 sensory grounding back into the body when stressed or activated.",
    voiceStyle: "calm, controlled, masculine",
    status: "placeholder",
    linkedPracticeIds: ["meditation_grounding_5min"],
  },
];

export function getAudioAssetById(id: string): AudioAsset | undefined {
  return AUDIO_ASSETS.find((a) => a.id === id);
}

export function getAudioAssetForPractice(
  practiceId: string,
): AudioAsset | undefined {
  return AUDIO_ASSETS.find((a) => a.linkedPracticeIds.includes(practiceId));
}
