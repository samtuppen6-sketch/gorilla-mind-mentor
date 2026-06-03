// Gorilla Mind — Top 21 Protocol Pillar Registry
//
// Single source of truth for the 21 pillars of the Gorilla Mind protocol.
// The Practice Registry (guided practices) feeds INTO this — pillar
// completion is derived from the daily-action keys flipped by
// completePracticeSession() plus any direct pillar marks.
//
// Conditional pillars (heat / cold / strength) require access on the user
// profile. If access is missing, the pillar is "Not assigned" and is
// excluded from daily-minimum, DP penalties and Coach recommendations.

import type { DailyProgress } from "@/lib/practice-progress";
import type { UserProfile } from "@/lib/profile-store";

export type PillarFrequency =
  | "daily"
  | "weekly"
  | "session_based"
  | "weekly_or_session_based"
  | "daily_or_session_based"
  | "principle";

export type PillarCategory =
  | "foundation"
  | "mindset"
  | "nutrition"
  | "regulation"
  | "exposure"
  | "training"
  | "protocol"
  | "movement"
  | "discipline"
  | "recovery"
  | "identity";

export type AccessField =
  | "heatExposureAccess"
  | "coldExposureAccess"
  | "strengthTrainingAccess"
  | "pilatesMobilityAccess";

export type ProtocolPillar = {
  pillarId: string;
  title: string;
  category: PillarCategory;
  description: string;
  frequency: PillarFrequency;
  trackable: boolean;
  dailyActionKey: string;
  defaultDisciplinePoints: number;
  countsTowardDailyMinimum: boolean;
  countsTowardProtocolStreak: boolean;
  highPriority: boolean;
  conditional: boolean;
  requiredAccessField?: AccessField;
  acceptedAccessValues?: string[];
  noAccessStateLabel?: string;
  linkedPracticeIds: string[];
  coachRoutingTags: string[];
  safetyNotes: string[];
  displayOrder: number;
};

// ---------------------------------------------------------------------------
// Registry — 21 pillars
// ---------------------------------------------------------------------------

