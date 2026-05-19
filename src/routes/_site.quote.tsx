import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Send, Upload } from "lucide-react";
import { useState } from "react";
import { PageHero } from "./_site.services";

export const Route = createFileRoute("/_site/quote")({
  component: QuotePage,
  head: () => ({
    meta: [
      { title: "Request a quote — Javalab Tech" },
      { name: "description", content: "Tell us about your project. We come back within 24 hours with a plan, a timeline and a realistic price." },
      { property: "og:title", content: "Request a quote — Javalab Tech" },
      { property: "og:description", content: "Tell us about your project — proposal within 24 hours." },
      { property: "og:url", content: "/quote" },
    ],
    links: [{ rel: "canonical", href: "/quote" }],
  }),
});

const types = ["Website", "Mobile app", "POS system", "Wallet / Payments", "School / Hospital / HR", "Bulk SMS", "Custom"];
const budgets = ["< $5k", "$5k – $15k", "$15k – $50k", "$50k – $150k", "$150k+"];
const timelines = ["ASAP", "1 month", "1–3 months", "3–6 months", "6+ months"];

function QuotePage() {
  const [sent, setSent] = useState(false);
  const [type, setType] = useState(types[0]);
  const [budget, setBudget] = useState(budgets[1]);
  const [timeline, setTimeline] = useState(timelines[2]);

  return (
    <div>
      <PageHero
        tag="Request a quote"
        title={"Tell us what you're building."}
        sub="We'll send back a realistic proposal — scope, timeline and price — within 24 hours."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="glass-elevated rounded-3xl p-7 md:p-9"
        >
          {sent ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold">Got it.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your request will land in the HQ CRM and a project lead will be in touch within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Project type
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {types.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={
                        "h-9 rounded-lg px-3 text-xs font-medium transition-colors " +
                        (type === t
                          ? "bg-primary/15 text-primary-glow ring-1 ring-primary/30"
                          : "border border-glass-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Budget
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {budgets.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {timelines.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Describe the project
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Goals, users, must-have features, constraints…"
                  className="mt-1 w-full resize-none rounded-lg border border-glass-border bg-background/40 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div className="mt-5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Attach a brief (PDF / DOCX, optional)
                </label>
                <label className="mt-1 flex h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-glass-border bg-background/40 text-sm text-muted-foreground transition-colors hover:border-primary/40">
                  <Upload className="size-4" /> Drop a file or click to upload
                  <input type="file" className="hidden" />
                </label>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  { l: "Your name", t: "text" },
                  { l: "Work email", t: "email" },
                  { l: "Company", t: "text" },
                  { l: "Phone / WhatsApp", t: "tel" },
                ].map((f) => (
                  <div key={f.l}>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {f.l}
                    </label>
                    <input
                      required
                      type={f.t}
                      className="mt-1 h-10 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-5 text-sm font-medium text-primary-foreground shadow-[0_0_28px_-4px_oklch(0.72_0.22_250/0.7)]"
              >
                Send request <Send className="size-4" />
              </button>
              <p className="mt-3 text-[11px] text-muted-foreground">
                On submit, this lead is created in the Javalab HQ CRM automatically.
              </p>
            </>
          )}
        </form>
      </section>
    </div>
  );
}
