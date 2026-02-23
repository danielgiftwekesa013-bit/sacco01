import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// 🔹 Normalize member number to TPS-0001 format
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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 🔹 Accept real Safaricom C2B structure
    const {
      BillRefNumber,
      TransAmount,
      TransID,
      MSISDN,
      TransTime,
    } = req.body;

    const Amount = Number(TransAmount);
    const Phone = MSISDN ?? null;
    const PaymentDate = TransTime
      ? new Date(
          `${TransTime.substring(0, 4)}-${TransTime.substring(
            4,
            6
          )}-${TransTime.substring(6, 8)}T${TransTime.substring(
            8,
            10
          )}:${TransTime.substring(10, 12)}:${TransTime.substring(12, 14)}`
        )
      : new Date();

    // 🔹 Required validation
    if (!BillRefNumber || !TransID || !Amount || isNaN(Amount)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedMemberNo = normalizeMemberNo(BillRefNumber);

    // 1️⃣ Check member
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

    // 2️⃣ Prevent duplicate transaction safely
    const { data: existingTx } = await supabase
      .from("mpesa_payments")
      .select("id")
      .eq("mpesa_receipt", TransID)
      .maybeSingle();

    if (existingTx) {
      return res.status(200).json({
        ResultCode: "0",
        ResultDesc: "Accepted",
      });
    }

    // 3️⃣ Insert payment (payment_for must match DB constraint)
    const { data: payment, error: paymentError } = await supabase
      .from("mpesa_payments")
      .insert({
        mpesa_receipt: TransID,
        phone: Phone,
        amount: Amount,
        transaction_date: PaymentDate,
        status: "Success",
        payment_for: "DailyDeposit", // Valid DB enum value
        related_id: memberId,
        raw_callback: req.body,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment insert failed");
    }

    const ledgerInserts: any[] = [];

    // 4️⃣ Fetch related data
    const { data: membership } = await supabase
      .from("membership")
      .select("reg_fee, status")
      .eq("member_id", memberId)
      .maybeSingle();

    const { data: shares } = await supabase
      .from("shares")
      .select("amount")
      .eq("member_id", memberId);

    const { data: loans } = await supabase
      .from("loans")
      .select("id, status")
      .eq("member_id", memberId)
      .order("approved_date", { ascending: true });

    const { data: wellfare } = await supabase
      .from("wellfare")
      .select("deposit_date, status")
      .eq("member_id", memberId)
      .order("deposit_date", { ascending: false })
      .limit(1);

    // ----------------------------
    // 🔥 YOUR ORIGINAL LOGIC (SAFE)
    // ----------------------------

    if (!membership || membership.status !== "paid") {
      const regAmount = Math.min(Amount, 1000);

      ledgerInserts.push({
        member_id: memberId,
        payment_for: "Membership",
        amount: regAmount,
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
      const activeLoans =
        loans?.filter((l) => l.status === "Active") ?? [];

      const sharesPaid =
        shares?.reduce((acc, s) => acc + Number(s.amount), 0) ?? 0;

      if (activeLoans.length > 0) {
        const daily = Math.min(100, Amount);
        const loanAmount = Math.max(Amount - daily, 0);

        ledgerInserts.push({
          member_id: memberId,
          payment_for: "DailyDeposit",
          amount: daily,
          mpesa_payment_id: payment.id,
        });

        if (loanAmount > 0) {
          ledgerInserts.push({
            member_id: memberId,
            payment_for: "LoanRepayment",
            amount: loanAmount,
            related_id: activeLoans[0].id,
            mpesa_payment_id: payment.id,
          });
        }
      } else if (sharesPaid < 12000) {
        const daily = Math.min(100, Amount);
        const shareAmount = Math.max(Amount - daily, 0);

        ledgerInserts.push({
          member_id: memberId,
          payment_for: "DailyDeposit",
          amount: daily,
          mpesa_payment_id: payment.id,
        });

        if (shareAmount > 0) {
          ledgerInserts.push({
            member_id: memberId,
            payment_for: "Shares",
            amount: shareAmount,
            mpesa_payment_id: payment.id,
          });
        }
      } else {
        const wellfareLastPaid = wellfare?.[0];

        if (!wellfareLastPaid || wellfareLastPaid.status !== "paid") {
          const welfareAmount = Math.min(200, Amount);
          const dailyAmount = Math.max(Amount - welfareAmount, 0);

          ledgerInserts.push({
            member_id: memberId,
            payment_for: "Welfare",
            amount: welfareAmount,
            mpesa_payment_id: payment.id,
          });

          if (dailyAmount > 0) {
            ledgerInserts.push({
              member_id: memberId,
              payment_for: "DailyDeposit",
              amount: dailyAmount,
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
      const { error: ledgerError } = await supabase
        .from("payments_ledger")
        .insert(ledgerInserts);

      if (ledgerError) {
        throw ledgerError;
      }
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