export const PROTOCOL_PILLAR_REGISTRY: ProtocolPillar[] = [
  {
    pillarId: "sleep",
    title: "Sleep",
    category: "foundation",
    description: "7–9h of consistent, high-quality sleep is the foundation of every other pillar.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "sleepCompleted",
    defaultDisciplinePoints: 40,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: ["breathwork_wind_down_5min"],
    coachRoutingTags: ["SLEEP_WIND_DOWN"],
    safetyNotes: ["Persistent insomnia may need clinical support."],
    displayOrder: 1,
  },
  {
    pillarId: "identity",
    title: "Identity",
    category: "mindset",
    description: "Operate from a chosen identity anchor — not mood, not impulse.",
    frequency: "principle",
    trackable: true,
    dailyActionKey: "identityCompleted",
    defaultDisciplinePoints: 20,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: ["meditation_morning_identity_5min", "journal_checkin_3min"],
    coachRoutingTags: ["IDENTITY_MINDSET", "MISSED_DAY_REPAIR"],
    safetyNotes: [],
    displayOrder: 2,
  },
  {
    pillarId: "protein",
    title: "Protein",
    category: "nutrition",
    description: "Hit a protein floor every day. Anchor each meal on real protein.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "proteinCompleted",
    defaultDisciplinePoints: 25,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: ["nutrition_next_meal"],
    coachRoutingTags: ["NUTRITION_MEAL"],
    safetyNotes: ["If under clinical care for disordered eating, follow your clinician."],
    displayOrder: 3,
  },
  {
    pillarId: "breathwork",
    title: "Breathwork",
    category: "regulation",
    description: "Daily nervous-system regulation. May support a calmer baseline.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "breathworkCompleted",
    defaultDisciplinePoints: 30,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: [
      "breathwork_downregulate_3min",
      "breathwork_focus_4min",
      "breathwork_wind_down_5min",
    ],
    coachRoutingTags: ["BREATHWORK"],
    safetyNotes: ["No breath holds in water. No intense breathwork while driving."],
    displayOrder: 4,
  },
  {
    pillarId: "cold_exposure",
    title: "Cold Exposure",
    category: "exposure",
    description: "Brief cold exposure is associated with sharper alertness and recovery support.",
    frequency: "daily_or_session_based",
    trackable: true,
    dailyActionKey: "coldExposureCompleted",
    defaultDisciplinePoints: 30,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: true,
    requiredAccessField: "coldExposureAccess",
    acceptedAccessValues: ["cold_shower", "cold_plunge", "sea_swim", "ice_bath", "other"],
    noAccessStateLabel: "Not assigned — no cold exposure access",
    linkedPracticeIds: ["cold_exposure_preframe_3min"],
    coachRoutingTags: ["COLD_EXPOSURE"],
    safetyNotes: [
      "Skip if pregnant, cardiac condition, seizure history, or recent medical event without clinician sign-off.",
      "No breath holds in water.",
    ],
    displayOrder: 5,
  },
  {
    pillarId: "heat_exposure",
    title: "Heat Exposure",
    category: "exposure",
    description: "Sauna or heat exposure is used in Gorilla Mind as a recovery tool when access exists.",
    frequency: "weekly_or_session_based",
    trackable: true,
    dailyActionKey: "heatExposureCompleted",
    defaultDisciplinePoints: 25,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: true,
    requiredAccessField: "heatExposureAccess",
    acceptedAccessValues: ["sauna", "steam_room", "hot_bath", "infrared_sauna", "gym_spa", "other"],
    noAccessStateLabel: "Not assigned — no heat exposure access",
    linkedPracticeIds: [],
    coachRoutingTags: ["HEAT_EXPOSURE"],
    safetyNotes: [
      "Hydrate. Exit if dizzy, faint, or unwell.",
      "Skip if pregnant, cardiac condition, or medical contraindication without clinician sign-off.",
    ],
    displayOrder: 6,
  },
  {
    pillarId: "strength_training",
    title: "Strength Training",
    category: "training",
    description: "Progressive strength work scaled to access and readiness.",
    frequency: "weekly_or_session_based",
    trackable: true,
    dailyActionKey: "trainingCompleted",
    defaultDisciplinePoints: 50,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: true,
    requiredAccessField: "strengthTrainingAccess",
    acceptedAccessValues: ["bodyweight_only", "home_gym", "full_gym"],
    noAccessStateLabel: "Not assigned — no training access",
    linkedPracticeIds: [],
    coachRoutingTags: ["TRAINING"],
    safetyNotes: ["Stop short of unsafe pain. Scale to access."],
    displayOrder: 7,
  },
  {
    pillarId: "hydration",
    title: "Hydration",
    category: "foundation",
    description: "Hit a daily water floor. Water, not liquid calories.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "hydrationCompleted",
    defaultDisciplinePoints: 20,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: [],
    coachRoutingTags: [],
    safetyNotes: [],
    displayOrder: 8,
  },
  {
    pillarId: "morning_protocol",
    title: "Morning Protocol",
    category: "protocol",
    description: "Phone down, hydrate, breath, light, identity anchor. Win the first hour.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "morningProtocolCompleted",
    defaultDisciplinePoints: 50,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: ["meditation_morning_identity_5min", "breathwork_focus_4min"],
    coachRoutingTags: ["MISSED_MORNING"],
    safetyNotes: [],
    displayOrder: 9,
  },
  {
    pillarId: "pma",
    title: "Positive Mental Attitude",
    category: "mindset",
    description: "Choose the operator stance. PMA is a trained default, not a feeling.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "pmaCompleted",
    defaultDisciplinePoints: 20,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: ["meditation_grounding_5min"],
    coachRoutingTags: ["IDENTITY_MINDSET"],
    safetyNotes: [],
    displayOrder: 10,
  },
  {
    pillarId: "morning_walk",
    title: "Morning Walk",
    category: "movement",
    description: "Morning light and movement can help create the conditions for stable energy.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "morningWalkCompleted",
    defaultDisciplinePoints: 25,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: [],
    coachRoutingTags: ["MOBILITY"],
    safetyNotes: [],
    displayOrder: 11,
  },
  {
    pillarId: "journaling",
    title: "Journaling",
    category: "mindset",
    description: "Operator log. Honest, short, no spin.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "journalCompleted",
    defaultDisciplinePoints: 20,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: ["journal_checkin_3min"],
    coachRoutingTags: ["EVENING_REVIEW", "MISSED_DAY_REPAIR"],
    safetyNotes: [],
    displayOrder: 12,
  },
  {
    pillarId: "cardiac_coherence",
    title: "Cardiac Coherence",
    category: "regulation",
    description: "Slow, paced breathing is associated with improved HRV markers in some studies.",
    frequency: "daily_or_session_based",
    trackable: true,
    dailyActionKey: "cardiacCoherenceCompleted",
    defaultDisciplinePoints: 25,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: ["breathwork_downregulate_3min"],
    coachRoutingTags: ["BREATHWORK"],
    safetyNotes: [],
    displayOrder: 13,
  },
  {
    pillarId: "digital_discipline",
    title: "Digital Discipline",
    category: "discipline",
    description: "Phone is a tool, not a leash. Boundaries on inputs, scrolling, and notifications.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "digitalDisciplineCompleted",
    defaultDisciplinePoints: 25,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: ["meditation_urge_surfing_5min"],
    coachRoutingTags: ["PROCESS_ADDICTION"],
    safetyNotes: [],
    displayOrder: 14,
  },
  {
    pillarId: "nutrition_hierarchy",
    title: "Nutrition Hierarchy",
    category: "nutrition",
    description: "Protein → real-food carbs → hydration → fats → discretionary. In that order.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "nutritionCompleted",
    defaultDisciplinePoints: 30,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: ["nutrition_next_meal"],
    coachRoutingTags: ["NUTRITION_MEAL"],
    safetyNotes: ["If under clinical care for disordered eating, follow your clinician."],
    displayOrder: 15,
  },
  {
    pillarId: "recovery",
    title: "Recovery",
    category: "recovery",
    description: "Active recovery: mobility, walking, low-intensity breathing.",
    frequency: "daily_or_session_based",
    trackable: true,
    dailyActionKey: "recoveryCompleted",
    defaultDisciplinePoints: 25,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: ["mobility_recovery_10min"],
    coachRoutingTags: ["RECOVERY_DAY", "MOBILITY", "PILATES"],
    safetyNotes: ["Skip movements that hit sharp pain."],
    displayOrder: 16,
  },
  {
    pillarId: "visualisation",
    title: "Visualisation",
    category: "mindset",
    description: "Pre-rehearse the operator move. Specific, short, sensory.",
    frequency: "session_based",
    trackable: true,
    dailyActionKey: "visualisationCompleted",
    defaultDisciplinePoints: 20,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: [],
    coachRoutingTags: ["IDENTITY_MINDSET"],
    safetyNotes: [],
    displayOrder: 17,
  },
  {
    pillarId: "evening_protocol",
    title: "Evening Protocol",
    category: "protocol",
    description: "Wind-down, screens off, environment set for sleep.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "eveningProtocolCompleted",
    defaultDisciplinePoints: 35,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: ["breathwork_wind_down_5min", "journal_checkin_3min"],
    coachRoutingTags: ["SLEEP_WIND_DOWN", "EVENING_REVIEW"],
    safetyNotes: [],
    displayOrder: 18,
  },
  {
    pillarId: "structure",
    title: "Structure",
    category: "discipline",
    description: "A planned day beats a reactive day. Defined blocks, defined non-negotiables.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "structureCompleted",
    defaultDisciplinePoints: 20,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: [],
    coachRoutingTags: [],
    safetyNotes: [],
    displayOrder: 19,
  },
  {
    pillarId: "habit_stacking",
    title: "Habit Stacking",
    category: "discipline",
    description: "Anchor new habits to existing ones. Lower the activation cost.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "habitStackingCompleted",
    defaultDisciplinePoints: 20,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: false,
    conditional: false,
    linkedPracticeIds: [],
    coachRoutingTags: [],
    safetyNotes: [],
    displayOrder: 20,
  },
  {
    pillarId: "the_standard",
    title: "The Standard",
    category: "identity",
    description: "Did I meet the standard today? Yes or no. No story.",
    frequency: "daily",
    trackable: true,
    dailyActionKey: "standardMet",
    defaultDisciplinePoints: 25,
    countsTowardDailyMinimum: true,
    countsTowardProtocolStreak: true,
    highPriority: true,
    conditional: false,
    linkedPracticeIds: ["journal_checkin_3min"],
    coachRoutingTags: ["EVENING_REVIEW"],
    safetyNotes: [],
    displayOrder: 21,
  },
];

