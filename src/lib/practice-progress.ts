// Central guided-practice completion system for Gorilla Mind.
//
// One shared logger (`completePracticeSession`) is used by every guided
// practice route so completion, daily progress, discipline points and
// streaks stay in sync. The AI Coach reads `DailyProgress` so it does
// not re-recommend an action the user already completed today.

import {
  getProfile,
  setProfile,
  DEFAULT_PROFILE,
  type UserProfile,
} from "@/lib/profile-store";
import type { GuidedPractice } from "@/lib/practices";

// ---------- Storage keys ----------
export const PRACTICE_LOG_KEY = "gm.practiceLog.v1";
export const DAILY_PROGRESS_KEY = "gm.dailyProgress.v1";

// ---------- Types ----------
export type PracticeSource = "coach" | "library" | "protocol";

export type DailyActionKey =
  | "breathworkCompleted"
  | "meditationCompleted"
  | "mindfulnessCompleted"
  | "trainingCompleted"
  | "pilatesCompleted"
  | "mobilityCompleted"
  | "nutritionCompleted"
  | "coldExposureCompleted"
  | "heatExposureCompleted"
  | "journalCompleted"
  | "guidedPracticeCompleted";

export type PracticeLogEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  practiceId: string;
  practiceTitle: string;
  category: string;
  subRoute: string | null;
  source: PracticeSource;
  durationMinutes: number;
  completed: true;
  disciplinePointsAwarded: number;
  linkedCoachRoute: string | null;
  profileDay: number;
  primaryGap: string;
  safetyFlags: string[];
};

export type DailyProgress = {
  date: string;
  breathworkCompleted: boolean;
  meditationCompleted: boolean;
  mindfulnessCompleted: boolean;
  trainingCompleted: boolean;
  pilatesCompleted: boolean;
  mobilityCompleted: boolean;
  nutritionCompleted: boolean;
  coldExposureCompleted: boolean;
  heatExposureCompleted: boolean;
  journalCompleted: boolean;
  guidedPracticeCompleted: boolean;
  completedPracticeIdsToday: string[];
  disciplinePointsToday: number;
  dailyMinimumMet: boolean;
  fullProtocolCompleted: boolean;
};

export type CompletionResult = {
  saved: boolean;
  duplicate: boolean;
  pointsAwarded: number;
  dailyActionUpdated: DailyActionKey | null;
  dailyProgress: DailyProgress;
  logEntry: PracticeLogEntry;
  practiceStreakUpdated: boolean;
  protocolStreakUpdated: boolean;
  keysWritten: string[];
};

// ---------- Helpers ----------
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyProgress(date: string): DailyProgress {
  return {
    date,
    breathworkCompleted: false,
    meditationCompleted: false,
    mindfulnessCompleted: false,
    trainingCompleted: false,
    pilatesCompleted: false,
    mobilityCompleted: false,
    nutritionCompleted: false,
    coldExposureCompleted: false,
    heatExposureCompleted: false,
    journalCompleted: false,
    guidedPracticeCompleted: false,
    completedPracticeIdsToday: [],
    disciplinePointsToday: 0,
    dailyMinimumMet: false,
    fullProtocolCompleted: false,
  };
}

export function loadDailyProgress(): DailyProgress {
  if (typeof window === "undefined") return emptyProgress(today());
  const raw = localStorage.getItem(DAILY_PROGRESS_KEY);
  const t = today();
  if (!raw) return emptyProgress(t);
  try {
    const parsed = JSON.parse(raw) as DailyProgress;
    if (parsed.date !== t) return emptyProgress(t); // new day, reset
    return { ...emptyProgress(t), ...parsed };
  } catch {
    return emptyProgress(t);
  }
}

export function loadPracticeLog(): PracticeLogEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PRACTICE_LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PracticeLogEntry[];
  } catch {
    return [];
  }
}

