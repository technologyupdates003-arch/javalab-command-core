import { Bell, Bot, Command, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LiveDot } from "./primitives";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/60 px-3 backdrop-blur-xl">
      <SidebarTrigger className="size-8" />
      <div className="hidden h-5 w-px bg-border md:block" />
      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
        <span>Javalab Tech</span>
        <span className="opacity-40">/</span>
        <span className="text-foreground">Production</span>
        <LiveDot />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search clients, invoices, projects…"
            className="glass h-9 w-72 rounded-lg pl-9 pr-12 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <kbd className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-background/50 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
            <Command className="size-2.5" />K
          </kbd>
        </div>
        <button className="glass relative inline-flex size-9 items-center justify-center rounded-lg transition-colors hover:border-primary/40">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive ring-2 ring-background" />
        </button>
        <button className="glass inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors hover:border-primary/40">
          <Bot className="size-3.5 text-primary-glow" />
          Ask AI
        </button>
      </div>
    </header>
  );
}