// ---------------------------------------------------------------------------
// dailyActionKey -> pillarIds (one action can satisfy multiple pillars)
// ---------------------------------------------------------------------------

export const ACTION_KEY_TO_PILLAR_IDS: Record<string, string[]> = {
  breathworkCompleted: ["breathwork", "cardiac_coherence"],
  meditationCompleted: ["identity", "pma"],
  mindfulnessCompleted: ["pma"],
  mobilityCompleted: ["recovery"],
  pilatesCompleted: ["recovery"],
  trainingCompleted: ["strength_training"],
  nutritionCompleted: ["protein", "nutrition_hierarchy"],
  journalCompleted: ["journaling", "identity"],
  coldExposureCompleted: ["cold_exposure"],
  heatExposureCompleted: ["heat_exposure"],
  sleepCompleted: ["sleep"],
  hydrationCompleted: ["hydration"],
  morningProtocolCompleted: ["morning_protocol"],
  eveningProtocolCompleted: ["evening_protocol"],
  pmaCompleted: ["pma"],
  morningWalkCompleted: ["morning_walk"],
  cardiacCoherenceCompleted: ["cardiac_coherence"],
  digitalDisciplineCompleted: ["digital_discipline"],
  recoveryCompleted: ["recovery"],
  visualisationCompleted: ["visualisation"],
  identityCompleted: ["identity"],
  structureCompleted: ["structure"],
  habitStackingCompleted: ["habit_stacking"],
  standardMet: ["the_standard"],
  proteinCompleted: ["protein"],
};

