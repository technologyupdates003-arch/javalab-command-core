import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { provisionTenant } from "@/lib/tenant.functions";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "workspace";
}

function Onboarding() {
  const fn = useServerFn(provisionTenant);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setErr(null);
          try {
            const slug = slugify(name);
            await fn({ data: { name, slug, vertical: "retail" } });
            navigate({ to: `/app/${slug}` });
          } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8"
      >
        <h1 className="text-xl font-semibold">Create your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Give your business a name.</p>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Ltd" className="mt-4 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        {err && <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
        <button disabled={busy} className="mt-4 h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground">{busy ? "Creating…" : "Continue"}</button>
      </form>
    </div>
  );
}