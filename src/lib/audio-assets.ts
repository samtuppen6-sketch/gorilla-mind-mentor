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
    title: "Extended Exhale — 3 Minutes",
    category: "breathwork",
    durationMinutes: 3,
    audioUrl: "/audio/extended-exhale-3min.mp3",
    description:
      "Nasal inhale 4, slow exhale 6–8. Downshift the nervous system before sleep.",
    voiceStyle: "calm, controlled, masculine",
    status: "placeholder",
    linkedPracticeIds: ["extended_exhale_3min"],
  },
  {
    id: "morning_identity_reset_5min_audio",
    title: "Morning Identity Reset — 5 Minutes",
    category: "identity",
    durationMinutes: 5,
    audioUrl: "/audio/morning-identity-reset-5min.mp3",
    description:
      "Phone down. Re-anchor the operator. Identity first, then today's one non-negotiable.",
    voiceStyle: "calm, controlled, masculine",
    status: "placeholder",
    linkedPracticeIds: ["morning_identity_reset_5min"],
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
