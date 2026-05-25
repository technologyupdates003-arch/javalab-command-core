import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle } from "lucide-react";
import { PageHero } from "./_site.services";
import { featuredProducts } from "@/lib/site-data";

export const Route = createFileRoute("/_site/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Javalab Tech" },
      { name: "description", content: "Cloud POS, multi-currency wallets, school and hospital systems, HR, booking and bulk SMS — production-ready Javalab products." },
      { property: "og:title", content: "Products — Javalab Tech" },
      { property: "og:description", content: "Production-ready SaaS products from Javalab Tech." },
      { property: "og:url", content: "/products" },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
});

function ProductsPage() {
  return (
    <div>
      <PageHero
        tag="Our products"
        title="SaaS built for the way Africa works."
        sub="Production-ready platforms. Buy a subscription, pilot in a week, scale to thousands of branches."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {featuredProducts.map((p) => (
            <article
              key={p.slug}
              className="glass-elevated overflow-hidden rounded-2xl"
            >
              <div
                className="relative h-44 border-b border-glass-border"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.22 0.1 35), oklch(0.13 0.04 30))",
                }}
              >
                <div className="absolute inset-0 grid-bg opacity-50" />
                <span className="absolute left-4 top-4 rounded-md bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-glow backdrop-blur">
                  {p.tag}
                </span>
                <div className="absolute bottom-4 right-4 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Starting at
                  </p>
                  <p className="font-display text-lg font-semibold">{p.price}</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  {p.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/pricing"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3 text-xs font-medium text-primary-foreground"
                  >
                    Subscribe <ArrowRight className="size-3.5" />
                  </Link>
                  <Link
                    to="/quote"
                    className="glass inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium hover:border-primary/40"
                  >
                    <PlayCircle className="size-3.5" /> Request demo
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
