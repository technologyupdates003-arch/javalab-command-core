import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { services } from "@/lib/site-data";

export const Route = createFileRoute("/_site/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Javalab Tech" },
      { name: "description", content: "Web, mobile, POS, wallets, school, hospital, HR, booking and SMS — full-spectrum software services." },
      { property: "og:title", content: "Services — Javalab Tech" },
      { property: "og:description", content: "Full-spectrum software services for modern African business." },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
});

function PageHero({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <section className="relative overflow-hidden border-b border-glass-border">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[800px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
        <span className="text-[10px] uppercase tracking-[0.25em] text-primary-glow">{tag}</span>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{sub}</p>
      </div>
    </section>
  );
}

function ServicesPage() {
  return (
    <div>
      <PageHero
        tag="What we do"
        title={"Full-spectrum software, end to end."}
        sub="Strategy, design, engineering, deployment and 24/7 operations — one team, one accountable partner."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.slug}
              className="group glass-elevated rounded-2xl p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_40px_-8px_oklch(0.65_0.22_35/0.4)]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-chart-5/20 text-2xl ring-1 ring-white/10">
                {s.icon}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
              <ul className="mt-4 space-y-1.5">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <Check className="size-3 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/quote"
                className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary-glow transition-transform group-hover:translate-x-0.5"
              >
                Request quote <ArrowRight className="size-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export { PageHero };