// ---------- DP scoring ----------
function awardPoints(practice: GuidedPractice): number {
  const cat = practice.category;
  if (cat === "Breathwork") return 30;
  if (cat === "Mobility") return 20;
  if (cat === "Cold Exposure") return 30;
  if (cat === "Meditation") {
    if (practice.durationMinutes >= 15) return 60;
    if (practice.durationMinutes >= 10) return 40;
    return 25;
  }
  return 20;
}

// ---------- Category -> daily-action key ----------
function categoryToDailyAction(practice: GuidedPractice): DailyActionKey | null {
  switch (practice.category) {
    case "Breathwork":
      return "breathworkCompleted";
    case "Meditation":
      return "meditationCompleted";
    case "Mobility":
      return "mobilityCompleted";
    case "Cold Exposure":
      return "coldExposureCompleted";
    default:
      return null;
  }
}

// Some meditation practices also count as mindfulness.
function alsoMindfulness(practice: GuidedPractice): boolean {
  return practice.category === "Meditation";
}

// ---------- Daily minimum / full protocol ----------
function recomputeFlags(p: DailyProgress): DailyProgress {
  const meaningful = [
    p.breathworkCompleted,
    p.meditationCompleted || p.mindfulnessCompleted,
    p.trainingCompleted || p.mobilityCompleted || p.pilatesCompleted,
    p.nutritionCompleted,
    p.journalCompleted,
    p.coldExposureCompleted,
    p.heatExposureCompleted,
  ].filter(Boolean).length;
  const dailyMinimumMet = meaningful >= 3;
  const fullProtocolCompleted =
    p.breathworkCompleted &&
    (p.meditationCompleted || p.mindfulnessCompleted) &&
    (p.trainingCompleted || p.mobilityCompleted || p.pilatesCompleted) &&
    p.nutritionCompleted &&
    p.journalCompleted;
  return { ...p, dailyMinimumMet, fullProtocolCompleted };
}

// ---------- Streak update ----------
function updateProfileForCompletion(
  practice: GuidedPractice,
  pointsAwarded: number,
  progress: DailyProgress,
): { practiceStreakUpdated: boolean; protocolStreakUpdated: boolean } {
  const current = getProfile();
  // Pull optional fields (may not exist on older saves).
  const extra = current as UserProfile & {
    practiceStreak?: number;
    lastPracticeCompletedDate?: string;
    lastProtocolCompletedDate?: string;
    lastCompletedPracticeId?: string;
    lastCompletedPracticeCategory?: string;
    latestCompletedActionsToday?: string[];
  };

  const t = today();
  let practiceStreakUpdated = false;
  let protocolStreakUpdated = false;

  let practiceStreak = extra.practiceStreak ?? 0;
  if (extra.lastPracticeCompletedDate !== t) {
    // First practice of the day — bump or reset based on yesterday.
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    practiceStreak = extra.lastPracticeCompletedDate === yesterday ? practiceStreak + 1 : 1;
    practiceStreakUpdated = true;
  }

  let currentStreak = current.currentStreak;
  if (progress.dailyMinimumMet && extra.lastProtocolCompletedDate !== t) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    currentStreak = extra.lastProtocolCompletedDate === yesterday ? currentStreak + 1 : 1;
    protocolStreakUpdated = true;
  }

  const next: UserProfile & Record<string, unknown> = {
    ...current,
    disciplinePoints: current.disciplinePoints + pointsAwarded,
    currentStreak,
    practiceStreak,
    lastPracticeCompletedDate: t,
    lastProtocolCompletedDate: progress.dailyMinimumMet ? t : extra.lastProtocolCompletedDate ?? null,
    lastCompletedPracticeId: practice.id,
    lastCompletedPracticeCategory: practice.category,
    latestCompletedActionsToday: progress.completedPracticeIdsToday,
  };
  setProfile(next as UserProfile);
  return { practiceStreakUpdated, protocolStreakUpdated };
}

