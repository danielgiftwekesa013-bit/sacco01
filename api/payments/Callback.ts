// api/payments/Callback.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

interface Breakdown {
  dailyDeposit?: number;
  loanRepayment?: { loan_id?: string; amount: number } | null;
  shares?: number;
  welfare?: number;
  membership?: number;
}

type MpesaRaw = any;

/**
 * Robust extractor for STK callback content.
 */
function extractCallback(payload: MpesaRaw) {
  const cb =
    payload?.Body?.stkCallback ??
    payload?.body?.stkCallback ??
    payload?.stkCallback ??
    payload;

  const ResultCode = Number(cb?.ResultCode ?? cb?.resultCode ?? cb?.Result ?? -1);
  const ResultDesc =
    cb?.ResultDesc ?? cb?.resultDesc ?? cb?.ResultDescription ?? "";

  const CheckoutRequestID =
    cb?.CheckoutRequestID ??
    cb?.checkoutRequestID ??
    null;

  const MerchantRequestID =
    cb?.MerchantRequestID ?? cb?.merchantRequestID ?? null;

  const items =
    cb?.CallbackMetadata?.Item ??
    cb?.callbackMetadata?.Item ??
    cb?.CallbackMetadata ??
    [];

  const findItem = (name: string) => {
    if (!Array.isArray(items)) return undefined;
    const it = items.find((x: any) => (x?.Name ?? x?.name) === name);
    return it?.Value ?? it?.value;
  };

  const Amount = Number(cb?.Amount ?? findItem("Amount") ?? 0);

  const MpesaReceiptNumber =
    cb?.MpesaReceiptNumber ??
    findItem("MpesaReceiptNumber") ??
    findItem("ReceiptNumber") ??
    null;

  const PhoneNumber =
    cb?.PhoneNumber ?? findItem("PhoneNumber") ?? findItem("MSISDN") ?? null;

  const TransactionDate =
    cb?.TransactionDate ??
    findItem("TransactionDate") ??
    findItem("Transaction") ??
    null;

  return {
    CheckoutRequestID,
    MerchantRequestID,
    ResultCode,
    ResultDesc,
    Amount,
    MpesaReceiptNumber,
    PhoneNumber,
    TransactionDate,
    raw: payload,
  };
}