// ---------------------------------------------------------------------------
// Profile access helpers
// ---------------------------------------------------------------------------

type AccessProfile = Pick<
  UserProfile,
  "heatExposureAccess" | "coldExposureAccess" | "strengthTrainingAccess" | "pilatesMobilityAccess"
> & Record<string, unknown>;

export function isPillarAssigned(pillar: ProtocolPillar, profile: AccessProfile | null): boolean {
  if (!pillar.conditional) return true;
  if (!profile || !pillar.requiredAccessField) return false;
  const value = (profile as Record<string, unknown>)[pillar.requiredAccessField];
  if (!value || value === "none") return false;
  const accepted = pillar.acceptedAccessValues ?? [];
  return accepted.includes(String(value));
}

export function getAssignedPillars(profile: AccessProfile | null): ProtocolPillar[] {
  return PROTOCOL_PILLAR_REGISTRY.filter((p) => isPillarAssigned(p, profile));
}

export function getUnavailablePillars(profile: AccessProfile | null): ProtocolPillar[] {
  return PROTOCOL_PILLAR_REGISTRY.filter((p) => !isPillarAssigned(p, profile));
}

// ---------------------------------------------------------------------------
// Pillar status derivation
// ---------------------------------------------------------------------------

export type PillarStatus =
  | "complete"
  | "not_complete"
  | "not_assigned"
  | "principle"
  | "weekly_target"
  | "safety_blocked";

export type PillarComputedState = {
  pillar: ProtocolPillar;
  assigned: boolean;
  completed: boolean;
  status: PillarStatus;
  disciplinePointsEarned: number;
};

function progressFlag(progress: DailyProgress | null, key: string): boolean {
  if (!progress) return false;
  return Boolean((progress as unknown as Record<string, unknown>)[key]);
}

