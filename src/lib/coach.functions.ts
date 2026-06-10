import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { selectGuidedPractice, type GuidedPracticeRec } from "@/lib/practices";

const SYSTEM_INSTRUCTIONS = `You are the Gorilla Mind AI Coach.

VOICE: Direct. Calm. Masculine. Disciplined. Practical. Safe.
- No fake hype. No corporate wellness tone. No therapy language.
- No soft generic phrases like "this is a common challenge", "you may be experiencing", "try to…", "consider…", "it might be helpful…", "improve your day".
- Use grounded coach phrasing instead, e.g.: "You do not need motivation. You need structure." / "Do not try to fix your whole life tonight." / "Win the next 20 minutes." / "The body leads. The mind follows." / "Tonight is about stopping the slide." / "Tomorrow starts tonight." / "You are not broken. You are under-led."
- Speak like a disciplined coach who cares, not a therapist, influencer, or productivity app.

You will receive an ACTIVE ROUTE selected by the backend's route detector. Treat it as authoritative. The retrieval query has already been issued against the Gorilla Mind knowledge base via file_search; ground your answer in those results.

You will also receive TEMPORAL CONTEXT (the user's local time, day part, session context) and a RESPONSE MODE. Obey them. Never recommend actions that contradict the user's local time.

TIME-OF-DAY RULES (hard):
- MORNING (dayPart=MORNING) → RESPONSE MODE MORNING_ACTIVATION. Immediate activation: water, breathwork, movement, protein, plan the day. If profile primaryGap mentions phone or wasted mornings, explicitly say to keep the phone away until the first actions are done.
- MIDDAY / AFTERNOON (dayPart=MIDDAY) → RESPONSE MODE AFTERNOON_RESCUE. One small body-first action, one work/life reset action, one evening-protection action.
- EVENING (dayPart=EVENING, localTime 18:00–21:30) → RESPONSE MODE EVENING_RESET. Do NOT prescribe a full workout unless the user asks. Do NOT tell the user to cook a full meal unless they say they have not eaten. Prefer: hydration, light walk only if relevant, shower, breathwork, phone boundary, clothes laid out, tomorrow's first action chosen, sleep protection. Close the day, prepare tomorrow.
- LATE_NIGHT (dayPart=LATE_NIGHT, or localTime after 21:30) → RESPONSE MODE LATE_NIGHT_SHUTDOWN. Shutdown mode. No intense exercise. No heavy meals unless the user says they have not eaten. Prioritise nervous-system downshift, phone away, hygiene, breathwork, sleep, and morning setup.

SAFETY — non-negotiable:
- You are not a doctor, therapist, or emergency service. Do not diagnose or treat.
- Never tell a user to stop, change, or withhold prescribed medication.
- Never give dangerous withdrawal advice. Never recommend breath holds in water.
- Never encourage unsafe cold exposure, overtraining through pain, or eating-disorder-unsafe behaviour.
- Never shame a relapse or missed day.
- If ACTIVE ROUTE is SAFETY_CRISIS: stop normal coaching. Reply calmly directing the user to local emergency services / crisis line / doctor.

GORILLA MINDSET PRINCIPLES (inherit, do not lecture):
- Consistency over intensity. Fundamentals over hacks. Standards over moods.
- Self-responsibility over motivation. One day at a time. No zero days.
- Minimums on hard days. Standards on normal days.
- Always end with a clear next action AND a concrete next reply option so the conversation can continue.

CONVERSATION RULES:
- Treat this as an ongoing thread. If a PRIOR CONVERSATION block is provided, continue from it — do not re-introduce, do not restart the diagnosis, build on the previous turn.
- Do NOT produce a 20/60/90-day plan unless ACTIVE ROUTE is GENERAL_TRANSFORMATION_REQUEST.
- Default answers are SHORT and action-led.

DEFAULT RESPONSE FORMAT (every non-crisis, non-GENERAL_LIFE_STUCK, non-GENERAL_TRANSFORMATION_REQUEST, non-PLAN_BUILDING response):

HEADLINE
WHAT'S HAPPENING
DO THIS NOW
TODAY'S NON-NEGOTIABLES
IF TIME IS LOW
COACH CLOSE
REPLY WITH

REPLY WITH must give the user a concrete next reply option (e.g. "Reply BUILD MY PLAN and I will give you tomorrow's first hour.").

=== GORILLA MIND LANGUAGE RULES (hard) ===
- Direct. Short. Punchy. Guided. No vague wellness language. No therapy tone. No corporate self-help.
- Every sentence either gives an order, names a standard, or sharpens identity. No filler.
- Speak in commands, not suggestions. Use second person. Cut adjectives.

BANNED PHRASES — never output these or any close paraphrase:
- "light exercise"
- "healthy food habit"
- "reflect on progress"
- "consider trying"
- "it might help"
- "improve your wellbeing"
- "guided imagery"
- "focus on consistency"

REQUIRED VOCABULARY — use these phrases naturally where they fit; at least 2 must appear in any PLAN_BUILDING response:
- Standard
- Protocol
- Body first
- Morning lock-in
- Minimum standard
- Identity reset
- No phone before protocol
- Train before negotiation
- Protein before chaos
- The body leads. The mind follows.

=== NUTRITION / CALORIE GUARDRAIL (hard) ===
- NEVER invent calorie targets, macro targets, or bodyweight projections.
- If the backend marks calorieSource as "not_available", you MUST refuse to give a number and instead ask the user for: age, sex, height (cm), weight (kg), activity level, primary goal. List these six fields explicitly. Then give the temporary non-calorie standard: protein-first, water before caffeine, one whole-food meal, no chaotic evening eating.
- If calorieSource is "calculated" or "profile", state the target with its source ("calculated from your profile via Mifflin-St Jeor" or "from saved profile") and the protein/fat/carbs split.

=== PLAN_BUILDING_SPEC (forced when RESPONSE MODE = PLAN_BUILDING) ===
When RESPONSE MODE is PLAN_BUILDING, you MUST use EXACTLY these section labels in this exact order, each on its own line as a header:

HEADLINE
THE STANDARD
YOUR FIRST 24 HOURS
MORNING PROTOCOL
TRAINING PLAN
BREATHWORK
MEDITATION
NUTRITION
WHAT I NEED FROM YOU
REPLY WITH

Section rules:
- HEADLINE — one line, direct, names the standard the user is being held to.
- THE STANDARD — 2–4 short lines. Name the non-negotiables. Use required vocabulary.
- YOUR FIRST 24 HOURS — numbered list, 5–7 items, exact and ordered. No vague verbs.
- MORNING PROTOCOL — ordered sequence with timing: water before phone, mineralised hydration if appropriate, morning daylight outside, breathwork, meditation/identity reset, movement, protein, one-line journal.
- TRAINING PLAN — exact 7-day structure with exercises, reps, sets, and rest. Refuse heavy prescriptions if injury / equipment / experience missing — say so and ask under WHAT I NEED FROM YOU.
- BREATHWORK — name the exact practice (e.g. Box Breathing 5 min, Extended Exhale 3 min). Match the GUIDED PRACTICE card word-for-word.
- MEDITATION — name the exact practice (e.g. Morning Identity Reset 5 min). Match the GUIDED PRACTICE card.
- NUTRITION — obey the calorie guardrail above. Either ask for the 6 fields or give a number with its source.
- WHAT I NEED FROM YOU — max 3 sharp questions. No soft questions.
- REPLY WITH — 2–4 single-word/short chips matching the route's continuation options (e.g. CALORIES / GYM PLAN / HOME PLAN / MORNING PROTOCOL).

Hard rules under PLAN_BUILDING: no banned phrases, no therapy tone, no "you may want to", no "this could help". Every section ends with an action or a question, never with reflection.

=== DAILY-OS BREVITY OVERRIDE (hard) ===
This coach is a Day-by-Day Protocol Operating System, not a weekly plan generator. For NORMAL daily coaching (any response where RESPONSE MODE is not PLAN_BUILDING and ACTIVE ROUTE is not GENERAL_TRANSFORMATION_REQUEST):
- Maximum length: 180 words. Emergency / drift / safety responses: max 220 words.
- Short, punchy, mobile-readable. No long paragraphs. No 7-day plans. No weekly forecasts. No broad future programmes.
- Every recommended action MUST include a short why/payoff line right after it (e.g. "This resets your nervous system." "This breaks the phone loop." "This steadies your energy.").
- Maximum 3 actions under DO THIS NOW. Each action: WHAT to do, WHEN to do it, WHY it helps.
- Replace the "REPLY WITH" section with a single short conversational "CHECK-IN" line telling the user what to report back in natural language (e.g. "Come back after the breathwork and tell me what changed — energy, mood, whether you moved."). Do NOT output rigid uppercase command chips like "DONE / LOW ENERGY / WORK RESET" as the reply menu for normal daily coaching.
- Use Gorilla Mind payoff language where relevant: "This resets your nervous system." / "This stops the spiral." / "This gets you out of drift." / "This gives you control of the next hour." / "This breaks the phone loop." / "This steadies your energy." / "The body leads. The mind follows."
- Preferred section labels for normal daily coaching: HEADLINE / READ / DO THIS NOW / TODAY'S STANDARD / GUIDED TOOL (when relevant) / CHECK-IN / COACH CLOSE. Keep each section to 1–3 short lines.
- The user replies in free text. Understand natural replies ("I've done it", "I'm low energy", "I'm at home with 20 minutes", "I'm still scrolling", "I need work reset") and continue the conversation from current context — do not restart the diagnosis.
- PLAN_BUILDING and GENERAL_TRANSFORMATION_REQUEST responses are unaffected by this override and may use the longer structure.`;


const ProfileSchema = z.object({
  name: z.string(),
  identityAnchor: z.string(),
  primaryGoal: z.string(),
  primaryGap: z.string(),
  chronicity: z.string(),
  trainingLevel: z.string(),
  gymAccess: z.string(),
  sleepQuality: z.string(),
  nutritionStatus: z.string(),
  bodyCompGoal: z.string(),
  alcoholFlag: z.boolean(),
  recoveryState: z.string(),
  processAddictionFlag: z.boolean(),
  foodBoundaryActive: z.boolean(),
  protocolDay: z.number(),
  readinessState: z.string(),
  currentStreak: z.number(),
  disciplinePoints: z.number(),
  // Top 21 access fields — optional for backwards compatibility with
  // older saved profiles.
  heatExposureAccess: z.string().optional(),
  coldExposureAccess: z.string().optional(),
  strengthTrainingAccess: z.string().optional(),
  pilatesMobilityAccess: z.string().optional(),
  identityProfile: z.object({
    userId: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().optional(),
    phoneNumber: z.string().optional(),
    authProvider: z.string().optional(),
    onboardingComplete: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }).nullable().optional(),
}).passthrough();

const JournalSchema = z.object({
  date: z.string(),
  mood: z.number(),
  energy: z.number(),
  stress: z.number(),
  sleep: z.number(),
  cravingLevel: z.number(),
  trainingCompleted: z.boolean(),
  nutritionCompleted: z.boolean(),
  morningProtocolCompleted: z.boolean(),
  eveningProtocolCompleted: z.boolean(),
  journalText: z.string(),
  patternFlags: z.array(z.string()),
});

const DailyProgressSchema = z.object({
  date: z.string(),
  breathworkCompleted: z.boolean(),
  meditationCompleted: z.boolean(),
  mindfulnessCompleted: z.boolean(),
  trainingCompleted: z.boolean(),
  pilatesCompleted: z.boolean(),
  mobilityCompleted: z.boolean(),
  nutritionCompleted: z.boolean(),
  coldExposureCompleted: z.boolean(),
  heatExposureCompleted: z.boolean(),
  journalCompleted: z.boolean(),
  guidedPracticeCompleted: z.boolean(),
  completedPracticeIdsToday: z.array(z.string()),
  disciplinePointsToday: z.number(),
  dailyMinimumMet: z.boolean(),
  fullProtocolCompleted: z.boolean(),
  practiceStreak: z.number().optional(),
  protocolStreak: z.number().optional(),
  lastCompletedPracticeId: z.string().nullable().optional(),
  lastCompletedPracticeCategory: z.string().nullable().optional(),
  // Top 21 derived state (optional — older saves may not have it).
  completedPillarIdsToday: z.array(z.string()).optional(),
  completedDailyActionKeysToday: z.array(z.string()).optional(),
  highPriorityPillarsCompletedToday: z.array(z.string()).optional(),
  unavailablePillars: z.array(z.string()).optional(),
  assignedPillars: z.array(z.string()).optional(),
  dailyMinimumCount: z.number().optional(),
  highPriorityMinimumCount: z.number().optional(),
  protocolStreakEligible: z.boolean().optional(),
}).passthrough();

type Profile = z.infer<typeof ProfileSchema>;
type Journal = z.infer<typeof JournalSchema>;
type DailyProgressCtx = z.infer<typeof DailyProgressSchema>;


export type CoachRoute =
  | "SAFETY_CRISIS"
  | "MISSED_MORNING"
  | "MISSED_DAY_REPAIR"
  | "SLEEP_WIND_DOWN"
  | "BREATHWORK"
  | "MEDITATION_MINDFULNESS"
  | "TRAINING"
  | "PILATES"
  | "MOBILITY"
  | "RECOVERY_DAY"
  | "NUTRITION_MEAL"
  | "SOBRIETY_CRAVING"
  | "PROCESS_ADDICTION"
  | "COLD_EXPOSURE"
  | "HEAT_EXPOSURE"
  | "EVENING_REVIEW"
  | "DISCIPLINE_POINTS_STREAK"
  | "IDENTITY_MINDSET"
  | "GENERAL_LIFE_STUCK"
  | "GENERAL_TRANSFORMATION_REQUEST"
  | "GENERAL_COACHING"
  | "CONTINUATION_FITNESS_PLAN"
  | "CONTINUATION_JOB_PLAN"
  | "CONTINUATION_BOTH_PLAN"
  | "CONTINUATION_BUILD_MY_PLAN"
  | "CONTINUATION_RESET_NOW"
  | "CONTINUATION_MINIMUM_STANDARD"
  | "CONTINUATION_MORNING_SETUP"
  // Exercise Prescription Engine
  | "FITNESS_PLAN_REQUEST"
  | "FITNESS_ROUTINE_BUILDER"
  | "FULL_REBUILD_PLAN"
  | "CORE_BACK_SUPPORT_PLAN"
  | "GYM_STRENGTH_PLAN"
  | "RUNNING_STARTER_PLAN"
  | "HOME_BODYWEIGHT_PLAN"
  | "PILATES_CORE_PLAN"
  | "LOW_ENERGY_SESSION"
  | "INTERMEDIATE_FITNESS_PLAN"
  // Daily OS routes
  | "PROGRAM_REQUEST"
  | "BREATHWORK_MEDITATION_REQUEST"
  | "MORNING_PROTOCOL_REQUEST"
  | "NUTRITION_CALORIE_REQUEST"
  // Real-world intent routes
  | "LOW_ENERGY_MINIMUM_PLAN"
  | "FAT_LOSS_STARTER_PLAN"
  | "EVENING_WORK_PROTOCOL"
  | "STRESS_RESET"
  // Recovery-aware routes (Onboarding + Profile Engine)
  | "URGE_RESET"
  | "RELAPSE_PREVENTION"
  | "POST_RELAPSE_REPAIR"
  | "RECOVERY_STRUCTURE"
  | "SAFETY_SUPPORT";

export type ContinuationCommand =
  | "FITNESS"
  | "JOB"
  | "BOTH"
  | "BUILD_MY_PLAN"
  | "RESET"
  | "MINIMUM_STANDARD"
  | "MORNING"
  | "HOME"
  | "GYM"
  | "RUNNING"
  | "PILATES"
  | "LOW_ENERGY"
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "CALORIES"
  | "GYM_PLAN"
  | "HOME_PLAN"
  | "MORNING_PROTOCOL"
  | "FAT_LOSS"
  | "MUSCLE"
  | "ALL_ROUND_RESET"
  | "NONE";

// ---------- Exercise Prescription Engine — classification types ----------
export type FitnessGoal =
  | "fat_loss" | "muscle_building" | "general_fitness" | "strength"
  | "running" | "mobility" | "core_strength" | "back_support"
  | "confidence" | "all_round_reset" | "unknown";
export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "unknown";
export type TrainingLocation = "home" | "gym" | "outdoors" | "mixed" | "unknown";
export type Equipment = "none" | "dumbbells" | "resistance_bands" | "full_gym" | "cardio_machine" | "unknown";
export type InjuryFlag = "none" | "back_pain" | "knee_pain" | "shoulder_pain" | "mobility_limited" | "unknown";
export type AvailableTime = "10_minutes" | "20_minutes" | "30_minutes" | "45_minutes" | "60_minutes" | "unknown";
export type EnergyLevelTag = "low" | "moderate" | "high" | "unknown";
export type PreferredStyle = "weights" | "pilates" | "running" | "walking" | "bodyweight" | "mobility" | "mixed" | "unknown";

export type FitnessClassification = {
  fitnessGoal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  trainingLocation: TrainingLocation;
  equipment: Equipment;
  injuryFlag: InjuryFlag;
  availableTime: AvailableTime;
  energyLevel: EnergyLevelTag;
  preferredStyle: PreferredStyle;
};

export type GuidedWorkoutRecommendation = {
  id: string;
  title: string;
  category: "home_bodyweight" | "gym_strength" | "pilates_core" | "running" | "mobility" | "low_energy";
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced";
  reason: string;
  buttonLabel: string;
};

export type BreathworkSubRoute =
  | "DOWNREGULATE"
  | "FOCUS"
  | "ENERGISE"
  | "WIND_DOWN"
  | "NONE";

export type DayPart = "MORNING" | "MIDDAY" | "EVENING" | "LATE_NIGHT";

export type SessionContext =
  | "MORNING_CHECK_IN"
  | "DAILY_PLAN"
  | "MIDDAY_COURSE_CORRECTION"
  | "PRE_TRAINING"
  | "POST_TRAINING"
  | "EVENING_REVIEW"
  | "WIND_DOWN"
  | "LATE_NIGHT_SLEEP_PROTECTION"
  | "MISSED_DAY_REPAIR"
  | "GENERAL_LIFE_STUCK"
  | "GENERAL_TRANSFORMATION_REQUEST"
  | "SAFETY_OR_BOUNDARY";

const TemporalSchema = z.object({
  localDate: z.string(),
  localTime: z.string(),
  timezone: z.string(),
  dayOfWeek: z.string(),
  dayPart: z.enum(["MORNING", "MIDDAY", "EVENING", "LATE_NIGHT"]),
  sessionContext: z.enum([
    "MORNING_CHECK_IN",
    "DAILY_PLAN",
    "MIDDAY_COURSE_CORRECTION",
    "PRE_TRAINING",
    "POST_TRAINING",
    "EVENING_REVIEW",
    "WIND_DOWN",
    "LATE_NIGHT_SLEEP_PROTECTION",
    "MISSED_DAY_REPAIR",
    "GENERAL_LIFE_STUCK",
    "GENERAL_TRANSFORMATION_REQUEST",
    "SAFETY_OR_BOUNDARY",
  ]),
});
export type TemporalContext = z.infer<typeof TemporalSchema>;

export type ResponseMode =
  | "MORNING_ACTIVATION"
  | "AFTERNOON_RESCUE"
  | "EVENING_RESET"
  | "LATE_NIGHT_SHUTDOWN"
  | "PLAN_BUILDING"
  | "LOW_ENERGY_MINIMUM"
  | "EVENING_PROTOCOL"
  | "RESET_RECOVERY"
  | "STRESS_RESET"
  | "PROCESS_RESET"
  | "SLEEP_WIND_DOWN"
  | "URGE_RESET"
  | "RELAPSE_PREVENTION"
  | "POST_RELAPSE_REPAIR"
  | "RECOVERY_STRUCTURE"
  | "SAFETY_SUPPORT";

export type CoachDebug = {
  selectedRoute: CoachRoute;
  breathworkSubRoute: BreathworkSubRoute;
  routeReason: string;
  retrievalQuery: string;
  fileSearchCalled: boolean;
  vectorStoreId: string | null;
  retrievedChunksCount: number;
  retrievedFilenames: string[];
  retrievedPreviews: string[];
  groundedInRetrieval: boolean;
  apiError: string | null;
  model: string;
  profileContextSent: boolean;
  latestJournalSent: boolean;
  primaryGapUsed: string | null;
  protocolDayUsed: number | null;
  safetyFlagsUsed: string[];
  guidedPracticeId: string | null;
  guidedPracticeReason: string | null;
  localDate: string | null;
  localTime: string | null;
  timezone: string | null;
  dayOfWeek: string | null;
  dayPart: DayPart | null;
  sessionContext: SessionContext | null;
  temporalSource: "client" | "fallback";
  timeBasedRouteReason: string | null;
  responseMode: ResponseMode;
  conversationContinuation: boolean;
  userCanReply: boolean;
  quickRepliesShown: boolean;
  retrievalSuppressedVolumes: string[];
  reasonForSuppression: string | null;
  previousCoachReplyOptions: string[];
  userContinuationCommandDetected: boolean;
  continuationCommand: ContinuationCommand;
  routeOverrideApplied: boolean;
  routeOverrideReason: string | null;
  selectedRouteBeforeOverride: CoachRoute | null;
  selectedRouteAfterOverride: CoachRoute | null;
  duplicateAdviceSuppressed: boolean;
  suppressedAdvice: string[];
  // Exercise Prescription Engine
  fitnessGoal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  trainingLocation: TrainingLocation;
  equipment: Equipment;
  injuryFlag: InjuryFlag;
  availableTime: AvailableTime;
  energyLevel: EnergyLevelTag;
  preferredStyle: PreferredStyle;
  exerciseRoute: CoachRoute | null;
  guidedWorkoutRecommendation: GuidedWorkoutRecommendation | null;
  exercisePersonalisationMissing: string[];
  exerciseContinuationDetected: boolean;
  exercisePlanSource: string | null;
  exerciseKnowledgeUsed: boolean;
  safetyModificationApplied: boolean;
  // Gorilla Mind Daily OS
  selectedPillars: string[];
  pillarReasoning: string;
  activePlanType: string | null;
  activePlanLength: string | null;
  guidedPracticeRecommendation: GuidedPracticeRecommendation | null;
  breathworkPrescription: BreathworkPrescription | null;
  calorieTargetUsed: number | null;
  calorieSource: "profile" | "calculated" | "not_available";
  calorieMissingFields: string[];
  macroTargetUsed: { proteinG: number; carbsG: number; fatG: number } | null;
  programmePersonalisationMissing: string[];
  knowledgeBaseVolumesUsed: string[];
  genericFallbackUsed: boolean;
  genericFallbackReason: string | null;
  // Real-world routing diagnostics
  intentDetected: string | null;
  routePriorityReason: string | null;
  profileOverrideSuppressed: boolean;
  profileOverrideSuppressedReason: string | null;
  morningFillerSuppressed: boolean;
  responseModeReason: string | null;
  // Onboarding / recovery awareness
  currentSituation: string[];
  primaryStruggle: string[];
  controlLevel: string | null;
  supportStatus: string | null;
  needsFromCoach: string[];
  addictionRiskFlag: string | null;
  compulsionTypes: string[];
  relapseRisk: string | null;
  preferredSupportTone: string | null;
  nutritionMode: string | null;
  currentEatingIssue: string | null;
  preferredNutritionStyle: string | null;
  wantsCaloriesMacros: string | null;
  safetyRouteTriggered: boolean;
  recoveryRoute: string | null;
  triggerDetected: string | null;
  urgeSupportShown: boolean;
  professionalSupportSuggested: boolean;
  profileCompletenessScore: number | null;
  missingProfileFields: string[];
};

export type GuidedPracticeRecommendation = {
  id: string;
  title: string;
  category: "breathwork" | "meditation" | "morning_protocol" | "sleep" | "cold_water" | "mobility";
  durationMinutes: number;
  reason: string;
  buttonLabel: string;
};

export type ProgramState = {
  activePlanType: string | null;
  activePlanLength: string | null;
  selectedFitnessLevel: string | null;
  selectedBreathwork: string | null;
  selectedMeditation: string | null;
  selectedMorningProtocol: string | null;
  missingPersonalisationFields: string[];
  lastRecommendedGuidedPractice: string | null;
  lastProgrammeRoute: CoachRoute | null;
};

