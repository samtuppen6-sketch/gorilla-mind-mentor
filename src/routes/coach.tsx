import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { askCoach, type CoachResponse, type DayPart, type SessionContext, type TemporalContext } from "@/lib/coach.functions";
import { useProfile, useJournal } from "@/lib/profile-store";
import { loadDailyProgress } from "@/lib/practice-progress";
import { Loader2, Send, Play, Clock } from "lucide-react";


export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — Gorilla Mind" },
      { name: "description", content: "Direct, disciplined, grounded in the Gorilla Mind knowledge base." },
    ],
  }),
  component: () => (
    <AppShell>
      <CoachPage />
    </AppShell>
  ),
});

const SEED = "According to the Gorilla Mind knowledge base, what should I do if I keep wasting my mornings?";

function CoachPage() {
  const ask = useServerFn(askCoach);
  const profile = useProfile();
  const journal = useJournal();
  const [question, setQuestion] = useState(SEED);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachResponse | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const dailyProgress = loadDailyProgress();
      const res = await ask({ data: { question: question.trim(), profile, journal, dailyProgress } });

      setResult(res);
    } catch (err) {
      setResult({
        answer: "Request failed.",
        guidedPractice: null,
        debug: {
          selectedRoute: "GENERAL_COACHING",
          breathworkSubRoute: "NONE",
          routeReason: "Client-side request failure before route detector ran.",
          retrievalQuery: "",
          fileSearchCalled: false,
          vectorStoreId: null,
          retrievedChunksCount: 0,
          retrievedFilenames: [],
          retrievedPreviews: [],
          groundedInRetrieval: false,
          apiError: err instanceof Error ? err.message : String(err),
          model: "",
          profileContextSent: !!profile,
          latestJournalSent: !!journal,
          primaryGapUsed: profile?.primaryGap ?? null,
          protocolDayUsed: profile?.protocolDay ?? null,
          safetyFlagsUsed: [],
          guidedPracticeId: null,
          guidedPracticeReason: null,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SectionHeader eyebrow="AI" title="Coach." sub="Direct. Calm. Grounded in profile, journal and the Gorilla Mind knowledge base." />
      <div className="px-5 space-y-4">
        <div className="rounded-xl border border-border bg-card/60 p-3 text-[11px] text-muted-foreground">
          <span className="text-gold-muted">Context loaded:</span> profile · {profile.name} · day {profile.protocolDay} · gap "{profile.primaryGap}" {journal ? `· journal ${journal.date}` : "· no journal yet"}
        </div>

        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the Coach…"
            rows={4}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Searching the knowledge base…" : "Ask the Coach"}
          </button>
        </form>

        {result && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">Response</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          </div>
        )}

        {result?.guidedPractice && (
          <div className="rounded-xl border border-gold/40 bg-card p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted">Guided practice</p>
            <div>
              <h3 className="text-base font-semibold text-foreground">{result.guidedPractice.title}</h3>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                <span>{result.guidedPractice.category}</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{result.guidedPractice.durationMinutes} min</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-gold-muted">Why: </span>{result.guidedPractice.reason}
            </p>
            <Link
              to="/practice/$practiceId"
              params={{ practiceId: result.guidedPractice.id }}
              search={{ source: "coach", route: result.debug.selectedRoute }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-semibold text-primary-foreground"
            >
              <Play className="w-4 h-4" />
              {result.guidedPractice.buttonLabel}
            </Link>

          </div>
        )}

        <DebugPanel result={result} loading={loading} />
      </div>
    </>
  );
}

function DebugPanel({ result, loading }: { result: CoachResponse | null; loading: boolean }) {
  const d = result?.debug;
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-xs font-mono">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-3">Debug panel</p>
      {loading && <p className="text-muted-foreground">Awaiting response…</p>}
      {!loading && !d && <p className="text-muted-foreground">No request yet.</p>}
      {d && (
        <dl className="space-y-2 text-muted-foreground">
          <Row k="selected route" v={d.selectedRoute} />
          <Row k="breathwork sub-route" v={d.breathworkSubRoute} />
          <Row k="route reason" v={d.routeReason} />
          <Row k="retrieval query" v={d.retrievalQuery || "—"} />
          <Row k="model" v={d.model} />
          <Row k="profile context sent" v={String(d.profileContextSent)} />
          <Row k="latest journal sent" v={String(d.latestJournalSent)} />
          <Row k="primaryGap used" v={d.primaryGapUsed ?? "—"} />
          <Row k="protocolDay used" v={d.protocolDayUsed === null ? "—" : String(d.protocolDayUsed)} />
          <Row k="safety flags used" v={d.safetyFlagsUsed.length ? d.safetyFlagsUsed.join(", ") : "none"} />
          <Row k="guided practice selected" v={d.guidedPracticeId ? "true" : "false"} />
          <Row k="guided practice id" v={d.guidedPracticeId ?? "—"} />
          <Row k="guided practice reason" v={d.guidedPracticeReason ?? "—"} />
          <Row k="file_search called" v={String(d.fileSearchCalled)} />
          <Row k="vector store ID" v={d.vectorStoreId ?? "—"} />
          <Row k="retrieved chunks" v={String(d.retrievedChunksCount)} />
          <Row k="grounded in retrieval" v={String(d.groundedInRetrieval)} />
          <Row k="OpenAI error" v={d.apiError ?? "none"} />
          <div>
            <p className="text-foreground">retrieved filenames:</p>
            {d.retrievedFilenames.length === 0 ? (
              <p className="pl-2">—</p>
            ) : (
              <ul className="pl-2 space-y-0.5">
                {d.retrievedFilenames.map((f) => <li key={f}>• {f}</li>)}
              </ul>
            )}
          </div>
          <div>
            <p className="text-foreground">chunk previews (first 240 chars):</p>
            {d.retrievedPreviews.length === 0 ? (
              <p className="pl-2">—</p>
            ) : (
              <ol className="pl-2 space-y-2">
                {d.retrievedPreviews.map((p, i) => (
                  <li key={i} className="text-[11px] leading-relaxed">
                    <span className="text-gold-muted">[{i + 1}]</span> {p}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </dl>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-foreground shrink-0">{k}:</span>
      <span className="break-all">{v}</span>
    </div>
  );
}
