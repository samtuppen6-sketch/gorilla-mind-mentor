export function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="px-5 pt-6 pb-4">
      {eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] text-gold-muted mb-2">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
      {sub && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{sub}</p>}
    </div>
  );
}
