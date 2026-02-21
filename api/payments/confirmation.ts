import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// 🔹 Normalize member number to TPS-0001
function normalizeMemberNo(memberNo: string | null | undefined): string {
  if (!memberNo) return "";
  const cleaned = memberNo.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { BillRefNumber, Amount, TransID, Phone, PaymentDate } = req.body;

    if (!BillRefNumber || !Amount || !TransID) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedMemberNo = normalizeMemberNo(BillRefNumber);

    // 1️⃣ Check if member exists
    const { data: member, error: memberError } = await supabase
      .from("userprofiles")
      .select("id, member_no")
      .eq("member_no", normalizedMemberNo)
      .single();

    if (memberError || !member) {
      return res.status(200).json({
        ResultCode: "C2B00012",
        ResultDesc: "Rejected",
      });
    }

    const memberId = member.id;

    // 2️⃣ Prevent duplicate transaction
    const { data: existingTx } = await supabase
      .from("mpesa_payments")
      .select("id")
      .eq("mpesa_receipt", TransID)
      .single();

    if (existingTx) {
      return res.status(200).json({
        ResultCode: "0",
        ResultDesc: "Accepted", // duplicate acknowledged but not re-inserted
      });
    }

    // 3️⃣ Insert the offline payment
    const { data: payment } = await supabase
      .from("mpesa_payments")
      .insert({
        mpesa_receipt: TransID,
        phone: Phone ?? null,
        amount: Amount,
        transaction_date: PaymentDate ? new Date(PaymentDate) : new Date(),
        status: "Success",
        payment_for: "MixedPayment",
        related_id: memberId,
        raw_callback: req.body,
      })
      .select()
      .single();

    if (!payment) {
      throw new Error("Payment insert failed");
    }

    // 4️⃣ Allocation logic (insert only)
    const ledgerInserts: any[] = [];

    // 4a️⃣ Check membership
    const { data: membership } = await supabase
      .from("membership")
      .select("reg_fee, status")
      .eq("member_id", memberId)
      .single();

    // 4b️⃣ Check shares
    const { data: shares } = await supabase
      .from("shares")
      .select("amount, total_shares")
      .eq("member_id", memberId);

    // 4c️⃣ Check loans
    const { data: loans } = await supabase
      .from("loans")
      .select("id, status, loan_balance, paid_amount")
      .eq("member_id", memberId)
      .order("approved_date", { ascending: true });

    // 4d️⃣ Check wellfare
    const { data: wellfare } = await supabase
      .from("wellfare")
      .select("deposit_date, status")
      .eq("member_id", memberId)
      .order("deposit_date", { ascending: false })
      .limit(1);

    // --- Allocation based on your rules ---
    // 1️⃣ New member: pay reg_fee first (1000), rest to shares
    if (!membership || membership.status !== "paid") {
      ledgerInserts.push({
        member_id: memberId,
        payment_for: "Membership",
        amount: Math.min(Amount, 1000),
        mpesa_payment_id: payment.id,
      });

      if (Amount > 1000) {
        ledgerInserts.push({
          member_id: memberId,
          payment_for: "Shares",
          amount: Amount - 1000,
          mpesa_payment_id: payment.id,
        });
      }
    } else {
      // Existing member
      const activeLoans = loans?.filter((l) => l.status === "Active") || [];
      const sharesPaid = shares?.reduce((acc, s) => acc + Number(s.amount), 0) ?? 0;

      if (activeLoans.length > 0) {
        // priority: daily deposit 100, then old loan
        ledgerInserts.push({
          member_id: memberId,
          payment_for: "DailyDeposit",
          amount: 100,
          mpesa_payment_id: payment.id,
        });
        ledgerInserts.push({
          member_id: memberId,
          payment_for: "LoanRepayment",
          amount: Amount - 100,
          related_id: activeLoans[0].id,
          mpesa_payment_id: payment.id,
        });
      } else if (sharesPaid < 12000) {
        // no loan, shares not fully paid
        ledgerInserts.push({
          member_id: memberId,
          payment_for: "DailyDeposit",
          amount: 100,
          mpesa_payment_id: payment.id,
        });
        ledgerInserts.push({
          member_id: memberId,
          payment_for: "Shares",
          amount: Amount - 100,
          mpesa_payment_id: payment.id,
        });
      } else {
        // no loan, shares paid
        const wellfareLastPaid = wellfare?.[0];
        if (!wellfareLastPaid || wellfareLastPaid.status !== "paid" || Amount >= 200) {
          ledgerInserts.push({
            member_id: memberId,
            payment_for: "Wellfare",
            amount: 200,
            mpesa_payment_id: payment.id,
          });
          if (Amount > 200) {
            ledgerInserts.push({
              member_id: memberId,
              payment_for: "DailyDeposit",
              amount: Amount - 200,
              mpesa_payment_id: payment.id,
            });
          }
        } else {
          ledgerInserts.push({
            member_id: memberId,
            payment_for: "DailyDeposit",
            amount: Amount,
            mpesa_payment_id: payment.id,
          });
        }
      }
    }

    if (ledgerInserts.length > 0) {
      await supabase.from("payments_ledger").insert(ledgerInserts);
    }

    return res.status(200).json({
      ResultCode: "0",
      ResultDesc: "Accepted",
    });
  } catch (err) {
    console.error("CONFIRMATION ERROR:", err);
    return res.status(200).json({
      ResultCode: "1",
      ResultDesc: "Failed",
    });
  }
}