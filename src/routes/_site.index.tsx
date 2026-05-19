import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Star,
} from "lucide-react";
import {
  featuredProducts,
  partners,
  portfolio,
  stats,
  testimonials,
  blogPosts,
} from "@/lib/site-data";

export const Route = createFileRoute("/_site/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Javalab Tech — Software that runs modern African business" },
      { name: "description", content: "POS, wallets, websites, mobile apps and management systems built for schools, hospitals, retailers and fintechs across Africa." },
      { property: "og:title", content: "Javalab Tech — Software that runs modern African business" },
      { property: "og:description", content: "POS, wallets, websites, mobile apps and management systems built for African business." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Javalab Tech",
        description: "Software that runs modern African business.",
        url: "/",
      }),
    }],
  }),
});

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 md:px-6 md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-primary-glow">
              <Sparkles className="size-3" /> Trusted by 1,284+ businesses
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight md:text-7xl">
              Software that runs <br className="hidden md:block" />
              <span className="text-gradient">modern African business.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              From cloud POS and wallets to school, hospital and HR systems —
              Javalab Tech builds the digital infrastructure that lets ambitious
              companies scale without breaking.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/quote"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-5 text-sm font-medium text-primary-foreground shadow-[0_0_32px_-6px_oklch(0.72_0.22_250/0.7)] transition-shadow hover:shadow-[0_0_48px_-6px_oklch(0.72_0.22_250/0.95)]"
              >
                Start a project <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/products"
                className="glass inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-medium hover:border-primary/40"
              >
                <PlayCircle className="size-4" /> Request demo
              </Link>
              <Link
                to="/services"
                className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                View services <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-elevated relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl p-2 shadow-[0_30px_80px_-30px_oklch(0.72_0.22_250/0.5)]"
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-glass-border bg-background">
              <div className="absolute inset-0 grid-bg opacity-50" />
              <div className="absolute inset-x-0 top-0 flex h-10 items-center gap-2 border-b border-glass-border px-4">
                <span className="size-2.5 rounded-full bg-destructive/60" />
                <span className="size-2.5 rounded-full bg-warning/60" />
                <span className="size-2.5 rounded-full bg-success/60" />
                <span className="ml-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                  hq.javalab.tech / dashboard
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 top-10 grid grid-cols-4 gap-2 p-3 md:gap-3 md:p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass rounded-xl p-3"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                    <div className="mt-2 h-4 w-16 rounded bg-gradient-to-r from-primary to-primary-glow opacity-70" />
                    <div className="mt-3 h-1 w-full rounded-full bg-white/5">
                      <div className="h-full w-3/5 rounded-full bg-primary" />
                    </div>
                  </div>
                ))}
                <div className="glass col-span-4 mt-1 rounded-xl p-3 md:col-span-3">
                  <svg viewBox="0 0 400 100" className="h-full w-full">
                    <defs>
                      <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.22 250)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="oklch(0.72 0.22 250)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,70 C40,60 60,40 100,45 C140,50 160,80 200,60 C240,40 260,20 300,30 C340,40 360,55 400,35 L400,100 L0,100 Z"
                      fill="url(#g)"
                    />
                    <path
                      d="M0,70 C40,60 60,40 100,45 C140,50 160,80 200,60 C240,40 260,20 300,30 C340,40 360,55 400,35"
                      stroke="oklch(0.78 0.24 245)"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                <div className="glass col-span-4 rounded-xl p-3 md:col-span-1">
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-success" />
                        <div className="h-1.5 flex-1 rounded-full bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats / live counters */}
      <section className="border-y border-glass-border bg-background/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-3 md:px-6 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-semibold text-primary-glow md:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Integrated with
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {partners.map((p) => (
              <span
                key={p}
                className="font-display text-sm font-semibold tracking-widest text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary-glow">
                Our products
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Built once. <span className="text-gradient">Battle-tested everywhere.</span>
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-medium text-primary-glow hover:underline"
            >
              View all products →
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((p) => (
              <Link
                to="/products"
                key={p.slug}
                className="group glass-elevated relative overflow-hidden rounded-2xl p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_40px_-8px_oklch(0.72_0.22_250/0.4)]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-primary/30 to-chart-5/20 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-glow">
                    {p.tag}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                    {p.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-glass-border pt-4 text-xs">
                    <span className="text-muted-foreground">{p.price}</span>
                    <span className="inline-flex items-center gap-1 text-primary-glow transition-transform group-hover:translate-x-0.5">
                      Learn more <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-glass-border bg-background/60 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <p className="text-center text-[10px] uppercase tracking-[0.25em] text-primary-glow">
            What clients say
          </p>
          <h2 className="mt-2 text-center font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Real teams. Real outcomes.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.who} className="glass-elevated rounded-2xl p-6">
                <div className="flex gap-0.5 text-primary-glow">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 border-t border-glass-border pt-3">
                  <p className="text-sm font-medium">{t.who}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent projects */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary-glow">
                Recent work
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                A portfolio that ships.
              </h2>
            </div>
            <Link to="/portfolio" className="text-xs font-medium text-primary-glow hover:underline">
              See full portfolio →
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolio.slice(0, 3).map((p) => (
              <div
                key={p.slug}
                className="glass-elevated overflow-hidden rounded-2xl"
              >
                <div
                  className="relative h-44 overflow-hidden border-b border-glass-border"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.2 0.08 250), oklch(0.15 0.04 240))",
                  }}
                >
                  <div className="absolute inset-0 grid-bg opacity-50" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="rounded-md bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-glow backdrop-blur">
                      {p.category} · {p.year}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest blog */}
      <section className="border-t border-glass-border bg-background/60 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary-glow">
                From the blog
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Field notes from engineering.
              </h2>
            </div>
            <Link to="/blog" className="text-xs font-medium text-primary-glow hover:underline">
              All articles →
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {blogPosts.slice(0, 3).map((b) => (
              <article key={b.slug} className="glass-elevated rounded-2xl p-6">
                <span className="text-[10px] uppercase tracking-wider text-primary-glow">
                  {b.category} · {b.read}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold leading-snug">
                  {b.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.excerpt}</p>
                <p className="mt-4 text-[11px] text-muted-foreground">{b.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-glass-border bg-gradient-to-br from-primary/15 via-background to-background p-10 md:p-14">
            <div
              className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full opacity-40 blur-3xl"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Have a project? <span className="text-gradient">Let's build it.</span>
                </h2>
                <p className="mt-3 text-sm text-muted-foreground md:text-base">
                  Tell us what you need. We'll come back within 24 hours with a plan,
                  a timeline, and a realistic price.
                </p>
              </div>
              <ul className="space-y-2">
                {["Free 30-min discovery call", "Fixed-scope proposal in 48h", "MVP shipped in 6–10 weeks"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-success" />
                      {item}
                    </li>
                  ),
                )}
                <li className="pt-3">
                  <Link
                    to="/quote"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-5 text-sm font-medium text-primary-foreground"
                  >
                    Request a quote <ArrowRight className="size-4" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
