// Guided Practice catalogue for Gorilla Mind.
// Pure data + a deterministic selector that maps an active CoachRoute
// (and optional BreathworkSubRoute) to a recommended practice.
//
// Shared by both the AI Coach backend (src/lib/coach.functions.ts) and
// the Practice Player frontend (src/routes/practice.$practiceId.tsx),
// so the same source of truth is used everywhere.

export type PracticeCategory =
  | "Breathwork"
  | "Meditation"
  | "Mobility"
  | "Cold Exposure";

export type GuidedPractice = {
  id: string;
  title: string;
  category: PracticeCategory;
  subRoute: string;
  durationMinutes: number;
  intensity: "low" | "moderate" | "high";
  description: string;
  whenToUse: string[];
  instructionText: string;
  contraindications: string[];
  audioUrl: string | null;
  visualUrl: string | null;
  ambientTrack: string | null;
  routeTags: string[];
  primaryButtonLabel: string;
};

export const PRACTICES: GuidedPractice[] = [
  {
    id: "breathwork_downregulate_3min",
    title: "Extended Exhale Breathing",
    category: "Breathwork",
    subRoute: "DOWNREGULATE",
    durationMinutes: 3,
    intensity: "low",
    description:
      "A short down-regulating breath protocol to bring an activated nervous system back into baseline before you act.",
    whenToUse: [
      "stressed",
      "wired",
      "anxious",
      "overwhelmed",
      "racing thoughts",
      "activated nervous system",
    ],
    instructionText:
      "Seated. Quiet, nasal where possible.\n\nInhale through the nose for 4 seconds.\nSoft pause for 1 second.\nExhale slowly for 6–8 seconds.\n\nRepeat for 3 minutes. No breath holds. No force.",
    contraindications: [
      "Do not perform while driving.",
      "Do not perform in water.",
      "If chest pain, fainting, severe dizziness, pregnancy or serious heart condition: skip and seek professional support.",
    ],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: ["BREATHWORK:DOWNREGULATE"],
    primaryButtonLabel: "Start 3-Minute Guided Breathwork",
  },
  {
    id: "breathwork_focus_4min",
    title: "Box Breathing",
    category: "Breathwork",
    subRoute: "FOCUS",
    durationMinutes: 4,
    intensity: "low",
    description:
      "A focus-stabilising protocol to quiet mental noise and lock attention before deep work or a session.",
    whenToUse: ["distracted", "scattered", "unfocused", "mentally noisy"],
    instructionText:
      "Seated. Spine tall.\n\nInhale 4 seconds.\nHold 4 seconds.\nExhale 4 seconds.\nHold 4 seconds.\n\nRepeat for 4 minutes.",
    contraindications: [
      "Do not perform while driving.",
      "Do not perform in water.",
      "If breath holds cause panic, anxiety spikes, or dizziness: switch to extended-exhale breathing.",
    ],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: ["BREATHWORK:FOCUS"],
    primaryButtonLabel: "Start Focus Breathwork",
  },
  {
    id: "breathwork_wind_down_5min",
    title: "Sleep Downshift Breathing",
    category: "Breathwork",
    subRoute: "WIND_DOWN",
    durationMinutes: 5,
    intensity: "low",
    description:
      "Calming, low-stimulation nasal breathing to close the day and prepare the system for sleep.",
    whenToUse: [
      "night scrolling",
      "unable to switch off",
      "bedtime resistance",
      "poor sleep routine",
    ],
    instructionText:
      "Lights low. Phone down.\n\nSlow nasal breathing only.\nInhale 4 seconds. Exhale 6–8 seconds.\nKeep the exhale longer than the inhale.\n\nRepeat for 5 minutes. No breath holds.",
    contraindications: [
      "Do not perform in water.",
      "Skip if congestion blocks nasal breathing — breathe softly through the mouth instead.",
    ],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: ["BREATHWORK:WIND_DOWN", "SLEEP_WIND_DOWN"],
    primaryButtonLabel: "Start Sleep Wind-Down",
  },
  {
    id: "meditation_grounding_5min",
    title: "Grounding Reset",
    category: "Meditation",
    subRoute: "GROUNDING",
    durationMinutes: 5,
    intensity: "low",
    description:
      "A short grounding meditation to come back into the body when stressed, overwhelmed, or emotionally activated.",
    whenToUse: [
      "stressed",
      "emotionally activated",
      "overwhelmed",
      "disconnected",
    ],
    instructionText:
      "Seated. Feet on the floor.\n\nName 5 things you can see.\nName 4 things you can feel.\nName 3 things you can hear.\nThen breathe slowly through the nose for the remaining time.",
    contraindications: [
      "If acutely panicked or in a crisis state, contact a crisis line or emergency services first.",
    ],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: ["MEDITATION_MINDFULNESS:GROUNDING"],
    primaryButtonLabel: "Start Grounding Meditation",
  },
  {
    id: "meditation_morning_identity_5min",
    title: "Morning Identity Reset",
    category: "Meditation",
    subRoute: "MORNING_IDENTITY",
    durationMinutes: 5,
    intensity: "low",
    description:
      "A short identity-anchor meditation for the start of the day. Phone stays down. Operator first.",
    whenToUse: [
      "wasted mornings",
      "low discipline",
      "phone-first behaviour",
      "lack of structure",
    ],
    instructionText:
      "Seated. Phone face-down. Lights up.\n\nSlow nasal breath for 1 minute.\nThen silently state your identity anchor for 1 minute.\nThen name today's one non-negotiable for 1 minute.\nThen breathe quietly for the remaining time.",
    contraindications: [],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: ["MEDITATION_MINDFULNESS:MORNING_IDENTITY", "MISSED_MORNING"],
    primaryButtonLabel: "Start Morning Reset",
  },
  {
    id: "meditation_urge_surfing_5min",
    title: "Urge Surfing Reset",
    category: "Meditation",
    subRoute: "URGE_SURFING",
    durationMinutes: 5,
    intensity: "low",
    description:
      "Ride the urge without acting on it. Used for cravings, scrolling urges, food urges, or relapse risk.",
    whenToUse: [
      "cravings",
      "scrolling urges",
      "compulsive behaviour",
      "food urges",
      "relapse risk",
    ],
    instructionText:
      "Seated or standing. Phone out of reach.\n\nNotice the urge without judgement.\nName it: 'this is an urge'.\nBreathe slow nasal in for 4, out for 6–8.\nWatch the urge rise, peak, and fall like a wave.\n\nDo not act on it. Hold for 5 minutes.",
    contraindications: [
      "If urges involve self-harm or suicidal ideation: stop and contact a crisis line or emergency services immediately.",
    ],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: [
      "MEDITATION_MINDFULNESS:URGE_SURFING",
      "SOBRIETY_CRAVING",
      "PROCESS_ADDICTION",
    ],
    primaryButtonLabel: "Start Urge Reset",
  },
  {
    id: "mobility_recovery_10min",
    title: "Recovery Mobility Flow",
    category: "Mobility",
    subRoute: "RECOVERY_DAY",
    durationMinutes: 10,
    intensity: "low",
    description:
      "Controlled low-intensity mobility flow for recovery days, poor sleep, soreness, or low readiness.",
    whenToUse: [
      "poor sleep",
      "low readiness",
      "soreness",
      "recovery day",
      "injury caution",
    ],
    instructionText:
      "Easy pace. Nasal breathing throughout.\n\n2 min: slow walk or easy march.\n2 min: hip openers (90/90, kneeling hip flexor).\n2 min: thoracic spine rotations + cat-cow.\n2 min: shoulder CARs + scap pulls.\n2 min: slow standing breath downshift.\n\nStop anything that produces sharp pain.",
    contraindications: [
      "Skip movements that hit a sharp or pinching pain.",
      "If injured or symptomatic: see a clinician before loading.",
    ],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: ["RECOVERY_DAY", "MOBILITY"],
    primaryButtonLabel: "Start Recovery Flow",
  },
  {
    id: "cold_exposure_preframe_3min",
    title: "Cold Exposure Pre-Frame",
    category: "Cold Exposure",
    subRoute: "COLD_PREP",
    durationMinutes: 3,
    intensity: "low",
    description:
      "Short pre-frame to enter cold exposure calmly and safely. Not an in-water protocol.",
    whenToUse: [
      "preparing for cold shower",
      "preparing for cold plunge",
      "preparing for sea swim",
    ],
    instructionText:
      "Performed OUT of the water, before exposure.\n\nStand tall. Nasal breath.\nInhale 4 seconds. Exhale 6 seconds.\nNo breath holds. No hyperventilation.\nState clearly: 'I enter calm. I exit calm.'\n\nThen begin exposure conservatively. Stop if dizzy, numb, faint, or unsafe.",
    contraindications: [
      "No breath holds in water.",
      "Do not perform intense breathwork immediately before or during cold exposure.",
      "Skip if pregnant, cardiac condition, seizure history, or recent medical event without clinician sign-off.",
      "Exit immediately if dizzy, numb, faint, or unsafe. Ego is not a protocol.",
    ],
    audioUrl: null,
    visualUrl: null,
    ambientTrack: null,
    routeTags: ["COLD_EXPOSURE"],
    primaryButtonLabel: "Start Cold Prep",
  },
];

