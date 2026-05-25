import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant.functions";
import { listTenantProducts } from "@/lib/products.functions";
import { PRODUCT_BY_SLUG } from "@/lib/products-catalog";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/app/$slug/")({ component: Overview });

function Overview() {
  const { slug } = useParams({ from: "/app/$slug/" });
  const getTenant = useServerFn(getTenantBySlug);
  const listSubs = useServerFn(listTenantProducts);
  const tenantQ = useQuery({ queryKey: ["tenant", slug], queryFn: () => getTenant({ data: { slug } }) });
  const subsQ = useQuery({
    queryKey: ["tenant-products", tenantQ.data?.id],
    queryFn: () => listSubs({ data: { tenantId: tenantQ.data!.id } }),
    enabled: !!tenantQ.data?.id,
  });
  const subs = subsQ.data ?? [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Your active services across this workspace.</p>
      </div>
      {subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">You don't have any active products yet.</p>
          <Link to={`/app/${slug}/marketplace`} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <ShoppingBag className="size-4" /> Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subs.map((s) => {
            const p = PRODUCT_BY_SLUG[s.product_slug];
            if (!p) return null;
            return (
              <Link key={s.product_slug} to={`/app/${slug}/${p.workspacePath}`} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <p.icon className="size-6 text-primary" />
                <div className="mt-3 text-base font-semibold">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.tagline}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}