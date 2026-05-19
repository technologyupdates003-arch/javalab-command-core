import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageHero } from "./_site.services";
import { plansPublic } from "@/lib/site-data";

export const Route = createFileRoute("/_site/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Javalab Tech" },
      { name: "description", content: "Simple monthly and annual plans for every Javalab product. Pay with card or STK Push, cancel anytime." },
      { property: "og:title", content: "Pricing — Javalab Tech" },
      { property: "og:description", content: "Monthly and annual plans for every Javalab product." },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
});

function PricingPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <div>
      <PageHero
        tag="Pricing"
        title="Honest pricing. No surprises."
        sub="Pay monthly or annually. STK Push, card or invoice. Cancel anytime."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={!annual ? "text-foreground" : "text-muted-foreground"}>Monthly</span>
          <button
            onClick={() => setAnnual((a) => !a)}
            className={
              "relative h-7 w-12 rounded-full transition-colors " +
              (annual ? "bg-gradient-to-r from-primary to-primary-glow" : "bg-white/10")
            }
            aria-label="Toggle billing"
          >
            <span
              className={
                "absolute top-1 size-5 rounded-full bg-background shadow transition-transform " +
                (annual ? "translate-x-6" : "translate-x-1")
              }
            />
          </button>
          <span className={annual ? "text-foreground" : "text-muted-foreground"}>
            Annual <span className="ml-1 rounded bg-success/15 px-1.5 py-0.5 text-[10px] text-success">−20%</span>
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plansPublic.map((p) => {
            const price = annual ? Math.round(p.price * 12 * 0.8) : p.price;
            return (
              <div
                key={p.name}
                className={
                  "glass-elevated relative overflow-hidden rounded-3xl p-7 " +
                  (p.best ? "ring-2 ring-primary/50" : "")
                }
              >
                {p.best && (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary-glow px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
                    <Sparkles className="size-2.5" /> Most popular
                  </span>
                )}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-25 blur-3xl"
                  style={{ background: p.color }}
                />
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {p.name}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-semibold">${price}</span>
                  <span className="text-xs text-muted-foreground">/{annual ? "yr" : "mo"}</span>
                </div>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/quote"
                  className={
                    "mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-shadow " +
                    (p.best
                      ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_0_24px_-4px_oklch(0.72_0.22_250/0.7)] hover:shadow-[0_0_36px_-4px_oklch(0.72_0.22_250/0.95)]"
                      : "glass hover:border-primary/40")
                  }
                >
                  Get started <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-glass-border bg-background/60 p-5 text-center text-sm text-muted-foreground">
          Need something bigger? <Link to="/contact" className="text-primary-glow hover:underline">Talk to sales</Link>
          {" "}for enterprise pricing, on-premise deployment, custom modules and SLAs.
        </div>
      </section>
    </div>
  );
}
