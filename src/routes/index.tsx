import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Gorilla Mind" },
      { name: "description", content: "Your daily protocol, discipline points and streak." },
    ],
  }),
  component: () => (
    <AppShell>
      <TodayPage />
    </AppShell>
  ),
});

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function TodayPage() {
  const d = new Date();
  const today = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return (
    <>
      <SectionHeader eyebrow={today} title="Today." sub="One clean win. No phone-first behaviour. Execute the protocol." />
      <div className="px-5 space-y-4">
        <Stat label="Discipline points" value="0" hint="Earned today" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Streak" value="0d" />
          <Stat label="Repair" value="—" />
        </div>
        <Card title="Morning protocol" body="Hydration. Box breathing. 5 min meditation. No phone for the first hour. One clean win before noon." />
        <Card title="Training" body="Block scheduled. Execute as planned. Stop short of unsafe pain." />
        <Card title="Sleep" body="Wind-down at 22:30. Lights low. No screens in bed." />
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
