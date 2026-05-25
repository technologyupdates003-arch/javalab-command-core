import { createFileRoute, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant.functions";
import { listTenantProducts } from "@/lib/products.functions";
import { PRODUCT_BY_PATH } from "@/lib/products-catalog";
import { ProductLockedCard } from "@/components/workspace/workspace-shell";

export const Route = createFileRoute("/app/$slug/$product")({ component: GenericProduct });

function GenericProduct() {
  const { slug, product } = useParams({ from: "/app/$slug/$product" });
  const getTenant = useServerFn(getTenantBySlug);
  const listSubs = useServerFn(listTenantProducts);
  const tenantQ = useQuery({ queryKey: ["tenant", slug], queryFn: () => getTenant({ data: { slug } }) });
  const subsQ = useQuery({ queryKey: ["tenant-products", tenantQ.data?.id], queryFn: () => listSubs({ data: { tenantId: tenantQ.data!.id } }), enabled: !!tenantQ.data?.id });

  const def = PRODUCT_BY_PATH[product];
  if (!def) return <div className="text-sm text-muted-foreground">Unknown product.</div>;
  if (!subsQ.data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const owned = (subsQ.data ?? []).some((s) => s.product_slug === def.slug);
  if (!owned) return <ProductLockedCard tenantSlug={slug} product={def} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{def.name}</h1>
      <p className="text-sm text-muted-foreground">{def.tagline}</p>
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        This workspace is coming soon. Your subscription is active and reserved.
      </div>
    </div>
  );
}