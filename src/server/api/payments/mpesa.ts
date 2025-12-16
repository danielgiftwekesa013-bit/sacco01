// src/server/api/payments/stkpush.ts
import express from "express";
import axios from "axios";
import dayjs from "dayjs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const router = express.Router();

// ---------- Supabase server client (service key) ----------
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ---------- M-Pesa config ----------
const BASE_URL = process.env.MPESA_BASE_URL;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

if (!BASE_URL || !MPESA_SHORTCODE || !MPESA_PASSKEY || !MPESA_CALLBACK_URL) {
  throw new Error(
    "Missing MPESA_BASE_URL, MPESA_SHORTCODE, MPESA_PASSKEY, or MPESA_CALLBACK_URL in .env"
  );
}

// ---------- Helper: Access token ----------
async function getAccessToken() {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        auth: {
          username: process.env.MPESA_CONSUMER_KEY!,
          password: process.env.MPESA_CONSUMER_SECRET!,
        },
      }
    );
    if (!data.access_token) throw new Error("No access token received");
    return data.access_token;
  } catch (err: any) {
    console.error(
      "❌ Failed to get M-Pesa access token:",
      err.response?.data || err.message
    );
    throw new Error("Failed to get M-Pesa access token");
  }
}

// ---------- STK Push endpoint ----------
router.post("/stkpush", async (req, res) => {
  try {
    const { phone, total, payment_id } = req.body;

    // ----- Validate request -----
    if (!phone || !total || !payment_id) {
      return res.status(400).json({
        success: false,
        message: "phone, total, and payment_id are required",
      });
    }

    // ----- Normalize phone -----
    let normalizedPhone = String(phone).trim();
    if (normalizedPhone.startsWith("0")) normalizedPhone = `254${normalizedPhone.slice(1)}`;
    if (normalizedPhone.startsWith("+")) normalizedPhone = normalizedPhone.slice(1);
    if (!/^254\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "Invalid phone number format" });
    }

    // ----- Trigger STK Push -----
    const accessToken = await getAccessToken();
    const timestamp = dayjs().format("YYYYMMDDHHmmss");
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Number(total),
      PartyA: normalizedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: MPESA_CALLBACK_URL, // This hits your saccoCallback.ts endpoint
      AccountReference: payment_id,     // Links callback to stk_request row
      TransactionDesc: `Payment for ${payment_id}`,
    };

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const checkoutRequestID = response.data?.CheckoutRequestID || null;

    // ✅ Update the stk_request row with CheckoutRequestID
    if (checkoutRequestID) {
      await supabase
        .from("mpesa_stk_requests")
        .update({ checkout_request_id: checkoutRequestID })
        .eq("id", payment_id);
    }

    return res.json({
      success: true,
      checkoutRequestID,
      raw: response.data,
    });

  } catch (err: any) {
    console.error("❌ STK push flow error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: err.response?.data?.errorMessage || err.message,
      details: err.response?.data || null,
    });
  }
});

export default router;
