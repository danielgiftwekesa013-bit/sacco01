import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import your routes
import mpesaRoutes from "./api/payments/Mpesa.ts";      // stkpush
import callbackRoutes from "./api/payments/Callback.ts"; // mpesa callback

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------------------
   📌 GLOBAL LOGGING MIDDLEWARE (NEW)
--------------------------------------------------------*/
app.use((req, res, next) => {
  console.log(
    `\n📝 [${new Date().toISOString()}] Incoming Request:
     ➤ ${req.method} ${req.originalUrl}
     ➤ From: ${req.ip}
     ➤ Body:`,
    req.body
  );

  // Capture response end
  const originalSend = res.send;
  res.send = function (data) {
    console.log(
      `📤 [${new Date().toISOString()}] Response Sent for ${req.method} ${
        req.originalUrl
      }:\n`,
      data
    );
    return originalSend.apply(res, arguments);
  };

  next();
});

/* -------------------------------------------------------
   📌 Route-specific logging wrappings (NEW)
   These will help track STK Push & Callback handling
--------------------------------------------------------*/

// STK PUSH route logging
app.use("/api/payments", (req, res, next) => {
  if (req.originalUrl.includes("stkpush")) {
    console.log("📲 STK PUSH REQUEST RECEIVED:", req.body);
  }
  next();
});

// Callback logging
app.use("/api/payments", (req, res, next) => {
  if (req.originalUrl.includes("callback")) {
    console.log("📡 SAFARICOM CALLBACK RECEIVED RAW BODY:", req.body);
  }
  next();
});

/* -------------------------------------------------------
   Mount your routes (UNCHANGED)
--------------------------------------------------------*/
app.use("/api/payments", mpesaRoutes);
app.use("/api/payments", callbackRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("✅ Backend server running for M-Pesa integration");
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Unhandled Error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);

  const env = process.env.MPESA_ENVIRONMENT || "sandbox";
  const baseUrl =
    env.toLowerCase() === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  console.log(`🌍 M-Pesa Environment: ${env}`);
  console.log(`🔗 Safaricom Base URL in use: ${baseUrl}`);

  if (process.env.MPESA_CALLBACK_URL) {
    console.log(`📡 Listening for M-Pesa callbacks at: ${process.env.MPESA_CALLBACK_URL}`);
  } else {
    console.warn("⚠️ No MPESA_CALLBACK_URL set. Callbacks may fail.");
  }

  console.log("🟢 Logging Enabled: You will see STK push + callback activity in real-time.");
});
