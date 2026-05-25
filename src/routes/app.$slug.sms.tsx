import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTenantBySlug } from "@/lib/tenant.functions";
import { listTenantProducts } from "@/lib/products.functions";
import { getSmsOverview, sendSms, listSmsHistory, requestSenderId, addContact, listContacts } from "@/lib/sms.functions";
import { PRODUCT_BY_SLUG } from "@/lib/products-catalog";
import { ProductLockedCard } from "@/components/workspace/workspace-shell";

export const Route = createFileRoute("/app/$slug/sms")({ component: SmsWorkspace });

function SmsWorkspace() {
  const { slug } = useParams({ from: "/app/$slug/sms" });
  const getTenant = useServerFn(getTenantBySlug);
  const listSubs = useServerFn(listTenantProducts);
  const overview = useServerFn(getSmsOverview);
  const send = useServerFn(sendSms);
  const history = useServerFn(listSmsHistory);
  const reqSender = useServerFn(requestSenderId);
  const addCt = useServerFn(addContact);
  const listCt = useServerFn(listContacts);
  const qc = useQueryClient();

  const [tab, setTab] = useState<"overview" | "send" | "contacts" | "senders" | "history">("overview");
  const tenantQ = useQuery({ queryKey: ["tenant", slug], queryFn: () => getTenant({ data: { slug } }) });
  const subsQ = useQuery({ queryKey: ["tenant-products", tenantQ.data?.id], queryFn: () => listSubs({ data: { tenantId: tenantQ.data!.id } }), enabled: !!tenantQ.data?.id });
  const tid = tenantQ.data?.id;
  const oQ = useQuery({ queryKey: ["sms-overview", tid], queryFn: () => overview({ data: { tenantId: tid! } }), enabled: !!tid });

  if (!tenantQ.data || !subsQ.data) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const hasSms = (subsQ.data ?? []).some((s) => s.product_slug === "bulk-sms");
  if (!hasSms) return <ProductLockedCard tenantSlug={slug} product={PRODUCT_BY_SLUG["bulk-sms"]} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bulk SMS</h1>
        <p className="text-sm text-muted-foreground">Send messages, manage contacts and sender IDs.</p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {(["overview","send","contacts","senders","history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm capitalize ${tab===t?"border-b-2 border-primary text-foreground":"text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Wallet (KES)", value: (oQ.data?.balance ?? 0).toLocaleString() },
            { label: "Total sent", value: oQ.data?.totalSent ?? 0 },
            { label: "Delivered", value: oQ.data?.delivered ?? 0 },
            { label: "Contacts", value: oQ.data?.contacts ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "send" && <SendTab tenantId={tid!} senders={oQ.data?.senders ?? []} onSent={() => qc.invalidateQueries({ queryKey: ["sms-overview", tid] })} fn={send} />}
      {tab === "contacts" && <ContactsTab tenantId={tid!} addFn={addCt} listFn={listCt} />}
      {tab === "senders" && <SendersTab tenantId={tid!} senders={oQ.data?.senders ?? []} fn={reqSender} onChanged={() => qc.invalidateQueries({ queryKey: ["sms-overview", tid] })} />}
      {tab === "history" && <HistoryTab tenantId={tid!} fn={history} />}
    </div>
  );
}

function SendTab({ tenantId, senders, onSent, fn }: any) {
  const [recipients, setRecipients] = useState("");
  const [body, setBody] = useState("");
  const [senderId, setSenderId] = useState<string | undefined>(undefined);
  const [msg, setMsg] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => fn({ data: { tenantId, recipients: recipients.split(/[\s,]+/).filter(Boolean), body, senderId } }),
    onSuccess: (r: any) => { setMsg(`Queued ${r.queued} messages (KES ${r.totalCost.toFixed(2)}).`); setBody(""); setRecipients(""); onSent(); },
    onError: (e: any) => setMsg(e.message),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); setMsg(null); mut.mutate(); }} className="max-w-2xl space-y-3 rounded-2xl border border-border bg-card p-6">
      <select value={senderId ?? ""} onChange={(e) => setSenderId(e.target.value || undefined)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
        <option value="">Default sender</option>
        {senders.filter((s: any) => s.status === "approved").map((s: any) => <option key={s.sender_id} value={s.sender_id}>{s.sender_id}</option>)}
      </select>
      <textarea required value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="Recipients (comma or space separated, 2547XXXXXXXX)" rows={2} className="w-full rounded-lg border border-border bg-background p-3 text-sm" />
      <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" rows={4} className="w-full rounded-lg border border-border bg-background p-3 text-sm" />
      <div className="text-xs text-muted-foreground">{body.length} chars</div>
      {msg && <div className="rounded-md bg-muted px-3 py-2 text-xs">{msg}</div>}
      <button disabled={mut.isPending} className="h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">{mut.isPending ? "Sending…" : "Send"}</button>
    </form>
  );
}

function ContactsTab({ tenantId, addFn, listFn }: any) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["sms-contacts", tenantId], queryFn: () => listFn({ data: { tenantId } }) });
  const [phone, setPhone] = useState(""); const [name, setName] = useState("");
  const mut = useMutation({ mutationFn: () => addFn({ data: { tenantId, phone, name } }), onSuccess: () => { setPhone(""); setName(""); qc.invalidateQueries({ queryKey: ["sms-contacts", tenantId] }); } });
  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="flex flex-wrap gap-2">
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2547XXXXXXXX" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
        <button disabled={mut.isPending} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Add</button>
      </form>
      <div className="rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Phone</th><th className="p-3">Name</th></tr></thead>
          <tbody>{(q.data ?? []).map((c: any) => (<tr key={c.id} className="border-t border-border"><td className="p-3 font-mono text-xs">{c.phone}</td><td className="p-3">{c.name ?? "—"}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

function SendersTab({ tenantId, senders, fn, onChanged }: any) {
  const [sid, setSid] = useState("");
  const mut = useMutation({ mutationFn: () => fn({ data: { tenantId, senderId: sid } }), onSuccess: () => { setSid(""); onChanged(); } });
  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="flex gap-2">
        <input required value={sid} onChange={(e) => setSid(e.target.value)} maxLength={11} placeholder="ABANCOOL" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
        <button disabled={mut.isPending} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Request</button>
      </form>
      <div className="rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Sender ID</th><th className="p-3">Status</th></tr></thead>
          <tbody>{senders.map((s: any) => (<tr key={s.sender_id} className="border-t border-border"><td className="p-3 font-mono text-xs">{s.sender_id}</td><td className="p-3 capitalize">{s.status}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryTab({ tenantId, fn }: any) {
  const q = useQuery({ queryKey: ["sms-history", tenantId], queryFn: () => fn({ data: { tenantId } }) });
  return (
    <div className="rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">When</th><th className="p-3">Recipient</th><th className="p-3">Body</th><th className="p-3">Status</th><th className="p-3">Cost</th></tr></thead>
        <tbody>{(q.data ?? []).map((r: any) => (<tr key={r.id} className="border-t border-border align-top"><td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td><td className="p-3 font-mono text-xs">{r.recipient}</td><td className="p-3 max-w-md truncate">{r.body}</td><td className="p-3 capitalize">{r.status}</td><td className="p-3">{Number(r.cost).toFixed(2)}</td></tr>))}</tbody>
      </table>
    </div>
  );
}