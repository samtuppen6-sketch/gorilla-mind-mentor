import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, ListChecks, MessageSquare, BookOpen, User } from "lucide-react";
import { useDebugMode } from "@/lib/debug-mode";
import { clearProfile, useProfile } from "@/lib/profile-store";

const tabs = [
  { to: "/", label: "Today", icon: Home },
  { to: "/protocol", label: "Protocol", icon: ListChecks },
  { to: "/coach", label: "Coach", icon: MessageSquare },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  const debugMode = useDebugMode();
  const navigate = useNavigate();
  const profile = useProfile();
  const isDemo = profile.identityProfile?.authProvider === "local_placeholder";

  const devReset = () => {
    if (!confirm("Dev reset: clear profile and sign out?")) return;
    clearProfile();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative">
      {debugMode && (
        <div className="fixed top-2 right-2 z-50 flex items-center gap-2">
          <button
            onClick={devReset}
            className="rounded-full bg-background border border-gold/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-gold font-mono"
          >
            Dev reset
          </button>
          <span className="rounded-full bg-gold/20 border border-gold/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-gold font-mono">
            Debug mode
          </span>
        </div>
      )}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Gorilla Mind</span>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded-full bg-gold/15 border border-gold/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] text-gold font-mono">
              Demo Mode
            </span>
          )}
          <span className="text-xs text-muted-foreground">v0.1</span>
        </div>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/95 backdrop-blur border-t border-border">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-widest transition-colors ${
                    active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
