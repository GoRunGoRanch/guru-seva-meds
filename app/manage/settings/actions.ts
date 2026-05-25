"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { COMMON_TIMEZONES } from "@/lib/timezones";

const VALID = new Set(COMMON_TIMEZONES.map((t) => t.value));

export async function saveTimezone(formData: FormData) {
  const tz = String(formData.get("timezone") || "").trim();
  if (!VALID.has(tz)) return { error: "That timezone is not in the list." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "doctor") return { error: "Doctor role required." };

  const { error } = await supabase.from("app_settings").upsert({
    key: "current_timezone",
    value: tz,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
    updated_by_name: profile.full_name,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/manage/settings");
  return { ok: true };
}
