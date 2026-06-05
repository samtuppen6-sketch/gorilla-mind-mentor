import { useSyncExternalStore } from "react";

export type HeatExposureAccess =
  | "none" | "sauna" | "steam_room" | "hot_bath" | "infrared_sauna" | "gym_spa" | "home_sauna";
export type ColdExposureAccess =
  | "none" | "cold_shower" | "cold_plunge" | "sea_swim" | "ice_bath";
export type StrengthTrainingAccess =
  | "none" | "bodyweight_home" | "dumbbells_home" | "full_gym";
export type PilatesMobilityAccess =
  | "none" | "mat_home" | "app_guided" | "class_access" | "reformer_access";

// ============================================================================
// Extended Profile (Onboarding + Profile Engine)
// ============================================================================

export type MainGoal =
  | "fat_loss" | "muscle" | "fitness" | "confidence" | "energy"
  | "discipline" | "recovery" | "mental_clarity" | "all_round_reset" | "";

export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "returning" | "";
export type TrainingLocation = "home" | "gym" | "outdoors" | "mixed" | "unknown" | "";
export type Equipment = "none" | "dumbbells" | "bands" | "full_gym" | "cardio_machine" | "unknown" | "";
export type AvailableTimeMin = 10 | 20 | 30 | 45 | 60 | 0;
export type PreferredTraining = "weights" | "running" | "walking" | "pilates_core" | "bodyweight" | "mobility" | "mixed" | "";
export type InjuryFlag = "none" | "back_pain" | "knee_pain" | "shoulder_pain" | "mobility_limited" | "other" | "";

export type NutritionMode = "SIMPLE_STANDARD" | "PRECISION_TRACKING";
export type EatingIssue =
  | "skipping_meals" | "overeating_night" | "sugar_cravings" | "takeaways"
  | "no_protein" | "alcohol" | "no_structure" | "not_sure" | "";
export type NutritionStyle = "simple_rules" | "detailed_tracking" | "not_sure" | "";
export type DietPreference = "normal" | "high_protein" | "vegetarian" | "vegan" | "low_carb" | "no_preference" | "";
export type WantsCaloriesMacros = "yes" | "no" | "later" | "";

export type ControlLevel =
  | "in_control" | "slipping" | "struggling" | "out_of_control"
  | "worried_relapse" | "active_relapse" | "prefer_not_say" | "";
export type SupportStatus =
  | "none" | "friends_family" | "therapist" | "doctor"
  | "recovery_group" | "sponsor_mentor" | "rehab_aftercare" | "other" | "prefer_not_say" | "";
export type NeedsFromCoach =
  | "daily_structure" | "fitness_plan" | "morning_routine" | "urge_support"
  | "relapse_prevention" | "accountability" | "evening_wind_down"
  | "food_structure" | "mindset_identity" | "emergency_reset" | "not_sure";

export type AddictionRiskFlag = "none" | "mild" | "moderate" | "high" | "crisis";
export type CompulsionType =
  | "phone_social" | "alcohol" | "substances" | "gambling"
  | "porn_sexual" | "food_binge" | "sugar_takeaways" | "other";
export type RelapseRisk = "none" | "low" | "moderate" | "high" | "active";
export type SupportTone = "direct" | "gentle" | "balanced" | "";

export type StressLevel = "low" | "moderate" | "high" | "";
export type ConfidenceLevel = "low" | "medium" | "high" | "";
export type BiggestBarrier =
  | "phone" | "discipline" | "food" | "sleep" | "stress"
  | "injury" | "work" | "addiction_compulsion" | "confidence" | "routine" | "other" | "";
export type Sex = "male" | "female" | "other" | "prefer_not_say" | "";

export type UserProfile = {
  // --- legacy / stable coach fields (unchanged) ---
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
  heatExposureAccess: HeatExposureAccess;
  coldExposureAccess: ColdExposureAccess;
  strengthTrainingAccess: StrengthTrainingAccess;
  pilatesMobilityAccess: PilatesMobilityAccess;

  // --- basicProfile ---
  age: number | null;
  sex: Sex;
  heightCm: number | null;
  weightKg: number | null;
  country: string;
  timezone: string;
  preferredWakeTime: string; // HH:MM
  preferredSleepTime: string;

  // --- goals ---
  mainGoal: MainGoal;
  secondaryGoals: string[];
  motivationReason: string;

  // --- fitnessProfile ---
  fitnessLevel: FitnessLevel;
  trainingLocation: TrainingLocation;
  equipment: Equipment;
  availableTimeMin: AvailableTimeMin;
  preferredTraining: PreferredTraining;
  injuryFlag: InjuryFlag;
  injuryNotes: string;

  // --- nutritionProfile ---
  nutritionMode: NutritionMode;
  currentEatingIssue: EatingIssue;
  preferredNutritionStyle: NutritionStyle;
  dietPreference: DietPreference;
  mealsPerDay: 1 | 2 | 3 | 4 | 0;
  allergiesRestrictions: string;
  wantsCaloriesMacros: WantsCaloriesMacros;
  calorieTarget: number | null;
  macroTarget: { protein?: number; carbs?: number; fat?: number } | null;

  // --- currentSituation ---
  currentSituation: string[];
  primaryStruggle: string[];
  controlLevel: ControlLevel;
  supportStatus: SupportStatus;
  needsFromCoach: NeedsFromCoach[];

  // --- recoveryRiskProfile ---
  addictionRiskFlag: AddictionRiskFlag;
  compulsionTypes: CompulsionType[];
  relapseRisk: RelapseRisk;
  preferredSupportTone: SupportTone;
  safetySupportShown: boolean;

  // --- mindsetProfile ---
  stressLevel: StressLevel;
  confidenceLevel: ConfidenceLevel;
  biggestBarrier: BiggestBarrier;

  // --- onboarding meta ---
  onboardingComplete: boolean;
  onboardingCompletedAt: string | null;
  hardestPartOfDay: string;
  preferredTrainingWindow: string;

  // --- identityProfile (account/auth) ---
  identityProfile: IdentityProfile | null;

  // --- notificationProfile (placeholder for future push notifications) ---
  notificationProfile: NotificationProfile;
  reminderPreferences: ReminderPreferences;
};

