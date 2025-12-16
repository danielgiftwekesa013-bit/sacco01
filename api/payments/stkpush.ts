// api/payments/stkpush.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import dayjs from "dayjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BASE_URL = process.env.MPESA_BASE_URL!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;

async function getAccessToken() {
  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      auth: {
        username: process.env.MPESA_CONSUMER_KEY!,
        password: process.env.MPESA_CONSUMER_SECRET!,
      },
    }
  );
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { phone, total, member_id, breakdown, payment_for, related_id } = req.body;

    if (!phone || !total || !member_id) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Normalize Kenyan phone
    let normalizedPhone = String(phone).trim();
    if (normalizedPhone.startsWith("0")) normalizedPhone = `254${normalizedPhone.slice(1)}`;
    if (normalizedPhone.startsWith("+")) normalizedPhone = normalizedPhone.slice(1);

    // 1️⃣ Insert pending STK request row first
    const { data: reqRow, error: insertError } = await supabase
      .from("mpesa_stk_requests")
      .insert([
        {
          member_id,
          amount: total,
          phone: normalizedPhone,
          payment_for: payment_for || "MixedPayment",
          related_id: related_id || null,
          breakdown: breakdown || {},
          status: "Pending",
        },
      ])
      .select()
      .single();

    if (insertError || !reqRow) {
      console.error("Failed to create STK request row:", insertError);
      throw insertError || new Error("Could not create STK request row");
    }

    console.log("Created STK request row:", reqRow);

    // 2️⃣ Generate MPESA access token
    const accessToken = await getAccessToken();

    // 3️⃣ Prepare STK push request
    const timestamp = dayjs().format("YYYYMMDDHHmmss");
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

    const stkResponse = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Number(total),
        PartyA: normalizedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: normalizedPhone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: reqRow.id, // use the newly inserted row ID for callback reference
        TransactionDesc: "SACCO Payment",
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const checkoutRequestID = stkResponse.data.CheckoutRequestID;

    // 4️⃣ Update the STK request row with checkoutRequestID immediately
    await supabase
      .from("mpesa_stk_requests")
      .update({ checkout_request_id: checkoutRequestID })
      .eq("id", reqRow.id);

    console.log("Updated STK request with CheckoutRequestID:", checkoutRequestID);

    // ✅ Return response to frontend
    return res.status(200).json({ success: true, checkoutRequestID });
  } catch (err: any) {
    console.error("STK Push error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