async function processMpesaCallback(rawPayload: MpesaRaw) {
  try {
    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      Amount,
      MpesaReceiptNumber,
      PhoneNumber,
      TransactionDate,
      raw,
    } = extractCallback(rawPayload);

    if (!CheckoutRequestID) {
      console.error("Missing CheckoutRequestID in callback:", rawPayload);
      throw new Error("Missing CheckoutRequestID");
    }

    // 1️⃣ Fetch STK request
    const { data: stkRow, error: stkError } = await supabase
      .from("mpesa_stk_requests")
      .select("*")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (stkError || !stkRow) {
      console.error("STK request not found:", CheckoutRequestID, stkError);
      throw new Error("STK request not found");
    }

    // 2️⃣ Update STK status
    const status = ResultCode === 0 ? "Success" : "Failed";
    await supabase
      .from("mpesa_stk_requests")
      .update({ status })
      .eq("id", stkRow.id);

    // 3️⃣ Insert MPESA payment
    const allowedPaymentFors = [
      "DailyDeposit",
      "LoanRepayment",
      "Shares",
      "Membership",
      "Welfare",
    ];

    const safePaymentFor = allowedPaymentFors.includes(stkRow.payment_for)
      ? stkRow.payment_for
      : null;

    let txDate: Date | null = null;
    if (typeof TransactionDate === "string" && /^\d{14}$/.test(TransactionDate)) {
      const t = TransactionDate;
      txDate = new Date(
        `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(
          8,
          10
        )}:${t.slice(10, 12)}:${t.slice(12, 14)}Z`
      );
    } else if (TransactionDate) {
      const d = new Date(TransactionDate);
      txDate = isNaN(d.getTime()) ? null : d;
    }

    const { data: mpesaPayment, error: mpesaError } = await supabase
      .from("mpesa_payments")
      .insert({
        checkout_request_id: CheckoutRequestID,
        merchant_request_id: raw?.MerchantRequestID ?? null,
        mpesa_receipt: MpesaReceiptNumber ?? null,
        phone: PhoneNumber ?? stkRow.phone ?? null,
        amount: Amount ?? stkRow.amount ?? null,
        transaction_date: txDate,
        status,
        payment_for: safePaymentFor,
        related_id: stkRow.related_id ?? null,
        raw_callback: raw,
      })
      .select()
      .single();

    if (mpesaError || !mpesaPayment) {
      console.error("mpesa_payment insert failed:", mpesaError);
      throw mpesaError || new Error("mpesa_payment insert failed");
    }

    if (status !== "Success") {
      return;
    }

    // 4️⃣ Allocation logic
    const breakdown: Breakdown = stkRow.breakdown || {};
    const ledgerInserts: any[] = [];

    if (breakdown.dailyDeposit && breakdown.dailyDeposit > 0) {
      await supabase.from("dailydeposits").insert({
        member_id: stkRow.member_id,
        amount: breakdown.dailyDeposit,
      });

      ledgerInserts.push({
        member_id: stkRow.member_id,
        payment_for: "DailyDeposit",
        amount: breakdown.dailyDeposit,
        mpesa_payment_id: mpesaPayment.id,
      });
    }

    if (
      breakdown.loanRepayment &&
      breakdown.loanRepayment.amount > 0 &&
      breakdown.loanRepayment.loan_id
    ) {
      const { loan_id, amount } = breakdown.loanRepayment;

      const { data: loan } = await supabase
        .from("loans")
        .select("loan_balance, paid_amount")
        .eq("id", loan_id)
        .single();

      if (loan) {
        const newPaid = Number(loan.paid_amount || 0) + amount;
        const newBalance = Math.max(
          Number(loan.loan_balance || 0) - amount,
          0
        );

        await supabase
          .from("loans")
          .update({
            paid_amount: newPaid,
            loan_balance: newBalance,
            status: newBalance === 0 ? "Repaid" : "Active",
          })
          .eq("id", loan_id);
      }

      ledgerInserts.push({
        member_id: stkRow.member_id,
        payment_for: "LoanRepayment",
        amount,
        related_id: loan_id,
        mpesa_payment_id: mpesaPayment.id,
      });
    }

    if (breakdown.shares && breakdown.shares > 0) {
      await supabase.from("shares").insert({
        member_id: stkRow.member_id,
        amount: breakdown.shares,
        total_shares: breakdown.shares,
      });

      ledgerInserts.push({
        member_id: stkRow.member_id,
        payment_for: "Shares",
        amount: breakdown.shares,
        mpesa_payment_id: mpesaPayment.id,
      });
    }

    if (breakdown.membership && breakdown.membership > 0) {
      const { error } = await supabase.from("membership").insert({
        member_id: stkRow.member_id,
        reg_fee: breakdown.membership,
        status: "paid",
      });

      if (!error) {
        ledgerInserts.push({
          member_id: stkRow.member_id,
          payment_for: "Membership",
          amount: breakdown.membership,
          mpesa_payment_id: mpesaPayment.id,
        });
      }
    }

    if (breakdown.welfare && breakdown.welfare > 0) {
      await supabase.from("wellfare").insert({
        member_id: stkRow.member_id,
        amount: breakdown.welfare,
        status: "paid",
      });

      ledgerInserts.push({
        member_id: stkRow.member_id,
        payment_for: "Welfare",
        amount: breakdown.welfare,
        mpesa_payment_id: mpesaPayment.id,
      });
    }

    if (ledgerInserts.length > 0) {
      await supabase.from("payments_ledger").insert(ledgerInserts);
    }
  } catch (err) {
    console.error("MPESA CALLBACK PROCESSING ERROR:", err);
    throw err;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    // ⏳ PROCESS FIRST (VERCEL SAFE)
    await processMpesaCallback(req.body);

    // ✅ ACK MPESA
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (err: any) {
    console.error("MPESA CALLBACK ERROR:", err);

    // ⚠️ STILL ACK MPESA WITH 200
    return res.status(200).json({
      ResultCode: 1,
      ResultDesc: err?.message ?? "Failed",
    });
  }
}
