import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  FileText,
  KeyRound,
  LogIn,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import {
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
} from "@/components/hq/primitives";
import { clients } from "@/lib/mock-data";

export const Route = createFileRoute("/hq/clients/$id")({
  component: ClientDetail,
  loader: ({ params }) => {
    const client = clients.find((c) => c.id === params.id);
    if (!client) throw notFound();
    return { client };
  },
  notFoundComponent: () => (
    <div>
      <PageHeader title="Client not found" />
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.client.name ?? "Client"} — Javalab HQ` }],
  }),
});

function ClientDetail() {
  const { client } = Route.useLoaderData();
  const tabs = ["Overview", "Subscriptions", "Invoices", "KYC", "Activity", "Notes"];

  return (
    <div>
      <Link
        to="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to clients
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-chart-5/20 ring-1 ring-white/10">
            <Building2 className="size-6 text-primary-glow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{client.name}</h1>
              <StatusPill status={client.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {client.industry} · {client.country} · Customer since {client.since}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="glass inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs hover:border-primary/40">
            <Mail className="size-3.5" /> Email
          </button>
          <button className="glass inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs hover:border-primary/40">
            <Phone className="size-3.5" /> Call
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3 text-xs font-medium text-primary-foreground">
            <LogIn className="size-3.5" /> Login as customer
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 border-b border-glass-border">
        {tabs.map((t: string, i: number) => (
          <button
            key={t}
            className={
              "border-b-2 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors " +
              (i === 0
                ? "border-primary text-primary-glow"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <SectionHeader title="Subscriptions" subtitle="Active products & plans" />
          <div className="mt-4 space-y-2">
            {client.products.map((p: string) => (
              <div
                key={p}
                className="flex items-center justify-between rounded-xl border border-glass-border bg-background/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{p}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {client.plan} · Auto-renew
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">
                    ${Math.round(client.mrr / client.products.length).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">/ month</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Account" />
          <dl className="mt-4 space-y-3 text-xs">
            {[
              ["Plan", client.plan],
              ["MRR", `$${client.mrr.toLocaleString()}`],
              ["Country", client.country],
              ["Account ID", client.id],
              ["KYC", "Verified"],
              ["2FA", "Enabled"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <SectionHeader title="Recent activity" />
          <ul className="mt-3 space-y-3 text-xs">
            {[
              { i: FileText, t: "Invoice #INV-08214 paid", w: "2d ago" },
              { i: MessageSquare, t: "Support ticket #4812 resolved", w: "5d ago" },
              { i: KeyRound, t: "API key 'prod-pos-01' rotated", w: "1w ago" },
              { i: FileText, t: "Contract addendum signed", w: "3w ago" },
            ].map((a, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-glass-border/50 pb-2 last:border-0">
                <a.i className="size-3.5 text-primary-glow" />
                <span className="flex-1">{a.t}</span>
                <span className="text-muted-foreground">{a.w}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Notes" />
          <textarea
            className="mt-3 h-32 w-full resize-none rounded-lg bg-background/40 p-3 text-xs ring-1 ring-glass-border focus:outline-none focus:ring-primary/50"
            placeholder="Add a note about this client…"
          />
        </GlassCard>
      </div>
    </div>
  );
}
