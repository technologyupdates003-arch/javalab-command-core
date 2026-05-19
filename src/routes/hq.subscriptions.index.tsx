import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, RefreshCcw } from "lucide-react";
import {
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
} from "@/components/hq/primitives";
import { clients, failedPayments, plans } from "@/lib/mock-data";

export const Route = createFileRoute("/hq/subscriptions/")({
  component: SubsPage,
  head: () => ({ meta: [{ title: "Subscriptions — Javalab HQ" }] }),
});

function SubsPage() {
  const mrr = plans.reduce((s, p) => s + p.price * p.active, 0);
  return (
    <div>
      <PageHeader
        title="Subscription Center"
        description="Plans, billing, renewals, and recovery — the engine room of recurring revenue."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Total MRR", v: `$${mrr.toLocaleString()}` },
          { l: "Active subscriptions", v: plans.reduce((s, p) => s + p.active, 0).toLocaleString() },
          { l: "Trial accounts", v: "84" },
          { l: "Churn (30d)", v: "1.8%" },
        ].map((s) => (
          <div key={s.l} className="glass-elevated rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className="glass-elevated relative overflow-hidden rounded-2xl p-6"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-25 blur-3xl"
              style={{ background: p.color }}
            />
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {p.billing} plan
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold">{p.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold">${p.price}</span>
              <span className="text-xs text-muted-foreground">/ mo</span>
            </div>
            <ul className="mt-4 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs">
                  <Check className="size-3 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-glass-border pt-3">
              <span className="text-xs text-muted-foreground">Active tenants</span>
              <span className="font-display text-lg font-semibold" style={{ color: p.color }}>
                {p.active.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <SectionHeader title="Recent subscriptions" subtitle="Latest renewals & upgrades" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 font-medium">Client</th>
                  <th className="py-2 font-medium">Plan</th>
                  <th className="py-2 font-medium">MRR</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b border-glass-border/50 last:border-0">
                    <td className="py-2.5 font-medium">{c.name}</td>
                    <td className="py-2.5">{c.plan}</td>
                    <td className="py-2.5 font-mono text-xs">${c.mrr.toLocaleString()}</td>
                    <td className="py-2.5"><StatusPill status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader
            title="Failed payments"
            subtitle="Retry queue"
            action={
              <button className="glass inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] uppercase tracking-wider hover:border-primary/40">
                <RefreshCcw className="size-3" /> Retry all
              </button>
            }
          />
          <ul className="mt-3 space-y-2">
            {failedPayments.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 text-destructive" />
                  <span className="font-medium">{f.client}</span>
                  <span className="ml-auto font-mono">${f.amount}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {f.reason} · attempt {f.attempts}/3 · {f.when} ago
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
