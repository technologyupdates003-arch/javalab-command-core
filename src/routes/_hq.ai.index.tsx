import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, Sparkles } from "lucide-react";
import { GlassCard, PageHeader } from "@/components/hq/primitives";

export const Route = createFileRoute("/_hq/ai/")({
  component: AIPage,
  head: () => ({ meta: [{ title: "AI Assistant — Javalab HQ" }] }),
});

const suggestions = [
  "Summarize this month's revenue vs last month.",
  "Which 5 clients are most at risk of churn?",
  "Forecast subscription growth for Q3.",
  "Which support agent resolves tickets fastest?",
  "Compare Pharmacy POS adoption across regions.",
];

function AIPage() {
  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="The embedded brain of the command center — reports, forecasts, and recommendations across every module."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 flex min-h-[420px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-thin">
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
                <Bot className="size-4 text-primary-foreground" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
                <p>Good morning, Commander. Production looks healthy — MRR up 7.2% MoM and only 3 failed payments in the queue.</p>
                <p className="mt-2 text-muted-foreground">Ask me anything about your clients, products, or operations.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-glass-border pt-3">
            <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
              <Sparkles className="size-4 text-primary-glow" />
              <input
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                placeholder="Ask the HQ assistant…"
              />
              <button className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Try asking
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <li
                key={s}
                className="cursor-pointer rounded-xl border border-glass-border bg-background/40 p-3 text-xs transition-colors hover:border-primary/30 hover:text-primary-glow"
              >
                {s}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
