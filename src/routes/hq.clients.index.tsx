import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Download, Plus, Search } from "lucide-react";
import { useState } from "react";
import {
  GlassCard,
  PageHeader,
  StatusPill,
} from "@/components/hq/primitives";
import { clients } from "@/lib/mock-data";

export const Route = createFileRoute("/hq/clients/")({
  component: ClientsPage,
  head: () => ({ meta: [{ title: "Clients — Javalab HQ" }] }),
});

function ClientsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const filtered = clients.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.industry.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Every tenant across Javalab Tech — profiles, contracts, subscriptions, KYC, and activity."
        action={
          <div className="flex gap-2">
            <button className="glass inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium hover:border-primary/40">
              <Download className="size-3.5" /> Export
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-glow px-3 text-xs font-medium text-primary-foreground shadow-[0_0_24px_-4px_oklch(0.65_0.22_35/0.6)] hover:shadow-[0_0_32px_-4px_oklch(0.65_0.22_35/0.8)]">
              <Plus className="size-3.5" /> New client
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients, industries…"
            className="glass h-9 w-80 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        {["all", "active", "trial", "suspended", "pending", "churned"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "h-8 rounded-md px-3 text-[11px] font-medium uppercase tracking-wider transition-colors " +
              (filter === f
                ? "bg-primary/15 text-primary-glow ring-1 ring-primary/30"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {clients.length}
        </span>
      </div>

      <GlassCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium text-right">MRR</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="group border-b border-glass-border/60 transition-colors last:border-0 hover:bg-primary/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/hq/clients/$id"
                      params={{ id: c.id }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-chart-5/20 ring-1 ring-white/10">
                        <Building2 className="size-4 text-primary-glow" />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary-glow">{c.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {c.country}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.industry}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium">
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.products.map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary-glow"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    ${c.mrr.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
