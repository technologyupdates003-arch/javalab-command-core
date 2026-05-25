import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("tenant_memberships")
      .select("role, status, tenants(id, name, slug, vertical)")
      .eq("user_id", userId)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return (data ?? []).map((m: any) => ({
      role: m.role,
      tenant: m.tenants,
    }));
  });

const provisionSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  vertical: z.string().min(2).max(40).default("retail"),
  product: z.string().min(2).max(40).optional(),
});

export const provisionTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => provisionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: tenantId, error } = await supabase.rpc("provision_tenant", {
      p_name: data.name,
      p_slug: data.slug,
      p_vertical: data.vertical,
    });
    if (error) throw new Error(error.message);
    return { tenantId: tenantId as string, slug: data.slug };
  });

export const getTenantBySlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: t, error } = await supabase
      .from("tenants")
      .select("id, name, slug, vertical")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!t) throw new Error("Tenant not found");
    return t;
  });