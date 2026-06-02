import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, MessageSquare, BookOpen, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Today", icon: Home },
  { to: "/protocol", label: "Protocol", icon: ListChecks },
  { to: "/coach", label: "Coach", icon: MessageSquare },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell() {
  const { location } = useRouterState();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Gorilla Mind</span>
        </div>
        <span className="text-xs text-muted-foreground">v0.1</span>
      </header>
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
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
