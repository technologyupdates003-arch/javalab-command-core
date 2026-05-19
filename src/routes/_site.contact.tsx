import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { PageHero } from "./_site.services";

export const Route = createFileRoute("/_site/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Javalab Tech" },
      { name: "description", content: "Talk to Javalab Tech — sales, support, partnerships. We respond within one business day." },
      { property: "og:title", content: "Contact — Javalab Tech" },
      { property: "og:description", content: "Get in touch with Javalab Tech." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div>
      <PageHero
        tag="Contact"
        title="Let's talk."
        sub="Sales, support, partnerships — pick a channel that works for you. We answer within one business day."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            {[
              { i: Mail, t: "Email", v: "hello@javalab.tech", href: "mailto:hello@javalab.tech" },
              { i: Phone, t: "Phone", v: "+254 700 000 000", href: "tel:+254700000000" },
              { i: MessageCircle, t: "WhatsApp", v: "Chat with us", href: "https://wa.me/254700000000" },
              { i: MapPin, t: "Office", v: "Westlands, Nairobi · KE", href: "#map" },
            ].map((c) => (
              <a
                key={c.t}
                href={c.href}
                className="glass-elevated flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-chart-5/20 ring-1 ring-white/10">
                  <c.i className="size-4 text-primary-glow" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {c.t}
                  </p>
                  <p className="text-sm font-medium">{c.v}</p>
                </div>
              </a>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="glass-elevated rounded-2xl p-6 lg:col-span-2"
          >
            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
                  <Send className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">Message received.</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll be in touch within one business day. (Demo form — not wired to backend yet.)
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Send us a message
                </h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    { l: "Full name", n: "name", type: "text" },
                    { l: "Email", n: "email", type: "email" },
                    { l: "Company", n: "company", type: "text" },
                    { l: "Phone", n: "phone", type: "tel" },
                  ].map((f) => (
                    <div key={f.n}>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {f.l}
                      </label>
                      <input
                        required
                        type={f.type}
                        className="mt-1 h-10 w-full rounded-lg border border-glass-border bg-background/40 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    How can we help?
                  </label>
                  <textarea
                    required
                    rows={5}
                    className="mt-1 w-full resize-none rounded-lg border border-glass-border bg-background/40 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-5 text-sm font-medium text-primary-foreground shadow-[0_0_24px_-4px_oklch(0.72_0.22_250/0.7)]"
                >
                  Send message <Send className="size-4" />
                </button>
              </>
            )}
          </form>
        </div>
        <div
          id="map"
          className="mt-10 h-72 overflow-hidden rounded-2xl border border-glass-border bg-background/60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, oklch(0.72 0.22 250 / 0.2), transparent 60%), repeating-linear-gradient(0deg, oklch(1 0 0 / 0.04) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, oklch(1 0 0 / 0.04) 0 1px, transparent 1px 40px)",
          }}
        >
          <div className="flex h-full items-center justify-center">
            <div className="glass rounded-xl px-4 py-2 text-sm">
              <MapPin className="mr-1 inline size-3.5 text-primary-glow" /> Westlands, Nairobi
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
