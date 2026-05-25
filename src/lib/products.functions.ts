import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRODUCT_BY_SLUG } from "./products-catalog";

export const listTenantProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tenantId: string }) =>
    z.object({ tenantId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: subs, error } = await supabase
      .from("tenant_product_subscriptions")
      .select("product_slug, product_name, category, status, current_period_end, amount, currency")
      .eq("tenant_id", data.tenantId)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return subs ?? [];
  });

const subscribeSchema = z.object({
  tenantId: z.string().uuid(),
  productSlug: z.string().min(2).max(40),
});

export const subscribeToProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => subscribeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const product = PRODUCT_BY_SLUG[data.productSlug];
    if (!product) throw new Error("Unknown product");
    const { supabase } = context;
    const period_end = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const { data: row, error } = await supabase
      .from("tenant_product_subscriptions")
      .upsert(
        {
          tenant_id: data.tenantId,
          product_slug: product.slug,
          product_name: product.name,
          category: product.category,
          amount: product.monthly,
          currency: product.currency,
          status: "active",
          billing_cycle: "monthly",
          current_period_end: period_end,
        },
        { onConflict: "tenant_id,product_slug" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });