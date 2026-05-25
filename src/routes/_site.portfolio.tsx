import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "./_site.services";
import { portfolio } from "@/lib/site-data";

export const Route = createFileRoute("/_site/portfolio")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Javalab Tech" },
      { name: "description", content: "Selected work from Javalab Tech — fintech, hospitality, education, healthcare and retail." },
      { property: "og:title", content: "Portfolio — Javalab Tech" },
      { property: "og:description", content: "Selected case studies and projects from Javalab Tech." },
      { property: "og:url", content: "/portfolio" },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
  }),
});

function PortfolioPage() {
  const cats = ["All", ...Array.from(new Set(portfolio.map((p) => p.category)))];
  const [cat, setCat] = useState("All");
  const items = portfolio.filter((p) => cat === "All" || p.category === cat);
  return (
    <div>
      <PageHero
        tag="Our work"
        title="Selected case studies."
        sub="A small sample of the platforms we've designed, shipped and operate for clients across the continent."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "h-9 rounded-lg px-3 text-xs font-medium uppercase tracking-wider transition-colors " +
                (cat === c
                  ? "bg-primary/15 text-primary-glow ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <article key={p.slug} className="glass-elevated overflow-hidden rounded-2xl">
              <div
                className="relative h-52 border-b border-glass-border"
                style={{
                  background: `linear-gradient(135deg, oklch(0.22 0.1 ${
                    35 + items.indexOf(p) * 8
                  }), oklch(0.14 0.04 30))`,
                }}
              >
                <div className="absolute inset-0 grid-bg opacity-50" />
                <span className="absolute left-4 top-4 rounded-md bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-glow backdrop-blur">
                  {p.category} · {p.year}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
