import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import { PageHero } from "./_site.services";
import { jobs } from "@/lib/site-data";

export const Route = createFileRoute("/_site/careers")({
  component: CareersPage,
  head: () => ({
    meta: [
      { title: "Careers — Javalab Tech" },
      { name: "description", content: "Help us build the digital infrastructure of African business. Open engineering, design, sales and customer success roles." },
      { property: "og:title", content: "Careers — Javalab Tech" },
      { property: "og:description", content: "Open positions at Javalab Tech." },
      { property: "og:url", content: "/careers" },
    ],
    links: [{ rel: "canonical", href: "/careers" }],
  }),
});

function CareersPage() {
  return (
    <div>
      <PageHero
        tag="Careers"
        title={"Build the systems Africa runs on."}
        sub="We're a small team that ships big things. If you care about craft, scale and the customer — let's talk."
      />
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="space-y-3">
          {jobs.map((j) => (
            <div
              key={j.slug}
              className="group glass-elevated flex flex-wrap items-center gap-4 rounded-2xl p-5 transition-all hover:border-primary/40"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-chart-5/20 ring-1 ring-white/10">
                <Briefcase className="size-4 text-primary-glow" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold">{j.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>{j.dept}</span>
                  <span className="opacity-40">·</span>
                  <span>{j.type}</span>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" /> {j.location}
                  </span>
                </div>
              </div>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3 text-xs font-medium text-primary-foreground opacity-90 transition-opacity group-hover:opacity-100">
                Apply <ArrowRight className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-glass-border bg-background/60 p-6 text-center text-sm text-muted-foreground">
          Don't see your role? Send your CV to{" "}
          <a className="text-primary-glow hover:underline" href="mailto:careers@javalab.tech">
            careers@javalab.tech
          </a>
          .
        </div>
      </section>
    </div>
  );
}
