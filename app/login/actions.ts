"use server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Please enter your email." };

  const supabase = createClient();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${headers().get("x-forwarded-proto") || "https"}://${headers().get("host")}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { ok: true, email };
}
