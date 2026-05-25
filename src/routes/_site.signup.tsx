import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, UserPlus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { provisionTenant } from "@/lib/tenant.functions";
import { subscribeToProduct } from "@/lib/products.functions";
import { PRODUCT_BY_SLUG } from "@/lib/products-catalog";

const search = z.object({ product: z.string().optional() });

export const Route = createFileRoute("/_site/signup")({
  validateSearch: (s) => search.parse(s),
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — Javalab" }] }),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "workspace";
}

function SignupPage() {
  const { product } = useSearch({ from: "/_site/signup" });
  const navigate = useNavigate();
  const productDef = product ? PRODUCT_BY_SLUG[product] : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name }, emailRedirectTo: window.location.origin + "/app" },
      });
      if (signErr) throw signErr;
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;
      const slug = slugify(company);
      const { slug: createdSlug } = await provisionTenant({ data: { name: company, slug, vertical: productDef?.category ?? "retail" } });
      if (productDef) {
        const t = await supabase.from("tenants").select("id").eq("slug", createdSlug).single();
        if (t.data?.id) {
          await subscribeToProduct({ data: { tenantId: t.data.id, productSlug: productDef.slug } });
        }
        navigate({ to: `/app/${createdSlug}/${productDef.workspacePath}` });
      } else {
        navigate({ to: `/app/${createdSlug}` });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <UserPlus className="size-5" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">Create your workspace</h1>
        {productDef && (
          <p className="mt-1 text-sm text-muted-foreground">
            Starting with <strong>{productDef.name}</strong>. You can add more services from the Marketplace later.
          </p>
        )}
        <form className="mt-6 space-y-3" onSubmit={submit}>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Business / workspace name" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground">
            {busy ? "Creating…" : "Create account"} <ArrowRight className="size-4" />
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </section>
  );
}