// ---------- Main entry ----------
export function completePracticeSession(args: {
  practice: GuidedPractice;
  source: PracticeSource;
  linkedCoachRoute?: string | null;
}): CompletionResult {
  const { practice, source, linkedCoachRoute = null } = args;
  const t = today();
  const profile = getProfile() ?? DEFAULT_PROFILE;

  // Build safety flags snapshot from profile.
  const safetyFlags: string[] = [];
  if (profile.alcoholFlag) safetyFlags.push("alcoholFlag");
  if (profile.processAddictionFlag) safetyFlags.push("processAddictionFlag");
  if (profile.foodBoundaryActive) safetyFlags.push("foodBoundaryActive");
  if (profile.recoveryState && profile.recoveryState !== "none") {
    safetyFlags.push(`recoveryState:${profile.recoveryState}`);
  }

  // Load existing progress + log.
  let progress = loadDailyProgress();
  const log = loadPracticeLog();

  // Duplicate detection: same practiceId already completed today.
  const duplicate = progress.completedPracticeIdsToday.includes(practice.id);
  const pointsAwarded = duplicate ? 0 : awardPoints(practice);

  // Apply daily-action flags.
  const actionKey = categoryToDailyAction(practice);
  if (actionKey) progress = { ...progress, [actionKey]: true };
  if (alsoMindfulness(practice)) progress = { ...progress, mindfulnessCompleted: true };
  progress = {
    ...progress,
    guidedPracticeCompleted: true,
    completedPracticeIdsToday: duplicate
      ? progress.completedPracticeIdsToday
      : [...progress.completedPracticeIdsToday, practice.id],
    disciplinePointsToday: progress.disciplinePointsToday + pointsAwarded,
  };
  progress = recomputeFlags(progress);

  // Build log entry.
  const entry: PracticeLogEntry = {
    id: `${practice.id}-${Date.now()}`,
    date: t,
    timestamp: new Date().toISOString(),
    practiceId: practice.id,
    practiceTitle: practice.title,
    category: practice.category,
    subRoute: practice.subRoute ?? null,
    source,
    durationMinutes: practice.durationMinutes,
    completed: true,
    disciplinePointsAwarded: pointsAwarded,
    linkedCoachRoute,
    profileDay: profile.protocolDay,
    primaryGap: profile.primaryGap,
    safetyFlags,
  };

  const keysWritten: string[] = [];
  if (typeof window !== "undefined") {
    localStorage.setItem(PRACTICE_LOG_KEY, JSON.stringify([...log, entry]));
    keysWritten.push(PRACTICE_LOG_KEY);
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
    keysWritten.push(DAILY_PROGRESS_KEY);
  }

  const streak = updateProfileForCompletion(practice, pointsAwarded, progress);
  keysWritten.push("gm.userProfile.v1");

  return {
    saved: true,
    duplicate,
    pointsAwarded,
    dailyActionUpdated: actionKey,
    dailyProgress: progress,
    logEntry: entry,
    practiceStreakUpdated: streak.practiceStreakUpdated,
    protocolStreakUpdated: streak.protocolStreakUpdated,
    keysWritten,
  };
}

// Human-readable label for the updated daily action.
export function dailyActionLabel(k: DailyActionKey | null): string {
  if (!k) return "—";
  const map: Record<DailyActionKey, string> = {
    breathworkCompleted: "Breathwork completed",
    meditationCompleted: "Meditation completed",
    mindfulnessCompleted: "Mindfulness completed",
    trainingCompleted: "Training completed",
    pilatesCompleted: "Pilates completed",
    mobilityCompleted: "Mobility completed",
    nutritionCompleted: "Nutrition completed",
    coldExposureCompleted: "Cold exposure completed",
    heatExposureCompleted: "Heat exposure completed",
    journalCompleted: "Journal completed",
    guidedPracticeCompleted: "Guided practice completed",
  };
  return map[k];
}
