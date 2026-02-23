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

// Helper to log activity
async function logActivity({
  cron_job_name,
  activity_type,
  related_table,
  related_id,
  details,
  status,
}: {
  cron_job_name: string;
  activity_type: string;
  related_table?: string;
  related_id?: string;
  details?: any;
  status: "success" | "failed" | "partial";
}) {
  await supabase.from("activity_logs").insert([
    {
      cron_job_name,
      activity_type,
      related_table,
      related_id,
      details: details ? JSON.stringify(details) : null,
      status,
    },
  ]);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const cronJobName = "C2B Validation";

  try {
    const { MSISDN, BillRefNumber } = req.body;

    // 1️⃣ Validate MSISDN
    if (!MSISDN || !/^2547\d{8}$/.test(MSISDN)) {
      await logActivity({
        cron_job_name: cronJobName,
        activity_type: "Validation Failed",
        details: { MSISDN, BillRefNumber, reason: "Invalid MSISDN" },
        status: "failed",
      });

      return res.status(200).json({
        ResultCode: "C2B00011",
        ResultDesc: "Rejected",
      });
    }

    // 2️⃣ Normalize account number
    const normalizedInput = normalizeMemberNoToDbFormat(BillRefNumber);

    if (!normalizedInput) {
      await logActivity({
        cron_job_name: cronJobName,
        activity_type: "Validation Failed",
        details: { MSISDN, BillRefNumber, reason: "Invalid BillRefNumber" },
        status: "failed",
      });

      return res.status(200).json({
        ResultCode: "C2B00012",
        ResultDesc: "Rejected",
      });
    }

    // 3️⃣ Lookup member
    const { data: member, error } = await supabase
      .from("userprofiles")
      .select("id, member_no")
      .eq("member_no", normalizedInput)
      .single();

    if (error || !member) {
      await logActivity({
        cron_job_name: cronJobName,
        activity_type: "Validation Failed",
        related_table: "userprofiles",
        details: { MSISDN, BillRefNumber, normalizedInput },
        status: "failed",
      });

      return res.status(200).json({
        ResultCode: "C2B00012",
        ResultDesc: "Rejected",
      });
    }

    // ✅ Member exists → accept transaction
    await logActivity({
      cron_job_name: cronJobName,
      activity_type: "Validation Success",
      related_table: "userprofiles",
      related_id: member.id,
      details: { MSISDN, BillRefNumber, normalizedInput },
      status: "success",
    });

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (err) {
    console.error("VALIDATION ERROR:", err);
    await logActivity({
      cron_job_name: cronJobName,
      activity_type: "Validation Error",
      details: { error: err },
      status: "failed",
    });

    return res.status(200).json({
      ResultCode: "C2B00012",
      ResultDesc: "Rejected",
    });
  }
}