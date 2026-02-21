import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { phone, type, payload } = await req.json();

    const API_KEY = Deno.env.get("AT_API_KEY");
    const USERNAME = Deno.env.get("AT_USERNAME");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!API_KEY || !USERNAME) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Africa's Talking credentials"
        }),
        { status: 200 }
      );
    }

    // ✅ Create Supabase client (for DB access)
    const supabase = createClient(
      SUPABASE_URL!,
      SERVICE_ROLE_KEY!
    );

    // ✅ Format phone number (remove + if present)
    const formattedPhone = phone.startsWith("+")
      ? phone.substring(1)
      : phone;

    let message = "";

    switch (type) {

      case "welcome": {
        // 🔥 Fetch member_no from userprofiles using payload.user_id
        const { data, error } = await supabase
          .from("userprofiles")
          .select("member_no")
          .eq("id", payload.user_id)
          .single();

        if (error || !data?.member_no) {
          throw new Error("Could not fetch member number");
        }

        message = `Hello ${payload.name} welcome to Transpiaggio SACCO, your membership no is ${data.member_no}. Use it together with your ID to access members portal.`;
        break;
      }

      case "deposit":
        message = `Dear ${payload.name}, your deposit of KES ${payload.amount} was received successfully.`;
        break;

      case "loan_approved":
        message = `Congratulations ${payload.name}, your loan of KES ${payload.amount} has been approved.`;
        break;

      case "reminder":
        message = `Reminder ${payload.name}, your payment of KES ${payload.amount} is due on ${payload.date}.`;
        break;

      default:
        message = "Notification from Transpiaggio SACCO.";
    }

    const response = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey: API_KEY,
        },
        body: new URLSearchParams({
          username: USERNAME,
          to: formattedPhone,
          message: message,
        }),
      }
    );

    const resultText = await response.text();

    return new Response(
      JSON.stringify({
        provider_http_status: response.status,
        provider_raw_response: resultText
      }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 200 }
    );
  }
});