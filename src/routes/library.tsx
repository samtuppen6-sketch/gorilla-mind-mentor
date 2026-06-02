import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Library — Gorilla Mind" }, { name: "description", content: "Protocols, references and Gorilla Mind knowledge base." }] }),
  component: () => (
    <AppShell>
      <SectionHeader eyebrow="Knowledge" title="Library." sub="Reference material from the Gorilla Mind knowledge base." />
      <div className="px-5 space-y-3">
        {["Morning protocol", "Breathwork", "Cold & heat", "Training", "Nutrition", "Sleep", "Sobriety", "Missed-day repair"].map((t) => (
          <div key={t} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{t}</p>
            <p className="text-xs text-muted-foreground mt-1">Ask the Coach for the latest from the vector store.</p>
          </div>
        ))}
      </div>
    </AppShell>
  ),
});
