import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tenantOnly = z.object({ tenantId: z.string().uuid() });

export const getSmsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tenantOnly.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [wallet, outbox, contacts, senders] = await Promise.all([
      supabase.from("sms_tenant_wallets").select("balance, currency").eq("tenant_id", data.tenantId).maybeSingle(),
      supabase.from("sms_outbox").select("id, status").eq("tenant_id", data.tenantId).limit(1000),
      supabase.from("sms_contacts").select("id", { count: "exact", head: true }).eq("tenant_id", data.tenantId),
      supabase.from("sms_sender_ids").select("sender_id, status, is_default").eq("tenant_id", data.tenantId),
    ]);
    const list = outbox.data ?? [];
    return {
      balance: Number(wallet.data?.balance ?? 0),
      currency: wallet.data?.currency ?? "KES",
      totalSent: list.filter((m) => m.status === "sent" || m.status === "delivered").length,
      delivered: list.filter((m) => m.status === "delivered").length,
      failed: list.filter((m) => m.status === "failed").length,
      queued: list.filter((m) => m.status === "queued").length,
      contacts: contacts.count ?? 0,
      senders: senders.data ?? [],
    };
  });

const sendSchema = z.object({
  tenantId: z.string().uuid(),
  senderId: z.string().min(1).max(11).optional(),
  recipients: z.array(z.string().min(9).max(15)).min(1).max(500),
  body: z.string().min(1).max(1000),
});

function segments(text: string) {
  const len = text.length;
  return len <= 160 ? 1 : Math.ceil(len / 153);
}

export const sendSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const seg = segments(data.body);
    const perMsgCost = 0.8 * seg;
    const totalCost = perMsgCost * data.recipients.length;

    // Check wallet
    const { data: wallet } = await supabase
      .from("sms_tenant_wallets")
      .select("balance")
      .eq("tenant_id", data.tenantId)
      .maybeSingle();
    if (!wallet || Number(wallet.balance) < totalCost) {
      throw new Error("Insufficient wallet balance. Top up to continue.");
    }

    // Insert into outbox as queued (real provider dispatch can hook later)
    const rows = data.recipients.map((r) => ({
      tenant_id: data.tenantId,
      recipient: r,
      body: data.body,
      sender_id: data.senderId ?? null,
      kind: "bulk",
      status: "queued",
      segments: seg,
      cost: perMsgCost,
      provider: "talksasa",
    }));
    const { error: insErr } = await supabase.from("sms_outbox").insert(rows);
    if (insErr) throw new Error(insErr.message);

    // Debit wallet via admin RPC (negative credit)
    await supabase.rpc("credit_sms_wallet", { _tenant: data.tenantId, _amount: -totalCost });

    return { queued: rows.length, totalCost };
  });

const senderSchema = z.object({
  tenantId: z.string().uuid(),
  senderId: z.string().min(2).max(11).regex(/^[A-Za-z0-9 _.-]+$/),
  notes: z.string().max(500).optional(),
});

export const requestSenderId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => senderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("sms_sender_ids").insert({
      tenant_id: data.tenantId,
      sender_id: data.senderId,
      notes: data.notes,
      requested_by: userId,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSmsHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tenantOnly.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("sms_outbox")
      .select("id, recipient, body, status, segments, cost, created_at, sender_id")
      .eq("tenant_id", data.tenantId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const contactSchema = z.object({
  tenantId: z.string().uuid(),
  phone: z.string().min(9).max(15),
  name: z.string().max(120).optional(),
});

export const addContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => contactSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("sms_contacts").insert({
      tenant_id: data.tenantId,
      phone: data.phone,
      name: data.name,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tenantOnly.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("sms_contacts")
      .select("id, phone, name, created_at")
      .eq("tenant_id", data.tenantId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });