"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { COMMON_TIMEZONES } from "@/lib/timezones";

const VALID = new Set(COMMON_TIMEZONES.map((t) => t.value));

export async function saveTimezone(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  if (session.role !== "doctor") return { error: "Doctor role required." };

  const tz = String(formData.get("timezone") || "").trim();
  if (!VALID.has(tz)) return { error: "That timezone is not in the list." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_settings").upsert({
    key: "current_timezone",
    value: tz,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/manage/settings");
  return { ok: true };
}
