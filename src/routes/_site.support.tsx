import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, MessageCircle, Search, Ticket } from "lucide-react";
import { useState } from "react";
import { PageHero } from "./_site.services";

export const Route = createFileRoute("/_site/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support — Javalab Tech" },
      { name: "description", content: "Knowledge base, FAQs, ticket creation, live chat and WhatsApp support." },
      { property: "og:title", content: "Support — Javalab Tech" },
      { property: "og:description", content: "Get help from the Javalab support team." },
      { property: "og:url", content: "/support" },
    ],
    links: [{ rel: "canonical", href: "/support" }],
  }),
});

const faqs = [
  { q: "How do I subscribe to a Javalab product?", a: "Pick a plan on /pricing, complete checkout with card or STK Push, and your tenant is provisioned within minutes." },
  { q: "Can I migrate from another POS / system?", a: "Yes. We import data from CSV, Excel, MySQL, MSSQL and most major POS systems. Migration is free on Pro and Enterprise plans." },
  { q: "Do you offer SLAs?", a: "Enterprise plans include a 99.9% uptime SLA with response-time guarantees and a dedicated Customer Success Manager." },
  { q: "Where is my data stored?", a: "Data is stored in encrypted, region-pinned databases. We can deploy on-premise for regulated industries (finance, healthcare)." },
  { q: "Can I get a custom feature built?", a: "Absolutely — submit a request on /quote and we'll come back with a scope and price within 24 hours." },
];

function SupportPage() {
  const [q, setQ] = useState("");
  const items = faqs.filter((f) =>
    (f.q + f.a).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <PageHero
        tag="Support"
        title="How can we help?"
        sub="Browse the knowledge base, open a ticket, or chat with us — we typically reply in under 30 minutes during business hours."
      />
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { i: BookOpen, t: "Knowledge base", s: "Guides & how-tos" },
            { i: Ticket, t: "Open a ticket", s: "Get help from support" },
            { i: MessageCircle, t: "WhatsApp", s: "Chat with us live" },
          ].map((c) => (
            <button
              key={c.t}
              className="glass-elevated flex items-center gap-3 rounded-2xl p-5 text-left transition-all hover:border-primary/40"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-chart-5/20 ring-1 ring-white/10">
                <c.i className="size-4 text-primary-glow" />
              </div>
              <div>
                <p className="font-display text-base font-semibold">{c.t}</p>
                <p className="text-xs text-muted-foreground">{c.s}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Frequently asked
            </h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search FAQs"
                className="glass h-9 w-60 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="mt-4 divide-y divide-glass-border rounded-2xl border border-glass-border bg-background/40">
            {items.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="text-primary-glow group-open:hidden">+</span>
                  <span className="hidden text-primary-glow group-open:inline">−</span>
                  <span className="ml-3">{f.q}</span>
                </summary>
                <p className="mt-3 pl-6 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
            {items.length === 0 && (
              <p className="p-5 text-center text-sm text-muted-foreground">
                No matching questions.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
