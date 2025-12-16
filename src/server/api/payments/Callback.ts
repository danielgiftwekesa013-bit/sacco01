// api/payments/callback.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { processMpesaCallback } from "./callback.logic";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await processMpesaCallback(req.body);

    // ✅ MPESA expects HTTP 200 ALWAYS
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (err: any) {
    console.error("MPESA CALLBACK ERROR:", err);

    // ❗ STILL return 200, but failure code
    return res.status(200).json({
      ResultCode: 1,
      ResultDesc: err.message ?? "Failed",
    });
  }
}
