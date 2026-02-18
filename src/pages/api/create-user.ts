// /pages/api/create-user.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// ✅ Use your server-only service key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_name, phone, id_no } = req.body;

  if (!user_name || !id_no) {
    return res.status(400).json({ error: "Name and ID number are required" });
  }

  try {
    const userId = randomUUID(); // generate UUID
    const dummyEmail = `${id_no}@sacco.local`; // dummy email

    // 1️⃣ Create Supabase Auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      id: userId,
      email: dummyEmail,
      password: id_no, // ID number as password
      email_confirm: true,
    });

    if (authError) {
      console.error("Supabase createUser error:", authError);
      return res.status(500).json({ error: authError.message || JSON.stringify(authError) });
    }

    // 2️⃣ Insert user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("userprofiles")
      .insert([
        { id: userId, user_name, phone, id_no, email_address: dummyEmail },
      ])
      .select()
      .single();

    if (profileError) {
      console.error("Supabase insert profile error:", profileError);
      return res.status(500).json({ error: profileError.message || JSON.stringify(profileError) });
    }

    // ✅ Success
    return res.status(200).json({ message: "User created successfully", profile });
  } catch (err: any) {
    console.error("Unhandled create-user error:", err);
    return res.status(500).json({ error: err.message || "Failed to create user" });
  }
}
