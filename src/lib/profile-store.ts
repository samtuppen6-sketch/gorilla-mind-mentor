import { useSyncExternalStore } from "react";

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

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function getProfile(): UserProfile { return read(PROFILE_KEY, DEFAULT_PROFILE); }
export function getJournal(): JournalEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return null;
    return { ...DEFAULT_JOURNAL, ...JSON.parse(raw) };
  } catch { return null; }
}

export function setProfile(p: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  emit();
}
export function setJournal(j: JournalEntry | null) {
  if (typeof window === "undefined") return;
  if (j) localStorage.setItem(JOURNAL_KEY, JSON.stringify(j));
  else localStorage.removeItem(JOURNAL_KEY);
  emit();
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(subscribe, getProfile, () => DEFAULT_PROFILE);
}
export function useJournal(): JournalEntry | null {
  return useSyncExternalStore(subscribe, getJournal, () => null);
}