export function getPracticeById(id: string): GuidedPractice | undefined {
  return PRACTICES.find((p) => p.id === id);
}

export type GuidedPracticeRec = {
  id: string;
  title: string;
  category: PracticeCategory;
  durationMinutes: number;
  reason: string;
  buttonLabel: string;
};

/**
 * Pick a guided practice based on the active route and (optional) breathwork
 * sub-route. Returns null if no practice fits — the Coach answer should still
 * be useful without one.
 */
export function selectGuidedPractice(args: {
  route: string;
  breathworkSubRoute?: string | null;
  message?: string;
}): GuidedPracticeRec | null {
  const { route, breathworkSubRoute, message } = args;
  const m = (message ?? "").toLowerCase();

  let id: string | null = null;
  let reason = "";

  switch (route) {
    case "BREATHWORK": {
      const sub = breathworkSubRoute ?? "DOWNREGULATE";
      if (sub === "FOCUS") {
        id = "breathwork_focus_4min";
        reason =
          "Active route BREATHWORK / sub-route FOCUS — box breathing fits a scattered but non-panicked state.";
      } else if (sub === "WIND_DOWN") {
        id = "breathwork_wind_down_5min";
        reason =
          "Active route BREATHWORK / sub-route WIND_DOWN — calming nasal extended-exhale fits evening / sleep wind-down.";
      } else if (sub === "ENERGISE") {
        // No dedicated energise practice yet — default to a safe down-regulate
        // session rather than recommending intense breathwork without media.
        id = "breathwork_downregulate_3min";
        reason =
          "Active route BREATHWORK / sub-route ENERGISE — no dedicated energising session in the catalogue yet. Defaulting to safe down-regulating breathing.";
      } else {
        id = "breathwork_downregulate_3min";
        reason =
          "Active route BREATHWORK / sub-route DOWNREGULATE — extended-exhale breathing brings an activated system down first.";
      }
      break;
    }
    case "SLEEP_WIND_DOWN":
      id = "breathwork_wind_down_5min";
      reason =
        "Active route SLEEP_WIND_DOWN — calming nasal extended-exhale breathing prepares the system for sleep.";
      break;
    case "MISSED_MORNING":
      id = "meditation_morning_identity_5min";
      reason =
        "Active route MISSED_MORNING — short identity-anchor reset to re-enter the day as the operator.";
      break;
    case "SOBRIETY_CRAVING":
    case "PROCESS_ADDICTION":
      id = "meditation_urge_surfing_5min";
      reason =
        "Active route " +
        route +
        " — urge surfing reset rides the wave without acting on it.";
      break;
    case "MEDITATION_MINDFULNESS":
      if (/(crav|urge|scroll|relapse|slip)/i.test(m)) {
        id = "meditation_urge_surfing_5min";
        reason =
          "Meditation route with urge / craving language — urge surfing fits.";
      } else if (/(morning|identity|wasted morning|phone in bed)/i.test(m)) {
        id = "meditation_morning_identity_5min";
        reason =
          "Meditation route with morning / identity language — morning identity reset fits.";
      } else {
        id = "meditation_grounding_5min";
        reason =
          "Active route MEDITATION_MINDFULNESS — grounding reset is the safe default.";
      }
      break;
    case "RECOVERY_DAY":
    case "MOBILITY":
      id = "mobility_recovery_10min";
      reason =
        "Active route " +
        route +
        " — controlled low-intensity mobility flow protects recovery.";
      break;
    case "COLD_EXPOSURE":
      id = "cold_exposure_preframe_3min";
      reason =
        "Active route COLD_EXPOSURE — pre-frame entered out of water, calm, no in-water breath holds.";
      break;
    case "MISSED_DAY_REPAIR":
      id = "meditation_morning_identity_5min";
      reason =
        "Active route MISSED_DAY_REPAIR — identity reset re-anchors the operator without shame.";
      break;
    default:
      id = null;
  }

  if (!id) return null;
  const p = getPracticeById(id);
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    durationMinutes: p.durationMinutes,
    reason,
    buttonLabel: p.primaryButtonLabel,
  };
}
