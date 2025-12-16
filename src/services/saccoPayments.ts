// src/services/saccoPayments.ts
import { supabase } from "@/lib/supabase";

type Breakdown = {
  dailyDeposit?: number;
  loanRepayment?: { loan_id?: string; amount: number } | null;
  shares?: number;
  welfare?: number;
  membership?: number;
};

interface SaccoCheckoutParams {
  memberId?: string; // optional: if not provided, we'll get from auth
  phone: string;
  breakdown: Breakdown;
  paymentFor?: string; // optional short label, e.g. "MixedPayment"
  relatedId?: string | null; // optional: e.g. loan id if single-purpose
}

const normalizePhone = (raw: string) => {
  let p = String(raw || "").trim().replace(/\D/g, "");
  if (!p) return p;
  // common Kenyan forms
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("+")) p = p.slice(1);
  if (p.length === 9 && p.startsWith("7")) p = "254" + p; // 7xxxxxxxx
  return p;
};

export const saccoCheckout = async ({
  memberId,
  phone,
  breakdown,
  paymentFor = "MixedPayment",
  relatedId = null,
}: SaccoCheckoutParams) => {
  // 1) validate and compute total
  const normalizedPhone = normalizePhone(phone);
  if (!/^254\d{9}$/.test(normalizedPhone)) {
    throw new Error("Phone must be in Kenyan format (e.g. 2547XXXXXXXX)");
  }

  // compute total from breakdown
  const total = Number(breakdown.dailyDeposit || 0)
    + Number((breakdown.loanRepayment && ("amount" in breakdown.loanRepayment ? breakdown.loanRepayment.amount : 0)) || 0)
    + Number(breakdown.shares || 0)
    + Number(breakdown.welfare || 0)
    + Number(breakdown.membership || 0);

  if (total <= 0) throw new Error("Total must be > 0");

  // 2) ensure we have a memberId
  if (!memberId) {
    const { data } = await supabase.auth.getUser();
    memberId = data?.user?.id ?? null;
    if (!memberId) throw new Error("Not authenticated");
  }

  // 3) Create mpesa_stk_requests row (pending)
  // Store the breakdown JSON so callback knows how to allocate amount upon success.
  const { data: reqRow, error: reqError } = await supabase
    .from("mpesa_stk_requests")
    .insert([
      {
        member_id: memberId,
        amount: total,
        phone: normalizedPhone,
        payment_for: paymentFor,
        related_id: relatedId,
        breakdown: breakdown, // jsonb
        status: "Pending",
      },
    ])
    .select()
    .single();

  if (reqError || !reqRow) {
    console.error("Failed to create STK request row:", reqError);
    throw reqError || new Error("Failed to create stk request");
  }

  // 4) Call backend to trigger STK PUSH (backend uses service keys)
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
  if (!backendUrl) {
    // Optionally: you can generate the STK from frontend by calling an Edge function that creates the token securely
    throw new Error("VITE_BACKEND_URL is not configured");
  }

  // backend expects requestId (id of mpesa_stk_requests) so it can update the row
 const stkRes = await fetch(`${backendUrl}/api/payments/stkpush`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phone: normalizedPhone,
    total: total,          // backend expects "total" not "amount"
    payment_id: reqRow.id, // backend expects "payment_id" not "requestId"
    member_id: memberId,
    payment_for: paymentFor,
  }),
});

  const stkJson = await stkRes.json().catch(() => null);
  if (!stkRes.ok || !stkJson || !stkJson.success) {
    // mark request as failed
    await supabase
      .from("mpesa_stk_requests")
      .update({ status: "Failed", checkout_request_id: stkJson?.checkoutRequestID ?? null })
      .eq("id", reqRow.id);

    throw new Error(stkJson?.message || "Failed to trigger STK push");
  }

  // 5) update the request row with CheckoutRequestID returned by backend
  if (stkJson.checkoutRequestID) {
    await supabase
      .from("mpesa_stk_requests")
      .update({ checkout_request_id: stkJson.checkoutRequestID })
      .eq("id", reqRow.id);
  }

  // return the created request row and backend response
  return { request: reqRow, stk: stkJson };
};
