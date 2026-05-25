import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyTenants } from "@/lib/tenant.functions";

export const Route = createFileRoute("/app/")({ component: Index });

function Index() {
  const fn = useServerFn(listMyTenants);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["my-tenants"], queryFn: () => fn({}) });
  useEffect(() => {
    if (isLoading || !data) return;
    if (data.length === 0) navigate({ to: "/app/onboarding" });
    else navigate({ to: `/app/${data[0].tenant.slug}` });
  }, [data, isLoading, navigate]);
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>;
}