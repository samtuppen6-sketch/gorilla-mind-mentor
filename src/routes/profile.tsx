import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Gorilla Mind" }, { name: "description", content: "Your identity, streaks and discipline stats." }] }),
  component: () => (
    <AppShell>
      <SectionHeader eyebrow="Identity" title="Profile." sub="Who you're becoming, measured in days." />
      <div className="px-5 space-y-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-muted">Operator</p>
          <p className="text-xl font-semibold mt-1">Anonymous</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Streak" value="0" />
            <Stat label="Points" value="0" />
            <Stat label="Repairs" value="0" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Settings</p>
          <p className="text-xs text-muted-foreground mt-1">Auth, reminders and integrations coming next.</p>
        </div>
      </div>
    </AppShell>
  ),
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-gold">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
