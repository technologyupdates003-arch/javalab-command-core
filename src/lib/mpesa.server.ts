// Production M-Pesa Daraja STK push helpers. Server-only.

function mpesaBase() {
  const env = (process.env.MPESA_ENV || "production").toLowerCase();
  return env === "production" || env === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  if (!key || !secret) throw new Error("MPESA credentials missing");
  const basic = btoa(`${key}:${secret}`);
  const res = await fetch(`${mpesaBase()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error(`mpesa auth failed: ${res.status}`);
  const json: any = await res.json();
  return json.access_token as string;
}

function timestamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

export type StkPushInput = {
  phone: string; // 2547XXXXXXXX
  amount: number; // KES whole number
  accountReference: string;
  description: string;
  callbackUrl: string;
};

export async function stkPush(input: StkPushInput) {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  if (!shortcode || !passkey) throw new Error("MPESA shortcode/passkey missing");
  const ts = timestamp();
  const password = btoa(`${shortcode}${passkey}${ts}`);
  const token = await getAccessToken();
  const body = {
    BusinessShortCode: Number(shortcode),
    Password: password,
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(input.amount),
    PartyA: input.phone,
    PartyB: Number(shortcode),
    PhoneNumber: input.phone,
    CallBackURL: input.callbackUrl,
    AccountReference: input.accountReference.slice(0, 12),
    TransactionDesc: input.description.slice(0, 13),
  };
  const res = await fetch(`${mpesaBase()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: any = await res.json();
  if (!res.ok || json.ResponseCode !== "0") {
    throw new Error(json.errorMessage || json.ResponseDescription || `mpesa stk failed`);
  }
  return {
    checkoutRequestId: json.CheckoutRequestID as string,
    merchantRequestId: json.MerchantRequestID as string,
    raw: json,
  };
}

export function normalizePhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.startsWith("254")) return d;
  if (d.startsWith("0") && d.length === 10) return "254" + d.slice(1);
  if (d.startsWith("7") && d.length === 9) return "254" + d;
  return d;
}