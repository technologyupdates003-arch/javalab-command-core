import { createFileRoute, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant.functions";
import { listTenantProducts } from "@/lib/products.functions";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { PRODUCT_BY_PATH } from "@/lib/products-catalog";

export const Route = createFileRoute("/app/$slug")({ component: WorkspaceLayout });

function WorkspaceLayout() {
  const { slug } = useParams({ from: "/app/$slug" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const getTenant = useServerFn(getTenantBySlug);
  const listSubs = useServerFn(listTenantProducts);
  const tenantQ = useQuery({ queryKey: ["tenant", slug], queryFn: () => getTenant({ data: { slug } }) });
  const subsQ = useQuery({
    queryKey: ["tenant-products", tenantQ.data?.id],
    queryFn: () => listSubs({ data: { tenantId: tenantQ.data!.id } }),
    enabled: !!tenantQ.data?.id,
  });

  if (tenantQ.isLoading || !tenantQ.data) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>;
  }

  const parts = pathname.split("/").filter(Boolean);
  const productPath = parts[2];
  const activeProduct = productPath && PRODUCT_BY_PATH[productPath] ? PRODUCT_BY_PATH[productPath] : null;

  return (
    <WorkspaceShell
      tenantName={tenantQ.data.name}
      tenantSlug={slug}
      activeProduct={activeProduct}
      subscriptions={subsQ.data ?? []}
    >
      <Outlet />
    </WorkspaceShell>
  );
}