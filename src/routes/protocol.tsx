import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";

export const Route = createFileRoute("/protocol")({
  head: () => ({ meta: [{ title: "Protocol — Gorilla Mind" }, { name: "description", content: "Daily disciplines: morning, breathwork, meditation, training, nutrition, exposure, sleep, sobriety." }] }),
  component: () => (
    <AppShell>
      <SectionHeader eyebrow="Daily" title="Protocol." sub="The pillars. Execute each one. Mark what you owned." />
      <div className="px-5 space-y-3">
        {pillars.map((p) => (
          <div key={p.title} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{p.title}</h3>
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold-muted">{p.tag}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </AppShell>
  ),
});

const pillars = [
  { title: "Morning protocol", tag: "Identity", body: "Hydration. Box breathing. Meditation. No phone first hour. One clean win." },
  { title: "Breathwork", tag: "Nervous system", body: "Box breathing 4-4-4-4. No breath holds in water." },
  { title: "Meditation", tag: "Mind", body: "5–10 min stillness. Watch the thought, don't follow it." },
  { title: "Training", tag: "Body", body: "Plan, execute, stop short of unsafe pain." },
  { title: "Nutrition", tag: "Fuel", body: "Protein priority. No fasting to repair an overeat." },
  { title: "Sleep", tag: "Recovery", body: "Fixed wind-down. Cool, dark, no screens." },
  { title: "Cold exposure", tag: "Resilience", body: "Cold shower or plunge. Controlled. Never alone in deep water." },
  { title: "Heat exposure", tag: "Resilience", body: "Sauna. Hydrate. Exit if dizzy." },
  { title: "Sobriety & recovery", tag: "Identity", body: "Hold the line. Relapse is not shame — it's data. Repair the day." },
  { title: "Missed-day repair", tag: "System", body: "Don't escalate. Smallest credible win. Restart the streak with one rep of the protocol." },
];
