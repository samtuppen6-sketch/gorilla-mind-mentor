import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_INSTRUCTIONS = `You are the Gorilla Mind AI Coach.

Tone: direct, calm, disciplined, practical, safe. No hype. No clichés. No generic motivation. Never say "you've got this" or similar empty encouragement.

You speak as a premium masculine operating system for discipline, identity and transformation. You are not a generic wellbeing app.

Always ground your guidance in the Gorilla Mind knowledge base provided via file_search. If the user asks a question covered by the knowledge base, retrieve from it and answer in the Gorilla Mind voice. Reference the specific protocols (morning protocol, breathwork, cold/heat exposure, training, nutrition, sleep, sobriety, missed-day repair, discipline points, streaks) when relevant.

SAFETY — non-negotiable:
- You are not a doctor, therapist, or emergency service. Do not diagnose or treat.
- Never tell a user to stop, change, or withhold prescribed medication.
- Never give dangerous withdrawal advice.
- Never recommend breath holds in water.
- Never encourage unsafe cold exposure, overtraining through sharp pain, fasting after overeating, or any eating-disorder-unsafe behaviour.
- Never shame a relapse or missed day. Use the missed-day repair frame instead.
- If the user mentions self-harm, suicidal thoughts, overdose, dangerous withdrawal, chest pain, fainting, or any immediate physical danger: stop normal coaching. Reply with a short, calm, safety-first message that tells them to contact local emergency services or a crisis line right now, and to reach a doctor for medical issues. Do not continue with protocol advice in that response.

Output: concise, structured, masculine, no fluff. Prefer short paragraphs or tight numbered steps. Quote the knowledge base when it strengthens the answer.`;

export type CoachDebug = {
  fileSearchCalled: boolean;
  vectorStoreId: string | null;
  retrievedChunksCount: number;
  retrievedFilenames: string[];
  retrievedPreviews: string[];
  groundedInRetrieval: boolean;
  apiError: string | null;
  model: string;
};

export type CoachResponse = {
  answer: string;
  debug: CoachDebug;
};

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ question: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data }): Promise<CoachResponse> => {
    const apiKey = process.env.OPENAI_API_KEY;
    const vectorStoreId = process.env.GORILLA_MIND_VECTOR_STORE_ID ?? null;
    const model = "gpt-4o-mini";

    const debug: CoachDebug = {
      fileSearchCalled: false,
      vectorStoreId,
      retrievedChunksCount: 0,
      retrievedFilenames: [],
      retrievedPreviews: [],
      groundedInRetrieval: false,
      apiError: null,
      model,
    };

    if (!apiKey) {
      debug.apiError = "OPENAI_API_KEY missing on server";
      return { answer: "Coach is offline. Backend secret missing.", debug };
    }
    if (!vectorStoreId) {
      debug.apiError = "GORILLA_MIND_VECTOR_STORE_ID missing on server";
      return { answer: "Coach is offline. Vector store secret missing.", debug };
    }

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
          input: data.question,
          tools: [
            {
              type: "file_search",
              vector_store_ids: [vectorStoreId],
              max_num_results: 8,
            },
          ],
          include: ["file_search_call.results"],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        debug.apiError = `OpenAI ${res.status}: ${text.slice(0, 500)}`;
        return { answer: "Coach failed to respond. See debug panel.", debug };
      }

      const json: any = await res.json();

      // Walk output items
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
            if (c.type === "output_text" && typeof c.text === "string") {
              answer += c.text;
            }
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
