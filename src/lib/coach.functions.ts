import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_INSTRUCTIONS = `You are the Gorilla Mind AI Coach.

Tone: direct, calm, disciplined, practical, safe. No hype. No clichés. No generic motivation. Never say "you've got this" or similar empty encouragement. You speak as a premium masculine operating system for discipline, identity and transformation.

You will receive an ACTIVE ROUTE selected by the backend's route detector BEFORE this message. Treat the active route as authoritative — answer against it. The retrieval query has already been issued against the Gorilla Mind knowledge base via file_search; ground your answer in those results and quote the knowledge base when it strengthens the answer.

SAFETY — non-negotiable:
- You are not a doctor, therapist, or emergency service. Do not diagnose or treat.
- Never tell a user to stop, change, or withhold prescribed medication.
- Never give dangerous withdrawal advice.
- Never recommend breath holds in water.
- Never encourage unsafe cold exposure, overtraining through sharp pain, fasting after overeating, or any eating-disorder-unsafe behaviour.
- Never shame a relapse or missed day. Use the missed-day repair frame instead.
- If the ACTIVE ROUTE is SAFETY_CRISIS: stop normal coaching. Reply with a short, calm, safety-first message telling the user to contact local emergency services or a crisis line right now and to reach a doctor for medical issues. Do not produce the normal HEADLINE/DO THIS NOW format in that case.

Personalise: address the operator's primaryGoal and primaryGap directly. Reference protocolDay and current streak when relevant. If readinessState is low, give the minimum standard, not the full protocol. If the user message is ambiguous given the profile, ask ONE clarification question, then stop.

RESPONSE FORMAT (use these exact section labels, in this order, for every non-crisis response):

HEADLINE
WHAT'S HAPPENING
DO THIS NOW
TODAY'S NON-NEGOTIABLES
IF TIME IS LOW
COACH CLOSE

Rules:
- Keep answers short. Do not dump the full protocol.
- Use the smallest useful next action.
- Do not overclaim science.
- Do not shame.
- Do not use generic motivation.`;

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
});

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

type Profile = z.infer<typeof ProfileSchema>;
type Journal = z.infer<typeof JournalSchema>;

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
  | "DISCIPLINE_POINTS_STREAK"
  | "IDENTITY_MINDSET"
  | "GENERAL_COACHING";

export type CoachDebug = {
  selectedRoute: CoachRoute;
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
};

export type CoachResponse = { answer: string; debug: CoachDebug };

const SAFETY_PATTERNS = [
  /\bsuicid/i, /\bkill myself\b/i, /\bend (my|it all) life\b/i, /\bself.?harm\b/i,
  /\boverdose\b/i, /\bOD\b/, /\bwithdraw(al|ing)\b/i, /\bdetox\b/i,
  /\bchest pain\b/i, /\bcan'?t breathe\b/i, /\bfaint(ing)?\b/i, /\bemergency\b/i,
  /\bharm (myself|others)\b/i,
];

function hasMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function detectRoute(
  message: string,
  profile: Profile | null,
  journal: Journal | null,
): { route: CoachRoute; reason: string; query: string } {
  const text = `${message.toLowerCase()} ${journal?.journalText?.toLowerCase() ?? ""}`;
  const messageOnly = message.toLowerCase();
  const flags = journal?.patternFlags ?? [];
  const flagSet = new Set(flags.map((f) => f.toLowerCase()));
  const poorSleepMessage = /\b(slept badly|slept poorly|bad sleep|poor sleep|little sleep|no sleep|sleep deprived|rough sleep|terrible sleep|exhausted|wiped|tired)\b/i.test(message);
  const trainingMessage = /\b(train|training|trained|gym|lift|lifting|workout|session|squat|bench|deadlift|press|run|cardio)\b/i.test(message);
  const hardTrainingMessage = /\b(train hard|training hard|go hard|push hard|lift heavy|heavy session|max out|pr attempt|personal record|all out|smash.*workout)\b/i.test(message);

  // 1. SAFETY override
  if (hasMatch(text, SAFETY_PATTERNS)) {
    return {
      route: "SAFETY_CRISIS",
      reason: "User message or journal text contains crisis-language patterns (self-harm, overdose, withdrawal, medical emergency).",
      query: "safety crisis emergency contact crisis line doctor medical danger",
    };
  }

  // 2. Clear current user message intent. This must beat stale journal/profile context.
  if ((poorSleepMessage && trainingMessage) || hardTrainingMessage) {
    return {
      route: "RECOVERY_DAY",
      reason: "Current message explicitly combines poor sleep / low readiness with intent to train hard, so recovery caution overrides missed-day journal context.",
      query: "poor sleep training hard readiness recovery day reduced intensity mobility walk Pilates no overtraining soreness pain flag",
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

  if (/\b(breath|breathwork|box breathing|panic|anxious|anxiety|grounding)\b/i.test(message)) {
    return {
      route: "BREATHWORK",
      reason: "Current message explicitly asks about breath / stress / grounding.",
      query: "breathwork protocol stress anxiety grounding box breathing coherent breathing recovery safety",
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

function buildContextBlock(profile: Profile | null, journal: Journal | null): string {
  const lines: string[] = ["=== OPERATOR CONTEXT ==="];
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
  lines.push("=== END CONTEXT ===");
  return lines.join("\n");
}

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      question: z.string().min(1).max(4000),
      profile: ProfileSchema.nullable().optional(),
      journal: JournalSchema.nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<CoachResponse> => {
    const apiKey = process.env.OPENAI_API_KEY;
    const vectorStoreId = process.env.GORILLA_MIND_VECTOR_STORE_ID ?? null;
    const model = "gpt-4o-mini";

    const profile = data.profile ?? null;
    const journal = data.journal ?? null;

    const safetyFlags: string[] = [];
    if (profile?.alcoholFlag) safetyFlags.push("alcoholFlag");
    if (profile?.processAddictionFlag) safetyFlags.push("processAddictionFlag");
    if (profile?.foodBoundaryActive) safetyFlags.push("foodBoundaryActive");
    if (profile && profile.recoveryState && profile.recoveryState !== "none") safetyFlags.push(`recoveryState:${profile.recoveryState}`);

    const routing = detectRoute(data.question, profile, journal);

    const debug: CoachDebug = {
      selectedRoute: routing.route,
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
    };

    if (!apiKey) {
      debug.apiError = "OPENAI_API_KEY missing on server";
      return { answer: "Coach is offline. Backend secret missing.", debug };
    }
    if (!vectorStoreId) {
      debug.apiError = "GORILLA_MIND_VECTOR_STORE_ID missing on server";
      return { answer: "Coach is offline. Vector store secret missing.", debug };
    }

    const contextBlock = buildContextBlock(profile, journal);

    const routeBlock = [
      "=== ACTIVE ROUTE (selected by backend route detector) ===",
      `route: ${routing.route}`,
      `reason: ${routing.reason}`,
      `retrieval_query: ${routing.query}`,
      `safety_flags: ${safetyFlags.length ? safetyFlags.join(", ") : "none"}`,
      "=== END ROUTE ===",
    ].join("\n");

    // Route-specific instruction nudges
    const routeInstruction =
      routing.route === "SAFETY_CRISIS"
        ? "ACTIVE ROUTE is SAFETY_CRISIS. Do NOT produce the normal HEADLINE/DO THIS NOW format. Respond with a short calm safety-first message: tell the user to contact local emergency services or a crisis line right now, and to reach a doctor for medical issues. Do not give protocol advice in this response."
        : `ACTIVE ROUTE is ${routing.route}. Answer against this route. Use the smallest useful next action. Follow the HEADLINE / WHAT'S HAPPENING / DO THIS NOW / TODAY'S NON-NEGOTIABLES / IF TIME IS LOW / COACH CLOSE format exactly.`;

    const userInput = [
      routeBlock,
      "",
      contextBlock,
      "",
      `=== RETRIEVAL HINT (use these terms when calling file_search) ===\n${routing.query}\n=== END RETRIEVAL HINT ===`,
      "",
      "=== USER MESSAGE ===",
      data.question,
    ].join("\n");

    const instructions = `${SYSTEM_INSTRUCTIONS}\n\n${routeInstruction}`;

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
          include: ["file_search_call.results"],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        debug.apiError = `OpenAI ${res.status}: ${text.slice(0, 500)}`;
        return { answer: "Coach failed to respond. See debug panel.", debug };
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

      return { answer: answer || "(empty response)", debug };
    } catch (err) {
      debug.apiError = err instanceof Error ? err.message : String(err);
      return { answer: "Coach request failed. See debug panel.", debug };
    }
  });
