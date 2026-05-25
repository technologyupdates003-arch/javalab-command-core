import { createFileRoute, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant.functions";
import { listTenantProducts, subscribeToProduct } from "@/lib/products.functions";
import { PRODUCTS } from "@/lib/products-catalog";
import { Check } from "lucide-react";

export const Route = createFileRoute("/app/$slug/marketplace")({ component: Marketplace });

function Marketplace() {
  const { slug } = useParams({ from: "/app/$slug/marketplace" });
  const getTenant = useServerFn(getTenantBySlug);
  const listSubs = useServerFn(listTenantProducts);
  const subscribe = useServerFn(subscribeToProduct);
  const qc = useQueryClient();
  const tenantQ = useQuery({ queryKey: ["tenant", slug], queryFn: () => getTenant({ data: { slug } }) });
  const subsQ = useQuery({
    queryKey: ["tenant-products", tenantQ.data?.id],
    queryFn: () => listSubs({ data: { tenantId: tenantQ.data!.id } }),
    enabled: !!tenantQ.data?.id,
  });
  const mut = useMutation({
    mutationFn: (productSlug: string) => subscribe({ data: { tenantId: tenantQ.data!.id, productSlug } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant-products", tenantQ.data?.id] }),
  });
  const owned = new Set((subsQ.data ?? []).map((s) => s.product_slug));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Add more Abancool services to your workspace.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => {
          const isOwned = owned.has(p.slug);
          return (
            <div key={p.slug} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <p.icon className="size-6 text-primary" />
              <div className="mt-3 text-base font-semibold">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.tagline}</div>
              <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="size-3 text-primary" /> {f}</li>
                ))}
              </ul>
              <div className="mt-4 flex items-end justify-between">
                <div className="text-sm">
                  {p.monthly > 0 ? (<><span className="font-semibold">KES {p.monthly.toLocaleString()}</span><span className="text-muted-foreground">/mo</span></>) : (<span className="text-muted-foreground">Quote-based</span>)}
                </div>
                <button
                  disabled={isOwned || mut.isPending}
                  onClick={() => mut.mutate(p.slug)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                  {isOwned ? "Active" : mut.isPending ? "…" : "Subscribe"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}