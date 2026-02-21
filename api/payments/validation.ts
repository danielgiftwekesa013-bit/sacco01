import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// 🔹 Normalize input to match TPS-0001 format
function normalizeMemberNoToDbFormat(input: string | null | undefined): string {
  if (!input) return "";
  // Remove non-alphanumerics, uppercase, then add dash
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length <= 3) return cleaned; // fallback
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { MSISDN, BillRefNumber } = req.body;

    // 1️⃣ Validate MSISDN (Safaricom format)
    if (!MSISDN || !/^2547\d{8}$/.test(MSISDN)) {
      return res.status(200).json({
        ResultCode: "C2B00011",
        ResultDesc: "Rejected",
      });
    }

    // 2️⃣ Normalize account number
    const normalizedInput = normalizeMemberNoToDbFormat(BillRefNumber);

    if (!normalizedInput) {
      return res.status(200).json({
        ResultCode: "C2B00012",
        ResultDesc: "Rejected",
      });
    }

    // 3️⃣ Directly query for normalized member number (fast)
    const { data: member, error } = await supabase
      .from("userprofiles")
      .select("id, member_no")
      .eq("member_no", normalizedInput)
      .single();

    if (error || !member) {
      return res.status(200).json({
        ResultCode: "C2B00012",
        ResultDesc: "Rejected",
      });
    }

    // ✅ Member exists → accept transaction
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (err) {
    console.error("VALIDATION ERROR:", err);
    return res.status(200).json({
      ResultCode: "C2B00012",
      ResultDesc: "Rejected",
    });
  }
}