export type NotificationProfile = {
  pushEnabled: boolean;
  pushToken: string | null;
  devicePlatform: "ios" | "android" | "web" | null;
  notificationPermission: "granted" | "denied" | "default" | "unknown";
};

export type ReminderPreferences = {
  morningProtocol: boolean;
  eveningShutdown: boolean;
  streakProtection: boolean;
  urgeSupport: boolean;
  workoutReminder: boolean;
};

export const DEFAULT_NOTIFICATION_PROFILE: NotificationProfile = {
  pushEnabled: false,
  pushToken: null,
  devicePlatform: null,
  notificationPermission: "unknown",
};

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  morningProtocol: true,
  eveningShutdown: true,
  streakProtection: true,
  urgeSupport: false,
  workoutReminder: true,
};

export type AuthProvider = "google" | "apple" | "email" | "local_placeholder";

export type IdentityProfile = {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  authProvider: AuthProvider;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
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

  age: null,
  sex: "",
  heightCm: null,
  weightKg: null,
  country: "",
  timezone: "",
  preferredWakeTime: "",
  preferredSleepTime: "",

  mainGoal: "",
  secondaryGoals: [],
  motivationReason: "",

  fitnessLevel: "",
  trainingLocation: "",
  equipment: "",
  availableTimeMin: 0,
  preferredTraining: "",
  injuryFlag: "",
  injuryNotes: "",

  nutritionMode: "SIMPLE_STANDARD",
  currentEatingIssue: "",
  preferredNutritionStyle: "",
  dietPreference: "",
  mealsPerDay: 0,
  allergiesRestrictions: "",
  wantsCaloriesMacros: "",
  calorieTarget: null,
  macroTarget: null,

  currentSituation: [],
  primaryStruggle: [],
  controlLevel: "",
  supportStatus: "",
  needsFromCoach: [],

  addictionRiskFlag: "none",
  compulsionTypes: [],
  relapseRisk: "none",
  preferredSupportTone: "",
  safetySupportShown: false,

  stressLevel: "",
  confidenceLevel: "",
  biggestBarrier: "",

  onboardingComplete: false,
  onboardingCompletedAt: null,
  hardestPartOfDay: "",
  preferredTrainingWindow: "",
  identityProfile: null,
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

// ============================================================================
// Derivation helpers
// ============================================================================

export function deriveNutritionMode(p: Partial<UserProfile>): NutritionMode {
  if (p.preferredNutritionStyle === "detailed_tracking") return "PRECISION_TRACKING";
  if (p.wantsCaloriesMacros === "yes") return "PRECISION_TRACKING";
  return "SIMPLE_STANDARD";
}

export function deriveRelapseRisk(p: Partial<UserProfile>): { relapseRisk: RelapseRisk; addictionRiskFlag: AddictionRiskFlag } {
  const cl = p.controlLevel ?? "";
  const struggles = p.primaryStruggle ?? [];
  const heavy = struggles.some((s) =>
    /alcohol|substance|drug|gambl|porn|binge/i.test(s),
  );

  if (cl === "active_relapse") return { relapseRisk: "active", addictionRiskFlag: "high" };
  if (cl === "worried_relapse") return { relapseRisk: "high", addictionRiskFlag: "high" };
  if (cl === "out_of_control") return { relapseRisk: heavy ? "high" : "moderate", addictionRiskFlag: heavy ? "high" : "moderate" };
  if (cl === "struggling") return { relapseRisk: heavy ? "moderate" : "low", addictionRiskFlag: heavy ? "moderate" : "mild" };
  if (cl === "slipping") return { relapseRisk: heavy ? "moderate" : "low", addictionRiskFlag: heavy ? "mild" : "mild" };
  return { relapseRisk: "none", addictionRiskFlag: heavy ? "mild" : "none" };
}

const REQUIRED_PROFILE_FIELDS: (keyof UserProfile)[] = [
  "mainGoal", "fitnessLevel", "trainingLocation", "availableTimeMin",
  "preferredTraining", "injuryFlag", "currentEatingIssue", "preferredNutritionStyle",
  "wantsCaloriesMacros", "preferredWakeTime", "preferredSleepTime",
  "controlLevel", "supportStatus", "preferredSupportTone",
];

export function computeProfileCompleteness(p: Partial<UserProfile>): { score: number; missingFields: string[] } {
  const missing: string[] = [];
  for (const k of REQUIRED_PROFILE_FIELDS) {
    const v = (p as any)[k];
    const empty = v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0) || v === 0;
    if (empty) missing.push(String(k));
  }
  const total = REQUIRED_PROFILE_FIELDS.length;
  const score = Math.round(((total - missing.length) / total) * 100);
  return { score, missingFields: missing };
}
