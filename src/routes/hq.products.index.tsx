import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Package } from "lucide-react";
import {
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
} from "@/components/hq/primitives";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/hq/products/")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "SaaS Products — Javalab HQ" }] }),
});

function ProductsPage() {
  const groups = Array.from(new Set(products.map((p) => p.group)));
  return (
    <div>
      <PageHeader
        title="SaaS Products"
        description="Every Javalab product line — from Cloud POS variants to financial systems and channels."
      />
      <div className="space-y-6">
        {groups.map((g) => {
          const items = products.filter((p) => p.group === g);
          const totalTenants = items.reduce((s, p) => s + p.tenants, 0);
          const totalMrr = items.reduce((s, p) => s + p.mrr, 0);
          return (
            <div key={g}>
              <SectionHeader
                title={g}
                subtitle={`${items.length} products · ${totalTenants.toLocaleString()} tenants · $${totalMrr.toLocaleString()} MRR`}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <GlassCard key={p.id} hover className="group cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-5/10 ring-1 ring-white/10">
                        <Package className="size-4 text-primary-glow" />
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                    <h3 className="mt-3 font-display text-base font-semibold tracking-tight">
                      {p.name}
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Tenants
                        </p>
                        <p className="font-display text-lg font-semibold">
                          {p.tenants.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          MRR
                        </p>
                        <p className="font-display text-lg font-semibold text-primary-glow">
                          {p.mrr === 0 ? "—" : `$${(p.mrr / 1000).toFixed(1)}k`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-glass-border pt-3 text-[11px] text-muted-foreground transition-colors group-hover:text-primary-glow">
                      <span>Open module</span>
                      <ArrowUpRight className="size-3.5" />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