export function computePillarStates(
  progress: DailyProgress | null,
  profile: AccessProfile | null,
): PillarComputedState[] {
  return PROTOCOL_PILLAR_REGISTRY.map((pillar) => {
    const assigned = isPillarAssigned(pillar, profile);

    // Derive completion: either the pillar's own dailyActionKey is true OR
    // any mapped action key that points back at this pillar is true.
    let completed = progressFlag(progress, pillar.dailyActionKey);
    if (!completed) {
      for (const [actionKey, pillarIds] of Object.entries(ACTION_KEY_TO_PILLAR_IDS)) {
        if (pillarIds.includes(pillar.pillarId) && progressFlag(progress, actionKey)) {
          completed = true;
          break;
        }
      }
    }

    let status: PillarStatus;
    if (!assigned) status = "not_assigned";
    else if (completed) status = "complete";
    else if (pillar.frequency === "principle") status = "principle";
    else if (
      pillar.frequency === "weekly" ||
      pillar.frequency === "weekly_or_session_based" ||
      pillar.frequency === "session_based"
    )
      status = "not_complete";
    else status = "not_complete";

    return {
      pillar,
      assigned,
      completed,
      status,
      disciplinePointsEarned: completed ? pillar.defaultDisciplinePoints : 0,
    };
  });
}

export type ProtocolDailyState = {
  assignedPillarIds: string[];
  unavailablePillarIds: string[];
  completedPillarIdsToday: string[];
  completedDailyActionKeysToday: string[];
  highPriorityPillarsCompletedToday: string[];
  highPriorityAssignedPillarIds: string[];
  dailyMinimumCount: number;
  highPriorityMinimumCount: number;
  dailyMinimumMet: boolean;
  fullProtocolCompleted: boolean;
  protocolStreakEligible: boolean;
  nextRecommendedPillarId: string | null;
};

export function computeProtocolDailyState(
  progress: DailyProgress | null,
  profile: AccessProfile | null,
): ProtocolDailyState {
  const states = computePillarStates(progress, profile);
  const assigned = states.filter((s) => s.assigned);
  const completed = assigned.filter((s) => s.completed && s.pillar.countsTowardDailyMinimum);
  const highPriorityAssigned = assigned.filter((s) => s.pillar.highPriority);
  const highPriorityCompleted = highPriorityAssigned.filter((s) => s.completed);

  const completedDailyActionKeys: string[] = [];
  for (const key of Object.keys(ACTION_KEY_TO_PILLAR_IDS)) {
    if (progressFlag(progress, key)) completedDailyActionKeys.push(key);
  }

  const dailyMinimumCount = completed.length;
  const highPriorityMinimumCount = highPriorityCompleted.length;
  const dailyMinimumMet = dailyMinimumCount >= 3;
  const fullProtocolCompleted =
    assigned.length > 0 && completed.length >= assigned.length;
  // Streak-eligible: 3+ pillars, and ideally at least 1 high-priority.
  const protocolStreakEligible =
    dailyMinimumMet && (highPriorityMinimumCount >= 1 || highPriorityAssigned.length === 0);

  const nextRecommended = assigned
    .filter((s) => !s.completed && s.pillar.frequency !== "principle")
    .sort((a, b) => {
      if (a.pillar.highPriority !== b.pillar.highPriority) return a.pillar.highPriority ? -1 : 1;
      return a.pillar.displayOrder - b.pillar.displayOrder;
    })[0];

  return {
    assignedPillarIds: assigned.map((s) => s.pillar.pillarId),
    unavailablePillarIds: states.filter((s) => !s.assigned).map((s) => s.pillar.pillarId),
    completedPillarIdsToday: completed.map((s) => s.pillar.pillarId),
    completedDailyActionKeysToday: completedDailyActionKeys,
    highPriorityPillarsCompletedToday: highPriorityCompleted.map((s) => s.pillar.pillarId),
    highPriorityAssignedPillarIds: highPriorityAssigned.map((s) => s.pillar.pillarId),
    dailyMinimumCount,
    highPriorityMinimumCount,
    dailyMinimumMet,
    fullProtocolCompleted,
    protocolStreakEligible,
    nextRecommendedPillarId: nextRecommended?.pillar.pillarId ?? null,
  };
}

export function pillarStatusLabel(s: PillarStatus): string {
  switch (s) {
    case "complete":
      return "Complete";
    case "not_complete":
      return "Not complete";
    case "not_assigned":
      return "Not assigned";
    case "principle":
      return "Principle";
    case "weekly_target":
      return "Weekly target";
    case "safety_blocked":
      return "Safety blocked";
  }
}
