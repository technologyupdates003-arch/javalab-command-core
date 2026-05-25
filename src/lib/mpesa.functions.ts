import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stkPush, normalizePhone } from "./mpesa.server";

const topupSchema = z.object({
  tenantId: z.string().uuid(),
  amount: z.number().int().min(10).max(150000),
  phone: z.string().min(9).max(15),
  purpose: z.enum(["wallet_topup", "subscription"]).default("wallet_topup"),
  reference: z.string().max(40).default("TopUp"),
});

export const initiateMpesaStk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => topupSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const phone = normalizePhone(data.phone);

    const origin = process.env.MPESA_CALLBACK_URL
      || `https://${process.env.LOVABLE_PROJECT_HOST || "javalab-command-core.lovable.app"}`;
    const callbackUrl = origin.includes("/api/public/")
      ? origin
      : `${origin.replace(/\/$/, "")}/api/public/mpesa/callback`;

    // Insert pending tx first (so callback can match by checkout_request_id)
    const { data: tx, error: txErr } = await supabase
      .from("mpesa_transactions")
      .insert({
        tenant_id: data.tenantId,
        amount: data.amount,
        phone,
        purpose: data.purpose,
        account_reference: data.reference,
        description: data.reference,
        initiated_by: userId,
        status: "pending",
      })
      .select()
      .single();
    if (txErr) throw new Error(txErr.message);

    try {
      const result = await stkPush({
        phone,
        amount: data.amount,
        accountReference: data.reference,
        description: data.reference,
        callbackUrl,
      });
      await supabase
        .from("mpesa_transactions")
        .update({
          checkout_request_id: result.checkoutRequestId,
          merchant_request_id: result.merchantRequestId,
          raw_request: result.raw,
        })
        .eq("id", tx.id);
      return { ok: true, txId: tx.id, checkoutRequestId: result.checkoutRequestId };
    } catch (e: any) {
      await supabase
        .from("mpesa_transactions")
        .update({ status: "failed", result_desc: e.message })
        .eq("id", tx.id);
      throw new Error(e.message || "STK push failed");
    }
  });

export const getMpesaTxStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { txId: string }) => z.object({ txId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: tx, error } = await supabase
      .from("mpesa_transactions")
      .select("id, status, amount, mpesa_receipt, result_desc, purpose")
      .eq("id", data.txId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return tx;
  });