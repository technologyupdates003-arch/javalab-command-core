import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant.functions";
import { getSmsOverview } from "@/lib/sms.functions";
import { initiateMpesaStk } from "@/lib/mpesa.functions";

export const Route = createFileRoute("/app/$slug/billing")({ component: Billing });

function Billing() {
  const { slug } = useParams({ from: "/app/$slug/billing" });
  const getTenant = useServerFn(getTenantBySlug);
  const overview = useServerFn(getSmsOverview);
  const stk = useServerFn(initiateMpesaStk);
  const qc = useQueryClient();
  const tenantQ = useQuery({ queryKey: ["tenant", slug], queryFn: () => getTenant({ data: { slug } }) });
  const balQ = useQuery({
    queryKey: ["sms-overview", tenantQ.data?.id],
    queryFn: () => overview({ data: { tenantId: tenantQ.data!.id } }),
    enabled: !!tenantQ.data?.id,
  });
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(100);
  const [msg, setMsg] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => stk({ data: { tenantId: tenantQ.data!.id, phone, amount, purpose: "wallet_topup", reference: "WalletTopUp" } }),
    onSuccess: () => { setMsg("STK push sent — check your phone."); qc.invalidateQueries({ queryKey: ["sms-overview", tenantQ.data?.id] }); },
    onError: (e: any) => setMsg(e.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing & Wallet</h1>
        <p className="text-sm text-muted-foreground">Top up your wallet via M-Pesa.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Current balance</div>
        <div className="mt-1 text-3xl font-semibold">KES {(balQ.data?.balance ?? 0).toLocaleString()}</div>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); setMsg(null); mut.mutate(); }}
        className="space-y-3 rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="text-base font-semibold">Top up via M-Pesa</h2>
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        <input type="number" required min={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount (KES)" className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        {msg && <div className="rounded-md bg-muted px-3 py-2 text-xs">{msg}</div>}
        <button disabled={mut.isPending} className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground">{mut.isPending ? "Sending…" : "Send STK push"}</button>
      </form>
    </div>
  );
}