export type CoachResponse = {
  answer: string;
  debug: CoachDebug;
  guidedPractice: GuidedPracticeRec | null;
  guidedWorkout: GuidedWorkoutRecommendation | null;
  quickReplies: string[];
  programState: ProgramState;
};

const HistoryTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});
export type CoachHistoryTurn = z.infer<typeof HistoryTurnSchema>;


const SAFETY_PATTERNS = [
  /\bsuicid/i, /\bkill myself\b/i, /\bend (my|it all) life\b/i, /\bself.?harm\b/i,
  /\boverdose\b/i, /\bOD\b/, /\bwithdraw(al|ing)\b/i, /\bdetox\b/i,
  /\bchest pain\b/i, /\bcan'?t breathe\b/i, /\bfaint(ing)?\b/i, /\bemergency\b/i,
  /\bharm (myself|others)\b/i,
];

function hasMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function detectBreathworkSubRoute(
  message: string,
  profile: Profile | null,
  journal: Journal | null,
): { sub: BreathworkSubRoute; reason: string; query: string } {
  const m = message.toLowerCase();
  const downregulate = /(stress|stressed|wired|anxious|anxiety|overwhelm|racing thoughts|activated|panicky|panic|can'?t switch off|cannot switch off|on edge|tense)/i.test(message);
  const windDown = /(sleep|evening|night|wind ?down|bedtime|scrolling at night|before bed)/i.test(message);
  const energise = /(tired|flat|low energy|foggy|brain fog|sluggish|struggling to activate|need energy|wake up)/i.test(message);
  const focus = /(unfocused|scattered|distracted|mentally noisy|can'?t focus|cannot focus|focus)/i.test(message);

  // Safety gate for energising: don't recommend intense breathwork if poor sleep / panic / medical risk
  const poorSleep = (journal && journal.sleep < 6) || /(slept badly|poor sleep|no sleep|bad sleep)/i.test(message);
  const medicalRisk = /(chest pain|dizzy|dizziness|faint|pregnan|heart|cardiac)/i.test(message);

  if (downregulate) {
    return {
      sub: "DOWNREGULATE",
      reason: "User reports stress / wired / anxious / overwhelmed / racing thoughts — needs down-regulating protocol (extended exhale or coherent breathing), not box breathing or breath holds.",
      query: "down regulate breathwork extended exhale coherent breathing nasal slow exhale parasympathetic stress anxiety wired calm physiological sigh",
    };
  }
  if (windDown) {
    return {
      sub: "WIND_DOWN",
      reason: "User mentions sleep / evening / wind-down — needs calming nasal extended-exhale breathwork, no intense breath holds.",
      query: "wind down breathwork evening nasal extended exhale slow breathing pre sleep calming parasympathetic no breath holds",
    };
  }
  if (energise && !poorSleep && !medicalRisk) {
    return {
      sub: "ENERGISE",
      reason: "User reports tired / flat / low energy without poor-sleep or medical risk flags — energising protocol acceptable within safety limits.",
      query: "energising breathwork morning activation safe controlled nasal breathing arousal alertness no intense breath holds contraindications",
    };
  }
  if (energise && (poorSleep || medicalRisk)) {
    return {
      sub: "DOWNREGULATE",
      reason: "User reports tired/flat but also poor sleep or medical risk flag — intense breathwork is unsafe. Default to gentle down-regulating protocol.",
      query: "gentle breathwork poor sleep safety contraindications nasal slow breathing recovery no intense breath holds",
    };
  }
  if (focus) {
    return {
      sub: "FOCUS",
      reason: "User reports unfocused / scattered / mentally noisy but not panicked — box breathing or coherent breathing fits.",
      query: "focus breathwork box breathing coherent breathing 4 4 4 4 concentration mental clarity nasal",
    };
  }
  return {
    sub: "DOWNREGULATE",
    reason: "No specific breathwork sub-signal — default to safe down-regulating coherent / extended-exhale breathing rather than box breathing.",
    query: "general breathwork coherent breathing extended exhale nasal safe default protocol",
  };
}

// ---------- Exercise Prescription Engine helpers ----------

export function classifyFitness(message: string, profile: Profile | null, journal: Journal | null): FitnessClassification {
  const m = message.toLowerCase();
  const goal: FitnessGoal =
    /\b(fat loss|lose fat|cut|weight loss)\b/.test(m) ? "fat_loss" :
    /\b(muscle|hypertrophy|build muscle|bulk|gain mass)\b/.test(m) ? "muscle_building" :
    /\b(strength|strong|stronger|lift heavy)\b/.test(m) ? "strength" :
    /\b(run|running|5k|10k|jog)\b/.test(m) ? "running" :
    /\b(bad back|back pain|strengthen.*back)\b/.test(m) ? "back_support" :
    /\b(core|abs)\b/.test(m) ? "core_strength" :
    /\b(mobility|flexibility|stiff)\b/.test(m) ? "mobility" :
    /\b(confidence|reset|start over|get back)\b/.test(m) ? "all_round_reset" :
    /\b(fit|fitness|get in shape|exercise|workout)\b/.test(m) ? "general_fitness" : "unknown";

  const level: FitnessLevel =
    /\b(advanced|experienced|years of training)\b/.test(m) ? "advanced" :
    /\b(intermediate|already train|been training)\b/.test(m) ? "intermediate" :
    /\b(beginner|never trained|new to|just starting|out of shape)\b/.test(m) ? "beginner" :
    (profile?.trainingLevel === "beginner" || profile?.trainingLevel === "intermediate" || profile?.trainingLevel === "advanced") ? (profile.trainingLevel as FitnessLevel) : "unknown";

  const location: TrainingLocation =
    /\b(gym|weights room)\b/.test(m) ? "gym" :
    /\b(home|at home|from home|no gym|no equipment)\b/.test(m) ? "home" :
    /\b(outdoor|outside|park|trail)\b/.test(m) ? "outdoors" :
    /\b(mixed|both)\b/.test(m) ? "mixed" :
    (profile?.gymAccess === "full" || profile?.gymAccess === "yes") ? "gym" :
    (profile?.gymAccess === "none") ? "home" : "unknown";

  const equipment: Equipment =
    /\b(full gym|barbell|rack|machines)\b/.test(m) ? "full_gym" :
    /\b(dumbbell)\b/.test(m) ? "dumbbells" :
    /\b(band|resistance band)\b/.test(m) ? "resistance_bands" :
    /\b(treadmill|bike|rower|cardio machine)\b/.test(m) ? "cardio_machine" :
    /\b(no equipment|bodyweight|nothing)\b/.test(m) ? "none" :
    location === "gym" ? "full_gym" : location === "home" ? "none" : "unknown";

  const injury: InjuryFlag =
    /\b(bad back|back pain|lower back|sciatic|herniat)\b/.test(m) ? "back_pain" :
    /\b(knee|knees)\b/.test(m) ? "knee_pain" :
    /\b(shoulder)\b/.test(m) ? "shoulder_pain" :
    /\b(stiff|mobility limited|tight everywhere)\b/.test(m) ? "mobility_limited" :
    /\b(no injury|no pain|nothing wrong)\b/.test(m) ? "none" : "unknown";

  const time: AvailableTime =
    /\b10\s*(min|minutes)\b/.test(m) ? "10_minutes" :
    /\b20\s*(min|minutes)\b/.test(m) ? "20_minutes" :
    /\b30\s*(min|minutes)\b/.test(m) ? "30_minutes" :
    /\b45\s*(min|minutes)\b/.test(m) ? "45_minutes" :
    /\b(60|an hour|hour)\b/.test(m) ? "60_minutes" : "unknown";

  const energy: EnergyLevelTag =
    /\b(low energy|tired|drained|flat|exhausted|wiped)\b/.test(m) ? "low" :
    /\b(high energy|energised|fired up|fresh)\b/.test(m) ? "high" :
    /\b(moderate|ok|fine|normal)\b/.test(m) ? "moderate" :
    (journal && journal.energy <= 3 ? "low" : journal && journal.energy >= 7 ? "high" : "unknown");

  const style: PreferredStyle =
    /\b(weights|lift|lifting|strength training)\b/.test(m) ? "weights" :
    /\bpilates\b/.test(m) ? "pilates" :
    /\b(run|running|jog)\b/.test(m) ? "running" :
    /\b(walk|walking)\b/.test(m) ? "walking" :
    /\b(bodyweight|calisthenic)\b/.test(m) ? "bodyweight" :
    /\b(mobility|stretch|yoga)\b/.test(m) ? "mobility" :
    /\b(mixed|variety)\b/.test(m) ? "mixed" : "unknown";

  return {
    fitnessGoal: goal, fitnessLevel: level, trainingLocation: location, equipment,
    injuryFlag: injury, availableTime: time, energyLevel: energy, preferredStyle: style,
  };
}

// Daily-OS program-level detector — runs BEFORE narrower detectors. Catches
// broad plan/routine/morning-protocol/nutrition-calorie/breathwork+meditation
// asks and routes them at the program level so the coach builds a real plan
// instead of falling into a generic chat route.
function detectProgramRoute(message: string): { route: CoachRoute; reason: string; query: string } | null {
  const m = message.toLowerCase();
  const fullRebuild =
    /\b(fitness|exercise|workout|train).+(meditat|breath)|breath.+\b(fitness|exercise)|full reset.*fitness/.test(m)
    || /\brecommend (a|me)?\s*(fitness|training|workout|exercise)?\s*plan\b.*\b(meditat|breath)/.test(m)
    || /\b(build me a|build my|give me my|create my|make me a)\s+(full|complete|7.?day|seven.?day|daily|whole)?\s*(plan|routine|programme|program|system|protocol|reset|rebuild)\b/.test(m)
    || /\bwhat should i do every day\b/.test(m)
    || /\bdiscipline system\b/.test(m)
    || /\bfull(\s| )?(reset|rebuild|plan)\b/.test(m)
    || /\b(i want|need)\s+(a\s+)?(fitness|mindset|morning|daily)\s+plan\b/.test(m);
  if (fullRebuild) {
    return {
      route: "FULL_REBUILD_PLAN",
      reason: "Program-level rebuild signal — body-first 7-day rebuild with morning lock-in, fitness, breathwork, meditation, nutrition.",
      query: "gorilla mind top 21 pillars morning protocol fitness plan beginner breathwork meditation identity protein sleep weekly structure daily operating system",
    };
  }
  if (/\bmorning (protocol|routine|lock.?in)\b/.test(m) || /\b(fix|reset).*morning\b/.test(m) || /\bhow (do|to) (i\s+)?start (the|my)\s*day\b/.test(m) || /\bfirst hour\b/.test(m) || /\bstop wasting mornings\b/.test(m)) {
    return {
      route: "MORNING_PROTOCOL_REQUEST",
      reason: "Explicit morning-protocol / first-hour request — ordered MORNING LOCK-IN sequence with guided card.",
      query: "morning protocol lock in water phone away daylight box breathing identity reset walk protein journal",
    };
  }
  if (/\bbreath ?work.*\b(meditat|mindful)\b|\bmeditat.*\bbreath ?work\b|nervous system.*(calm|regulate)/.test(m) || /\b(stress|anxiety|focus|stillness).*plan\b/.test(m)) {
    return {
      route: "BREATHWORK_MEDITATION_REQUEST",
      reason: "Combined breathwork + meditation / nervous-system regulation request.",
      query: "breathwork box breathing extended exhale meditation morning identity reset nervous system regulation sleep",
    };
  }
  if (/\b(calorie|calories|macro|macros|meal plan|food plan|fat loss nutrition|protein target|diet)\b/.test(m)) {
    return {
      route: "NUTRITION_CALORIE_REQUEST",
      reason: "Nutrition / calorie / macro / diet request — strict guardrails, never invent calories.",
      query: "nutrition calorie target protein macro Mifflin TDEE fat loss muscle gain meal structure",
    };
  }
  return null;
}

function detectFitnessRoute(message: string, fc: FitnessClassification): { route: CoachRoute; reason: string; query: string } | null {
  const m = message.toLowerCase();
  // Explicit injury / back / core / pilates / mobility intent — must beat
  // profile-derived routes like SLEEP_WIND_DOWN even when standard fitness
  // verbs are absent.
  const backCoreIntent = fc.injuryFlag === "back_pain" || /\b(bad back|back pain|lower back|sciatica|spine|strengthen.*(core|back)|core (strength|from home|support)|mobility for back|back support|pilates)\b/.test(m);
  const exerciseIntent = backCoreIntent || /\b(exercise|workout|train|training|fit|fitness|routine|plan|lift|run|running|pilates|gym|cardio|movement)\b/.test(m);
  if (!exerciseIntent) return null;

  // Full rebuild signal: fitness + meditation + breathwork together
  if (/\b(fitness|exercise|workout|train).+\b(meditat|breath)|breath.+\b(fitness|exercise)|full reset.*fitness/.test(m)) {
    return {
      route: "FULL_REBUILD_PLAN",
      reason: "User requested combined fitness + meditation/breathwork — full rebuild plan.",
      query: "gorilla mind morning protocol fitness plan beginner breathwork meditation identity protein sleep weekly structure",
    };
  }
  // Bad back / core
  if (backCoreIntent) {
    return {
      route: "CORE_BACK_SUPPORT_PLAN",
      reason: "Back pain / core support intent — low-impact Pilates-style core routine, no aggressive loading. Overrides profile-derived sleep/evening routes.",
      query: "core back support pilates dead bug glute bridge bird dog side plank pelvic tilt safe lower back rehabilitation",
    };
  }
  // Gym / weights
  if (fc.trainingLocation === "gym" || /\b(gym|weights|lift|barbell|dumbbell)\b/.test(m)) {
    return {
      route: "GYM_STRENGTH_PLAN",
      reason: "Gym access / weights intent — full-body strength prescription.",
      query: "full body gym strength beginner intermediate squat hinge press row plank rep ranges technique RPE",
    };
  }
  // Running
  if (fc.preferredStyle === "running" || /\b(run|running|5k|10k|jog|cardio)\b/.test(m)) {
    return {
      route: "RUNNING_STARTER_PLAN",
      reason: "Running intent — run/walk interval starter prescription.",
      query: "beginner running run walk intervals couch to 5k joint readiness nasal breathing cadence",
    };
  }
  // Pilates / mobility
  if (fc.preferredStyle === "pilates" || /\bpilates\b/.test(m)) {
    return {
      route: "PILATES_CORE_PLAN",
      reason: "Pilates / core / mobility intent.",
      query: "pilates core mobility beginner control breathing pelvic tilt bird dog dead bug",
    };
  }
  // Low energy / short time
  if (fc.energyLevel === "low" || fc.availableTime === "10_minutes" || fc.availableTime === "20_minutes" && /\blow\b/.test(m)) {
    return {
      route: "LOW_ENERGY_SESSION",
      reason: "Low energy / short time — minimum standard session.",
      query: "low energy minimum standard short session walk squats glute bridge plank breathing recovery day",
    };
  }
  // Home / bodyweight
  if (fc.trainingLocation === "home" || /\b(home|bodyweight|no equipment)\b/.test(m)) {
    return {
      route: "HOME_BODYWEIGHT_PLAN",
      reason: "Home / bodyweight intent.",
      query: "home bodyweight beginner circuit squat press up glute bridge plank hip hinge weekly structure",
    };
  }
  // Intermediate explicit
  if (fc.fitnessLevel === "intermediate" || fc.fitnessLevel === "advanced") {
    return {
      route: "INTERMEDIATE_FITNESS_PLAN",
      reason: "Intermediate/advanced level — progression-oriented weekly structure.",
      query: "intermediate fitness weekly structure full body strength zone 2 mobility conditioning progression",
    };
  }
  // Default: routine builder
  return {
    route: "FITNESS_ROUTINE_BUILDER",
    reason: "Generic fitness request — lead with a safe starter session, then ask HOME / GYM / RUNNING / PILATES.",
    query: "beginner fitness routine bodyweight starter session safe minimum standard weekly structure",
  };
}

function buildWorkoutForRoute(route: CoachRoute, fc: FitnessClassification): GuidedWorkoutRecommendation | null {
  switch (route) {
    case "HOME_BODYWEIGHT_PLAN":
    case "FITNESS_ROUTINE_BUILDER":
    case "FULL_REBUILD_PLAN":
      return {
        id: "beginner_home_reset_20", title: "Beginner Home Reset",
        category: "home_bodyweight", durationMinutes: 20, level: "beginner",
        reason: "Best for a low-friction first session without equipment.",
        buttonLabel: "Start Home Reset",
      };
    case "CORE_BACK_SUPPORT_PLAN":
    case "PILATES_CORE_PLAN":
      return {
        id: "core_back_support_15", title: "Core & Back Support",
        category: "pilates_core", durationMinutes: 15, level: "beginner",
        reason: "Best for building core control without aggressive loading.",
        buttonLabel: "Start Core Support",
      };
    case "GYM_STRENGTH_PLAN":
      return {
        id: "full_body_gym_45", title: "Full-Body Gym Standard",
        category: "gym_strength", durationMinutes: 45,
        level: fc.fitnessLevel === "intermediate" || fc.fitnessLevel === "advanced" ? "intermediate" : "beginner",
        reason: "Best for building strength, confidence and fitness with controlled loading.",
        buttonLabel: "Start Gym Standard",
      };
    case "RUNNING_STARTER_PLAN":
      return {
        id: "run_walk_foundation_25", title: "Run-Walk Foundation",
        category: "running", durationMinutes: 25, level: "beginner",
        reason: "Best for building running capacity without overloading joints.",
        buttonLabel: "Start Run-Walk",
      };
    case "LOW_ENERGY_SESSION":
    case "LOW_ENERGY_MINIMUM_PLAN":
      return {
        id: "low_energy_minimum_15", title: "Low Energy Minimum",
        category: "low_energy", durationMinutes: 15, level: "beginner",
        reason: "Best for tired, low-motivation days when the user needs to keep the standard alive without forcing a full session.",
        buttonLabel: "Start Minimum Session",
      };
    case "INTERMEDIATE_FITNESS_PLAN":
      return {
        id: "full_body_intermediate_45", title: "Intermediate Full-Body",
        category: "gym_strength", durationMinutes: 45, level: "intermediate",
        reason: "Best for progressing strength and conditioning with controlled volume.",
        buttonLabel: "Start Intermediate Session",
      };
    default:
      return null;
  }
}

const FITNESS_PERSONALISATION_QUESTIONS: Record<string, string> = {
  trainingLocation: "Where are you training: home, gym, or outdoors?",
  availableTime: "How much time today: 10, 20, 30, or 45 minutes?",
  energyLevel: "Current energy: low, moderate, or high?",
  injuryFlag: "Any pain or injuries I should work around?",
  fitnessGoal: "Goal: fat loss, muscle, fitness, confidence, or all-round reset?",
  preferredStyle: "Do you want weights, running, Pilates/core, or bodyweight?",
};

function exercisePersonalisationMissing(fc: FitnessClassification): string[] {
  const missing: string[] = [];
  if (fc.trainingLocation === "unknown") missing.push("trainingLocation");
  if (fc.availableTime === "unknown") missing.push("availableTime");
  if (fc.energyLevel === "unknown") missing.push("energyLevel");
  if (fc.injuryFlag === "unknown") missing.push("injuryFlag");
  if (fc.fitnessGoal === "unknown") missing.push("fitnessGoal");
  if (fc.preferredStyle === "unknown") missing.push("preferredStyle");
  return missing.slice(0, 3);
}

const FITNESS_ROUTES: Set<CoachRoute> = new Set([
  "FITNESS_PLAN_REQUEST", "FITNESS_ROUTINE_BUILDER", "FULL_REBUILD_PLAN",
  "CORE_BACK_SUPPORT_PLAN", "GYM_STRENGTH_PLAN", "RUNNING_STARTER_PLAN",
  "HOME_BODYWEIGHT_PLAN", "PILATES_CORE_PLAN", "LOW_ENERGY_SESSION",
  "INTERMEDIATE_FITNESS_PLAN", "LOW_ENERGY_MINIMUM_PLAN", "FAT_LOSS_STARTER_PLAN",
]);

// Real-world intent detection — runs early so realistic prompts route correctly
// before they get hoovered up by GENERAL_LIFE_STUCK or profile.sleepQuality.
function detectRealWorldIntent(message: string): { intent: string; route: CoachRoute; reason: string; query: string } | null {
  const m = message.toLowerCase();

  // ---- Recovery-aware checks (added by Onboarding + Profile Engine) ----
  // These use distinct keywords ("urge", "relapsed", etc.) and do NOT
  // overlap with existing routes. Inserted at the top of RWI, AFTER
  // SAFETY_CRISIS (handled upstream in detectRoute) but BEFORE the
  // legacy PROCESS_ADDICTION check.

  // POST_RELAPSE_REPAIR — past-tense relapse / messed up.
  if (/\b(i relapsed|i drank|i used (last|again|yesterday)|i gambled|i binged|i messed up|i failed (last night|yesterday|again))\b/.test(m)) {
    return { intent: "POST_RELAPSE", route: "POST_RELAPSE_REPAIR", reason: "Past-tense relapse / repair moment.", query: "post relapse repair no shame return to standard recovery support contact small action" };
  }
  // RELAPSE_PREVENTION — worried / close to / not safe / about to.
  if (/\b(worried i('| wi)?ll relapse|going to relapse|about to (drink|use|gamble|binge)|close to (drinking|using|gambling|relapse)|not safe around (my )?triggers?|slipping (badly|hard))\b/.test(m)) {
    return { intent: "RELAPSE_PREVENTION", route: "RELAPSE_PREVENTION", reason: "Danger window / relapse risk.", query: "relapse prevention danger window remove trigger contact support delay urge ten minute rule" };
  }
  // URGE_RESET — present-tense urge / craving.
  if (/\b(i have an urge|i'?m having an urge|i want to (drink|use|gamble|scroll|binge)|i'?m triggered|i feel triggered|craving (right now|hard))\b/.test(m)) {
    return { intent: "URGE_RESET", route: "URGE_RESET", reason: "Active urge / craving.", query: "urge reset delay distance breathwork extended exhale contact support ten minute rule" };
  }
  // RECOVERY_STRUCTURE — explicit recovery structure ask.
  if (/\b(i'?m in recovery|i need (a )?(daily )?structure|rebuild discipline|recovery (plan|structure|routine))\b/.test(m)) {
    return { intent: "RECOVERY_STRUCTURE", route: "RECOVERY_STRUCTURE", reason: "Recovery structure ask.", query: "recovery structure morning daylight breathwork walk protein journal phone away sleep support" };
  }

  // PROCESS_ADDICTION (phone / scrolling / wasted morning) — check first so
  // "wasted the whole morning on my phone" stays here.
  if (/\b(wasted (the |my )?(whole )?morning on (my )?phone|doomscroll|scrolling|phone hijack|phone in bed)\b/.test(m)) {
    return { intent: "PROCESS_ADDICTION", route: "PROCESS_ADDICTION", reason: "Phone / scrolling / wasted-morning signal.", query: "process addiction phone scrolling urge interruption replacement morning protocol" };
  }
  // MISSED_DAY_REPAIR
  if (/\b(missed yesterday|missed a day|fallen off|fell off|failed yesterday|skipped yesterday|lost my streak|back on track|broken streak)\b/.test(m)) {
    return { intent: "MISSED_DAY", route: "MISSED_DAY_REPAIR", reason: "Missed-day / fell-off language.", query: "missed day repair broken streak no shame minimum standard restart identity anchor" };
  }
  // EVENING_WORK_PROTOCOL
  if (/\b(working late tonight|work(ing)? late|late shift|finishing late|long day at work|tonight what should i do|got home late|home late|after work tonight)\b/.test(m)) {
    return { intent: "EVENING_WORK", route: "EVENING_WORK_PROTOCOL", reason: "Working late / evening shutdown intent.", query: "evening shutdown protocol late work protein shower extended exhale phone away morning setup sleep" };
  }
  // FAT_LOSS / NUTRITION
  if (/\b(lose fat|fat loss|lose weight|weight loss|cut body fat|belly fat|calories|macros|diet|meal plan|food plan|what should i eat|what to eat|eat today|food today|meals today|what food)\b/.test(m)) {
    return { intent: "FAT_LOSS", route: "FAT_LOSS_STARTER_PLAN", reason: "Fat loss / nutrition intent.", query: "fat loss nutrition calorie target protein Mifflin TDEE meal structure water before caffeine" };
  }
  // STRESS_RESET
  if (/\b(stressed|head is all over the place|overwhelmed|anxious|can'?t think|wired|panicking|panic|racing thoughts)\b/.test(m)) {
    return { intent: "STRESS", route: "STRESS_RESET", reason: "Stress / overwhelmed / racing thoughts intent.", query: "stress reset extended exhale breathwork nervous system regulate downregulate journal" };
  }
  // GYM_STRENGTH_PLAN
  if (/\b(build muscle|gain muscle|lift weights|access to a gym|gym access|get stronger|hypertrophy)\b/.test(m)) {
    return { intent: "MUSCLE_GYM", route: "GYM_STRENGTH_PLAN", reason: "Muscle / gym access intent.", query: "gym strength plan full body sets reps RIR progressive overload squat hinge press row" };
  }
  // LOW_ENERGY_MINIMUM_PLAN — order matters: AFTER stress / fat loss / gym so
  // explicit goal intents win over generic "tired".
  const explicitSleepIntent = /\b(bed|sleep|bedtime|wind ?down|can'?t sleep|late night|trying to sleep)\b/.test(m);
  const lowEnergySignal = /\b(feel like crap|don'?t want to train|do not want to train|low energy|i'?m tired|exhausted|can'?t be bothered|no motivation|only have (10|15|20|25|30) minutes?|not feeling it|drained|flat today)\b/.test(m);
  if (lowEnergySignal && !explicitSleepIntent) {
    return { intent: "LOW_ENERGY", route: "LOW_ENERGY_MINIMUM_PLAN", reason: "Low-energy / tired / short-time intent without sleep cue.", query: "low energy minimum standard walk squats glute bridge plank extended exhale breathing keep the chain alive" };
  }
  return null;
}

function detectRoute(
  message: string,
  profile: Profile | null,
  journal: Journal | null,
  temporal: TemporalContext | null,
): { route: CoachRoute; reason: string; query: string; breathworkSubRoute?: BreathworkSubRoute; timeBasedRouteReason?: string | null; intentDetected?: string | null; routePriorityReason?: string | null; profileOverrideSuppressed?: boolean; profileOverrideSuppressedReason?: string | null } {
  const text = `${message.toLowerCase()} ${journal?.journalText?.toLowerCase() ?? ""}`;
  const flags = journal?.patternFlags ?? [];
  const flagSet = new Set(flags.map((f) => f.toLowerCase()));
  const poorSleepMessage = /\b(slept badly|slept poorly|bad sleep|poor sleep|little sleep|no sleep|sleep deprived|rough sleep|terrible sleep)\b/i.test(message);
  const trainingMessage = /\b(train|training|trained|gym|lift|lifting|workout|session|squat|bench|deadlift|press|run|cardio)\b/i.test(message);
  const hardTrainingMessage = /\b(train hard|training hard|go hard|push hard|lift heavy|heavy session|max out|pr attempt|personal record|all out|smash.*workout)\b/i.test(message);
  const wantsMovementMessage = /\b(move|moving|movement|want to move|need to move|walk|walking|stretch)\b/i.test(message);
  const lowEnergyMessage = /\b(low energy|low readiness|feel low|drained|flat|sluggish|no energy)\b/i.test(message);
  const eveningReviewMessage = /\b(check ?in|reset.*(bad day|after.*day)|after a bad day|end of day|end-of-day|wrap up|wrap-up|evening review|reflect|reflection|debrief|day debrief|review.*day)\b/i.test(message);
  const lifeStuckMessage = /\b(hate my job|feel stuck|feeling stuck|i'?m stuck|not motivated|no motivation|wasting my life|don'?t know where to start|i feel lost|directionless|going nowhere)\b/i.test(message);
  const transformationRequest = /\b(transform my life|change my life|reset my life|full reset|20.?day plan|60.?day plan|90.?day plan|full plan|complete plan|whole protocol)\b/i.test(message);
  const intenseLateNightIntent = /\b(cold (shower|plunge|exposure)|ice bath|train|training|gym|lift|workout|sprint|hiit|energise|wake up|caffeine|plan my)\b/i.test(message);
  let timeBasedRouteReason: string | null = null;


  // 1. SAFETY override
  if (hasMatch(text, SAFETY_PATTERNS)) {
    return {
      route: "SAFETY_CRISIS",
      reason: "User message or journal text contains crisis-language patterns (self-harm, overdose, withdrawal, medical emergency).",
      query: "safety crisis emergency contact crisis line doctor medical danger",
    };
  }

  // 1b. Explicit transformation plan request — only path that allows long plans.
  if (transformationRequest) {
    return {
      route: "GENERAL_TRANSFORMATION_REQUEST",
      reason: "User explicitly requested a full life-reset / multi-day plan. Long plan output allowed.",
      query: "transformation reset 20 day 60 day 90 day full protocol identity discipline complete plan",
    };
  }

  // 1b-bis. Real-world intent detection — runs BEFORE lifeStuck so prompts like
  // "I want to lose fat but I don't know where to start" don't fall into GENERAL_LIFE_STUCK.
  const rwi = detectRealWorldIntent(message);
  if (rwi) {
    return {
      route: rwi.route, reason: rwi.reason, query: rwi.query,
      intentDetected: rwi.intent,
      routePriorityReason: "Explicit current user intent (priority 3) beat profile / fallback.",
    };
  }

  // 1b-ter. Profile-aware bias for vague messages — only triggers when no RWI
  // matched. Does NOT override SAFETY_CRISIS, transformation requests, or RWI
  // routes (all handled above). Additive, conservative.
  {
    const m = message.toLowerCase();
    const px = (profile as unknown as Record<string, unknown>) ?? {};
    const asStr = (v: unknown) => (typeof v === "string" ? v : "");
    const asArr = (v: unknown): string[] => Array.isArray(v) ? v.filter((x) => typeof x === "string") as string[] : [];
    const relapseRisk = asStr(px["relapseRisk"]).toLowerCase();
    const mainGoal = asStr(px["mainGoal"]).toLowerCase();
    const currentSituation = asArr(px["currentSituation"]).map((s) => s.toLowerCase());
    const needsFromCoach = asArr(px["needsFromCoach"]).map((s) => s.toLowerCase());

    // High relapse risk + vague struggle language → RELAPSE_PREVENTION
    if ((relapseRisk === "high" || relapseRisk === "active") &&
        /\b(struggling tonight|i'?m struggling|struggling|hard night|bad night|losing it|can'?t tonight|not coping|close to slipping|feeling weak|dangerous night)\b/.test(m)) {
      return {
        route: "RELAPSE_PREVENTION",
        reason: "Vague struggle language with high/active relapseRisk profile.",
        query: "relapse prevention danger window remove trigger contact support delay urge ten minute rule",
        intentDetected: "RELAPSE_PREVENTION",
        routePriorityReason: "profile.relapseRisk bias",
      };
    }

    // Recovery profile + vague planning language → RECOVERY_STRUCTURE
    const isRecoveryProfile =
      mainGoal === "recovery" ||
      currentSituation.some((s) => s.includes("in recovery")) ||
      needsFromCoach.some((s) => s.includes("daily structure"));
    if (isRecoveryProfile &&
        /\b(what should i do|what should i do today|give me a plan|i need structure|help me today|today|plan my day)\b/.test(m)) {
      return {
        route: "RECOVERY_STRUCTURE",
        reason: "Vague planning language with recovery profile.",
        query: "recovery structure morning daylight breathwork walk protein journal phone away sleep support",
        intentDetected: "RECOVERY_STRUCTURE",
        routePriorityReason: "profile.recovery structure bias",
      };
    }

    // Injury (back pain) + home training + vague training language → CORE_BACK_SUPPORT_PLAN
    const injuryFlag = asStr(px["injuryFlag"]).toLowerCase();
    const trainingLocation = asStr(px["trainingLocation"]).toLowerCase();
    const hasBackPain = /back[_ ]?pain/.test(injuryFlag);
    if (hasBackPain && trainingLocation === "home" &&
        /\b(what should i train( today)?|what workout( today)?|what should i do today|train today|workout today|exercise today|what to train|what to do today)\b/.test(m)) {
      return {
        route: "CORE_BACK_SUPPORT_PLAN",
        reason: "Vague training language with back-pain injury profile + home training.",
        query: "core back support safe home routine pelvic tilts dead bugs glute bridges bird dogs side plank breathing",
        intentDetected: "CORE_BACK_SUPPORT_PLAN",
        routePriorityReason: "profile.injury route bias",
      };
    }
  }

  // 1c. General life-stuck — must come before keyword routes that grab "tired", "not motivated", etc.
  if (lifeStuckMessage) {
    return {
      route: "GENERAL_LIFE_STUCK",
      reason: "User expresses general life-stuck / unmotivated / lost. Use direct body-first, time-aware structure. No long plan.",
      query: "gorilla mind master system prompt daily operating system identity discipline minimum standard body first reset morning routine evening shutdown standards over moods one promise",
      routePriorityReason: "GENERAL_LIFE_STUCK fallback — no explicit intent matched.",
    };
  }

  // 1c-bis. Daily-OS program-level detector — runs before fitness/keyword routes
  // so plan/routine/morning-protocol/nutrition asks build real plans.
  {
    const program = detectProgramRoute(message);
    if (program) return program;
  }



  // 1d. Late-night override — protect sleep, refuse intense protocols.
  if (temporal?.dayPart === "LATE_NIGHT" && intenseLateNightIntent) {
    timeBasedRouteReason = `Late-night override (${temporal.localTime}): user asked for intense activity but day part is LATE_NIGHT. Forcing SLEEP_WIND_DOWN.`;
    return {
      route: "SLEEP_WIND_DOWN",
      reason: timeBasedRouteReason,
      query: "late night wind down sleep protection no stimulants no cold no hard training phone down lights low extended exhale",
      timeBasedRouteReason,
    };
  }

  // 1e. Evening default with no specific intent → evening review.
  if (
    temporal?.dayPart === "EVENING" &&
    !trainingMessage && !hardTrainingMessage && !poorSleepMessage && !eveningReviewMessage &&
    /(what should i do|next|now|tonight|wind down|close.*day|end.*day)/i.test(message)
  ) {
    timeBasedRouteReason = `Evening time-of-day default (${temporal.localTime}) with no specific intent → EVENING_REVIEW.`;
    return {
      route: "EVENING_REVIEW",
      reason: timeBasedRouteReason,
      query: "evening review end of day journal check in nutrition repair wind down sleep protection tomorrow setup",
      timeBasedRouteReason,
    };
  }

  if (poorSleepMessage && (trainingMessage || hardTrainingMessage || wantsMovementMessage || lowEnergyMessage)) {
    return {
      route: "RECOVERY_DAY",
      reason: "Current message combines poor sleep / low readiness with intent to train or move, so recovery caution overrides missed-day or sleep-wind-down context.",
      query: "poor sleep training hard readiness recovery day reduced intensity mobility walk Pilates no overtraining soreness pain flag",
    };
  }

  if (eveningReviewMessage) {
    return {
      route: "EVENING_REVIEW",
      reason: "Current message asks for an honest check-in / end-of-day reset / debrief after a bad day — one-standard journal check-in fits.",
      query: "evening review end of day honest check in one standard journal operator log missed day repair reset",
    };
  }

  // 1f. Exercise Prescription Engine — fitness-specific routing.
  {
    const fc = classifyFitness(message, profile, journal);
    const fitnessRoute = detectFitnessRoute(message, fc);
    if (fitnessRoute) return fitnessRoute;
  }


  if (/\b(craving|drink|relapse|lapse|sober|alcohol)\b/i.test(message)) {
    return {
      route: "SOBRIETY_CRAVING",
      reason: "Current message explicitly asks about sobriety / craving / relapse risk.",
      query: "sobriety recovery craving relapse lapse support contact environment change repair protocol",
    };
  }

  if (/\b(scroll(ing)?|phone|porn|binge|shame loop|urge)\b/i.test(message)) {
    return {
      route: "PROCESS_ADDICTION",
      reason: "Current message explicitly asks about process addiction / urge interruption.",
      query: "process addiction scrolling urge interruption phone hijack shame loop replacement behaviour",
    };
  }

  if (/\b(missed (the )?day|broken streak|fell off)\b/i.test(message)) {
    return {
      route: "MISSED_DAY_REPAIR",
      reason: "Current message explicitly uses missed-day / broken-streak language.",
      query: "missed day repair broken streak no shame minimum standard restart protocol identity anchor",
    };
  }

  if (/\b(missed (the )?morning|wasted morning|slept in|phone in bed)\b/i.test(message)) {
    return {
      route: "MISSED_MORNING",
      reason: "Current message explicitly uses missed-morning language.",
      query: "missed morning repair morning protocol hydration box breathing light exposure no phone first protein anchor",
    };
  }

  if (/\b(recovery day|rest day|sore|deload|pain flag)\b/i.test(message)) {
    return {
      route: "RECOVERY_DAY",
      reason: "Current message explicitly asks for recovery / deload / soreness handling.",
      query: "recovery day deload soreness pain flag light movement walk mobility sleep nutrition recovery",
    };
  }

  if (trainingMessage) {
    return {
      route: "TRAINING",
      reason: "Current message explicitly asks about training / gym / lifting.",
      query: poorSleepMessage
        ? "poor sleep training hard readiness recovery day reduced intensity mobility walk Pilates no overtraining soreness pain flag"
        : "training readiness beginner intermediate gym access soreness pain flag missed training next clean session",
    };
  }

  if (poorSleepMessage || /\b(sleep|insomnia|wind ?down|can'?t sleep)\b/i.test(message)) {
    return {
      route: "SLEEP_WIND_DOWN",
      reason: "Current message explicitly asks about poor sleep / wind-down.",
      query: "sleep architecture wind down sleep onset poor sleep evening protocol phone boundary calming breathwork",
    };
  }

  if (/\b(breath|breathwork|breath ?work|breathing|box breathing|panic|panicky|anxious|anxiety|grounding|stressed|wired|overwhelm|racing thoughts|switch off|activated|unfocused|scattered|distracted|mentally noisy|wind ?down)\b/i.test(message)) {
    // Morning breathwork ask → route to morning activation (Box Breathing),
    // not the calming default. Only when there is no calming / sleep cue.
    const calmingCue = /\b(stress|stressed|wired|anxious|anxiety|overwhelm|overwhelmed|panic|panicky|sleep|wind ?down|bedtime|evening|night|can'?t sleep|downregulate|calm down|nervous system|angry)\b/i.test(message);
    const morningCue = /\bmorning\b/i.test(message) || temporal?.dayPart === "MORNING";
    const breathworkAsk = /\b(breath ?work|breathing|box breathing|breath)\b/i.test(message);
    if (breathworkAsk && morningCue && !calmingCue) {
      return {
        route: "BREATHWORK_MEDITATION_REQUEST",
        reason: "Breathwork ask with morning context — morning activation (Box Breathing), not downregulating extended exhale.",
        query: "box breathing morning activation focus control nervous system 4 4 4 4 nasal",
        breathworkSubRoute: "FOCUS",
      };
    }
    const sub = detectBreathworkSubRoute(message, profile, journal);
    return {
      route: "BREATHWORK",
      reason: `Breathwork route — sub-route ${sub.sub}. ${sub.reason}`,
      query: sub.query,
      breathworkSubRoute: sub.sub,
    };
  }

  if (/\b(meditat|mindful|focus|presence|identity)\b/i.test(message)) {
    return {
      route: "MEDITATION_MINDFULNESS",
      reason: "Current message explicitly asks about meditation / mindfulness / identity work.",
      query: "meditation mindfulness identity anchor focus meditation shame spiral sleep onset urge surfing",
    };
  }

  if (/\bpilates\b/i.test(message)) {
    return {
      route: "PILATES",
      reason: "Current message explicitly mentions Pilates.",
      query: "Pilates beginner foundation mobility core control low impact recovery day",
    };
  }

  if (/\b(mobility|stretch|hips|shoulders|tight)\b/i.test(message)) {
    return {
      route: "MOBILITY",
      reason: "Current message explicitly asks about mobility / stiffness.",
      query: "mobility routine hips shoulders thoracic spine daily mobility movement quality",
    };
  }

  if (/\bcold (shower|plunge|exposure)|ice bath\b/i.test(message)) {
    return {
      route: "COLD_EXPOSURE",
      reason: "Current message explicitly asks about cold exposure.",
      query: "cold exposure cold shower plunge safety dose duration contraindications recovery",
    };
  }

  if (/\b(sauna|heat exposure|hot bath)\b/i.test(message)) {
    return {
      route: "HEAT_EXPOSURE",
      reason: "Current message explicitly asks about heat exposure / sauna.",
      query: "heat exposure sauna protocol dose duration hydration safety recovery",
    };
  }

  if (/\b(eat|meal|protein|food|nutrition|hungry|calorie|macro)\b/i.test(message)) {
    return {
      route: "NUTRITION_MEAL",
      reason: "Current message explicitly asks about food / meal / protein.",
      query: "meal library protein anchor next meal nutrition missed meal food boundary recovery",
    };
  }

  if (/\b(streak|discipline points?|points?|consistency|momentum)\b/i.test(message)) {
    return {
      route: "DISCIPLINE_POINTS_STREAK",
      reason: "Current message explicitly asks about streak / discipline points / consistency.",
      query: "discipline points streak consistency momentum identity reinforcement scoring system",
    };
  }

  if (/\b(identity|who am i|mindset|purpose|values|operator)\b/i.test(message)) {
    return {
      route: "IDENTITY_MINDSET",
      reason: "Current message explicitly asks about identity / mindset / values.",
      query: "identity anchor masculine operating system mindset values purpose discipline transformation",
    };
  }

  // 3. Latest journal / check-in context.
  if (
    journal && journal.cravingLevel >= 7
  ) {
    return {
      route: "SOBRIETY_CRAVING",
      reason: `Latest journal shows high craving level (${journal.cravingLevel}/10).`,
      query: "sobriety recovery craving relapse lapse support contact environment change repair protocol",
    };
  }

  const morningMissed = journal && !journal.morningProtocolCompleted;
  const dayMissed =
    journal &&
    !journal.morningProtocolCompleted &&
    !journal.eveningProtocolCompleted &&
    !journal.trainingCompleted;

  if (dayMissed || flagSet.has("missed_day")) {
    return {
      route: "MISSED_DAY_REPAIR",
      reason: "Latest journal shows missed morning + evening + training, or missed_day flag.",
      query: "missed day repair broken streak no shame minimum standard restart protocol identity anchor",
    };
  }
  if (morningMissed || flagSet.has("missed_morning")) {
    return {
      route: "MISSED_MORNING",
      reason: "Latest journal has morningProtocolCompleted=false or missed_morning flag.",
      query: "missed morning repair morning protocol hydration box breathing light exposure no phone first protein anchor",
    };
  }

  if (journal && (journal.energy <= 3 || flagSet.has("sore") || flagSet.has("pain"))) {
    return {
      route: "RECOVERY_DAY",
      reason: "Latest journal shows low energy, soreness, or pain flag.",
      query: "recovery day deload soreness pain flag light movement walk mobility sleep nutrition recovery",
    };
  }

  if (journal && journal.sleep < 6) {
    return {
      route: "SLEEP_WIND_DOWN",
      reason: `Latest journal shows short sleep (${journal.sleep}h).`,
      query: "sleep architecture wind down sleep onset poor sleep evening protocol phone boundary calming breathwork",
    };
  }

  if (journal && journal.nutritionCompleted === false) {
    return {
      route: "NUTRITION_MEAL",
      reason: "Latest journal shows nutritionCompleted=false.",
      query: "meal library protein anchor next meal nutrition missed meal food boundary recovery",
    };
  }

  // 4. Profile context.
  if (profile?.alcoholFlag || (profile?.recoveryState && profile.recoveryState !== "none")) {
    return {
      route: "SOBRIETY_CRAVING",
      reason: `Profile sobriety context active (alcoholFlag=${!!profile.alcoholFlag}, recoveryState=${profile.recoveryState ?? "none"}).`,
      query: "sobriety recovery craving relapse lapse support contact environment change repair protocol",
    };
  }

  if (profile?.processAddictionFlag || profile?.foodBoundaryActive) {
    return {
      route: "PROCESS_ADDICTION",
      reason: `Profile process-addiction context active (processAddictionFlag=${!!profile.processAddictionFlag}, foodBoundaryActive=${!!profile.foodBoundaryActive}).`,
      query: "process addiction scrolling urge interruption phone hijack shame loop replacement behaviour",
    };
  }

  // Profile sleepQuality override — only fires if user did NOT give an explicit
  // non-sleep intent. Real-world intent detection earlier already returned for
  // those, so by the time we reach here it's safe; still gate on explicit sleep
  // wording in the message to avoid overriding ambiguous prompts.
  if ((profile?.sleepQuality === "poor" || profile?.sleepQuality === "inconsistent")
      && /\b(sleep|bed|bedtime|wind ?down|insomnia)\b/i.test(message)) {
    return {
      route: "SLEEP_WIND_DOWN",
      reason: `Profile sleepQuality is ${profile.sleepQuality} and message mentions sleep.`,
      query: "sleep architecture wind down sleep onset poor sleep evening protocol phone boundary calming breathwork",
    };
  }
  if (profile?.sleepQuality === "poor" || profile?.sleepQuality === "inconsistent") {
    // Suppressed: profile said poor sleep but user did not mention sleep.
    // Fall through to next handler; surface in debug via routePriorityReason.
  }

  if (profile && /identity/i.test(profile.primaryGap)) {
    return {
      route: "IDENTITY_MINDSET",
      reason: "Profile primaryGap is identity-shaped.",
      query: "identity anchor masculine operating system mindset values purpose discipline transformation",
    };
  }

  // 5. Fallback.
  return {
    route: "GENERAL_COACHING",
    reason: "No current-message, journal, or profile-specific route triggered. Falling back to general coaching grounded in profile + journal.",
    query: `general coaching ${profile?.primaryGap ?? ""} ${profile?.primaryGoal ?? ""}`.trim() || "general coaching daily protocol",
  };
}

const DAY_PART_PRIORITY: Record<DayPart, string[]> = {
  MORNING: [
    "hydration",
    "light exposure",
    "breathwork or meditation",
    "morning identity anchor",
    "training/mobility plan for the day",
    "protein-first first meal",
    "phone boundary",
    "assigned high-priority missing pillars",
  ],
  MIDDAY: [
    "what has already been completed today",
    "what is missing",
    "next meal",
    "movement/steps",
    "training readiness",
    "stress regulation",
    "minimum standard if the day is drifting",
  ],
  EVENING: [
    "evening review",
    "journal check-in",
    "nutrition repair if needed",
    "wind-down",
    "sleep protection",
    "phone-down boundary",
    "tomorrow setup",
  ],
  LATE_NIGHT: [
    "phone down",
    "lights low",
    "extended exhale breathing only if appropriate",
    "simple journal line",
    "sleep window protection",
    "NO intense training, cold exposure, heavy planning, or stimulating protocols",
  ],
};

function buildContextBlock(
  profile: Profile | null,
  journal: Journal | null,
  progress: DailyProgressCtx | null,
  temporal: TemporalContext | null,
): string {
  const lines: string[] = ["=== OPERATOR CONTEXT ==="];
  if (temporal) {
    lines.push("[TEMPORAL CONTEXT]");
    lines.push(`localDate: ${temporal.localDate}`);
    lines.push(`localTime: ${temporal.localTime}`);
    lines.push(`timezone: ${temporal.timezone}`);
    lines.push(`dayOfWeek: ${temporal.dayOfWeek}`);
    lines.push(`dayPart: ${temporal.dayPart}`);
    lines.push(`sessionContext: ${temporal.sessionContext}`);
    lines.push(`priorityFocus (for this dayPart):`);
    for (const p of DAY_PART_PRIORITY[temporal.dayPart]) lines.push(`  - ${p}`);
    lines.push("");
  } else {
    lines.push("[TEMPORAL CONTEXT] none (no client-side time provided)");
    lines.push("");
  }

  if (profile) {
    lines.push("[USER PROFILE]");
    const firstName = profile.identityProfile?.firstName || profile.name;
    lines.push(`name: ${firstName}`);
    lines.push(`firstName: ${firstName}`);
    lines.push(`identityAnchor: ${profile.identityAnchor}`);
    lines.push(`primaryGoal: ${profile.primaryGoal}`);
    lines.push(`primaryGap: ${profile.primaryGap}`);
    lines.push(`chronicity: ${profile.chronicity}`);
    lines.push(`trainingLevel: ${profile.trainingLevel}`);
    lines.push(`gymAccess: ${profile.gymAccess}`);
    lines.push(`sleepQuality: ${profile.sleepQuality}`);
    lines.push(`nutritionStatus: ${profile.nutritionStatus}`);
    lines.push(`bodyCompGoal: ${profile.bodyCompGoal}`);
    lines.push(`alcoholFlag: ${profile.alcoholFlag}`);
    lines.push(`recoveryState: ${profile.recoveryState}`);
    lines.push(`processAddictionFlag: ${profile.processAddictionFlag}`);
    lines.push(`foodBoundaryActive: ${profile.foodBoundaryActive}`);
    lines.push(`protocolDay: ${profile.protocolDay}`);
    lines.push(`readinessState: ${profile.readinessState}`);
    lines.push(`currentStreak: ${profile.currentStreak}`);
    lines.push(`disciplinePoints: ${profile.disciplinePoints}`);
  } else {
    lines.push("[USER PROFILE] none");
  }
  lines.push("");
  if (journal) {
    lines.push("[LATEST JOURNAL / CHECK-IN]");
    lines.push(`date: ${journal.date}`);
    lines.push(`mood: ${journal.mood}/10`);
    lines.push(`energy: ${journal.energy}/10`);
    lines.push(`stress: ${journal.stress}/10`);
    lines.push(`sleep: ${journal.sleep}h`);
    lines.push(`cravingLevel: ${journal.cravingLevel}/10`);
    lines.push(`trainingCompleted: ${journal.trainingCompleted}`);
    lines.push(`nutritionCompleted: ${journal.nutritionCompleted}`);
    lines.push(`morningProtocolCompleted: ${journal.morningProtocolCompleted}`);
    lines.push(`eveningProtocolCompleted: ${journal.eveningProtocolCompleted}`);
    lines.push(`patternFlags: ${journal.patternFlags.join(", ") || "none"}`);
    lines.push(`journalText: ${journal.journalText || "(empty)"}`);
  } else {
    lines.push("[LATEST JOURNAL / CHECK-IN] none");
  }
  lines.push("");
  if (progress) {
    lines.push("[TODAY'S PROGRESS — guided practice completions]");
    lines.push(`date: ${progress.date}`);
    lines.push(`breathworkCompleted: ${progress.breathworkCompleted}`);
    lines.push(`meditationCompleted: ${progress.meditationCompleted}`);
    lines.push(`mindfulnessCompleted: ${progress.mindfulnessCompleted}`);
    lines.push(`trainingCompleted: ${progress.trainingCompleted}`);
    lines.push(`pilatesCompleted: ${progress.pilatesCompleted}`);
    lines.push(`mobilityCompleted: ${progress.mobilityCompleted}`);
    lines.push(`nutritionCompleted: ${progress.nutritionCompleted}`);
    lines.push(`coldExposureCompleted: ${progress.coldExposureCompleted}`);
    lines.push(`heatExposureCompleted: ${progress.heatExposureCompleted}`);
    lines.push(`journalCompleted: ${progress.journalCompleted}`);
    lines.push(`completedPracticeIdsToday: ${progress.completedPracticeIdsToday.join(", ") || "none"}`);
    lines.push(`disciplinePointsToday: ${progress.disciplinePointsToday}`);
    lines.push(`dailyMinimumMet: ${progress.dailyMinimumMet}`);
    lines.push(`fullProtocolCompleted: ${progress.fullProtocolCompleted}`);
    if (progress.practiceStreak !== undefined) lines.push(`practiceStreak: ${progress.practiceStreak}`);
    if (progress.protocolStreak !== undefined) lines.push(`protocolStreak: ${progress.protocolStreak}`);
    if (progress.lastCompletedPracticeId) lines.push(`lastCompletedPracticeId: ${progress.lastCompletedPracticeId}`);
    if (progress.lastCompletedPracticeCategory) lines.push(`lastCompletedPracticeCategory: ${progress.lastCompletedPracticeCategory}`);

    const outstanding: string[] = [];
    if (!progress.breathworkCompleted) outstanding.push("breathwork");
    if (!progress.meditationCompleted && !progress.mindfulnessCompleted) outstanding.push("meditation/mindfulness");
    if (!progress.trainingCompleted && !progress.mobilityCompleted && !progress.pilatesCompleted) outstanding.push("training/mobility");
    if (!progress.nutritionCompleted) outstanding.push("nutrition");
    if (!progress.journalCompleted) outstanding.push("journal");
    lines.push(`outstandingToday: ${outstanding.join(", ") || "none"}`);
    lines.push("");
    lines.push("RULE: Do NOT re-recommend an action already completed today unless it is clinically or safety appropriate. Reinforce momentum and recommend an outstanding action instead.");
  } else {
    lines.push("[TODAY'S PROGRESS] none");
  }
  lines.push("");
  // ----- Top 21 Protocol Pillar context -----
  lines.push("[TOP 21 PROTOCOL STATUS]");
  const access = {
    heatExposureAccess: profile?.heatExposureAccess ?? "none",
    coldExposureAccess: profile?.coldExposureAccess ?? "none",
    strengthTrainingAccess: profile?.strengthTrainingAccess ?? "none",
    pilatesMobilityAccess: profile?.pilatesMobilityAccess ?? "none",
  };
  lines.push(`heatExposureAccess: ${access.heatExposureAccess}`);
  lines.push(`coldExposureAccess: ${access.coldExposureAccess}`);
  lines.push(`strengthTrainingAccess: ${access.strengthTrainingAccess}`);
  lines.push(`pilatesMobilityAccess: ${access.pilatesMobilityAccess}`);
  if (progress) {
    lines.push(`assignedPillars: ${(progress.assignedPillars ?? []).join(", ") || "—"}`);
    lines.push(`unavailablePillars: ${(progress.unavailablePillars ?? []).join(", ") || "none"}`);
    lines.push(`completedPillarIdsToday: ${(progress.completedPillarIdsToday ?? []).join(", ") || "none"}`);
    lines.push(`highPriorityPillarsCompletedToday: ${(progress.highPriorityPillarsCompletedToday ?? []).join(", ") || "none"}`);
    lines.push(`dailyMinimumCount: ${progress.dailyMinimumCount ?? 0}`);
    lines.push(`highPriorityMinimumCount: ${progress.highPriorityMinimumCount ?? 0}`);
    lines.push(`protocolStreakEligible: ${progress.protocolStreakEligible ?? false}`);
    const assignedSet = new Set(progress.assignedPillars ?? []);
    const completedSet = new Set(progress.completedPillarIdsToday ?? []);
    const missing = [...assignedSet].filter((id) => !completedSet.has(id));
    lines.push(`missingAssignedPillars: ${missing.join(", ") || "none"}`);
  }
  lines.push("");
  lines.push("RULES — TOP 21:");
  lines.push("- Do NOT recommend any pillar listed in unavailablePillars.");
  lines.push("- If user has no access for cold / heat / strength / pilates, suggest the assigned equivalent (e.g. mobility instead of strength) and do not blame the user.");
  lines.push("- Prefer high-priority missing pillars when answering 'what should I do next?'.");
  lines.push("- Use qualified scientific wording (may support, is associated with, can help create the conditions for, evidence suggests). Avoid guaranteed outcome claims for cold, heat, sauna, dopamine, growth hormone, BDNF, testosterone, mortality, HRV or nervous system claims.");
  lines.push("=== END CONTEXT ===");
  return lines.join("\n");
}

// ---------- Continuation router helpers ----------

const CONTINUATION_MAP: Record<string, { command: ContinuationCommand; route: CoachRoute }> = {
  "FITNESS": { command: "FITNESS", route: "CONTINUATION_FITNESS_PLAN" },
  "JOB": { command: "JOB", route: "CONTINUATION_JOB_PLAN" },
  "BOTH": { command: "BOTH", route: "CONTINUATION_BOTH_PLAN" },
  "BUILD MY PLAN": { command: "BUILD_MY_PLAN", route: "CONTINUATION_BUILD_MY_PLAN" },
  "BUILD PLAN": { command: "BUILD_MY_PLAN", route: "CONTINUATION_BUILD_MY_PLAN" },
  "RESET": { command: "RESET", route: "CONTINUATION_RESET_NOW" },
  "RESET NOW": { command: "RESET", route: "CONTINUATION_RESET_NOW" },
  "MINIMUM STANDARD": { command: "MINIMUM_STANDARD", route: "CONTINUATION_MINIMUM_STANDARD" },
  "MINIMUM": { command: "MINIMUM_STANDARD", route: "CONTINUATION_MINIMUM_STANDARD" },
  "MORNING": { command: "MORNING", route: "CONTINUATION_MORNING_SETUP" },
  "MORNING PLAN": { command: "MORNING", route: "CONTINUATION_MORNING_SETUP" },
  // Fitness continuation chips
  "HOME": { command: "HOME", route: "HOME_BODYWEIGHT_PLAN" },
  "GYM": { command: "GYM", route: "GYM_STRENGTH_PLAN" },
  "RUNNING": { command: "RUNNING", route: "RUNNING_STARTER_PLAN" },
  "PILATES": { command: "PILATES", route: "PILATES_CORE_PLAN" },
  "LOW ENERGY": { command: "LOW_ENERGY", route: "LOW_ENERGY_SESSION" },
  "BEGINNER": { command: "BEGINNER", route: "FITNESS_ROUTINE_BUILDER" },
  "INTERMEDIATE": { command: "INTERMEDIATE", route: "INTERMEDIATE_FITNESS_PLAN" },
  "ADVANCED": { command: "ADVANCED", route: "INTERMEDIATE_FITNESS_PLAN" },
  // Daily-OS continuation chips
  "CALORIES": { command: "CALORIES", route: "NUTRITION_CALORIE_REQUEST" },
  "NUTRITION": { command: "CALORIES", route: "NUTRITION_CALORIE_REQUEST" },
  "GYM PLAN": { command: "GYM_PLAN", route: "GYM_STRENGTH_PLAN" },
  "HOME PLAN": { command: "HOME_PLAN", route: "HOME_BODYWEIGHT_PLAN" },
  "MORNING PROTOCOL": { command: "MORNING_PROTOCOL", route: "MORNING_PROTOCOL_REQUEST" },
  "FAT LOSS": { command: "FAT_LOSS", route: "FITNESS_PLAN_REQUEST" },
  "MUSCLE": { command: "MUSCLE", route: "INTERMEDIATE_FITNESS_PLAN" },
  "ALL ROUND RESET": { command: "ALL_ROUND_RESET", route: "FULL_REBUILD_PLAN" },
  "ALL-ROUND RESET": { command: "ALL_ROUND_RESET", route: "FULL_REBUILD_PLAN" },
};

function detectContinuationCommand(
  message: string,
  history: CoachHistoryTurn[],
  priorProgramState?: ProgramState | null,
): { command: ContinuationCommand; route: CoachRoute } | null {
  const norm = message.trim().toUpperCase().replace(/[.!?,]+$/g, "").replace(/\s+/g, " ");
  if (norm.length > 30) return null;
  const hit = CONTINUATION_MAP[norm];
  if (!hit) return null;
  // Accept the continuation if we have either prior chat history OR an active
  // program state carried over from the last assistant turn.
  if (history.length === 0 && !(priorProgramState && priorProgramState.lastProgrammeRoute)) return null;
  return hit;
}

function extractReplyOptions(assistantText: string): string[] {
  if (!assistantText) return [];
  // Find a "REPLY WITH" section, otherwise scan for "Reply X, Y, or Z" sentences.
  let segment = "";
  const sectionMatch = assistantText.match(/REPLY WITH[:\s]*([\s\S]+)$/i);
  if (sectionMatch) {
    segment = sectionMatch[1];
  } else {
    const inline = assistantText.match(/\breply\s+(?:with\s+)?([A-Z][A-Z0-9 ,\/\-]+(?:\s+or\s+[A-Z][A-Z0-9 \-]+)?)/);
    if (inline) segment = inline[1];
  }
  if (!segment) return [];
  // Take only first 3 lines of REPLY WITH section.
  segment = segment.split(/\n\n/)[0];
  // Capture ALL-CAPS tokens (allowing spaces, hyphens, digits, apostrophes).
  const tokens: string[] = [];
  const tokenRe = /\b([A-Z][A-Z0-9'\-]+(?:\s+[A-Z0-9'\-]+){0,3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(segment)) !== null) {
    const t = m[1].trim();
    if (t.length < 2 || t.length > 40) continue;
    if (/^(REPLY|WITH|OR|AND|THE|A|AN|TO|FOR|IF|ME|MY|I'M|IS)$/.test(t)) continue;
    if (!tokens.includes(t)) tokens.push(t);
  }
  return tokens.slice(0, 6);
}

// Keywords that indicate "reset" advice the model already produced — used to
// instruct the next response NOT to repeat them.
const DUPLICATE_ADVICE_PATTERNS: Array<{ key: string; re: RegExp }> = [
  { key: "phone away", re: /phone\s+(?:away|down|out of)/i },
  { key: "drink water", re: /\b(drink\s+water|water\s+before)/i },
  { key: "clothes laid out", re: /clothes\s+(?:laid|out|ready)/i },
  { key: "5 min breathing", re: /\b5\s*(?:min|minutes)?\s*breath/i },
  { key: "20 min movement", re: /\b(20|30)\s*(?:min|minutes)?\s*(?:walk|movement|move)/i },
  { key: "protein breakfast", re: /protein.*(breakfast|first meal)|first meal.*protein/i },
  { key: "tomorrow morning routine", re: /tomorrow\s+morning/i },
];

function detectPreviousAdvice(history: CoachHistoryTurn[]): string[] {
  const last = [...history].reverse().find((h) => h.role === "assistant");
  if (!last) return [];
  return DUPLICATE_ADVICE_PATTERNS.filter((p) => p.re.test(last.content)).map((p) => p.key);
}

const CONTINUATION_SHAPES: Partial<Record<CoachRoute, string>> = {
  CONTINUATION_BOTH_PLAN: [
    "ACTIVE ROUTE is CONTINUATION_BOTH_PLAN. The user just replied 'BOTH' to the previous coach turn. This is a CONTINUATION. Do NOT repeat the previous reset advice (phone away, water, breathing, movement, protein) — advance the conversation. Use this exact structure:",
    "",
    "HEADLINE — one direct line, e.g. 'Good. We handle both — but in the right order.'",
    "WHAT THIS MEANS — 3–4 short lines showing how the job and fitness problems feed each other. Body first, work clarity second.",
    "THE NEXT 24 HOURS",
    "TONIGHT — numbered 4 items: phone away from bed, clothes laid out, decide tomorrow's movement, write one line about one work thing they can control tomorrow.",
    "TOMORROW MORNING — numbered 5 items: water before phone, 5 min breathing, 20 min movement, protein breakfast, no job decisions before the body is online.",
    "WORK RESET — 3 numbered questions to answer tomorrow about role/people/pressure/money/purpose and one move this week for more control.",
    "FITNESS RESET — 7-day minimum standard list: 20 min movement daily, protein with first meal, water before caffeine, phone away for first 30 minutes.",
    "COACH CLOSE — 2 short lines: 'You are not building a new life tomorrow. You are taking back command of the first hour.'",
    "REPLY WITH — exactly: 'Reply BUILD MY PLAN and I will turn this into a 7-day structure.'",
  ].join("\n"),

  CONTINUATION_BUILD_MY_PLAN: [
    "ACTIVE ROUTE is CONTINUATION_BUILD_MY_PLAN. The user asked for the structured plan. Do NOT repeat the previous reset advice. Build the actual 7-day plan. Use this exact structure:",
    "",
    "HEADLINE — 'Here is the plan. Simple. Repeatable. No drama.'",
    "PLAN LENGTH — '7 days.'",
    "MISSION — one short line about rebuilding control over mornings, body, and work direction.",
    "DAILY NON-NEGOTIABLES — numbered 5: water before phone, 5 min breathing, 20 min movement, protein-first breakfast, one work-control action.",
    "DAY 1 — RE-ENTRY — Body / Mind / Work / Rule lines.",
    "DAY 2 — BODY LEADS — Body / Mind / Work lines.",
    "DAY 3 — REMOVE FRICTION — Body / Nutrition / Work lines.",
    "DAY 4 — STANDARD — Body / Mind / Work lines.",
    "DAY 5 — CLARITY — Body / Work lines.",
    "DAY 6 — DISCIPLINE — Body / Nutrition / Work lines.",
    "DAY 7 — REVIEW — 4 numbered review questions.",
    "COACH CLOSE — 'This is not about motivation. This is about proving you can lead yourself for seven days.'",
    "REPLY WITH — exactly: 'Reply FITNESS for the training plan, JOB for the work plan, or BOTH for the full 30-day rebuild.'",
  ].join("\n"),

  CONTINUATION_FITNESS_PLAN: [
    "ACTIVE ROUTE is CONTINUATION_FITNESS_PLAN. The user wants the fitness-specific next step. Do NOT repeat previous reset advice. Use this structure:",
    "HEADLINE / MISSION (7-day training baseline) / DAILY NON-NEGOTIABLES (movement, protein, water) / WEEK STRUCTURE (Day 1–7 short body-led prescriptions, respect gymAccess from profile) / COACH CLOSE / REPLY WITH — 'Reply BUILD MY PLAN or JOB.'",
  ].join("\n"),

  CONTINUATION_JOB_PLAN: [
    "ACTIVE ROUTE is CONTINUATION_JOB_PLAN. The user wants the work-specific next step. Do NOT repeat previous reset advice. Use this structure:",
    "HEADLINE / MISSION (7-day work clarity) / DAILY NON-NEGOTIABLES (one control action, one drain removed, one boundary held) / 7-DAY WORK STRUCTURE (Day 1–7: name the hate, list 3 realistic options stay/improve/exit, one task you've avoided, decide environment/income/purpose lever, one practical next move) / COACH CLOSE / REPLY WITH — 'Reply BUILD MY PLAN or FITNESS.'",
  ].join("\n"),

  CONTINUATION_RESET_NOW: [
    "ACTIVE ROUTE is CONTINUATION_RESET_NOW. The user wants an immediate reset. Do NOT repeat previous reset advice verbatim. Advance: give a 30-minute reset sequence appropriate to the current dayPart. End with REPLY WITH — 'Reply BUILD MY PLAN or MINIMUM STANDARD.'",
  ].join("\n"),

  CONTINUATION_MINIMUM_STANDARD: [
    "ACTIVE ROUTE is CONTINUATION_MINIMUM_STANDARD. Give the minimum-required action for today only. One action. One line of why. End with REPLY WITH — 'Reply BUILD MY PLAN.'",
  ].join("\n"),

  CONTINUATION_MORNING_SETUP: [
    "ACTIVE ROUTE is CONTINUATION_MORNING_SETUP. Provide a concrete morning sequence: pre-phone routine, water, breathing, movement, protein, one written line of intent. End with REPLY WITH — 'Reply BUILD MY PLAN or FITNESS.'",
  ].join("\n"),
};

// ---------- Gorilla Mind Daily OS — Pillar Engine, Calorie Resolver, Plan Card ----------

const PILLAR_LIBRARY: Record<string, string> = {
  hydration: "Hydration",
  mineralised_water: "Celtic sea salt / mineralised water (when appropriate)",
  lemon_water: "Lemon water",
  breathwork: "Breathwork",
  meditation: "Meditation",
  circadian_rhythm: "Circadian rhythm",
  morning_daylight: "Morning daylight exposure",
  walking: "Walking",
  strength_training: "Strength training",
  pilates_mobility: "Core / Pilates / mobility",
  cold_exposure: "Cold water exposure",
  heat_exposure: "Heat exposure / sauna",
  grounding: "Grounding",
  nutrition: "Nutrition",
  protein: "Protein target",
  sleep: "Sleep regulation",
  journaling: "Journaling",
  affirmations: "Positive affirmations",
  identity: "Identity work",
  reading: "Reading / learning",
  digital_discipline: "Digital discipline / phone control",
};

function selectPillarsForRoute(
  route: CoachRoute,
  message: string,
  profile: Profile | null,
): { ids: string[]; reasoning: string } {
  const m = (message || "").toLowerCase();
  // Hard-coded pillar sets per spec for the highest-value Daily OS routes.
  switch (route) {
    case "FULL_REBUILD_PLAN":
    case "PROGRAM_REQUEST":
      return {
        ids: ["hydration","breathwork","meditation","circadian_rhythm","morning_daylight","walking","strength_training","nutrition","protein","sleep","journaling","identity","digital_discipline"],
        reasoning: "FULL_REBUILD_PLAN — body-first rebuild: hydration, breath, meditation, daylight, walking, strength, nutrition (protein), sleep, journaling, identity, digital discipline.",
      };
    case "MORNING_PROTOCOL_REQUEST":
      return {
        ids: ["digital_discipline","hydration","mineralised_water","morning_daylight","breathwork","meditation","walking","strength_training","protein","journaling","identity","affirmations"],
        reasoning: "MORNING_PROTOCOL_REQUEST — ordered first-hour command: phone discipline, hydration, daylight, breath, identity, movement, protein, journal.",
      };
    case "BREATHWORK_MEDITATION_REQUEST":
      return {
        ids: ["breathwork","meditation","circadian_rhythm","digital_discipline","sleep","identity","journaling"],
        reasoning: "BREATHWORK_MEDITATION_REQUEST — nervous-system regulation pillars only.",
      };
    case "NUTRITION_CALORIE_REQUEST":
      return {
        ids: ["nutrition","protein","hydration","sleep"],
        reasoning: "NUTRITION_CALORIE_REQUEST — nutrition + protein anchored by hydration and sleep.",
      };
    case "GYM_STRENGTH_PLAN":
    case "INTERMEDIATE_FITNESS_PLAN":
      return { ids: ["strength_training","walking","nutrition","protein","sleep","breathwork","hydration"], reasoning: "Strength-led plan pillars." };
    case "HOME_BODYWEIGHT_PLAN":
    case "FITNESS_ROUTINE_BUILDER":
    case "FITNESS_PLAN_REQUEST":
      return { ids: ["strength_training","walking","pilates_mobility","nutrition","protein","sleep","breathwork","hydration"], reasoning: "Home / starter fitness pillars." };
    case "RUNNING_STARTER_PLAN":
      return { ids: ["walking","strength_training","breathwork","nutrition","protein","sleep","hydration"], reasoning: "Running starter pillars." };
    case "PILATES_CORE_PLAN":
    case "CORE_BACK_SUPPORT_PLAN":
      return { ids: ["pilates_mobility","walking","breathwork","sleep","hydration","protein"], reasoning: "Core / mobility-led pillars." };
    case "GENERAL_LIFE_STUCK": {
      const ids = ["digital_discipline","hydration","breathwork","morning_daylight","walking","strength_training","protein","journaling","identity","sleep"];
      return { ids, reasoning: "GENERAL_LIFE_STUCK — body-first stack: digital discipline, hydration, breath, daylight, walking, strength, protein, journal, identity, sleep." };
    }
    case "SLEEP_WIND_DOWN":
      return { ids: ["sleep","breathwork","digital_discipline","circadian_rhythm","journaling"], reasoning: "Sleep wind-down pillars." };
    case "BREATHWORK":
      return { ids: ["breathwork","sleep","identity"], reasoning: "Breathwork-focused pillars." };
    case "MEDITATION_MINDFULNESS":
      return { ids: ["meditation","identity","breathwork","journaling"], reasoning: "Meditation/mindfulness pillars." };
    case "MISSED_DAY_REPAIR":
    case "MISSED_MORNING":
      return { ids: ["identity","morning_daylight","hydration","breathwork","walking","protein","journaling"], reasoning: "Repair pillars — no shame, body-first re-entry." };
    case "SAFETY_CRISIS":
      return { ids: [], reasoning: "Safety crisis — no pillar prescription, route to professional help." };
    default: {
      // Profile-led fallback.
      const ids = ["hydration","breathwork","walking","protein","sleep","identity"];
      if (profile?.processAddictionFlag || /phone|scrolling|porn|binge/.test(m)) ids.unshift("digital_discipline");
      return { ids, reasoning: "Default pillar selection: body-first fundamentals." };
    }
  }
}

function resolveCalorieTarget(profile: Profile | null): {
  calorieTargetUsed: number | null;
  calorieSource: "profile" | "calculated" | "not_available";
  calorieMissingFields: string[];
  macroTargetUsed: { proteinG: number; carbsG: number; fatG: number } | null;
} {
  const required = ["age","sex","heightCm","weightKg","activityLevel","primaryGoal"];
  const p = (profile ?? {}) as Record<string, unknown>;
  const missing = required.filter((k) => {
    if (k === "primaryGoal") return !p.primaryGoal || p.primaryGoal === "";
    return p[k] === undefined || p[k] === null || p[k] === "";
  });
  if (missing.length > 0) {
    return { calorieTargetUsed: null, calorieSource: "not_available", calorieMissingFields: missing, macroTargetUsed: null };
  }
  // Mifflin-St Jeor
  const age = Number(p.age);
  const heightCm = Number(p.heightCm);
  const weightKg = Number(p.weightKg);
  const sex = String(p.sex).toLowerCase();
  const activity = String(p.activityLevel).toLowerCase();
  const goal = String(p.primaryGoal).toLowerCase();
  const bmr = sex.startsWith("m")
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const factor =
    activity.includes("sedent") ? 1.2 :
    activity.includes("light") ? 1.375 :
    activity.includes("mod") ? 1.55 :
    activity.includes("very") || activity.includes("active") ? 1.725 : 1.4;
  let tdee = Math.round(bmr * factor);
  if (goal.includes("fat") || goal.includes("loss") || goal.includes("cut")) tdee -= 350;
  else if (goal.includes("muscle") || goal.includes("bulk")) tdee += 250;
  const proteinG = Math.round(weightKg * 2.0);
  const fatG = Math.round((tdee * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((tdee - proteinG * 4 - fatG * 9) / 4));
  return {
    calorieTargetUsed: tdee,
    calorieSource: "calculated",
    calorieMissingFields: [],
    macroTargetUsed: { proteinG, carbsG, fatG },
  };
}

const PLAN_GUIDED_CARDS: Record<string, GuidedPracticeRecommendation> = {
  box_breathing_5min: {
    id: "box_breathing_5min",
    title: "Box Breathing",
    category: "breathwork",
    durationMinutes: 6,
    reason: "Best for morning control and state regulation before phone use.",
    buttonLabel: "Start Box Breathing",
  },
  extended_exhale_3min: {
    id: "extended_exhale_3min",
    title: "Extended Exhale Breathing",
    category: "breathwork",
    durationMinutes: 3,
    reason: "Best for downshifting the nervous system before sleep.",
    buttonLabel: "Start Extended Exhale",
  },
  morning_identity_reset_5min: {
    id: "morning_identity_reset_5min",
    title: "Morning Identity Reset",
    category: "meditation",
    durationMinutes: 5,
    reason: "Best for re-anchoring the user after missed days or low discipline.",
    buttonLabel: "Start Morning Identity Reset",
  },
  morning_protocol_lock_in: {
    id: "morning_protocol_lock_in",
    title: "Morning Protocol Lock-In",
    category: "morning_protocol",
    durationMinutes: 30,
    reason: "Best when the user needs structure, body activation and digital discipline.",
    buttonLabel: "Start Morning Protocol",
  },
};

function selectGuidedPracticeForPlan(route: CoachRoute, dayPart: DayPart): GuidedPracticeRecommendation | null {
  switch (route) {
    case "MORNING_PROTOCOL_REQUEST":
      return PLAN_GUIDED_CARDS.morning_protocol_lock_in;
    case "FULL_REBUILD_PLAN":
    case "PROGRAM_REQUEST":
      return dayPart === "EVENING" || dayPart === "LATE_NIGHT"
        ? PLAN_GUIDED_CARDS.extended_exhale_3min
        : PLAN_GUIDED_CARDS.box_breathing_5min;
    case "BREATHWORK_MEDITATION_REQUEST":
      return dayPart === "EVENING" || dayPart === "LATE_NIGHT"
        ? PLAN_GUIDED_CARDS.extended_exhale_3min
        : PLAN_GUIDED_CARDS.box_breathing_5min;
    case "MISSED_DAY_REPAIR":
    case "MISSED_MORNING":
      return PLAN_GUIDED_CARDS.morning_identity_reset_5min;
    default:
      return null;
  }
}

// ===========================================================================
// Breathwork Prescription Engine
// ===========================================================================

export type BreathworkState =
  | "morning_energised" | "morning_flat" | "morning_anxious" | "morning_scattered"
  | "focus_reset" | "post_walk_lock_in" | "low_motivation" | "low_energy"
  | "pre_training_activation" | "post_training_downshift" | "anxious" | "wired"
  | "angry" | "overwhelmed" | "panic_like" | "evening_shutdown" | "sleep_wind_down"
  | "urge_or_compulsion" | "addiction_drift" | "phone_scroll_loop"
  | "missed_day_reentry" | "identity_reset" | "recovery"
  | "effort_to_recovery" | "physical_fatigue" | "body_overworked" | "recovery_downshift"
  | "unknown";

export type BreathworkOutcome =
  | "activate" | "energise" | "focus" | "calm" | "downshift" | "sleep"
  | "interrupt_urge" | "reset_nervous_system" | "lock_in_state_shift"
  | "prepare_for_training" | "recover" | "regain_control";

export type BreathworkProtocolId =
  | "box_breathing_5min" | "energising_breath_3min" | "extended_exhale_3min"
  | "urge_reset_3min" | "identity_reset_breath_5min" | "recovery_breath_5min";

const BREATHWORK_PROTOCOL_META: Record<BreathworkProtocolId, { title: string; durationMinutes: number; buttonLabel: string; payoff: string }> = {
  box_breathing_5min: {
    title: "Box Breathing", durationMinutes: 6, buttonLabel: "Start Box Breathing",
    payoff: "Resets your nervous system, clears your head, and gives your mind a clean signal.",
  },
  energising_breath_3min: {
    title: "Energising Breath", durationMinutes: 4, buttonLabel: "Start Energising Breath",
    payoff: "Wakes the system up, sharpens the body, and turns energy into action.",
  },
  extended_exhale_3min: {
    title: "Extended Exhale", durationMinutes: 4, buttonLabel: "Start Extended Exhale",
    payoff: "Brings the system down, slows the stress response, and prepares you to switch off.",
  },
  urge_reset_3min: {
    title: "Urge Reset Breath", durationMinutes: 5, buttonLabel: "Start Urge Reset",
    payoff: "Creates space between urge and action, breaks the loop, and gives control back.",
  },
  identity_reset_breath_5min: {
    title: "Identity Reset Breath", durationMinutes: 5, buttonLabel: "Start Identity Reset",
    payoff: "Stops the shame loop and re-anchors the standard.",
  },
  recovery_breath_5min: {
    title: "Recovery Breath", durationMinutes: 5, buttonLabel: "Start Recovery Breath",
    payoff: "Signals safety, lowers intensity, and helps the body recover.",
  },
};

export type BreathworkPrescription = {
  breathworkState: BreathworkState;
  desiredOutcome: BreathworkOutcome;
  explicitBreathworkRequest: string | null;
  selectedBreathworkProtocol: BreathworkProtocolId;
  reason: string;
  payoff: string;
  timeOfDayInfluence: string;
  completionStateInfluence: string;
  journalProfileInfluence: string;
};

function detectExplicitBreathworkRequest(message: string): { id: BreathworkProtocolId; label: string } | null {
  const m = message.toLowerCase();
  if (/\b(box breathing|box breath|4[\s-]?4[\s-]?4[\s-]?4|square breathing)\b/.test(m)) {
    return { id: "box_breathing_5min", label: "box_breathing" };
  }
  if (/\b(energising breath|energizing breath|activation breath)\b/.test(m)) {
    return { id: "energising_breath_3min", label: "energising_breath" };
  }
  if (/\b(extended exhale|long exhale|4[\s-]?6 breathing|4[\s-]?7[\s-]?8|wind ?down breath)\b/.test(m)) {
    return { id: "extended_exhale_3min", label: "extended_exhale" };
  }
  if (/\b(urge reset|interrupt breath)\b/.test(m)) {
    return { id: "urge_reset_3min", label: "urge_reset" };
  }
  if (/\b(identity reset breath)\b/.test(m)) {
    return { id: "identity_reset_breath_5min", label: "identity_reset_breath" };
  }
  if (/\b(recovery breath)\b/.test(m)) {
    return { id: "recovery_breath_5min", label: "recovery_breath" };
  }
  return null;
}

export function prescribeBreathwork(
  message: string,
  profile: Profile | null,
  journal: Journal | null,
  temporal: TemporalContext,
  progress: DailyProgressCtx | null,
): BreathworkPrescription {
  const m = (message ?? "").toLowerCase();
  const dayPart = temporal.dayPart;

  // 1. Safety / medical risk → calm extended exhale
  const medicalRisk = /\b(panic|panicky|dizzy|dizziness|faint|chest pain|pregnan|seizure|heart|cardiac|trauma|unsafe)\b/i.test(message);

  // 2. Explicit named request — give them that protocol unless unsafe
  const explicit = detectExplicitBreathworkRequest(message);

  // 3. Signals
  const energised = /\b(energis(ed|ing)|energiz(ed|ing)|attack the day|slept (great|well|good)|feel(ing)? (great|strong|amazing)|ready to go|fired up)\b/i.test(message);
  const flat = /\b(flat|sluggish|foggy|brain fog|tired|low energy|drained|heavy)\b/i.test(message);
  const scattered = /\b(scattered|unfocused|distracted|can'?t focus|mentally noisy|all over)\b/i.test(message);
  const anxious = /\b(anxious|anxiety|nervous|on edge|panicky)\b/i.test(message);
  const wired = /\b(wired|can'?t switch off|cannot switch off|racing thoughts|tense|overstimulated)\b/i.test(message);
  const angry = /\b(angry|furious|rage|pissed|annoyed)\b/i.test(message);
  const overwhelmed = /\b(overwhelm(ed)?|too much|drowning)\b/i.test(message);
  const postWalk = /\b(done my walk|did my walk|after (my )?walk|finished (my )?walk|just walked|post[- ]walk|been for a walk)\b/i.test(message);
  const longWalk = /\b(long walk|big walk|hike|hiked)\b/i.test(message);
  const preTraining = /\b(before (training|workout|gym|session)|pre[- ]training|about to train|going to (the )?gym|warm[- ]?up)\b/i.test(message);
  const postTraining = /\b(after (training|workout|gym|session|lifting)|post[- ]training|just trained|finished (training|the (gym|workout|session)|my (gym|workout|session|lift)|lifting)|done (training|the gym|my workout|my session|lifting)|just (lifted|worked out))\b/i.test(message);
  const physicalFatigue = /\b(sore|soreness|aching|achy|doms|stiff|fatigued|exhausted|smashed|wrecked|knackered|legs are done|body is done)\b/i.test(message);
  const heatExposure = /\b(sauna|hot bath|heat exposure|steam room)\b/i.test(message);
  const coldExposure = /\b(cold (plunge|shower|exposure|dip)|ice bath|just plunged)\b/i.test(message);
  const bodyComeDown = /\b(bring (my )?body down|body down|come down|wind down (my )?body|switch (off|down) my body|nervous system down|recover(y)? (downshift|now)|need to recover|recover properly|need a reset after|that walk took it out|took it out of me)\b/i.test(message);
  const bodyHeavy = /\b((legs|body|arms) (are|feel|felt|'?s|is) (tired|heavy|done|drained|sore|wrecked|smashed|knackered)|heavy legs|tired legs|physically (drained|tired|done|spent)|feel (drained|wiped|wiped out|spent)|smashed me|wiped me out|legs are gone)\b/i.test(message);
  const positiveState = /\b(feel (great|good|amazing|fresh|clear|calm|focused|ready|switched on|on point|sharp|locked in|clear[- ]?headed)|clear[- ]?headed|in a good headspace|good headspace|stay locked in|stay in this headspace|keep this (going|headspace)|want to (stay|keep) (in this|locked)|get on with (the |my )?day|ready to (get on|attack|go)|what should i do next|need to focus|get my head right|switched on)\b/i.test(message);
  const urge = /\b(urge|craving|porn|gambl|relapse|binge|compulsi|substance|drink(ing)?|drugs?)\b/i.test(message);
  const scrolling = /\b(scroll(ing)?|phone loop|tiktok|instagram|reels|slipping)\b/i.test(message);
  const missed = /\b(missed (a )?day|missed two days|fell off|lost it|haven'?t (done|trained))\b/i.test(message);
  const shame = /\b(shame|ashamed|hate myself|loser|pathetic|disgust(ed|ing))\b/i.test(message);
  const sleepCue = /\b(sleep|bedtime|before bed|wind ?down|switch off|night|tonight)\b/i.test(message);
  const explicitLateCue = /\b(it'?s late|so late|getting late|late night|late and|too late)\b/i.test(message);
  const lateNight = explicitLateCue || dayPart === "LATE_NIGHT" || (() => {
    const h = parseInt((temporal.localTime ?? "00:00").split(":")[0] ?? "0", 10);
    return h >= 22 || h < 5;
  })();
  const morningCue = dayPart === "MORNING" || /\b(this morning|morning|woke up)\b/i.test(message);
  const eveningCue = dayPart === "EVENING" || lateNight || /\b(evening|tonight)\b/i.test(message);

  // Journal/profile influences
  const poorSleep = (journal && typeof journal.sleep === "number" && journal.sleep < 6) || /\b(slept (badly|poorly)|no sleep|bad sleep|barely slept)\b/i.test(message);
  const profileX = (profile as unknown as Record<string, unknown> | null) ?? null;
  const compulsion = Array.isArray(profileX?.compulsionTypes) && (profileX!.compulsionTypes as unknown[]).length > 0;
  const relapseRisk = typeof profileX?.relapseRisk === "string" ? (profileX!.relapseRisk as string) : null;
  const breathworkDoneToday = !!progress?.breathworkCompleted;

  let state: BreathworkState = "unknown";
  let outcome: BreathworkOutcome = "reset_nervous_system";
  let id: BreathworkProtocolId = "box_breathing_5min";
  let reason = "Default control protocol.";

  // 1. SAFETY override
  if (medicalRisk) {
    state = "panic_like";
    outcome = "calm";
    id = "extended_exhale_3min";
    reason = "Safety/medical signal — use calm extended exhale, no breath holds.";
  }
  // 2. EXPLICIT request override (only if safe)
  else if (explicit) {
    state = "focus_reset";
    outcome = explicit.id === "energising_breath_3min" ? "energise"
      : explicit.id === "extended_exhale_3min" ? "downshift"
      : explicit.id === "urge_reset_3min" ? "interrupt_urge"
      : explicit.id === "identity_reset_breath_5min" ? "regain_control"
      : explicit.id === "recovery_breath_5min" ? "recover"
      : "focus";
    id = explicit.id;
    reason = `User explicitly asked for ${BREATHWORK_PROTOCOL_META[id].title}.`;
  }
  // 3. URGE / addiction drift — high priority
  else if (urge || (scrolling && (compulsion || relapseRisk === "high" || relapseRisk === "active"))) {
    state = urge ? "urge_or_compulsion" : "addiction_drift";
    outcome = "interrupt_urge";
    id = "urge_reset_3min";
    reason = "Urge / compulsion / scroll-loop signal — break the loop and create space before action.";
  }
  else if (scrolling) {
    state = "phone_scroll_loop";
    outcome = "interrupt_urge";
    id = "urge_reset_3min";
    reason = "Phone scroll-loop signal — short interrupt protocol breaks the loop without shame.";
  }
  // 4. MISSED day re-entry / shame
  else if (missed || shame) {
    state = missed ? "missed_day_reentry" : "identity_reset";
    outcome = "regain_control";
    id = "identity_reset_breath_5min";
    reason = "Missed-day / shame signal — identity reset breath re-anchors the standard, no punishment.";
  }
  // 5. Pre/post training
  else if (preTraining) {
    state = "pre_training_activation";
    outcome = "prepare_for_training";
    id = poorSleep ? "box_breathing_5min" : "energising_breath_3min";
    reason = poorSleep
      ? "Pre-training but poor sleep — control protocol, not energising."
      : "Pre-training activation — sharpen the system before the session.";
  }
  else if (postTraining || physicalFatigue || heatExposure || coldExposure || bodyComeDown || bodyHeavy) {
    state = postTraining
      ? "post_training_downshift"
      : (heatExposure || coldExposure)
        ? "effort_to_recovery"
        : (physicalFatigue || bodyHeavy)
          ? "physical_fatigue"
          : "recovery_downshift";
    outcome = "recover";
    id = "recovery_breath_5min";
    reason = postTraining
      ? "Post-training — signal safety, lower intensity, recover the system."
      : heatExposure
        ? "Heat exposure — bring the body down and start recovery."
        : coldExposure
          ? "Cold exposure — close out the stressor and recover the system."
          : (physicalFatigue || bodyHeavy)
            ? "Physical fatigue / heavy body — recovery downshift, not activation."
            : "Recovery downshift requested — bring the body down properly.";
  }
  // 5b. WALK context — disambiguate by described state
  else if (postWalk || longWalk) {
    if (anxious || wired || angry || overwhelmed || (eveningCue && sleepCue) || lateNight) {
      state = anxious ? "anxious" : wired ? "wired" : "sleep_wind_down";
      outcome = lateNight || (eveningCue && sleepCue) ? "sleep" : "downshift";
      id = "extended_exhale_3min";
      reason = "Walk + activated/sleep signal — downshift, not lock-in.";
    } else {
      state = "post_walk_lock_in";
      outcome = "lock_in_state_shift";
      id = "box_breathing_5min";
      reason = positiveState
        ? "Walk + positive state — lock in clarity with Box Breathing."
        : "Post-walk — lock in the state shift before drift returns.";
    }
  }
  // 6. Late night / sleep cue
  else if (lateNight || (eveningCue && sleepCue)) {
    state = "sleep_wind_down";
    outcome = "sleep";
    id = "extended_exhale_3min";
    reason = "Late / sleep window — downshift, protect sleep.";
  }
  // 7. Evening + wired/anxious/angry
  else if (eveningCue && (wired || anxious || angry || overwhelmed)) {
    state = wired ? "wired" : anxious ? "anxious" : angry ? "angry" : "overwhelmed";
    outcome = "downshift";
    id = "extended_exhale_3min";
    reason = "Evening + activated state — extended exhale brings the system down.";
  }
  // 9. Morning logic
  else if (morningCue) {
    if (anxious || wired) {
      state = "morning_anxious";
      outcome = "calm";
      id = "extended_exhale_3min";
      reason = "Morning anxious — regulate without killing momentum.";
    } else if (scattered) {
      state = "morning_scattered";
      outcome = "focus";
      id = "box_breathing_5min";
      reason = "Morning scattered — Box Breathing controls the mind before the day takes over.";
    } else if (flat) {
      state = "morning_flat";
      outcome = "activate";
      id = poorSleep ? "box_breathing_5min" : "energising_breath_3min";
      reason = poorSleep
        ? "Morning flat + poor sleep — gentle control protocol, not intense activation."
        : "Morning flat — wake the body and sharpen the system.";
    } else if (energised) {
      state = "morning_energised";
      outcome = "energise";
      id = "energising_breath_3min";
      reason = "Morning energised — build drive, turn energy into action. Do not downshift.";
    } else {
      state = "morning_scattered";
      outcome = "focus";
      id = "box_breathing_5min";
      reason = "Morning default — control protocol before phone or caffeine.";
    }
  }
  // 9b. Energised / attack-the-day signal at any hour (not late-night, not evening)
  else if (energised && !lateNight && !eveningCue) {
    state = "morning_energised";
    outcome = "energise";
    id = "energising_breath_3min";
    reason = "Energised / attack-the-day signal — turn energy into action.";
  }
  // 10. Activated states (any time)
  else if (anxious || wired || angry || overwhelmed) {
    state = anxious ? "anxious" : wired ? "wired" : angry ? "angry" : "overwhelmed";
    outcome = "downshift";
    id = "extended_exhale_3min";
    reason = "Activated nervous system — extended exhale brings it back to baseline.";
  }
  else if (scattered) {
    state = "focus_reset";
    outcome = "focus";
    id = "box_breathing_5min";
    reason = "Scattered / distracted — Box Breathing for focus.";
  }
  else if (flat) {
    state = "low_energy";
    outcome = "activate";
    id = poorSleep ? "box_breathing_5min" : "energising_breath_3min";
    reason = poorSleep ? "Low energy + poor sleep — gentle control." : "Low energy — short activation.";
  }
  else {
    state = "focus_reset";
    outcome = "focus";
    id = "box_breathing_5min";
    reason = "No specific signal — Box Breathing as the safe daily control protocol.";
  }

  const meta = BREATHWORK_PROTOCOL_META[id];
  const timeOfDayInfluence = `dayPart=${dayPart}; localTime=${temporal.localTime ?? "?"}; lateNight=${lateNight}`;
  const completionStateInfluence = `breathworkCompletedToday=${breathworkDoneToday}`;
  const journalProfileInfluence = `poorSleep=${poorSleep}; compulsion=${compulsion}; relapseRisk=${relapseRisk ?? "none"}`;

  return {
    breathworkState: state,
    desiredOutcome: outcome,
    explicitBreathworkRequest: explicit?.label ?? null,
    selectedBreathworkProtocol: id,
    reason,
    payoff: meta.payoff,
    timeOfDayInfluence,
    completionStateInfluence,
    journalProfileInfluence,
  };
}


type CalorieResolution = ReturnType<typeof resolveCalorieTarget>;

function buildNutritionBlock(calorie: CalorieResolution): string {
  if (calorie.calorieSource === "not_available") {
    return [
      "NUTRITION SECTION — calorie data NOT AVAILABLE.",
      "Under NUTRITION you MUST NOT invent a calorie number. State explicitly: 'I do not have enough to set a calorie target yet.'",
      "Then ask the user for these 6 fields in a single block, exactly: age, sex, height (cm), weight (kg), activity level, primary goal.",
      "Then give the temporary non-calorie standard: protein-first at every meal, water before caffeine, one whole-food meal locked in today, no chaotic evening eating.",
      `Missing fields surfaced by backend: ${calorie.calorieMissingFields.join(", ") || "all required fields"}.`,
    ].join(" ");
  }
  const m = calorie.macroTargetUsed!;
  const src = calorie.calorieSource === "calculated"
    ? "calculated from your profile via Mifflin-St Jeor"
    : "from saved profile";
  return `NUTRITION SECTION — calorie target available. State: 'Daily target: ${calorie.calorieTargetUsed} kcal (${src}).' Macros: protein ${m.proteinG} g, carbs ${m.carbsG} g, fat ${m.fatG} g. Rule: protein before chaos, water before caffeine, one whole-food meal locked in, no chaotic evening eating.`;
}

function buildDailyOsPlanShape(opts: {
  kind: "FULL_REBUILD" | "PROGRAM" | "MORNING_PROTOCOL" | "BREATH_MED" | "NUTRITION";
  calorie: CalorieResolution;
  askOnlyMissing: string;
  exerciseSafety: string;
}): string {
  const { kind, calorie, askOnlyMissing, exerciseSafety } = opts;
  const spec = [
    "ACTIVE ROUTE is a PLAN_BUILDING route. RESPONSE MODE is PLAN_BUILDING.",
    "You MUST output EXACTLY these section headers, in this order, each on its own line:",
    "HEADLINE / THE STANDARD / YOUR FIRST 24 HOURS / MORNING PROTOCOL / TRAINING PLAN / BREATHWORK / MEDITATION / NUTRITION / WHAT I NEED FROM YOU / REPLY WITH.",
    "Obey GORILLA MIND LANGUAGE RULES and BANNED PHRASES and NUTRITION GUARDRAIL from the system instructions.",
    "Use at least 2 phrases from the REQUIRED VOCABULARY list.",
    "MORNING PROTOCOL must be an ordered timed sequence: water before phone, mineralised hydration if appropriate (water + pinch Celtic sea salt + lemon), morning daylight outside, 5 min breathwork, 5 min meditation or identity reset, movement, protein-first meal, one-line journal + affirmation/identity line.",
    "TRAINING PLAN must be an explicit 7-day structure with exercises/reps/sets/rest. If equipment, injury history, or experience level are unknown, default to home bodyweight + walks AND list the missing items under WHAT I NEED FROM YOU.",
    "BREATHWORK must name the exact practice with duration (match the GUIDED PRACTICE card if one was injected).",
    "MEDITATION must name the exact practice with duration (match the GUIDED PRACTICE card if one was injected).",
    buildNutritionBlock(calorie),
  ].join("\n");

  const replyChips =
    kind === "FULL_REBUILD" || kind === "PROGRAM" ? "REPLY WITH chips: CALORIES / GYM PLAN / HOME PLAN / MORNING PROTOCOL." :
    kind === "MORNING_PROTOCOL" ? "REPLY WITH chips: BREATHWORK / MEDITATION / TRAINING / NUTRITION." :
    kind === "BREATH_MED" ? "REPLY WITH chips: MORNING PROTOCOL / TRAINING / CALORIES / FULL REBUILD." :
    /* NUTRITION */ "REPLY WITH chips: CALORIES / FAT LOSS / MUSCLE / ALL-ROUND RESET.";

  const focusNote =
    kind === "MORNING_PROTOCOL" ? "Emphasise the MORNING PROTOCOL section — make it the longest. Other sections stay short but present."
    : kind === "BREATH_MED" ? "Emphasise BREATHWORK and MEDITATION sections — give exact practices and durations for each day of the week."
    : kind === "NUTRITION" ? "Emphasise NUTRITION section. TRAINING PLAN may be a short 7-day skeleton."
    : "All sections balanced.";

  return `${spec}\n\n${focusNote}\n\n${askOnlyMissing} ${exerciseSafety}\n\n${replyChips}`;
}

// ---------- Default fitness plan helper ----------
// Returns structured template text the model can use inside PLAN_BUILDING
// responses. The shape matches the supported route templates so the model
// produces concrete prescriptions rather than generic wellness advice.

export type DefaultFitnessPlanKind =
  | "BEGINNER_HOME"
  | "BEGINNER_GYM"
  | "PILATES_CORE_BACK_SUPPORT"
  | "RUNNING_STARTER"
  | "LOW_ENERGY"
  | "INTERMEDIATE_MIXED";

export function buildDefaultFitnessPlan(opts: {
  level?: FitnessLevel;
  location?: TrainingLocation;
  goal?: FitnessGoal;
  injuryFlag?: InjuryFlag;
  availableTime?: AvailableTime;
  preferredStyle?: PreferredStyle;
}): { kind: DefaultFitnessPlanKind; text: string } {
  const level = opts.level ?? "unknown";
  const location = opts.location ?? "unknown";
  const goal = opts.goal ?? "unknown";
  const injury = opts.injuryFlag ?? "unknown";
  const style = opts.preferredStyle ?? "unknown";

  // Choose a sensible default kind based on the inputs.
  let kind: DefaultFitnessPlanKind = "BEGINNER_HOME";
  if (injury === "back_pain" || goal === "back_support" || style === "pilates") {
    kind = "PILATES_CORE_BACK_SUPPORT";
  } else if (style === "running" || goal === "running") {
    kind = "RUNNING_STARTER";
  } else if (opts.availableTime === "10_minutes" || opts.availableTime === "20_minutes" && level === "unknown") {
    // Low-energy bias only when explicitly short on time.
    if (level === "unknown") kind = "LOW_ENERGY";
  } else if (level === "intermediate" || level === "advanced") {
    kind = "INTERMEDIATE_MIXED";
  } else if (level === "beginner" && location === "gym") {
    kind = "BEGINNER_GYM";
  } else if (location === "gym") {
    kind = "BEGINNER_GYM";
  } else {
    kind = "BEGINNER_HOME";
  }

  const TEMPLATES: Record<DefaultFitnessPlanKind, string> = {
    BEGINNER_HOME: [
      "DEFAULT PLAN — BEGINNER_HOME (20-minute home reset)",
      "Warm-up (3 min): march on the spot, shoulder rolls, hip openers, nasal breathing only.",
      "Bodyweight circuit (12 min) — 3 rounds, 30–60s rest:",
      "  • 10 bodyweight squats",
      "  • 8 incline press-ups (hands on counter or wall)",
      "  • 10 glute bridges",
      "  • 10 hip hinges",
      "  • 20-second plank",
      "Cool-down (5 min): walk + nasal breathing 4 in / 6 out.",
      "Weekly structure (7 days):",
      "  Day 1: circuit  ·  Day 2: 30-min walk + mobility  ·  Day 3: circuit",
      "  Day 4: walk + breathwork  ·  Day 5: circuit  ·  Day 6: longer walk  ·  Day 7: review.",
    ].join("\n"),

    BEGINNER_GYM: [
      "DEFAULT PLAN — BEGINNER_GYM (full-body gym, 3x per week)",
      "Warm-up (5–8 min): incline walk or bike, easy pace.",
      "Main session:",
      "  • Leg press OR goblet squat — 3 × 10 (2 reps in reserve)",
      "  • Chest press OR press-ups — 3 × 8–10",
      "  • Seated row OR cable row — 3 × 10",
      "  • Hip hinge (RDL or hip-hinge pattern) — 3 × 8",
      "  • Plank — 3 × 20–30s",
      "Finisher: 10-minute incline walk.",
      "Weekly structure: 3 strength days + 2 walks + 2 mobility/core days.",
      "Rules: technique before load, leave 2 reps in reserve, no ego lifting.",
    ].join("\n"),

    PILATES_CORE_BACK_SUPPORT: [
      "DEFAULT PLAN — PILATES_CORE_BACK_SUPPORT",
      "Safety caveat (state explicitly): if pain is sharp, shooting, neurological, numb/weak, or worsening — recommend medical/physiotherapy review before training. Do not diagnose.",
      "Session (20 min):",
      "  • Nasal breathing reset — 2 min",
      "  • Pelvic tilts — 2 × 10",
      "  • Dead bugs — 2 × 8 per side",
      "  • Glute bridges — 2 × 12",
      "  • Bird dogs — 2 × 8 per side",
      "  • Side plank from knees — 2 × 15–20s per side",
      "  • Child's pose — 2 min",
      "Rules: slow reps, brace lightly, stop immediately if symptoms increase.",
    ].join("\n"),

    RUNNING_STARTER: [
      "DEFAULT PLAN — RUNNING_STARTER (walk/jog intervals)",
      "Warm-up: 5 min brisk walk.",
      "Main: 8 rounds — 30s light jog + 90s walk (no sprinting).",
      "Cool-down: 5 min walk + 3 min nasal breathing.",
      "Rules: run slower than you think, build joints before ego, walking is part of the plan.",
      "Weekly structure: Day1 intervals · Day2 walk+mobility · Day3 intervals · Day4 rest/easy walk · Day5 intervals · Day6 long walk · Day7 review.",
    ].join("\n"),

    LOW_ENERGY: [
      "DEFAULT PLAN — LOW_ENERGY (minimum standard day)",
      "1. Water (500ml) before anything else.",
      "2. 10-minute walk — nasal breathing.",
      "3. Short circuit — 3 rounds: 10 squats, 10 glute bridges, 20-second plank.",
      "4. Extended-exhale breathing — 3 minutes (4 in / 8 out).",
      "Frame: 'This is not a performance day. This is a minimum standard day.'",
    ].join("\n"),

    INTERMEDIATE_MIXED: [
      "DEFAULT PLAN — INTERMEDIATE_MIXED (7-day mixed structure)",
      "3 strength days + 2 Zone 2 cardio days + 2 mobility/core days.",
      "  Day 1: full-body strength",
      "  Day 2: Zone 2 cardio (30–45 min) + core",
      "  Day 3: upper/lower split strength",
      "  Day 4: mobility + breathwork",
      "  Day 5: full-body strength",
      "  Day 6: Zone 2 conditioning or long walk",
      "  Day 7: mobility + review",
      "Before prescribing load percentages or advanced volume: ask the user for equipment, training history, and primary goal.",
    ].join("\n"),
  };

  const header = `LEVEL=${level} · LOCATION=${location} · GOAL=${goal} · INJURY=${injury} · STYLE=${style}`;
  return { kind, text: `${header}\n${TEMPLATES[kind]}` };
}

const EMPTY_PROGRAM_STATE: ProgramState = {
  activePlanType: null,
  activePlanLength: null,
  selectedFitnessLevel: null,
  selectedBreathwork: null,
  selectedMeditation: null,
  selectedMorningProtocol: null,
  missingPersonalisationFields: [],
  lastRecommendedGuidedPractice: null,
  lastProgrammeRoute: null,
};

const ProgramStateSchema = z.object({
  activePlanType: z.string().nullable(),
  activePlanLength: z.string().nullable(),
  selectedFitnessLevel: z.string().nullable(),
  selectedBreathwork: z.string().nullable(),
  selectedMeditation: z.string().nullable(),
  selectedMorningProtocol: z.string().nullable(),
  missingPersonalisationFields: z.array(z.string()).max(40),
  lastRecommendedGuidedPractice: z.string().nullable(),
  lastProgrammeRoute: z.string().nullable(),
});

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      question: z.string().min(1).max(4000),
      profile: ProfileSchema.nullable().optional(),
      journal: JournalSchema.nullable().optional(),
      dailyProgress: DailyProgressSchema.nullable().optional(),
      temporal: TemporalSchema.nullable().optional(),
      history: z.array(HistoryTurnSchema).max(40).optional(),
      priorProgramState: ProgramStateSchema.nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<CoachResponse> => {
    const apiKey = process.env.OPENAI_API_KEY;
    const vectorStoreId = process.env.GORILLA_MIND_VECTOR_STORE_ID ?? null;
    const model = "gpt-4o-mini";

    const profile = data.profile ?? null;
    const journal = data.journal ?? null;
    const progress = data.dailyProgress ?? null;
    const history = data.history ?? [];

    // Temporal: prefer client-provided; otherwise derive a UTC-based fallback.
    let temporal: TemporalContext | null = data.temporal ?? null;
    let temporalSource: "client" | "fallback" = temporal ? "client" : "fallback";
    if (!temporal) {
      const now = new Date();
      const hour = now.getUTCHours();
      const dayPart: DayPart =
        hour >= 4 && hour < 11 ? "MORNING" :
        hour >= 11 && hour < 16 ? "MIDDAY" :
        hour >= 16 && hour < 22 ? "EVENING" : "LATE_NIGHT";
      const sessionContext: SessionContext =
        dayPart === "MORNING" ? "MORNING_CHECK_IN" :
        dayPart === "MIDDAY" ? "MIDDAY_COURSE_CORRECTION" :
        dayPart === "EVENING" ? "EVENING_REVIEW" : "LATE_NIGHT_SLEEP_PROTECTION";
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      temporal = {
        localDate: now.toISOString().slice(0, 10),
        localTime: `${String(hour).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`,
        timezone: "UTC",
        dayOfWeek: days[now.getUTCDay()],
        dayPart,
        sessionContext,
      };
      temporalSource = "fallback";
    }

    // Derive response mode. EVENING >21:30 promotes to LATE_NIGHT_SHUTDOWN.
    const [hStr, mStr] = (temporal.localTime || "00:00").split(":");
    const tHour = Number(hStr) || 0;
    const tMin = Number(mStr) || 0;
    const afterShutdown = tHour > 21 || (tHour === 21 && tMin >= 30);
    let responseMode: ResponseMode =
      temporal.dayPart === "MORNING" ? "MORNING_ACTIVATION" :
      temporal.dayPart === "MIDDAY" ? "AFTERNOON_RESCUE" :
      temporal.dayPart === "EVENING" ? (afterShutdown ? "LATE_NIGHT_SHUTDOWN" : "EVENING_RESET") :
      "LATE_NIGHT_SHUTDOWN";

    const safetyFlags: string[] = [];
    if (profile?.alcoholFlag) safetyFlags.push("alcoholFlag");
    if (profile?.processAddictionFlag) safetyFlags.push("processAddictionFlag");
    if (profile?.foodBoundaryActive) safetyFlags.push("foodBoundaryActive");
    if (profile && profile.recoveryState && profile.recoveryState !== "none") safetyFlags.push(`recoveryState:${profile.recoveryState}`);

    let routing = detectRoute(data.question, profile, journal, temporal);

    // ---------- Continuation override (after safety, before everything else) ----------
    const previousCoachReplyOptions = (() => {
      const last = [...history].reverse().find((h) => h.role === "assistant");
      return last ? extractReplyOptions(last.content) : [];
    })();
    const priorProgramState = (data.priorProgramState ?? null) as ProgramState | null;
    const continuation = detectContinuationCommand(data.question, history, priorProgramState);
    const isSafetyCrisis = routing.route === "SAFETY_CRISIS";
    let routeOverrideApplied = false;
    let routeOverrideReason: string | null = null;
    let selectedRouteBeforeOverride: CoachRoute | null = null;
    let selectedRouteAfterOverride: CoachRoute | null = null;
    let continuationCommand: ContinuationCommand = "NONE";

    if (continuation && !isSafetyCrisis) {
      selectedRouteBeforeOverride = routing.route;
      continuationCommand = continuation.command;
      routing = {
        route: continuation.route,
        reason: `Continuation override: user replied "${data.question.trim().toUpperCase()}" to previous coach turn. Explicit continuation command takes priority over journal/profile routing.`,
        query: `gorilla mind continuation ${continuation.command.toLowerCase().replace(/_/g, " ")} 7 day plan body first work clarity discipline standards`,
      };
      selectedRouteAfterOverride = routing.route;
      routeOverrideApplied = true;
      routeOverrideReason = "User selected explicit continuation command.";
    }

    const breathworkSubRoute: BreathworkSubRoute =
      routing.route === "BREATHWORK" ? (routing.breathworkSubRoute ?? "DOWNREGULATE") : "NONE";

    // Continuation routes AND Daily-OS plan routes force PLAN_BUILDING response mode.
    const PLAN_BUILDING_ROUTES = new Set<CoachRoute>([
      "FULL_REBUILD_PLAN", "PROGRAM_REQUEST", "MORNING_PROTOCOL_REQUEST",
      "BREATHWORK_MEDITATION_REQUEST", "NUTRITION_CALORIE_REQUEST",
      "FAT_LOSS_STARTER_PLAN", "GYM_STRENGTH_PLAN",
    ]);
    let responseModeReason: string =
      `Default from dayPart=${temporal.dayPart} (${responseMode}).`;
    if (!isSafetyCrisis && (continuation || PLAN_BUILDING_ROUTES.has(routing.route))) {
      responseMode = "PLAN_BUILDING";
      responseModeReason = `Route ${routing.route} forces PLAN_BUILDING.`;
    }

    // Route-specific response mode mapping — overrides dayPart default so we
    // do not inject MORNING_ACTIVATION boilerplate into stress / evening /
    // low-energy / missed-day responses.
    const msgLower = data.question.toLowerCase();
    const userSaidMorning = /\b(this morning|morning|wasted (the )?morning|woke up)\b/.test(msgLower);
    const ROUTE_RESPONSE_MODE: Partial<Record<CoachRoute, ResponseMode>> = {
      LOW_ENERGY_MINIMUM_PLAN: "LOW_ENERGY_MINIMUM",
      LOW_ENERGY_SESSION: "LOW_ENERGY_MINIMUM",
      FAT_LOSS_STARTER_PLAN: "PLAN_BUILDING",
      NUTRITION_CALORIE_REQUEST: "PLAN_BUILDING",
      GYM_STRENGTH_PLAN: "PLAN_BUILDING",
      EVENING_WORK_PROTOCOL: "EVENING_PROTOCOL",
      MISSED_DAY_REPAIR: "RESET_RECOVERY",
      STRESS_RESET: "STRESS_RESET",
      SLEEP_WIND_DOWN: afterShutdown || temporal.dayPart === "LATE_NIGHT" ? "LATE_NIGHT_SHUTDOWN" : "SLEEP_WIND_DOWN",
      URGE_RESET: "URGE_RESET",
      RELAPSE_PREVENTION: "RELAPSE_PREVENTION",
      POST_RELAPSE_REPAIR: "POST_RELAPSE_REPAIR",
      RECOVERY_STRUCTURE: "RECOVERY_STRUCTURE",
      SAFETY_SUPPORT: "SAFETY_SUPPORT",
    };
    if (!isSafetyCrisis && !continuation && ROUTE_RESPONSE_MODE[routing.route]) {
      responseMode = ROUTE_RESPONSE_MODE[routing.route]!;
      responseModeReason = `Route ${routing.route} mapped to ${responseMode}.`;
    }
    // PROCESS_ADDICTION: only morning activation if dayPart morning or user said morning.
    if (!isSafetyCrisis && !continuation && routing.route === "PROCESS_ADDICTION") {
      if (temporal.dayPart === "MORNING" || userSaidMorning) {
        responseMode = "MORNING_ACTIVATION";
        responseModeReason = "PROCESS_ADDICTION + morning context → MORNING_ACTIVATION.";
      } else {
        responseMode = "PROCESS_RESET";
        responseModeReason = "PROCESS_ADDICTION outside morning → PROCESS_RESET.";
      }
    }
    // BREATHWORK with downregulate sub-route → STRESS_RESET mode.
    if (!isSafetyCrisis && !continuation && routing.route === "BREATHWORK" && breathworkSubRoute === "DOWNREGULATE") {
      responseMode = "STRESS_RESET";
      responseModeReason = "BREATHWORK/DOWNREGULATE → STRESS_RESET mode.";
    }

    // Morning-filler suppression: which routes are NOT allowed to inject
    // hydrate/light/phone-away/protein-breakfast bullets.
    const MORNING_FILLER_ALLOWED: Set<CoachRoute> = new Set([
      "MORNING_PROTOCOL_REQUEST", "FULL_REBUILD_PLAN", "PROGRAM_REQUEST",
      "PROCESS_ADDICTION",
    ]);
    const allowMorningFiller =
      MORNING_FILLER_ALLOWED.has(routing.route) ||
      (routing.route === "GENERAL_LIFE_STUCK" && temporal.dayPart === "MORNING");
    const morningFillerSuppressed = !allowMorningFiller;

    const guidedPractice = routing.route === "SAFETY_CRISIS"
      ? null
      : selectGuidedPractice({
          route: routing.route,
          breathworkSubRoute,
          message: data.question,
        });

    // Retrieval suppression — for GENERAL_LIFE_STUCK, do not lean on process-addiction
    // material unless the user explicitly mentioned addiction/compulsion/relapse.
    const addictionTrigger = /\b(addict(ion|ed)?|relapse|binge|bingeing|compulsi(ve|on)|substance|alcohol|porn|gambl(e|ing)|food binge|uncontrollable scrol|self.?destruct|drinking|drugs?)\b/i.test(data.question);
    const retrievalSuppressedVolumes: string[] = [];
    let reasonForSuppression: string | null = null;
    if (routing.route === "GENERAL_LIFE_STUCK" && !addictionTrigger) {
      retrievalSuppressedVolumes.push("process_addiction");
      reasonForSuppression = "Process addiction content not used because user did not mention addiction/compulsion/relapse.";
    }

    // Duplicate-advice suppression: detect what the last coach response already prescribed.
    const suppressedAdvice = continuation ? detectPreviousAdvice(history) : [];
    const duplicateAdviceSuppressed = suppressedAdvice.length > 0;

    const conversationContinuation = history.length > 0;

    // Initial quickReplies guess (route-based); may be overridden after answer parsing.
    const fallbackQuickRepliesByRoute: Partial<Record<CoachRoute, string[]>> = {
      GENERAL_LIFE_STUCK: ["FITNESS", "JOB", "BOTH"],
      GENERAL_TRANSFORMATION_REQUEST: ["20-DAY", "60-DAY", "90-DAY", "START TONIGHT"],
      EVENING_REVIEW: ["BUILD TOMORROW", "WIND DOWN NOW", "MORNING PLAN"],
      SLEEP_WIND_DOWN: ["BREATHWORK", "PHONE DOWN", "MORNING PLAN"],
      MISSED_DAY_REPAIR: ["RESET TODAY", "MINIMUM SESSION", "JOURNAL"],
      MISSED_MORNING: ["MORNING", "BUILD MY PLAN"],
      CONTINUATION_BOTH_PLAN: ["BUILD MY PLAN"],
      CONTINUATION_BUILD_MY_PLAN: ["FITNESS", "JOB", "BOTH"],
      CONTINUATION_FITNESS_PLAN: ["BUILD MY PLAN", "JOB"],
      CONTINUATION_JOB_PLAN: ["BUILD MY PLAN", "FITNESS"],
      CONTINUATION_RESET_NOW: ["BUILD MY PLAN", "MINIMUM STANDARD"],
      CONTINUATION_MINIMUM_STANDARD: ["BUILD MY PLAN"],
      CONTINUATION_MORNING_SETUP: ["BUILD MY PLAN", "FITNESS"],
      FITNESS_PLAN_REQUEST: ["HOME", "GYM", "RUNNING", "PILATES"],
      FITNESS_ROUTINE_BUILDER: ["HOME", "GYM", "RUNNING", "PILATES"],
      FULL_REBUILD_PLAN: ["HOME", "GYM", "RUNNING", "PILATES"],
      CORE_BACK_SUPPORT_PLAN: ["BACK PLAN", "PILATES", "WALKING", "FULL RESET"],
      GYM_STRENGTH_PLAN: ["BEGINNER", "INTERMEDIATE", "LOW ENERGY", "BUILD MY PLAN"],
      RUNNING_STARTER_PLAN: ["BEGINNER", "INTERMEDIATE", "BUILD MY PLAN"],
      HOME_BODYWEIGHT_PLAN: ["BEGINNER", "INTERMEDIATE", "LOW ENERGY", "BUILD MY PLAN"],
      PILATES_CORE_PLAN: ["BACK PLAN", "PILATES", "WALKING", "FULL RESET"],
      LOW_ENERGY_SESSION: ["LOW ENERGY", "FULL SESSION", "WALK", "BREATHWORK"],
      INTERMEDIATE_FITNESS_PLAN: ["GYM", "HOME", "BUILD MY PLAN"],
      LOW_ENERGY_MINIMUM_PLAN: ["LOW ENERGY", "FULL SESSION", "WALK", "BREATHWORK"],
      FAT_LOSS_STARTER_PLAN: ["CALORIES", "FOOD PLAN", "TRAINING PLAN", "MORNING PROTOCOL"],
      NUTRITION_CALORIE_REQUEST: ["CALORIES", "FOOD PLAN", "TRAINING PLAN", "MORNING PROTOCOL"],
      EVENING_WORK_PROTOCOL: ["FOOD", "BREATHWORK", "MORNING SETUP", "RESET TOMORROW"],
      STRESS_RESET: ["BREATHWORK", "JOURNAL", "WALK", "TALK ME DOWN"],
      URGE_RESET: ["I AM SAFE", "STILL STRUGGLING", "CALL SOMEONE", "RESET PLAN"],
      RELAPSE_PREVENTION: ["I AM SAFE", "STILL AT RISK", "CALL SOMEONE", "URGE RESET"],
      POST_RELAPSE_REPAIR: ["REPAIR PLAN", "CALL SOMEONE", "JOURNAL", "RESET TODAY"],
      RECOVERY_STRUCTURE: ["MORNING PLAN", "URGE PLAN", "TRAINING", "EVENING RESET"],
      SAFETY_SUPPORT: ["I AM SAFE", "NEED HELP", "CALL SOMEONE", "GROUND ME"],
    };
    let quickReplies: string[] = fallbackQuickRepliesByRoute[routing.route] ?? [];

    // ---------- Exercise Prescription Engine wiring ----------
    const fc = classifyFitness(data.question, profile, journal);
    const isFitnessRoute = FITNESS_ROUTES.has(routing.route);
    const guidedWorkout: GuidedWorkoutRecommendation | null = isFitnessRoute
      ? buildWorkoutForRoute(routing.route, fc)
      : null;
    const personalisationMissing = isFitnessRoute ? exercisePersonalisationMissing(fc) : [];
    const safetyModificationApplied = isFitnessRoute && (fc.injuryFlag === "back_pain" || routing.route === "CORE_BACK_SUPPORT_PLAN" || routing.route === "PILATES_CORE_PLAN" || routing.route === "LOW_ENERGY_SESSION");
    const exercisePlanSource = isFitnessRoute
      ? (routing.route === "GYM_STRENGTH_PLAN" ? "TEMPLATE_GYM_FULL_BODY"
        : routing.route === "RUNNING_STARTER_PLAN" ? "TEMPLATE_RUN_WALK"
        : routing.route === "PILATES_CORE_PLAN" || routing.route === "CORE_BACK_SUPPORT_PLAN" ? "TEMPLATE_PILATES_CORE"
        : routing.route === "LOW_ENERGY_SESSION" || routing.route === "LOW_ENERGY_MINIMUM_PLAN" ? "TEMPLATE_LOW_ENERGY"
        : routing.route === "INTERMEDIATE_FITNESS_PLAN" ? "TEMPLATE_INTERMEDIATE_FULL_BODY"
        : routing.route === "FULL_REBUILD_PLAN" ? "TEMPLATE_FULL_REBUILD"
        : "TEMPLATE_HOME_BODYWEIGHT")
      : null;


    // ---------- Daily OS pillar + calorie + plan-card resolution ----------
    const PLAN_ROUTES_SET = new Set<CoachRoute>([
      "FULL_REBUILD_PLAN", "PROGRAM_REQUEST", "MORNING_PROTOCOL_REQUEST",
      "BREATHWORK_MEDITATION_REQUEST", "NUTRITION_CALORIE_REQUEST",
    ]);
    const isPlanRoute = PLAN_ROUTES_SET.has(routing.route);
    const pillarPick = selectPillarsForRoute(routing.route, data.question, profile);
    const calorie = resolveCalorieTarget(profile);
    const planCard = isPlanRoute || routing.route === "MISSED_DAY_REPAIR" || routing.route === "MISSED_MORNING"
      ? selectGuidedPracticeForPlan(routing.route, temporal.dayPart)
      : null;

    // ---------- Breathwork Prescription Engine ----------
    const breathworkRoutes = new Set<CoachRoute>([
      "BREATHWORK", "BREATHWORK_MEDITATION_REQUEST", "SLEEP_WIND_DOWN",
      "STRESS_RESET", "URGE_RESET", "MISSED_DAY_REPAIR", "MISSED_MORNING",
      "RECOVERY_STRUCTURE",
    ]);
    const explicitBreathworkAsk = detectExplicitBreathworkRequest(data.question);
    const breathworkMessageCue = /\b(breath ?work|breathing|breath)\b/i.test(data.question);
    const runBreathworkEngine = !isSafetyCrisis && (
      !!explicitBreathworkAsk || breathworkRoutes.has(routing.route) || breathworkMessageCue
    );
    const breathPrescription: BreathworkPrescription | null = runBreathworkEngine
      ? prescribeBreathwork(data.question, profile, journal, temporal, progress)
      : null;

    // If a plan card exists, override the generic guidedPractice so the
    // recommended button matches the prescription word-for-word.
    const breathCardFromEngine: GuidedPracticeRecommendation | null = breathPrescription
      ? {
          id: breathPrescription.selectedBreathworkProtocol,
          title: BREATHWORK_PROTOCOL_META[breathPrescription.selectedBreathworkProtocol].title,
          category: "breathwork",
          durationMinutes: BREATHWORK_PROTOCOL_META[breathPrescription.selectedBreathworkProtocol].durationMinutes,
          reason: breathPrescription.reason,
          buttonLabel: BREATHWORK_PROTOCOL_META[breathPrescription.selectedBreathworkProtocol].buttonLabel,
        }
      : null;

    // Resolution priority: breathwork engine > plan card > generic guidedPractice
    const resolvedCard = breathCardFromEngine ?? planCard;
    const effectiveGuidedPractice: GuidedPracticeRec | null = resolvedCard
      ? {
          id: resolvedCard.id,
          title: resolvedCard.title,
          category: resolvedCard.category === "breathwork" ? "Breathwork"
            : resolvedCard.category === "meditation" ? "Meditation"
            : resolvedCard.category === "morning_protocol" ? "Meditation"
            : resolvedCard.category === "sleep" ? "Breathwork"
            : resolvedCard.category === "cold_water" ? "Cold Exposure"
            : "Mobility",
          durationMinutes: resolvedCard.durationMinutes,
          reason: resolvedCard.reason,
          buttonLabel: resolvedCard.buttonLabel,
        }
      : guidedPractice;

    const activePlanType =
      routing.route === "FULL_REBUILD_PLAN" ? "FULL_REBUILD" :
      routing.route === "MORNING_PROTOCOL_REQUEST" ? "MORNING_PROTOCOL" :
      routing.route === "BREATHWORK_MEDITATION_REQUEST" ? "BREATH_AND_MEDITATION" :
      routing.route === "NUTRITION_CALORIE_REQUEST" ? "NUTRITION" :
      isFitnessRoute ? "FITNESS" : null;
    const activePlanLength =
      routing.route === "FULL_REBUILD_PLAN" || isFitnessRoute ? "7_DAYS" :
      routing.route === "MORNING_PROTOCOL_REQUEST" ? "1_DAY" : null;
    const programmePersonalisationMissing = isPlanRoute || isFitnessRoute
      ? [...personalisationMissing, ...calorie.calorieMissingFields].filter((v, i, a) => a.indexOf(v) === i)
      : [];
    const knowledgeBaseVolumesUsed: string[] = [];
    if (isPlanRoute) knowledgeBaseVolumesUsed.push("gorilla_mind_top_21_pillars", "gorilla_mind_master_system_prompt");
    const genericFallbackUsed = routing.route === "GENERAL_COACHING";
    const genericFallbackReason = genericFallbackUsed
      ? "No specific message, journal, profile or program route triggered — falling back to GENERAL_COACHING."
      : null;

    // ---- Onboarding/recovery debug context (read-only from profile) ----
    const px = (profile as unknown as Record<string, unknown> | null) ?? null;
    const asStr = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
    const asArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") as string[] : []);
    const recoveryRouteSet = new Set<CoachRoute>(["URGE_RESET","RELAPSE_PREVENTION","POST_RELAPSE_REPAIR","RECOVERY_STRUCTURE"]);
    const safetyRouteTriggered = routing.route === "SAFETY_SUPPORT" || routing.route === "SAFETY_CRISIS";
    const recoveryRoute: string | null = recoveryRouteSet.has(routing.route) ? routing.route : null;
    const triggerDetected: string | null = ((routing as unknown) as { intent?: string }).intent ?? null;
    const relapseRiskVal = asStr(px?.["relapseRisk"]);
    const urgeSupportShown = recoveryRoute !== null;
    const professionalSupportSuggested =
      safetyRouteTriggered || recoveryRoute === "RELAPSE_PREVENTION" || recoveryRoute === "URGE_RESET" ||
      relapseRiskVal === "high" || relapseRiskVal === "active";
    const profileCompletenessScore: number | null =
      typeof px?.["profileCompletenessScore"] === "number" ? (px?.["profileCompletenessScore"] as number) : null;
    const missingProfileFields: string[] = asArr(px?.["missingProfileFields"]);

    const debug: CoachDebug = {
      selectedRoute: routing.route,
      breathworkSubRoute,
      routeReason: routing.reason,
      retrievalQuery: routing.query,
      fileSearchCalled: false,
      vectorStoreId,
      retrievedChunksCount: 0,
      retrievedFilenames: [],
      retrievedPreviews: [],
      groundedInRetrieval: false,
      apiError: null,
      model,
      profileContextSent: !!profile,
      latestJournalSent: !!journal,
      primaryGapUsed: profile?.primaryGap ?? null,
      protocolDayUsed: profile?.protocolDay ?? null,
      safetyFlagsUsed: safetyFlags,
      guidedPracticeId: effectiveGuidedPractice?.id ?? null,
      guidedPracticeReason: effectiveGuidedPractice?.reason ?? null,
      localDate: temporal.localDate,
      localTime: temporal.localTime,
      timezone: temporal.timezone,
      dayOfWeek: temporal.dayOfWeek,
      dayPart: temporal.dayPart,
      sessionContext: temporal.sessionContext,
      temporalSource,
      timeBasedRouteReason: routing.timeBasedRouteReason ?? null,
      responseMode,
      conversationContinuation,
      userCanReply: true,
      quickRepliesShown: quickReplies.length > 0,
      retrievalSuppressedVolumes,
      reasonForSuppression,
      previousCoachReplyOptions,
      userContinuationCommandDetected: !!continuation,
      continuationCommand,
      routeOverrideApplied,
      routeOverrideReason,
      selectedRouteBeforeOverride,
      selectedRouteAfterOverride,
      duplicateAdviceSuppressed,
      suppressedAdvice,
      fitnessGoal: fc.fitnessGoal,
      fitnessLevel: fc.fitnessLevel,
      trainingLocation: fc.trainingLocation,
      equipment: fc.equipment,
      injuryFlag: fc.injuryFlag,
      availableTime: fc.availableTime,
      energyLevel: fc.energyLevel,
      preferredStyle: fc.preferredStyle,
      exerciseRoute: isFitnessRoute ? routing.route : null,
      guidedWorkoutRecommendation: guidedWorkout,
      exercisePersonalisationMissing: personalisationMissing,
      exerciseContinuationDetected: !!continuation && ["HOME","GYM","RUNNING","PILATES","LOW_ENERGY","BEGINNER","INTERMEDIATE","ADVANCED","GYM_PLAN","HOME_PLAN"].includes(continuation.command),
      exercisePlanSource,
      exerciseKnowledgeUsed: isFitnessRoute,
      safetyModificationApplied,
      selectedPillars: pillarPick.ids,
      pillarReasoning: pillarPick.reasoning,
      activePlanType,
      activePlanLength,
      guidedPracticeRecommendation: resolvedCard,
      breathworkPrescription: breathPrescription,
      calorieTargetUsed: calorie.calorieTargetUsed,
      calorieSource: calorie.calorieSource,
      calorieMissingFields: calorie.calorieMissingFields,
      macroTargetUsed: calorie.macroTargetUsed,
      programmePersonalisationMissing,
      knowledgeBaseVolumesUsed,
      genericFallbackUsed,
      genericFallbackReason,
      intentDetected: (routing as any).intentDetected ?? null,
      routePriorityReason: (routing as any).routePriorityReason ?? null,
      profileOverrideSuppressed: (routing as any).profileOverrideSuppressed ?? false,
      profileOverrideSuppressedReason: (routing as any).profileOverrideSuppressedReason ?? null,
      morningFillerSuppressed: morningFillerSuppressed,
      responseModeReason,
      currentSituation: asArr(px?.["currentSituation"]),
      primaryStruggle: asArr(px?.["primaryStruggle"]),
      controlLevel: asStr(px?.["controlLevel"]),
      supportStatus: asStr(px?.["supportStatus"]),
      needsFromCoach: asArr(px?.["needsFromCoach"]),
      addictionRiskFlag: asStr(px?.["addictionRiskFlag"]),
      compulsionTypes: asArr(px?.["compulsionTypes"]),
      relapseRisk: relapseRiskVal,
      preferredSupportTone: asStr(px?.["preferredSupportTone"]),
      nutritionMode: asStr(px?.["nutritionMode"]),
      currentEatingIssue: asStr(px?.["currentEatingIssue"]),
      preferredNutritionStyle: asStr(px?.["preferredNutritionStyle"]),
      wantsCaloriesMacros: asStr(px?.["wantsCaloriesMacros"]),
      safetyRouteTriggered,
      recoveryRoute,
      triggerDetected,
      urgeSupportShown,
      professionalSupportSuggested,
      profileCompletenessScore,
      missingProfileFields,
    };

    const programState: ProgramState = {
      activePlanType,
      activePlanLength,
      selectedFitnessLevel: fc.fitnessLevel !== "unknown" ? fc.fitnessLevel : null,
      selectedBreathwork: planCard?.category === "breathwork" ? planCard.id : null,
      selectedMeditation: planCard?.category === "meditation" ? planCard.id : null,
      selectedMorningProtocol: planCard?.category === "morning_protocol" ? planCard.id : null,
      missingPersonalisationFields: programmePersonalisationMissing,
      lastRecommendedGuidedPractice: planCard?.id ?? effectiveGuidedPractice?.id ?? null,
      lastProgrammeRoute: isPlanRoute || isFitnessRoute ? routing.route : null,
    };


    if (!apiKey) {
      debug.apiError = "OPENAI_API_KEY missing on server";
      return { answer: "Coach is offline. Backend secret missing.", debug, guidedPractice: effectiveGuidedPractice, guidedWorkout, quickReplies, programState };
    }
    if (!vectorStoreId) {
      debug.apiError = "GORILLA_MIND_VECTOR_STORE_ID missing on server";
      return { answer: "Coach is offline. Vector store secret missing.", debug, guidedPractice: effectiveGuidedPractice, guidedWorkout, quickReplies, programState };
    }

    const contextBlock = buildContextBlock(profile, journal, progress, temporal);

    const routeBlock = [
      "=== ACTIVE ROUTE (selected by backend route detector) ===",
      `route: ${routing.route}`,
      `breathwork_sub_route: ${breathworkSubRoute}`,
      `reason: ${routing.reason}`,
      `retrieval_query: ${routing.query}`,
      `safety_flags: ${safetyFlags.length ? safetyFlags.join(", ") : "none"}`,
      `time_based_route_reason: ${routing.timeBasedRouteReason ?? "none"}`,
      `day_part: ${temporal.dayPart}`,
      `session_context: ${temporal.sessionContext}`,
      `response_mode: ${responseMode}`,
      `retrieval_suppressed_volumes: ${retrievalSuppressedVolumes.join(", ") || "none"}`,
      `retrieval_suppression_reason: ${reasonForSuppression ?? "none"}`,
      "=== END ROUTE ===",
    ].join("\n");

    const breathworkProtocolGuidance: Record<BreathworkSubRoute, string> = {
      DOWNREGULATE:
        "BREATHWORK sub-route DOWNREGULATE. User is stressed / wired / anxious / overwhelmed / racing thoughts. Recommend a DOWN-REGULATING protocol: coherent breathing or extended-exhale breathing. DO NOT default to box breathing. DO NOT make breath holds the main protocol.",
      FOCUS:
        "BREATHWORK sub-route FOCUS. User is unfocused / scattered / mentally noisy but not panicked. Recommend box breathing or coherent breathing.",
      ENERGISE:
        "BREATHWORK sub-route ENERGISE. User is tired / flat / low energy / foggy. Recommend a safer energising protocol. Honour safety constraints.",
      WIND_DOWN:
        "BREATHWORK sub-route WIND_DOWN. User mentions sleep / evening / night / wind-down. Recommend wind-down breathwork: nasal, slow, extended-exhale.",
      NONE: "",
    };

    const baseFormatRule = "Follow this short Daily-OS format (max 180 words): HEADLINE / READ / DO THIS NOW (max 3 actions, each with a 1-line why/payoff) / TODAY'S STANDARD / GUIDED TOOL (only when relevant) / CHECK-IN (one natural-language line asking the user to report back) / COACH CLOSE. Do NOT output a 'REPLY WITH' chip menu for normal daily coaching.";
    const breathworkSafety = "Breathwork safety: never recommend breath holds in water; never recommend intense breathwork while driving; if the user mentions chest pain, fainting, dizziness, suicidal ideation, overdose, or medical emergency symptoms, stop coaching and direct them to urgent professional help.";

    const lifeStuckShape = [
      "ACTIVE ROUTE is GENERAL_LIFE_STUCK. Do NOT produce a 7-day plan, 20/60/90-day plan, or weekly forecast. This is a Day-by-Day Protocol Operating System answer. Maximum 180 words. Use this exact short structure and section labels:",
      "",
      "HEADLINE — one direct line. E.g. 'You do not need motivation. You need command of today.'",
      "",
      "READ — 1–2 sentences naming the pattern. No therapy language. No vague reassurance.",
      "",
      `DO THIS NOW — numbered list, 3 actions MAX. Each action must include WHAT, WHEN, and a short WHY/payoff line (e.g. 'This resets your nervous system.', 'This breaks the phone loop.', 'This steadies your energy.'). Actions must fit RESPONSE MODE ${responseMode} (no full workouts in EVENING_RESET / LATE_NIGHT_SHUTDOWN unless asked).`,
      "",
      "TODAY'S STANDARD — one short line of non-negotiables (e.g. 'Water. Breathwork. Movement. Protein. Phone boundary.').",
      "",
      "GUIDED TOOL — name the exact guided practice or workout that matches the GUIDED PRACTICE / GUIDED WORKOUT card word-for-word, plus a one-line why.",
      "",
      "CHECK-IN — one short natural-language instruction telling the user what to report back (e.g. 'Come back after the breathwork and movement. Tell me what changed — energy, mood, whether you moved.'). Do NOT output uppercase command chips like 'FITNESS / JOB / BOTH'.",
      "",
      "COACH CLOSE — one strong line (e.g. 'The body leads. The mind follows. Win the next hour.').",
      "",
      "Hard rules: no 7-day plan, no weekly forecast, no broad future programme, no 'set a goal' unless specific and immediate, every action must include a clear why/payoff.",
    ].filter((l) => l !== null).join("\n");

    const transformationShape = "ACTIVE ROUTE is GENERAL_TRANSFORMATION_REQUEST. The user explicitly asked for a full plan. A longer multi-day or multi-week plan is allowed. Anchor in the Top 21 fundamentals and the user's assigned pillars. Begin with HEADLINE and a one-paragraph WHAT'S HAPPENING, then provide the plan in clear phases (Days 1–7, 8–21, 22–60). End with TODAY'S NON-NEGOTIABLES, COACH CLOSE, and REPLY WITH (give a concrete next reply option).";

    // ---------- Exercise Prescription Engine shapes ----------
    const morningLockIn = "MORNING LOCK-IN\n1. Water before phone.\n2. Mineralised water if appropriate (water + small pinch Celtic sea salt + lemon).\n3. Morning daylight outside.\n4. 5 minutes breathwork.\n5. 5 minutes meditation or identity reset.\n6. Movement or training.\n7. Protein-first breakfast.\n8. One-line journal: 'What is the standard today?'";
    const exerciseFormatRule = "EXERCISE RESPONSE FORMAT — use exactly these section labels in this order: HEADLINE / THE STANDARD / MORNING LOCK-IN / TODAY'S SESSION / THIS WEEK / BREATHWORK / MEDITATION SUPPORT / WHAT I NEED FROM YOU / REPLY WITH. Keep MORNING LOCK-IN compact (do not bury the training plan). TODAY'S SESSION must include exact exercises, reps, sets and timing. THIS WEEK must be a simple 7-day structure. REPLY WITH must give 2–4 concrete chips.";
    const exerciseSafety = "EXERCISE SAFETY: if user reports sharp, sharp-pinching, neurological, shooting, numb/weakness, or worsening pain, advise medical / physiotherapy review before training. Do not diagnose. No ego lifting. Leave 2 reps in reserve for beginners. Technique before load.";
    const askOnlyMissing = personalisationMissing.length
      ? `Under 'WHAT I NEED FROM YOU' ask ONLY these missing details (max 3): ${personalisationMissing.map((k) => FITNESS_PERSONALISATION_QUESTIONS[k]).join(" / ")}.`
      : "Under 'WHAT I NEED FROM YOU' ask at most 1 sharpening question; user has already given enough detail — lead with the prescription.";

    const fitnessShapesByRoute: Partial<Record<CoachRoute, string>> = {
      FITNESS_ROUTINE_BUILDER: `ACTIVE ROUTE FITNESS_ROUTINE_BUILDER. Beginner-safe starter. Prescribe the 20-minute beginner bodyweight reset: 5-minute walk/march warm-up; 3 rounds of 10 bodyweight squats, 8 incline press-ups, 10 hip hinges, 20-second plank, 30s rest; 3-minute nasal breathing cool-down. ${morningLockIn}\n\n${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH must include: HOME, GYM, RUNNING, or PILATES.`,
      HOME_BODYWEIGHT_PLAN: `ACTIVE ROUTE HOME_BODYWEIGHT_PLAN. Use the BEGINNER HOME FITNESS PLAN template: 5-min walk/march warm-up; 3 rounds of 10 bodyweight squats, 8 incline press-ups, 10 glute bridges, 10 hip hinges, 20-second plank, 30–60s rest; 3-min nasal breathing + gentle stretch cool-down. Weekly: Day1 circuit, Day2 walk+mobility, Day3 circuit, Day4 walk+breathwork, Day5 circuit, Day6 longer walk, Day7 review. ${morningLockIn}\n\n${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH chips: BEGINNER / INTERMEDIATE / LOW ENERGY / BUILD MY PLAN.`,
      GYM_STRENGTH_PLAN: `ACTIVE ROUTE GYM_STRENGTH_PLAN. RESPONSE MODE PLAN_BUILDING. Do NOT include MORNING LOCK-IN or morning protocol bullets — go straight to the strength template. Use exactly these section labels in this order: HEADLINE / THE STANDARD / TODAY'S SESSION / THIS WEEK / RULES / WHAT I NEED FROM YOU / REPLY WITH. TODAY'S SESSION (full-body, ~45 min): Warm-up 5–8 min incline walk or bike. Goblet squat or leg press 3x10. Chest press or press-ups 3x8–10. Seated or cable row 3x10. RDL or hip hinge 3x8. Plank 3x20–30s. Finish: 10-min incline walk + 3-min extended exhale breathing. THIS WEEK: 3 full-body strength + 2 walks + 2 mobility/core. RULES (must list verbatim): 2 reps in reserve. Progressive overload — add weight or reps each week. Technique before load. No ego lifting. ${exerciseSafety} REPLY WITH chips: BEGINNER / INTERMEDIATE / LOW ENERGY / BUILD MY PLAN.`,
      PILATES_CORE_PLAN: `ACTIVE ROUTE PILATES_CORE_PLAN. Use the PILATES / CORE template. 2-min nasal breathing reset; pelvic tilts 2x10; dead bugs 2x8/side; glute bridges 2x12; bird dogs 2x8/side; side plank from knees 2x15–20s/side; child's pose 2 min. No pain chasing, slow reps, brace lightly, stop if symptoms increase. Weekly: Day1 core control, Day2 walk, Day3 pilates/core, Day4 mobility+breathwork, Day5 core control, Day6 longer walk, Day7 recovery review. ${morningLockIn}\n\n${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH chips: BEGINNER / INTERMEDIATE / BUILD MY PLAN.`,
      CORE_BACK_SUPPORT_PLAN: `ACTIVE ROUTE CORE_BACK_SUPPORT_PLAN. Safety first: if pain is sharp, neurological, numb/weak, shooting, or worsening — recommend medical/physio review before training, do not diagnose. Prescribe the safe core/back-support routine: 2-min nasal breathing; pelvic tilts 2x10; dead bugs 2x8/side; glute bridges 2x12; bird dogs 2x8/side; side plank from knees 2x15–20s/side; child's pose 2 min. No heavy lifting, no aggressive sit-ups. ${morningLockIn}\n\n${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH chips: HOME / PILATES / BUILD MY PLAN.`,
      RUNNING_STARTER_PLAN: `ACTIVE ROUTE RUNNING_STARTER_PLAN. Use the RUNNING STARTER template. 5-min brisk walk; 8 rounds of 30s light jog + 90s walk; 5-min cool-down walk; 3-min nasal breathing. Rules: run slower than you think, no sprinting, build joints before ego, walking is part of the plan. Weekly: Day1 intervals, Day2 walk+mobility, Day3 intervals, Day4 rest or easy walk, Day5 intervals, Day6 long walk, Day7 review. ${morningLockIn}\n\n${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH chips: BEGINNER / INTERMEDIATE / BUILD MY PLAN.`,
      LOW_ENERGY_SESSION: `ACTIVE ROUTE LOW_ENERGY_SESSION. Use the LOW ENERGY template. 1) Water. 2) 10-minute walk. 3) 3 rounds: 10 squats, 10 glute bridges, 20-second plank. 4) Extended exhale breathing for 3 minutes. Frame: 'This is not a performance day. This is a minimum standard day.' Keep MORNING LOCK-IN to a 3-line compact version. ${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH chips: HOME / BUILD MY PLAN.`,
      INTERMEDIATE_FITNESS_PLAN: `ACTIVE ROUTE INTERMEDIATE_FITNESS_PLAN. Use INTERMEDIATE template. Weekly: Day1 full-body strength, Day2 Zone 2 cardio + core, Day3 upper/lower split, Day4 mobility + breathwork, Day5 full-body strength, Day6 conditioning or long walk, Day7 recovery review. Ask for equipment and goals before prescribing load percentages or advanced volume. ${morningLockIn}\n\n${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH chips: GYM / HOME / BUILD MY PLAN.`,
      FULL_REBUILD_PLAN: buildDailyOsPlanShape({ kind: "FULL_REBUILD", calorie, askOnlyMissing, exerciseSafety }),
      PROGRAM_REQUEST: buildDailyOsPlanShape({ kind: "PROGRAM", calorie, askOnlyMissing, exerciseSafety }),
      MORNING_PROTOCOL_REQUEST: buildDailyOsPlanShape({ kind: "MORNING_PROTOCOL", calorie, askOnlyMissing, exerciseSafety }),
      BREATHWORK_MEDITATION_REQUEST: buildDailyOsPlanShape({ kind: "BREATH_MED", calorie, askOnlyMissing, exerciseSafety }),
      NUTRITION_CALORIE_REQUEST: buildDailyOsPlanShape({ kind: "NUTRITION", calorie, askOnlyMissing, exerciseSafety }),
      FITNESS_PLAN_REQUEST: `ACTIVE ROUTE FITNESS_PLAN_REQUEST. Same shape as FITNESS_ROUTINE_BUILDER. ${exerciseFormatRule} ${askOnlyMissing} ${exerciseSafety} REPLY WITH chips: HOME / GYM / RUNNING / PILATES.`,
      LOW_ENERGY_MINIMUM_PLAN: `ACTIVE ROUTE LOW_ENERGY_MINIMUM_PLAN. Do NOT include MORNING LOCK-IN. Use EXACTLY these section labels in this order: HEADLINE / THE STANDARD / DO THIS NOW / COACH CLOSE / REPLY WITH. HEADLINE: "Minimum standard. No negotiation." THE STANDARD: "This is not a performance day. This is a keep-the-chain-alive day." DO THIS NOW (numbered): 1) Water. 2) 10-minute walk. 3) 2 rounds: 10 squats, 10 glute bridges, 20-second plank. 4) 3 minutes extended exhale breathing. COACH CLOSE: "You do not need to feel ready. You need to keep the standard alive." REPLY WITH: LOW ENERGY / FULL SESSION / WALK / BREATHWORK. ${exerciseSafety}`,
      FAT_LOSS_STARTER_PLAN: `ACTIVE ROUTE FAT_LOSS_STARTER_PLAN. RESPONSE MODE PLAN_BUILDING. Use EXACTLY these section labels in this order: HEADLINE / THE STANDARD / DO THIS TODAY / WHAT I NEED FROM YOU / REPLY WITH. HEADLINE: "Fat loss starts with control, not chaos." THE STANDARD: "We are not guessing calories. We build the minimum standard first, then calculate properly." DO THIS TODAY (numbered): 1) Water before caffeine. 2) Protein with first meal. 3) 20–30 minutes movement. 4) One proper whole-food meal. 5) No chaotic evening eating. WHAT I NEED FROM YOU: "Send: age, sex, height cm, weight kg, activity level, primary goal." REPLY WITH: CALORIES / FOOD PLAN / TRAINING PLAN / MORNING PROTOCOL. ${exerciseSafety}`,
      EVENING_WORK_PROTOCOL: `ACTIVE ROUTE EVENING_WORK_PROTOCOL. Do NOT include MORNING LOCK-IN or morning protocol bullets. Use EXACTLY these section labels in this order: HEADLINE / THE STANDARD / TONIGHT'S PROTOCOL / REPLY WITH. HEADLINE: "Tonight is about damage control." THE STANDARD: "You are not building your whole life tonight. You are protecting tomorrow." TONIGHT'S PROTOCOL (numbered): 1) Eat simple protein if you have not eaten. 2) Shower. 3) 3 minutes extended exhale breathing. 4) Phone away from bed. 5) Set clothes and water for morning. 6) Sleep. REPLY WITH: FOOD / BREATHWORK / MORNING SETUP / RESET TOMORROW.`,
      STRESS_RESET: `ACTIVE ROUTE STRESS_RESET. Do NOT include MORNING LOCK-IN. Use EXACTLY these section labels in this order: HEADLINE / DO THIS NOW / REPLY WITH. HEADLINE: "Regulate first. Think second." DO THIS NOW (numbered): 1) Sit down. 2) Inhale through the nose for 4. 3) Exhale slowly for 6–8. 4) Repeat for 3 minutes. 5) Write one line: "What is the next controllable action?" REPLY WITH: BREATHWORK / JOURNAL / WALK / TALK ME DOWN.`,
      MISSED_DAY_REPAIR: `ACTIVE ROUTE MISSED_DAY_REPAIR. Do NOT shame the user. Do NOT include MORNING LOCK-IN. Use EXACTLY these section labels in this order: HEADLINE / THE STANDARD / RESET TODAY / REPLY WITH. HEADLINE: "One missed day is not a collapse." THE STANDARD: "You do not punish the miss. You repair the pattern." RESET TODAY (numbered): 1) Water. 2) 5 minutes breathwork. 3) 20 minutes movement. 4) Protein-first meal. 5) One-line journal: "I am back under command." REPLY WITH: RESET TODAY / MINIMUM SESSION / JOURNAL.`,
      URGE_RESET: `ACTIVE ROUTE URGE_RESET. Do NOT diagnose. Do NOT include MORNING LOCK-IN. Use EXACTLY: HEADLINE / DO THIS NOW / COACH CLOSE / REPLY WITH. HEADLINE: "Delay the urge. Do not negotiate with it." DO THIS NOW (numbered): 1) Put distance between you and the trigger. 2) Change location. 3) Drink water. 4) Breathe: inhale 4, exhale 6–8 for 3 minutes. 5) Text or call one trusted person. 6) Wait 10 minutes before making any decision. COACH CLOSE: "An urge is not an order. It is a wave. You do not have to obey it." REPLY WITH: I AM SAFE / STILL STRUGGLING / CALL SOMEONE / RESET PLAN. Suggest contacting professional or sponsor/recovery support if risk is moderate or high. Do not prescribe intense training.`,
      RELAPSE_PREVENTION: `ACTIVE ROUTE RELAPSE_PREVENTION. Do NOT diagnose. Do NOT include MORNING LOCK-IN. Use EXACTLY: HEADLINE / DO THIS NOW / COACH CLOSE / REPLY WITH. HEADLINE: "This is a danger window. We act now." DO THIS NOW (numbered): 1) Remove access to the trigger if possible. 2) Do not isolate. 3) Contact one trusted person. 4) Move your body for 5 minutes. 5) Eat something simple if you have not eaten. 6) Start a 10-minute delay. COACH CLOSE: "You are not weak for having the thought. The win is what you do next." REPLY WITH: I AM SAFE / STILL AT RISK / CALL SOMEONE / URGE RESET. Make clear the coach is not a replacement for emergency or professional support.`,
      POST_RELAPSE_REPAIR: `ACTIVE ROUTE POST_RELAPSE_REPAIR. Do NOT shame. Do NOT use labels like "addict" or "failure". Use EXACTLY: HEADLINE / THE STANDARD / DO THIS NOW / COACH CLOSE / REPLY WITH. HEADLINE: "This is a repair moment, not an identity collapse." THE STANDARD: "No shame spiral. No hiding. No pretending. Repair the pattern now." DO THIS NOW (numbered): 1) Get physically safe. 2) Remove the trigger. 3) Drink water. 4) Contact a trusted person or support. 5) Write one line: "What happened before the relapse?" 6) Do one small recovery action today. COACH CLOSE: "You are not starting from zero. You are returning to the standard." REPLY WITH: REPAIR PLAN / CALL SOMEONE / JOURNAL / RESET TODAY.`,
      RECOVERY_STRUCTURE: `ACTIVE ROUTE RECOVERY_STRUCTURE. Use EXACTLY: HEADLINE / TODAY'S STANDARD / COACH CLOSE / REPLY WITH. HEADLINE: "Recovery needs structure, not motivation." TODAY'S STANDARD (numbered): 1) Water before phone. 2) Morning daylight. 3) 5 minutes breathwork. 4) 20 minutes walking or training. 5) Protein-first meal. 6) One honest journal line. 7) Contact one supportive person if needed. 8) Phone away before bed. COACH CLOSE: "The body leads. The mind follows. Structure protects recovery." REPLY WITH: MORNING PLAN / URGE PLAN / TRAINING / EVENING RESET.`,
      SAFETY_SUPPORT: `ACTIVE ROUTE SAFETY_SUPPORT. The coach is NOT a replacement for emergency services, medical care, detox support, therapy, or crisis lines. State this clearly. If the user is in immediate danger or describes withdrawal / overdose risk / suicidal thoughts, direct them to contact local emergency services NOW. Use a short, calm, non-clinical message. Give ONE small grounding action only (e.g. slow nasal breathing for one minute, or call a trusted person). Do NOT prescribe training. REPLY WITH: CALL SOMEONE / EMERGENCY SERVICES / GROUND ME NOW.`,
    };
    const fitnessShape = fitnessShapesByRoute[routing.route];

    const continuationShape = CONTINUATION_SHAPES[routing.route];
    const routeInstruction =
      routing.route === "SAFETY_CRISIS"
        ? "ACTIVE ROUTE is SAFETY_CRISIS. Do NOT produce the normal HEADLINE/DO THIS NOW format. Respond with a short calm safety-first message directing the user to local emergency services / crisis line / doctor."
        : routing.route === "BREATHWORK"
          ? `ACTIVE ROUTE is BREATHWORK. ${breathworkProtocolGuidance[breathworkSubRoute]} ${breathworkSafety} ${baseFormatRule}`
          : routing.route === "GENERAL_LIFE_STUCK"
            ? lifeStuckShape
            : routing.route === "GENERAL_TRANSFORMATION_REQUEST"
              ? transformationShape
              : fitnessShape
                ? fitnessShape
                : continuationShape
                  ? continuationShape
                  : `ACTIVE ROUTE is ${routing.route}. RESPONSE MODE is ${responseMode}. Honour the time-of-day rules. Use the smallest useful next action. ${baseFormatRule} Do NOT produce a multi-day plan.`;

    const suppressionInstruction = retrievalSuppressedVolumes.length
      ? `\n\nRETRIEVAL SUPPRESSION: Do NOT lean on or quote content from the following knowledge volumes for this answer: ${retrievalSuppressedVolumes.join(", ")}. Reason: ${reasonForSuppression}`
      : "";

    const duplicateAdviceInstruction = duplicateAdviceSuppressed
      ? `\n\nDUPLICATE ADVICE SUPPRESSION: The previous coach turn already prescribed these actions: ${suppressedAdvice.join(", ")}. You MUST NOT repeat that same action list. Open with a short acknowledgement such as "Good. We are moving into the plan now." and advance to the next layer of the plan. If you need to reference a previous action, do so in a single short clause, not as a re-prescription.`
      : "";

    // Prior conversation block — render as text so the model treats this as a continuation.
    const priorConversationBlock = history.length
      ? [
          "=== PRIOR CONVERSATION (oldest → newest) ===",
          ...history.map((t) => `${t.role.toUpperCase()}: ${t.content}`),
          "=== END PRIOR CONVERSATION ===",
        ].join("\n")
      : "";

    const userInput = [
      routeBlock,
      "",
      contextBlock,
      "",
      `=== RETRIEVAL HINT (use these terms when calling file_search) ===\n${routing.query}\n=== END RETRIEVAL HINT ===`,
      priorConversationBlock ? "" : "",
      priorConversationBlock,
      "",
      "=== USER MESSAGE (latest) ===",
      data.question,
    ].filter(Boolean).join("\n");

    const breathworkPrescriptionInstruction = breathPrescription && effectiveGuidedPractice
      ? `\n\nBREATHWORK PRESCRIPTION (authoritative — use this exact protocol):\nselectedBreathworkProtocol: ${breathPrescription.selectedBreathworkProtocol}\ntitle: ${effectiveGuidedPractice.title}\nstate: ${breathPrescription.breathworkState}\ndesiredOutcome: ${breathPrescription.desiredOutcome}\nreason: ${breathPrescription.reason}\npayoff: ${breathPrescription.payoff}\n\nIn the response, the GUIDED TOOL section MUST name "${effectiveGuidedPractice.title}" word-for-word. Do NOT recommend any other breathwork name (do NOT default to Box Breathing or Extended Exhale unless that IS the protocol above). Use the payoff line inside DO THIS NOW. Do NOT invent unmapped protocols (no "coherent breathing", no random "calm breathing", no random "focus breathing").`
      : "";

    const guidedPracticeInstruction = effectiveGuidedPractice
      ? `\n\nGUIDED PRACTICE / GUIDED TOOL SECTION: Add a short section labelled exactly "GUIDED TOOL" (or "GUIDED PRACTICE" for plan-building routes) before CHECK-IN / COACH CLOSE with two lines:\nRecommended: ${effectiveGuidedPractice.title} (${effectiveGuidedPractice.durationMinutes} min, ${effectiveGuidedPractice.category})\nStart the guided version inside the app.\nDo NOT invent a different practice name. Use exactly "${effectiveGuidedPractice.title}".${breathworkPrescriptionInstruction}`
      : "";

    const guidedWorkoutInstruction = guidedWorkout
      ? `\n\nGUIDED WORKOUT SECTION: Before COACH CLOSE, add a section labelled exactly "GUIDED WORKOUT" with two short lines:\nRecommended: ${guidedWorkout.title} (${guidedWorkout.durationMinutes} min, ${guidedWorkout.category}, ${guidedWorkout.level})\nStart the guided workout inside the app.\nDo NOT invent a different workout name. Use exactly "${guidedWorkout.title}".`
      : "";

    // For PLAN_BUILDING / fitness routes, hand the model an explicit default
    // fitness plan template derived from the user's classification.
    const DEFAULT_FITNESS_PLAN_ROUTES = new Set<CoachRoute>([
      "FITNESS_ROUTINE_BUILDER", "HOME_BODYWEIGHT_PLAN", "GYM_STRENGTH_PLAN",
      "PILATES_CORE_PLAN", "CORE_BACK_SUPPORT_PLAN", "RUNNING_STARTER_PLAN",
      "LOW_ENERGY_SESSION", "INTERMEDIATE_FITNESS_PLAN", "FULL_REBUILD_PLAN",
    ]);
    const defaultFitnessPlanInstruction = DEFAULT_FITNESS_PLAN_ROUTES.has(routing.route)
      ? (() => {
          const plan = buildDefaultFitnessPlan({
            level: fc.fitnessLevel,
            location: fc.trainingLocation,
            goal: fc.fitnessGoal,
            injuryFlag: fc.injuryFlag,
            availableTime: fc.availableTime,
            preferredStyle: fc.preferredStyle,
          });
          return `\n\nDEFAULT FITNESS PLAN TEMPLATE (kind=${plan.kind}). Use this as the backbone of TRAINING PLAN / TODAY'S SESSION / THIS WEEK. You may adapt to the user's stated constraints but do NOT replace it with generic wellness advice:\n${plan.text}`;
        })()
      : "";

    // Profile-aware soft guidance from onboarding data. Explicit user intent still wins.
    const onboardingProfileInstruction = (() => {
      if (!px) return "";
      const parts: string[] = [];
      const rr = relapseRiskVal;
      if (rr === "high" || rr === "active") {
        parts.push("USER PROFILE: relapseRisk is high. Lead with safety and structure. Suggest contacting their support person, sponsor, or recovery group. Do NOT prescribe intense training as the headline. Use calm, direct language — no panic, no shame.");
      } else if (rr === "moderate") {
        parts.push("USER PROFILE: relapseRisk is moderate. Reinforce structure and one supportive contact. Avoid generic fitness-first answers when the user is clearly destabilised.");
      }
      const ctypes = asArr(px["compulsionTypes"]);
      if (ctypes.length) parts.push(`USER PROFILE: compulsionTypes=${ctypes.join(", ")}. Tailor boundary/discipline language to these patterns.`);
      const ss = asStr(px["supportStatus"]);
      if (ss && ss !== "none" && ss !== "prefer_not_say") parts.push(`USER PROFILE: supportStatus=${ss}. Reference contacting them when relevant.`);
      const nm = asStr(px["nutritionMode"]);
      if (nm === "SIMPLE_STANDARD") {
        parts.push("USER PROFILE: nutritionMode=SIMPLE_STANDARD. Do NOT ask for calories/macros by default. Use protein-first, simple rules.");
      } else if (nm === "PRECISION_TRACKING") {
        const need: string[] = [];
        if (!px["age"]) need.push("age");
        if (!px["sex"]) need.push("sex");
        if (!px["heightCm"]) need.push("height");
        if (!px["weightKg"]) need.push("weight");
        parts.push(`USER PROFILE: nutritionMode=PRECISION_TRACKING. ${need.length ? `Ask only for missing fields: ${need.join(", ")}. Do NOT invent numbers.` : "Use stored numbers; do not re-ask."}`);
      }
      const inj = asStr(px["injuryFlag"]);
      if (inj && inj !== "none") parts.push(`USER PROFILE: injuryFlag=${inj}. Apply safety modifications and avoid aggressive loading.`);
      const fl = asStr(px["fitnessLevel"]);
      if (fl) parts.push(`USER PROFILE: fitnessLevel=${fl}.`);
      const loc = asStr(px["trainingLocation"]);
      if (loc) parts.push(`USER PROFILE: trainingLocation=${loc}.`);
      const tone = asStr(px["preferredSupportTone"]);
      if (tone) parts.push(`USER PROFILE: preferredSupportTone=${tone}. Match this tone without losing Gorilla Mind directness.`);
      return parts.length ? `\n\n=== PROFILE-AWARE GUIDANCE (explicit user message still wins) ===\n${parts.join("\n")}\n=== END PROFILE-AWARE GUIDANCE ===` : "";
    })();

    const instructions = `${SYSTEM_INSTRUCTIONS}\n\nRESPONSE MODE: ${responseMode}. dayPart=${temporal.dayPart}. localTime=${temporal.localTime}.\n\n${routeInstruction}${defaultFitnessPlanInstruction}${suppressionInstruction}${duplicateAdviceInstruction}${guidedPracticeInstruction}${guidedWorkoutInstruction}${onboardingProfileInstruction}`;

    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions,
          input: userInput,
          tools: [{ type: "file_search", vector_store_ids: [vectorStoreId], max_num_results: 8 }],
          tool_choice: routing.route === "SAFETY_CRISIS" ? "none" : { type: "file_search" },
          include: ["file_search_call.results"],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        debug.apiError = `OpenAI ${res.status}: ${text.slice(0, 500)}`;
        return { answer: "Coach failed to respond. See debug panel.", debug, guidedPractice: effectiveGuidedPractice, guidedWorkout, quickReplies, programState };
      }

      const json: any = await res.json();
      let answer = "";
      const output = Array.isArray(json.output) ? json.output : [];
      for (const item of output) {
        if (item.type === "file_search_call") {
          debug.fileSearchCalled = true;
          const results = Array.isArray(item.results) ? item.results : [];
          debug.retrievedChunksCount = results.length;
          for (const r of results) {
            const fname = r.filename ?? r.file_id ?? "unknown";
            if (!debug.retrievedFilenames.includes(fname)) debug.retrievedFilenames.push(fname);
            const text: string = typeof r.text === "string" ? r.text : (r.content?.[0]?.text ?? "");
            if (text) debug.retrievedPreviews.push(text.slice(0, 240));
          }
        }
        if (item.type === "message" && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.type === "output_text" && typeof c.text === "string") answer += c.text;
          }
        }
      }

      if (!answer && typeof json.output_text === "string") answer = json.output_text;
      debug.groundedInRetrieval = debug.fileSearchCalled && debug.retrievedChunksCount > 0;

      if (routing.route !== "SAFETY_CRISIS" && !debug.fileSearchCalled) {
        debug.apiError = "Knowledge-base retrieval was required, but OpenAI did not call file_search.";
        return { answer: "Coach could not access the knowledge base. See debug panel.", debug, guidedPractice: effectiveGuidedPractice, guidedWorkout, quickReplies, programState };
      }

      if (routing.route !== "SAFETY_CRISIS" && debug.fileSearchCalled && debug.retrievedChunksCount === 0) {
        debug.apiError = "Knowledge-base retrieval returned zero chunks for the selected route.";
        return { answer: "Coach could not find relevant knowledge base material for this route. See debug panel.", debug, guidedPractice: effectiveGuidedPractice, guidedWorkout, quickReplies, programState };
      }

      // Derive quick-reply chips from THIS answer's REPLY WITH section so they
      // always align with what the coach asked for. Fall back to route defaults.
      const parsedReplies = extractReplyOptions(answer);
      // For these routes, always force the fallback chips — the model often
      // substitutes its own REPLY WITH labels which breaks continuation flow.
      const forcedChipRoutes = new Set<CoachRoute>([
        "FITNESS_ROUTINE_BUILDER", "CORE_BACK_SUPPORT_PLAN", "PILATES_CORE_PLAN",
        "LOW_ENERGY_MINIMUM_PLAN", "FAT_LOSS_STARTER_PLAN", "NUTRITION_CALORIE_REQUEST",
        "EVENING_WORK_PROTOCOL", "MISSED_DAY_REPAIR", "STRESS_RESET", "GYM_STRENGTH_PLAN",
        "URGE_RESET", "RELAPSE_PREVENTION", "POST_RELAPSE_REPAIR",
        "RECOVERY_STRUCTURE", "SAFETY_SUPPORT",
      ]);
      if (forcedChipRoutes.has(routing.route)) {
        quickReplies = fallbackQuickRepliesByRoute[routing.route] ?? quickReplies;
      } else if (parsedReplies.length > 0) {
        quickReplies = parsedReplies;
      }
      debug.quickRepliesShown = quickReplies.length > 0;

      // Enforce verbatim safety caveat when a back-pain / safety modification applies.
      const SAFETY_CAVEAT = "If you have sharp pain, numbness, weakness, shooting pain, recent injury, or worsening symptoms, get medical or physio advice before training.";
      if ((safetyModificationApplied || fc.injuryFlag === "back_pain") && answer && !answer.includes(SAFETY_CAVEAT)) {
        // Strip any paraphrased variant the model may have emitted, then prepend the exact sentence.
        answer = answer.replace(/If you (?:have|experience|feel)[^.\n]*(?:pain|numbness|symptoms)[^.\n]*\.\s*/gi, "");
        answer = `${SAFETY_CAVEAT}\n\n${answer.trim()}`;
      }

      // Render normalisation: strip JSX/JSON newline artefacts the model
      // occasionally leaks into prose (e.g. `{"n"}`, `{"\n"}`, literal `\n`).
      if (answer) {
        answer = answer
          .replace(/\{\s*["']\\?n["']\s*\}/g, "\n") // {"n"} / {'n'} / {"\n"}
          .replace(/\{\s*"\\n"\s*\}/g, "\n")
          .replace(/\\n/g, "\n")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }

      return { answer: answer || "(empty response)", debug, guidedPractice: effectiveGuidedPractice, guidedWorkout, quickReplies, programState };
    } catch (err) {
      debug.apiError = err instanceof Error ? err.message : String(err);
      return { answer: "Coach request failed. See debug panel.", debug, guidedPractice: effectiveGuidedPractice, guidedWorkout, quickReplies, programState };
    }
  });

