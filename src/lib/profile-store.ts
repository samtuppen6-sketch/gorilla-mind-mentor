import { useSyncExternalStore } from "react";

export type HeatExposureAccess =
  | "none" | "sauna" | "steam_room" | "hot_bath" | "infrared_sauna" | "gym_spa" | "home_sauna";
export type ColdExposureAccess =
  | "none" | "cold_shower" | "cold_plunge" | "sea_swim" | "ice_bath";
export type StrengthTrainingAccess =
  | "none" | "bodyweight_home" | "dumbbells_home" | "full_gym";
export type PilatesMobilityAccess =
  | "none" | "mat_home" | "app_guided" | "class_access" | "reformer_access";

export type UserProfile = {
  name: string;
  identityAnchor: string;
  primaryGoal: string;
  primaryGap: string;
  chronicity: string;
  trainingLevel: string;
  gymAccess: string;
  sleepQuality: string;
  nutritionStatus: string;
  bodyCompGoal: string;
  alcoholFlag: boolean;
  recoveryState: string;
  processAddictionFlag: boolean;
  foodBoundaryActive: boolean;
  protocolDay: number;
  readinessState: string;
  currentStreak: number;
  disciplinePoints: number;
  // Top 21 Protocol access fields — conditional pillar gating.
  heatExposureAccess: HeatExposureAccess;
  coldExposureAccess: ColdExposureAccess;
  strengthTrainingAccess: StrengthTrainingAccess;
  pilatesMobilityAccess: PilatesMobilityAccess;
};

export type JournalEntry = {
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleep: number;
  cravingLevel: number;
  trainingCompleted: boolean;
  nutritionCompleted: boolean;
  morningProtocolCompleted: boolean;
  eveningProtocolCompleted: boolean;
  journalText: string;
  patternFlags: string[];
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "Operator",
  identityAnchor: "Disciplined, calm, present",
  primaryGoal: "Build daily discipline and rebuild mornings",
  primaryGap: "Wasted mornings on phone",
  chronicity: "6+ months",
  trainingLevel: "intermediate",
  gymAccess: "full gym",
  sleepQuality: "inconsistent",
  nutritionStatus: "undereating protein",
  bodyCompGoal: "recomp",
  alcoholFlag: false,
  recoveryState: "none",
  processAddictionFlag: false,
  foodBoundaryActive: false,
  protocolDay: 1,
  readinessState: "moderate",
  currentStreak: 0,
  disciplinePoints: 0,
  heatExposureAccess: "none",
  coldExposureAccess: "none",
  strengthTrainingAccess: "full_gym",
  pilatesMobilityAccess: "mat_home",
};

export const DEFAULT_JOURNAL: JournalEntry = {
  date: "",
  mood: 5,
  energy: 5,
  stress: 5,
  sleep: 6,
  cravingLevel: 2,
  trainingCompleted: false,
  nutritionCompleted: false,
  morningProtocolCompleted: false,
  eveningProtocolCompleted: false,
  journalText: "",
  patternFlags: [],
};

const PROFILE_KEY = "gm.userProfile.v1";
const JOURNAL_KEY = "gm.latestJournal.v1";

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

// Cached snapshots — useSyncExternalStore requires referentially stable
// snapshots between calls when the underlying data hasn't changed.
// Previously getProfile/getJournal returned a fresh object every render,
// which caused React's "Maximum update depth exceeded" infinite loop.
let profileCache: UserProfile = DEFAULT_PROFILE;
let profileCacheRaw: string | null = "__init__";
let journalCache: JournalEntry | null = null;
let journalCacheRaw: string | null = "__init__";

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (raw === profileCacheRaw) return profileCache;
  profileCacheRaw = raw;
  if (!raw) { profileCache = DEFAULT_PROFILE; return profileCache; }
  try { profileCache = { ...DEFAULT_PROFILE, ...JSON.parse(raw) }; }
  catch { profileCache = DEFAULT_PROFILE; }
  return profileCache;
}

export function getJournal(): JournalEntry | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(JOURNAL_KEY);
  if (raw === journalCacheRaw) return journalCache;
  journalCacheRaw = raw;
  if (!raw) { journalCache = null; return null; }
  try { journalCache = { ...DEFAULT_JOURNAL, ...JSON.parse(raw) }; }
  catch { journalCache = null; }
  return journalCache;
}

export function setProfile(p: UserProfile) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(p);
  localStorage.setItem(PROFILE_KEY, serialized);
  profileCache = p;
  profileCacheRaw = serialized;
  emit();
}
export function setJournal(j: JournalEntry | null) {
  if (typeof window === "undefined") return;
  if (j) {
    const serialized = JSON.stringify(j);
    localStorage.setItem(JOURNAL_KEY, serialized);
    journalCache = j;
    journalCacheRaw = serialized;
  } else {
    localStorage.removeItem(JOURNAL_KEY);
    journalCache = null;
    journalCacheRaw = null;
  }
  emit();
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(subscribe, getProfile, () => DEFAULT_PROFILE);
}
export function useJournal(): JournalEntry | null {
  return useSyncExternalStore(subscribe, getJournal, () => null);
}
