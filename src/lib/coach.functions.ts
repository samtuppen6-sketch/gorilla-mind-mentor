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

DEFAULT RESPONSE FORMAT (every non-crisis, non-GENERAL_LIFE_STUCK, non-GENERAL_TRANSFORMATION_REQUEST response):

HEADLINE
WHAT'S HAPPENING
DO THIS NOW
TODAY'S NON-NEGOTIABLES
IF TIME IS LOW
COACH CLOSE
REPLY WITH

REPLY WITH must give the user a concrete next reply option (e.g. "Reply BUILD MY PLAN and I will give you tomorrow's first hour.").`;

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
  | "CONTINUATION_MORNING_SETUP";

export type ContinuationCommand =
  | "FITNESS"
  | "JOB"
  | "BOTH"
  | "BUILD_MY_PLAN"
  | "RESET"
  | "MINIMUM_STANDARD"
  | "MORNING"
  | "NONE";

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
  | "PLAN_BUILDING";

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
};

export type CoachResponse = {
  answer: string;
  debug: CoachDebug;
  guidedPractice: GuidedPracticeRec | null;
  quickReplies: string[];
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

function detectRoute(
  message: string,
  profile: Profile | null,
  journal: Journal | null,
  temporal: TemporalContext | null,
): { route: CoachRoute; reason: string; query: string; breathworkSubRoute?: BreathworkSubRoute; timeBasedRouteReason?: string | null } {
  const text = `${message.toLowerCase()} ${journal?.journalText?.toLowerCase() ?? ""}`;
  const flags = journal?.patternFlags ?? [];
  const flagSet = new Set(flags.map((f) => f.toLowerCase()));
  const poorSleepMessage = /\b(slept badly|slept poorly|bad sleep|poor sleep|little sleep|no sleep|sleep deprived|rough sleep|terrible sleep|exhausted|wiped|tired)\b/i.test(message);
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

  // 1c. General life-stuck — must come before keyword routes that grab "tired", "not motivated", etc.
  if (lifeStuckMessage) {
    return {
      route: "GENERAL_LIFE_STUCK",
      reason: "User expresses general life-stuck / unmotivated / lost. Use direct body-first, time-aware structure. No long plan.",
      query: "gorilla mind master system prompt daily operating system identity discipline minimum standard body first reset morning routine evening shutdown standards over moods one promise",
    };
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

  if (/\b(breath|breathwork|box breathing|panic|panicky|anxious|anxiety|grounding|stressed|wired|overwhelm|racing thoughts|switch off|activated|unfocused|scattered|distracted|mentally noisy|wind ?down)\b/i.test(message)) {
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

  if (profile?.sleepQuality === "poor" || profile?.sleepQuality === "inconsistent") {
    return {
      route: "SLEEP_WIND_DOWN",
      reason: `Profile sleepQuality is ${profile.sleepQuality}.`,
      query: "sleep architecture wind down sleep onset poor sleep evening protocol phone boundary calming breathwork",
    };
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
    lines.push(`name: ${profile.name}`);
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
};

function detectContinuationCommand(
  message: string,
  history: CoachHistoryTurn[],
): { command: ContinuationCommand; route: CoachRoute } | null {
  if (!history.length) return null;
  const norm = message.trim().toUpperCase().replace(/[.!?,]+$/g, "").replace(/\s+/g, " ");
  if (norm.length > 30) return null;
  return CONTINUATION_MAP[norm] ?? null;
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

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      question: z.string().min(1).max(4000),
      profile: ProfileSchema.nullable().optional(),
      journal: JournalSchema.nullable().optional(),
      dailyProgress: DailyProgressSchema.nullable().optional(),
      temporal: TemporalSchema.nullable().optional(),
      history: z.array(HistoryTurnSchema).max(40).optional(),
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
    const continuation = detectContinuationCommand(data.question, history);
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

    // Continuation routes force PLAN_BUILDING response mode.
    if (continuation && !isSafetyCrisis) {
      responseMode = "PLAN_BUILDING";
    }

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
      MISSED_DAY_REPAIR: ["RESET", "MINIMUM STANDARD", "BUILD MY PLAN"],
      MISSED_MORNING: ["MORNING", "BUILD MY PLAN"],
      CONTINUATION_BOTH_PLAN: ["BUILD MY PLAN"],
      CONTINUATION_BUILD_MY_PLAN: ["FITNESS", "JOB", "BOTH"],
      CONTINUATION_FITNESS_PLAN: ["BUILD MY PLAN", "JOB"],
      CONTINUATION_JOB_PLAN: ["BUILD MY PLAN", "FITNESS"],
      CONTINUATION_RESET_NOW: ["BUILD MY PLAN", "MINIMUM STANDARD"],
      CONTINUATION_MINIMUM_STANDARD: ["BUILD MY PLAN"],
      CONTINUATION_MORNING_SETUP: ["BUILD MY PLAN", "FITNESS"],
    };
    let quickReplies: string[] = fallbackQuickRepliesByRoute[routing.route] ?? [];

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
      guidedPracticeId: guidedPractice?.id ?? null,
      guidedPracticeReason: guidedPractice?.reason ?? null,
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
    };

    if (!apiKey) {
      debug.apiError = "OPENAI_API_KEY missing on server";
      return { answer: "Coach is offline. Backend secret missing.", debug, guidedPractice, quickReplies };
    }
    if (!vectorStoreId) {
      debug.apiError = "GORILLA_MIND_VECTOR_STORE_ID missing on server";
      return { answer: "Coach is offline. Vector store secret missing.", debug, guidedPractice, quickReplies };
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

    const baseFormatRule = "Follow the HEADLINE / WHAT'S HAPPENING / DO THIS NOW / TODAY'S NON-NEGOTIABLES / IF TIME IS LOW / COACH CLOSE / REPLY WITH format exactly.";
    const breathworkSafety = "Breathwork safety: never recommend breath holds in water; never recommend intense breathwork while driving; if the user mentions chest pain, fainting, dizziness, suicidal ideation, overdose, or medical emergency symptoms, stop coaching and direct them to urgent professional help.";

    // Dynamic ORDERS heading for life-stuck.
    const ordersHeading =
      responseMode === "EVENING_RESET" || responseMode === "LATE_NIGHT_SHUTDOWN"
        ? "TONIGHT'S ORDERS"
        : responseMode === "MORNING_ACTIVATION"
          ? "TODAY'S ORDERS"
          : "TODAY'S ORDERS";
    const includeTomorrowMorning = responseMode === "EVENING_RESET" || responseMode === "LATE_NIGHT_SHUTDOWN";

    const lifeStuckShape = [
      "ACTIVE ROUTE is GENERAL_LIFE_STUCK. Do NOT produce a 20/60/90-day plan. Use this exact short structure and section labels:",
      "",
      "HEADLINE",
      "Short, direct diagnosis. No more than one sentence.",
      "",
      "WHAT'S ACTUALLY HAPPENING",
      "Name the pattern clearly in 2–4 short lines. No therapy language. No vague reassurance. No 'this is a common challenge'.",
      "",
      ordersHeading,
      `Numbered list, 4–5 items max. Every item must be appropriate for RESPONSE MODE ${responseMode}. EVENING_RESET and LATE_NIGHT_SHUTDOWN: no full workouts, no big meals (unless user has not eaten), prefer phone-away-from-bed, water, clothes laid out, tomorrow's first action chosen, sensible bedtime. MORNING_ACTIVATION: water, breathwork, movement, protein, plan. AFTERNOON_RESCUE: one body-first action, one work/life reset, one evening protection.`,
      "End the section with the 'No life overhaul / No job panic / No massive fitness plan' framing where it fits the time of day.",
      includeTomorrowMorning ? "" : null,
      includeTomorrowMorning ? "TOMORROW MORNING" : null,
      includeTomorrowMorning ? "Numbered list, 4–5 items. Pre-phone routine: water, 5 min breathing, 20 min movement, protein-based breakfast, one written line of intent." : null,
      "",
      "COACH CLOSE",
      "Strong, grounded close, 2–3 short lines. Use phrasing like 'You are not broken. You are under-led.' or 'Your job is not to fix your whole life tonight. Your job is to keep one promise to yourself.' No motivational fluff. No vague questions.",
      "",
      "REPLY WITH",
      'Give the user a concrete next reply option. For this route, always end with: "FITNESS, JOB, or BOTH."',
      "",
      "Hard rules: do NOT ask a soft question like 'what is the first thing you will do tomorrow morning to improve your day?'. Give the first step yourself, then ask them to choose a direction.",
    ].filter((l) => l !== null).join("\n");

    const transformationShape = "ACTIVE ROUTE is GENERAL_TRANSFORMATION_REQUEST. The user explicitly asked for a full plan. A longer multi-day or multi-week plan is allowed. Anchor in the Top 21 fundamentals and the user's assigned pillars. Begin with HEADLINE and a one-paragraph WHAT'S HAPPENING, then provide the plan in clear phases (Days 1–7, 8–21, 22–60). End with TODAY'S NON-NEGOTIABLES, COACH CLOSE, and REPLY WITH (give a concrete next reply option).";

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

    const guidedPracticeInstruction = guidedPractice
      ? `\n\nGUIDED PRACTICE SECTION: After TODAY'S NON-NEGOTIABLES (or ${ordersHeading} for life-stuck) and before COACH CLOSE, add a section labelled exactly "GUIDED PRACTICE" with two short lines:\nRecommended: ${guidedPractice.title} (${guidedPractice.durationMinutes} min, ${guidedPractice.category})\nStart the guided version inside the app.\nDo NOT invent a different practice name. Use exactly "${guidedPractice.title}".`
      : "";

    const instructions = `${SYSTEM_INSTRUCTIONS}\n\nRESPONSE MODE: ${responseMode}. dayPart=${temporal.dayPart}. localTime=${temporal.localTime}.\n\n${routeInstruction}${suppressionInstruction}${guidedPracticeInstruction}`;

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
        return { answer: "Coach failed to respond. See debug panel.", debug, guidedPractice, quickReplies };
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
        return { answer: "Coach could not access the knowledge base. See debug panel.", debug, guidedPractice, quickReplies };
      }

      if (routing.route !== "SAFETY_CRISIS" && debug.fileSearchCalled && debug.retrievedChunksCount === 0) {
        debug.apiError = "Knowledge-base retrieval returned zero chunks for the selected route.";
        return { answer: "Coach could not find relevant knowledge base material for this route. See debug panel.", debug, guidedPractice, quickReplies };
      }

      return { answer: answer || "(empty response)", debug, guidedPractice, quickReplies };
    } catch (err) {
      debug.apiError = err instanceof Error ? err.message : String(err);
      return { answer: "Coach request failed. See debug panel.", debug, guidedPractice, quickReplies };
    }
  });

