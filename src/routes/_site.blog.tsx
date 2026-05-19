import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { PageHero } from "./_site.services";
import { blogPosts } from "@/lib/site-data";

export const Route = createFileRoute("/_site/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "Blog — Javalab Tech" },
      { name: "description", content: "Engineering, product and business notes from the Javalab Tech team." },
      { property: "og:title", content: "Blog — Javalab Tech" },
      { property: "og:description", content: "Field notes from engineering, product and business at Javalab Tech." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
});

function BlogPage() {
  const [q, setQ] = useState("");
  const cats = ["All", ...Array.from(new Set(blogPosts.map((b) => b.category)))];
  const [cat, setCat] = useState("All");
  const items = blogPosts.filter(
    (b) =>
      (cat === "All" || b.category === cat) &&
      (b.title.toLowerCase().includes(q.toLowerCase()) ||
        b.excerpt.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div>
      <PageHero
        tag="Blog"
        title="Field notes from the team."
        sub="Engineering deep dives, product thinking, case studies and the occasional rant."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles…"
              className="glass h-10 w-72 rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  "h-8 rounded-md px-3 text-[11px] font-medium uppercase tracking-wider transition-colors " +
                  (cat === c
                    ? "bg-primary/15 text-primary-glow ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <article key={b.slug} className="glass-elevated overflow-hidden rounded-2xl">
              <div
                className="h-40 border-b border-glass-border"
                style={{ background: "linear-gradient(135deg, oklch(0.22 0.1 250), oklch(0.13 0.04 240))" }}
              />
              <div className="p-5">
                <span className="text-[10px] uppercase tracking-wider text-primary-glow">
                  {b.category} · {b.read}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.excerpt}</p>
                <p className="mt-4 text-[11px] text-muted-foreground">{b.date}</p>
              </div>
            </article>
          ))}
          {items.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground">
              No articles match your search.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
