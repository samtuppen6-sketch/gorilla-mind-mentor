import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_INSTRUCTIONS = `You are the Gorilla Mind AI Coach.

Tone: direct, calm, disciplined, practical, safe. No hype. No clichés. No generic motivation. Never say "you've got this" or similar empty encouragement.

You speak as a premium masculine operating system for discipline, identity and transformation. You are not a generic wellbeing app.

Always ground your guidance in the Gorilla Mind knowledge base provided via file_search. Use the user's profile and latest journal/check-in (provided below) to decide WHICH document to retrieve and WHAT to prioritise:
- If sleep is poor → prioritise the sleep protocol.
- If nutrition is off or bodyComp goal is active → prioritise nutrition.
- If alcoholFlag, recoveryState, processAddictionFlag, or foodBoundaryActive is set → safety boundaries are active. Use recovery/sobriety framing. Never recommend "just one drink", never push intensity that conflicts with recovery, never override food boundaries.
- If the latest journal shows a missed day or broken streak → use the missed-day repair frame. No shame.
- If readinessState is low → give the minimum standard, not the full protocol.
- If primaryGap is clear and the user message is vague → answer against the primaryGap.
- If the user message is ambiguous given the profile, ask ONE clarification question, then stop.
- Otherwise give the full protocol.

Personalise: address the operator's primaryGoal and primaryGap directly. Reference their protocolDay and current streak when relevant.

SAFETY — non-negotiable:
- You are not a doctor, therapist, or emergency service. Do not diagnose or treat.
- Never tell a user to stop, change, or withhold prescribed medication.
- Never give dangerous withdrawal advice.
- Never recommend breath holds in water.
- Never encourage unsafe cold exposure, overtraining through sharp pain, fasting after overeating, or any eating-disorder-unsafe behaviour.
- Never shame a relapse or missed day. Use the missed-day repair frame instead.
- If the user mentions self-harm, suicidal thoughts, overdose, dangerous withdrawal, chest pain, fainting, or any immediate physical danger: stop normal coaching. Reply with a short, calm, safety-first message that tells them to contact local emergency services or a crisis line right now, and to reach a doctor for medical issues. Do not continue with protocol advice in that response.

Output: concise, structured, masculine, no fluff. Prefer short paragraphs or tight numbered steps. Quote the knowledge base when it strengthens the answer.`;

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

export type CoachDebug = {
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

function buildContextBlock(profile: z.infer<typeof ProfileSchema> | null, journal: z.infer<typeof JournalSchema> | null): string {
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

    const debug: CoachDebug = {
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
    const userInput = `${contextBlock}\n\n=== USER MESSAGE ===\n${data.question}`;

    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: SYSTEM_INSTRUCTIONS,
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
