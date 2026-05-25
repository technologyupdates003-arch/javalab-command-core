import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Bad payload", { status: 400 });
        }
        const stk = payload?.Body?.stkCallback;
        if (!stk) return Response.json({ ResultCode: 0, ResultDesc: "Ignored" });

        const checkoutRequestId: string | undefined = stk.CheckoutRequestID;
        const resultCode: number = stk.ResultCode;
        const resultDesc: string = stk.ResultDesc;
        if (!checkoutRequestId) return Response.json({ ResultCode: 0, ResultDesc: "No ref" });

        const items: any[] = stk.CallbackMetadata?.Item ?? [];
        const itemMap: Record<string, any> = {};
        for (const it of items) itemMap[it.Name] = it.Value;
        const receipt = itemMap["MpesaReceiptNumber"];
        const amount = Number(itemMap["Amount"] ?? 0);

        // Find the pending tx
        const { data: tx } = await supabaseAdmin
          .from("mpesa_transactions")
          .select("id, tenant_id, amount, purpose, status")
          .eq("checkout_request_id", checkoutRequestId)
          .maybeSingle();
        if (!tx) {
          return Response.json({ ResultCode: 0, ResultDesc: "Tx not found, accepted" });
        }
        if (tx.status === "success") {
          return Response.json({ ResultCode: 0, ResultDesc: "Already processed" });
        }

        const newStatus = resultCode === 0 ? "success" : "failed";
        await supabaseAdmin
          .from("mpesa_transactions")
          .update({
            status: newStatus,
            mpesa_receipt: receipt ?? null,
            result_code: resultCode,
            result_desc: resultDesc,
            raw_callback: payload,
          })
          .eq("id", tx.id);

        if (newStatus === "success" && tx.purpose === "wallet_topup") {
          await supabaseAdmin.rpc("credit_sms_wallet", {
            _tenant: tx.tenant_id,
            _amount: amount || tx.amount,
          });
        }

        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});