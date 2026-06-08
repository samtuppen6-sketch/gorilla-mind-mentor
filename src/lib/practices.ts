// Central Guided Practice Registry for Gorilla Mind.
//
// One source of truth for every guided action the Coach can recommend.
// Each practice carries enough metadata for:
//   - the Coach to recommend it deterministically,
//   - the Practice Player to render it,
//   - the central completePracticeSession() engine to award DP, flip the
//     correct daily action key, and update streaks,
//   - and (later) wearable / Samsung Health / Whoop / Apple Health hooks to
//     attach real session data via `completionRules`. No wearable integration
//     is wired today — only the data shape is prepared.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PracticeCategory =
  | "Breathwork"
  | "Meditation"
  | "Mobility"
  | "Cold Exposure"
  | "Heat Exposure"
  | "Training"
  | "Pilates"
  | "Journal"
  | "Nutrition";

// Mirrors DailyActionKey in practice-progress.ts. Duplicated as a string
// union here to avoid a circular import — practice-progress imports from
// this file.
export type RegistryDailyActionKey =
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

export type PracticeCompletionRules = {
  // Block a second completion of the same practiceId on the same date.
  blockDuplicatePerDay: boolean;
  // Counts toward the "3 meaningful categories" daily minimum.
  countsTowardDailyMinimum: boolean;
  // True for practices with no fixed timer (e.g. nutrition) — user taps
  // Complete when the real-world action is done.
  requiresUserConfirmation: boolean;
  // Reserved for future wearable hooks (Samsung Health / Whoop / Apple
  // Health). Not consumed yet — just declared so a later release can read
  // it without a registry migration.
  wearableHooks: {
    samsungHealth: boolean;
    whoop: boolean;
    appleHealth: boolean;
  };
};

export type GuidedPractice = {
  // Registry-required fields ------------------------------------------------
  id: string;
  title: string;
  category: PracticeCategory;
  route: string; // primary CoachRoute this practice serves
  routes: string[]; // any additional CoachRoutes that can recommend it
  subRoute: string | null;
  durationMinutes: number;
  intensity: "low" | "moderate" | "high";
  disciplinePoints: number;
  dailyActionKey: RegistryDailyActionKey;
  recommendedWhen: string[];
  avoidWhen: string[];
  safetyNotes: string[];
  placeholderAudioUrl: string;
  placeholderVisualUrl: string;
  practicePath: string; // route used by the Practice Player
  completionRules: PracticeCompletionRules;

  // Optional link to the central guided-audio registry. When set, the
  // Practice Player resolves the MP3 via src/lib/audio-assets.ts. When
  // absent, the player falls back to linkedPracticeIds on the audio registry.
  audioAssetId?: string;

  // Presentation fields used by the Practice Player ------------------------
  description: string;
  instructionText: string;
  primaryButtonLabel: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLACEHOLDER_AUDIO = "placeholder://audio-coming-soon";
const PLACEHOLDER_VISUAL = "placeholder://visual-coming-soon";

function path(id: string): string {
  return `/practice/${id}`;
}

const TIMED_RULES: PracticeCompletionRules = {
  blockDuplicatePerDay: true,
  countsTowardDailyMinimum: true,
  requiresUserConfirmation: false,
  wearableHooks: { samsungHealth: false, whoop: false, appleHealth: false },
};

const CONFIRMED_RULES: PracticeCompletionRules = {
  blockDuplicatePerDay: true,
  countsTowardDailyMinimum: true,
  requiresUserConfirmation: true,
  wearableHooks: { samsungHealth: false, whoop: false, appleHealth: false },
};

// ---------------------------------------------------------------------------
// PRACTICE_REGISTRY — single source of truth
// ---------------------------------------------------------------------------

export const PRACTICE_REGISTRY: GuidedPractice[] = [
  // 1. Breathwork — down-regulate
  {
    id: "breathwork_downregulate_3min",
    title: "Extended Exhale Breathing",
    category: "Breathwork",
    route: "BREATHWORK",
    routes: ["BREATHWORK", "SAFETY_DEESCALATE"],
    subRoute: "DOWNREGULATE",
    durationMinutes: 3,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "breathworkCompleted",
    recommendedWhen: [
      "stressed", "wired", "anxious", "overwhelmed",
      "racing thoughts", "activated nervous system",
    ],
    avoidWhen: ["in water", "driving", "acute panic without support"],
    safetyNotes: [
      "Do not perform while driving.",
      "Do not perform in water.",
      "If chest pain, fainting, severe dizziness, pregnancy or serious heart condition: skip and seek professional support.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("breathwork_downregulate_3min"),
    completionRules: TIMED_RULES,
    description:
      "A short down-regulating breath protocol to bring an activated nervous system back into baseline before you act.",
    instructionText:
      "Seated. Quiet, nasal where possible.\n\nInhale through the nose for 4 seconds.\nSoft pause for 1 second.\nExhale slowly for 6–8 seconds.\n\nRepeat for 3 minutes. No breath holds. No force.",
    primaryButtonLabel: "Start 3-Minute Guided Breathwork",
  },

  // Breathwork — focus
  {
    id: "breathwork_focus_4min",
    title: "Box Breathing",
    category: "Breathwork",
    route: "BREATHWORK",
    routes: ["BREATHWORK"],
    subRoute: "FOCUS",
    durationMinutes: 4,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "breathworkCompleted",
    recommendedWhen: ["distracted", "scattered", "unfocused", "mentally noisy"],
    avoidWhen: ["in water", "driving", "panic spikes on breath holds"],
    safetyNotes: [
      "Do not perform while driving.",
      "Do not perform in water.",
      "If breath holds cause panic, anxiety spikes, or dizziness: switch to extended-exhale breathing.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("breathwork_focus_4min"),
    completionRules: TIMED_RULES,
    description:
      "A focus-stabilising protocol to quiet mental noise and lock attention before deep work or a session.",
    instructionText:
      "Seated. Spine tall.\n\nInhale 4 seconds.\nHold 4 seconds.\nExhale 4 seconds.\nHold 4 seconds.\n\nRepeat for 4 minutes.",
    primaryButtonLabel: "Start Focus Breathwork",
  },

  // Breathwork — wind down
  {
    id: "breathwork_wind_down_5min",
    title: "Sleep Downshift Breathing",
    category: "Breathwork",
    route: "SLEEP_WIND_DOWN",
    routes: ["BREATHWORK", "SLEEP_WIND_DOWN"],
    subRoute: "WIND_DOWN",
    durationMinutes: 5,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "breathworkCompleted",
    recommendedWhen: [
      "night scrolling", "unable to switch off",
      "bedtime resistance", "poor sleep routine",
    ],
    avoidWhen: ["in water"],
    safetyNotes: [
      "Do not perform in water.",
      "Skip if congestion blocks nasal breathing — breathe softly through the mouth instead.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("breathwork_wind_down_5min"),
    completionRules: TIMED_RULES,
    audioAssetId: "sleep_downshift_5min_audio",
    description:
      "Calming, low-stimulation nasal breathing to close the day and prepare the system for sleep.",
    instructionText:
      "Lights low. Phone down.\n\nSlow nasal breathing only.\nInhale 4 seconds. Exhale 6–8 seconds.\nKeep the exhale longer than the inhale.\n\nRepeat for 5 minutes. No breath holds.",
    primaryButtonLabel: "Start Sleep Wind-Down",
  },

  // 2. Meditation — morning identity reset
  {
    id: "meditation_morning_identity_5min",
    title: "Morning Identity Reset",
    category: "Meditation",
    route: "MISSED_DAY_REPAIR",
    routes: [
      "MISSED_DAY_REPAIR", "MORNING_PROTOCOL", "IDENTITY_RESET",
      "MISSED_MORNING", "MEDITATION_MINDFULNESS",
    ],
    subRoute: "MORNING_IDENTITY",
    durationMinutes: 5,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "meditationCompleted",
    recommendedWhen: [
      "wasted mornings", "low discipline",
      "phone-first behaviour", "lack of structure",
    ],
    avoidWhen: [],
    safetyNotes: [],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("meditation_morning_identity_5min"),
    completionRules: TIMED_RULES,
    description:
      "A short identity-anchor meditation for the start of the day. Phone stays down. Operator first.",
    instructionText:
      "Seated. Phone face-down. Lights up.\n\nSlow nasal breath for 1 minute.\nThen silently state your identity anchor for 1 minute.\nThen name today's one non-negotiable for 1 minute.\nThen breathe quietly for the remaining time.",
    primaryButtonLabel: "Start Morning Reset",
  },

  // Meditation — grounding
  {
    id: "meditation_grounding_5min",
    title: "Grounding Reset",
    category: "Meditation",
    route: "MEDITATION_MINDFULNESS",
    routes: ["MEDITATION_MINDFULNESS"],
    subRoute: "GROUNDING",
    durationMinutes: 5,
    intensity: "low",
    disciplinePoints: 25,
    dailyActionKey: "meditationCompleted",
    recommendedWhen: [
      "stressed", "emotionally activated", "overwhelmed", "disconnected",
    ],
    avoidWhen: ["acute crisis without professional support"],
    safetyNotes: [
      "If acutely panicked or in a crisis state, contact a crisis line or emergency services first.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("meditation_grounding_5min"),
    completionRules: TIMED_RULES,
    audioAssetId: "grounding_reset_5min_audio",
    description:
      "A short grounding meditation to come back into the body when stressed, overwhelmed, or emotionally activated.",
    instructionText:
      "Seated. Feet on the floor.\n\nName 5 things you can see.\nName 4 things you can feel.\nName 3 things you can hear.\nThen breathe slowly through the nose for the remaining time.",
    primaryButtonLabel: "Start Grounding Meditation",
  },

  // Meditation — urge surfing
  {
    id: "meditation_urge_surfing_5min",
    title: "Urge Surfing Reset",
    category: "Meditation",
    route: "SOBRIETY_CRAVING",
    routes: ["SOBRIETY_CRAVING", "PROCESS_ADDICTION", "MEDITATION_MINDFULNESS"],
    subRoute: "URGE_SURFING",
    durationMinutes: 5,
    intensity: "low",
    disciplinePoints: 25,
    dailyActionKey: "meditationCompleted",
    recommendedWhen: [
      "cravings", "scrolling urges", "compulsive behaviour",
      "food urges", "relapse risk",
    ],
    avoidWhen: ["self-harm ideation", "suicidal ideation"],
    safetyNotes: [
      "If urges involve self-harm or suicidal ideation: stop and contact a crisis line or emergency services immediately.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("meditation_urge_surfing_5min"),
    completionRules: TIMED_RULES,
    audioAssetId: "urge_reset_10min_audio",
    description:
      "Ride the urge without acting on it. Used for cravings, scrolling urges, food urges, or relapse risk.",
    instructionText:
      "Seated or standing. Phone out of reach.\n\nNotice the urge without judgement.\nName it: 'this is an urge'.\nBreathe slow nasal in for 4, out for 6–8.\nWatch the urge rise, peak, and fall like a wave.\n\nDo not act on it. Hold for 5 minutes.",
    primaryButtonLabel: "Start Urge Reset",
  },

  // 3. Mobility — recovery flow
  {
    id: "mobility_recovery_10min",
    title: "Recovery Mobility Reset",
    category: "Mobility",
    route: "RECOVERY_DAY",
    routes: ["RECOVERY_DAY", "LOW_READINESS", "POOR_SLEEP", "MOBILITY"],
    subRoute: "RECOVERY_DAY",
    durationMinutes: 10,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "mobilityCompleted",
    recommendedWhen: [
      "poor sleep", "low readiness", "soreness",
      "recovery day", "injury caution",
    ],
    avoidWhen: ["sharp pain", "acute injury without clinician sign-off"],
    safetyNotes: [
      "Skip movements that hit a sharp or pinching pain.",
      "If injured or symptomatic: see a clinician before loading.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("mobility_recovery_10min"),
    completionRules: TIMED_RULES,
    description:
      "Controlled low-intensity mobility flow for recovery days, poor sleep, soreness, or low readiness.",
    instructionText:
      "Easy pace. Nasal breathing throughout.\n\n2 min: slow walk or easy march.\n2 min: hip openers (90/90, kneeling hip flexor).\n2 min: thoracic spine rotations + cat-cow.\n2 min: shoulder CARs + scap pulls.\n2 min: slow standing breath downshift.\n\nStop anything that produces sharp pain.",
    primaryButtonLabel: "Start Recovery Flow",
  },

  // 4. Journal — one-standard check-in
  {
    id: "journal_checkin_3min",
    title: "One Standard Check-In",
    category: "Journal",
    route: "MISSED_DAY_REPAIR",
    routes: ["MISSED_DAY_REPAIR", "EVENING_REVIEW", "LOW_READINESS"],
    subRoute: null,
    durationMinutes: 3,
    intensity: "low",
    disciplinePoints: 20,
    dailyActionKey: "journalCompleted",
    recommendedWhen: [
      "end of day", "missed-day repair", "low clarity",
      "low readiness", "needs honest self-report",
    ],
    avoidWhen: [],
    safetyNotes: [
      "Honesty over performance. This is a private operator log, not a content post.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("journal_checkin_3min"),
    completionRules: TIMED_RULES,
    description:
      "A short, honest check-in against one standard. No story, no spin — just the operator log.",
    instructionText:
      "Phone face-down or single-purpose.\n\nAnswer in one line each:\n1. What did I actually do today?\n2. Where did I fall short of the standard?\n3. What is the single next action that puts me back on protocol?\n\nNo paragraphs. No shame. Operator log only.",
    primaryButtonLabel: "Start Check-In",
  },

  // 5. Nutrition — protein-first meal
  {
    id: "nutrition_next_meal",
    title: "Protein-First Meal",
    category: "Nutrition",
    route: "NUTRITION",
    routes: ["NUTRITION", "MISSED_DAY_REPAIR", "LOW_ENERGY"],
    subRoute: null,
    durationMinutes: 0,
    intensity: "low",
    disciplinePoints: 20,
    dailyActionKey: "nutritionCompleted",
    recommendedWhen: [
      "low energy", "missed meal", "missed-day repair",
      "post-training refuel", "needs nutrition anchor",
    ],
    avoidWhen: [
      "active eating-disorder treatment without clinician sign-off",
      "medical restriction on protein intake",
    ],
    safetyNotes: [
      "If under clinical care for disordered eating, follow your clinician's plan over this prompt.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("nutrition_next_meal"),
    completionRules: CONFIRMED_RULES,
    description:
      "Anchor the next meal on protein and real food. User-confirmed completion.",
    instructionText:
      "Build the next meal in this order:\n\n1. Protein first: a clear palm-sized portion (chicken, beef, fish, eggs, Greek yoghurt).\n2. Real-food carbs: rice, potato, oats, fruit.\n3. Hydration: water, not liquid calories.\n\nNo grazing. Eat, then close the kitchen. Tap Complete after the meal.",
    primaryButtonLabel: "Mark Meal Complete",
  },

  // Cold exposure pre-frame
  {
    id: "cold_exposure_preframe_3min",
    title: "Cold Exposure Pre-Frame",
    category: "Cold Exposure",
    route: "COLD_EXPOSURE",
    routes: ["COLD_EXPOSURE"],
    subRoute: "COLD_PREP",
    durationMinutes: 3,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "coldExposureCompleted",
    recommendedWhen: [
      "preparing for cold shower",
      "preparing for cold plunge",
      "preparing for sea swim",
    ],
    avoidWhen: [
      "in water", "pregnant", "cardiac condition",
      "seizure history", "recent medical event without clinician sign-off",
    ],
    safetyNotes: [
      "No breath holds in water.",
      "Do not perform intense breathwork immediately before or during cold exposure.",
      "Skip if pregnant, cardiac condition, seizure history, or recent medical event without clinician sign-off.",
      "Exit immediately if dizzy, numb, faint, or unsafe. Ego is not a protocol.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("cold_exposure_preframe_3min"),
    completionRules: TIMED_RULES,
    description:
      "Short pre-frame to enter cold exposure calmly and safely. Not an in-water protocol.",
    instructionText:
      "Performed OUT of the water, before exposure.\n\nStand tall. Nasal breath.\nInhale 4 seconds. Exhale 6 seconds.\nNo breath holds. No hyperventilation.\nState clearly: 'I enter calm. I exit calm.'\n\nThen begin exposure conservatively. Stop if dizzy, numb, faint, or unsafe.",
    primaryButtonLabel: "Start Cold Prep",
  },

  // -------------------------------------------------------------------------
  // Plan-builder aliases — spec-required IDs surfaced by the FULL_REBUILD_PLAN
  // / MORNING_PROTOCOL / BREATHWORK / MEDITATION plan routes. These point at
  // the same underlying actions as the canonical entries above but match the
  // exact ids/durations the Coach plan spec prescribes so the guided card
  // matches the prescription word-for-word.
  // -------------------------------------------------------------------------
  {
    id: "box_breathing_5min",
    title: "Box Breathing",
    category: "Breathwork",
    route: "BREATHWORK",
    routes: ["BREATHWORK", "MORNING_PROTOCOL", "FULL_REBUILD_PLAN", "MORNING_PROTOCOL_REQUEST"],
    subRoute: "MORNING_ACTIVATION",
    durationMinutes: 6,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "breathworkCompleted",
    recommendedWhen: ["morning activation", "before phone", "before caffeine", "state regulation"],
    avoidWhen: ["in water", "driving"],
    safetyNotes: ["Do not perform in water.", "Skip breath holds if they spike anxiety — switch to extended-exhale instead."],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("box_breathing_5min"),
    completionRules: TIMED_RULES,
    audioAssetId: "box_breathing_5min_audio",
    description: "Morning control protocol: 4 in / 4 hold / 4 out / 4 hold. 16 rounds. Phone stays down.",
    instructionText: "Seated. Spine tall. Phone away.\n\nInhale 4 seconds.\nHold 4 seconds.\nExhale 4 seconds.\nHold 4 seconds.\n\n16 rounds. Use it in the morning before phone or caffeine.",
    primaryButtonLabel: "Start Box Breathing",
  },
  {
    id: "extended_exhale_3min",
    title: "Extended Exhale Breathing",
    category: "Breathwork",
    route: "SLEEP_WIND_DOWN",
    routes: ["BREATHWORK", "SLEEP_WIND_DOWN", "FULL_REBUILD_PLAN", "BREATHWORK_MEDITATION_REQUEST"],
    subRoute: "WIND_DOWN",
    durationMinutes: 3,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "breathworkCompleted",
    recommendedWhen: ["evening shutdown", "before sleep", "downshift", "wired"],
    avoidWhen: ["in water", "driving"],
    safetyNotes: ["Do not perform in water.", "Mouth breathe softly if nose is blocked."],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("extended_exhale_3min"),
    completionRules: TIMED_RULES,
    audioAssetId: "extended_exhale_3min_audio",
    description: "Downshift the nervous system before sleep. Nasal in 4, slow exhale 6–8.",
    instructionText: "Lights low. Phone down.\n\nInhale through the nose for 4 seconds.\nExhale slowly through the nose for 6–8 seconds.\n\nRepeat for 3 minutes. No breath holds.",
    primaryButtonLabel: "Start Extended Exhale",
  },
  {
    id: "morning_identity_reset_5min",
    title: "Morning Identity Reset",
    category: "Meditation",
    route: "MEDITATION_MINDFULNESS",
    routes: ["MEDITATION_MINDFULNESS", "MORNING_PROTOCOL", "FULL_REBUILD_PLAN", "BREATHWORK_MEDITATION_REQUEST", "MORNING_PROTOCOL_REQUEST"],
    subRoute: "MORNING_IDENTITY",
    durationMinutes: 5,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "meditationCompleted",
    recommendedWhen: ["missed days", "low discipline", "morning lock-in", "identity work"],
    avoidWhen: [],
    safetyNotes: [],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("morning_identity_reset_5min"),
    completionRules: TIMED_RULES,
    audioAssetId: "morning_identity_reset_5min_audio",
    description: "Re-anchor the operator after missed days. Phone down. Identity first.",
    instructionText: "Seated. Phone face-down.\n\n1 min — slow nasal breathing.\n1 min — state your identity anchor silently.\n1 min — name today's one non-negotiable.\n2 min — quiet breath.",
    primaryButtonLabel: "Start Morning Identity Reset",
  },
  {
    id: "morning_protocol_lock_in",
    title: "Morning Protocol Lock-In",
    category: "Meditation",
    route: "MORNING_PROTOCOL",
    routes: ["MORNING_PROTOCOL", "FULL_REBUILD_PLAN", "MORNING_PROTOCOL_REQUEST"],
    subRoute: "MORNING_PROTOCOL",
    durationMinutes: 30,
    intensity: "low",
    disciplinePoints: 50,
    dailyActionKey: "guidedPracticeCompleted",
    recommendedWhen: ["needs structure", "body activation", "digital discipline", "first hour command"],
    avoidWhen: [],
    safetyNotes: ["Use morning daylight outdoors — do not stare at the sun."],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("morning_protocol_lock_in"),
    completionRules: TIMED_RULES,
    audioAssetId: "morning_protocol_lock_in_audio",
    description: "The full morning lock-in: water, daylight, breath, identity, movement, protein, one journal line.",
    instructionText: "1. Water before phone.\n2. Mineralised water if appropriate (water + pinch Celtic sea salt + lemon).\n3. Morning daylight outside.\n4. Box Breathing — 5 minutes.\n5. Morning Identity Reset — 5 minutes.\n6. 20-minute walk or training session.\n7. Protein-first breakfast.\n8. One-line journal: 'What is the standard today?'",
    primaryButtonLabel: "Start Morning Protocol",
  },
  {
    id: "urge_reset_10min",
    title: "Urge Reset",
    category: "Meditation",
    route: "SOBRIETY_CRAVING",
    routes: ["SOBRIETY_CRAVING", "PROCESS_ADDICTION", "MEDITATION_MINDFULNESS"],
    subRoute: "URGE_SURFING",
    durationMinutes: 10,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "meditationCompleted",
    recommendedWhen: ["cravings", "scrolling urges", "compulsive behaviour", "relapse risk"],
    avoidWhen: ["self-harm ideation", "suicidal ideation"],
    safetyNotes: [
      "If urges involve self-harm or suicidal ideation: stop and contact a crisis line or emergency services immediately.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("urge_reset_10min"),
    completionRules: TIMED_RULES,
    audioAssetId: "urge_reset_10min_audio",
    description: "Ride the urge without acting on it. Watch it rise, peak, and fall like a wave.",
    instructionText: "Phone out of reach. Seated or standing.\n\nNotice the urge without judgement.\nName it: 'this is an urge'.\nSlow nasal breath: in 4, out 6–8.\nWatch the urge rise, peak, and fall.\n\nDo not act on it. Hold for 10 minutes.",
    primaryButtonLabel: "Start Urge Reset",
  },
  {
    id: "relapse_repair_7min",
    title: "Relapse Repair",
    category: "Meditation",
    route: "MISSED_DAY_REPAIR",
    routes: ["MISSED_DAY_REPAIR", "SOBRIETY_CRAVING", "PROCESS_ADDICTION"],
    subRoute: "RELAPSE_REPAIR",
    durationMinutes: 7,
    intensity: "low",
    disciplinePoints: 30,
    dailyActionKey: "meditationCompleted",
    recommendedWhen: ["after a slip", "post-relapse", "shame loop", "needs reset"],
    avoidWhen: ["acute crisis without professional support"],
    safetyNotes: [
      "This is a support practice, not medical or crisis care.",
      "If in immediate danger: contact emergency services or a crisis line first.",
    ],
    placeholderAudioUrl: PLACEHOLDER_AUDIO,
    placeholderVisualUrl: PLACEHOLDER_VISUAL,
    practicePath: path("relapse_repair_7min"),
    completionRules: TIMED_RULES,
    audioAssetId: "relapse_repair_7min_audio",
    description: "Repair after a slip. No shame, no spin. Operator log, identity, next action.",
    instructionText: "Seated. Phone face-down.\n\n1. Name what happened in one line. No story.\n2. State the standard you hold.\n3. State the single next action that puts you back on protocol.\n4. Slow nasal breath to close.\n\nNo shame. Operator log only.",
    primaryButtonLabel: "Start Relapse Repair",
  },
];

// Backwards-compatible alias.
export const PRACTICES = PRACTICE_REGISTRY;

export function getPracticeById(id: string): GuidedPractice | undefined {
  return PRACTICE_REGISTRY.find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Coach recommendation selector
// ---------------------------------------------------------------------------

export type GuidedPracticeRec = {
  id: string;
  title: string;
  category: PracticeCategory;
  durationMinutes: number;
  reason: string;
  buttonLabel: string;
};

function rec(p: GuidedPractice, reason: string): GuidedPracticeRec {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    durationMinutes: p.durationMinutes,
    reason,
    buttonLabel: p.primaryButtonLabel,
  };
}

/**
 * Pick a guided practice based on the active route and (optional) breathwork
 * sub-route. Only ever returns practices that exist in PRACTICE_REGISTRY.
 */
export function selectGuidedPractice(args: {
  route: string;
  breathworkSubRoute?: string | null;
  message?: string;
}): GuidedPracticeRec | null {
  const { route, breathworkSubRoute, message } = args;
  const m = (message ?? "").toLowerCase();

  const byId = (id: string, reason: string): GuidedPracticeRec | null => {
    const p = getPracticeById(id);
    return p ? rec(p, reason) : null;
  };

  switch (route) {
    case "BREATHWORK": {
      const sub = breathworkSubRoute ?? "DOWNREGULATE";
      if (sub === "FOCUS") {
        return byId("breathwork_focus_4min",
          "Active route BREATHWORK / sub-route FOCUS — box breathing fits a scattered but non-panicked state.");
      }
      if (sub === "WIND_DOWN") {
        return byId("breathwork_wind_down_5min",
          "Active route BREATHWORK / sub-route WIND_DOWN — calming nasal extended-exhale fits evening / sleep wind-down.");
      }
      return byId("breathwork_downregulate_3min",
        "Active route BREATHWORK — extended-exhale breathing brings an activated system down first.");
    }
    case "SLEEP_WIND_DOWN":
      return byId("breathwork_wind_down_5min",
        "Active route SLEEP_WIND_DOWN — calming nasal extended-exhale breathing prepares the system for sleep.");
    case "MISSED_MORNING":
    case "MORNING_PROTOCOL":
    case "IDENTITY_RESET":
      return byId("meditation_morning_identity_5min",
        `Active route ${route} — short identity-anchor reset to re-enter the day as the operator.`);
    case "SOBRIETY_CRAVING":
    case "PROCESS_ADDICTION":
      return byId("meditation_urge_surfing_5min",
        `Active route ${route} — urge surfing reset rides the wave without acting on it.`);
    case "MEDITATION_MINDFULNESS":
      if (/(crav|urge|scroll|relapse|slip)/i.test(m)) {
        return byId("meditation_urge_surfing_5min",
          "Meditation route with urge / craving language — urge surfing fits.");
      }
      if (/(morning|identity|wasted morning|phone in bed)/i.test(m)) {
        return byId("meditation_morning_identity_5min",
          "Meditation route with morning / identity language — morning identity reset fits.");
      }
      return byId("meditation_grounding_5min",
        "Active route MEDITATION_MINDFULNESS — grounding reset is the safe default.");
    case "RECOVERY_DAY":
    case "LOW_READINESS":
    case "POOR_SLEEP":
    case "MOBILITY":
      return byId("mobility_recovery_10min",
        `Active route ${route} — controlled low-intensity mobility flow protects recovery.`);
    case "COLD_EXPOSURE":
      return byId("cold_exposure_preframe_3min",
        "Active route COLD_EXPOSURE — pre-frame entered out of water, calm, no in-water breath holds.");
    case "EVENING_REVIEW":
      return byId("journal_checkin_3min",
        "Active route EVENING_REVIEW — one-standard check-in closes the day honestly.");
    case "NUTRITION":
    case "NUTRITION_MEAL":
    case "LOW_ENERGY":
      return byId("nutrition_next_meal",
        `Active route ${route} — anchor the next meal on protein and real food.`);
    case "MISSED_DAY_REPAIR":
      // Default repair is the identity reset; journal/nutrition can be
      // chained as the next step from the Today screen.
      return byId("meditation_morning_identity_5min",
        "Active route MISSED_DAY_REPAIR — identity reset re-anchors the operator without shame.");
    default:
      return null;
  }
}
